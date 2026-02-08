import { GoogleGenAI, Type } from "@google/genai";
import { Cell, RobotState, DecisionResponse } from "../types";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY!,
});

const SYSTEM_INSTRUCTION = `
You are the **Autonomous Intelligence Layer** of a specialized Search-and-Rescue Robot.
Your architecture requires you to make high-level tactical decisions based on Perceived State.

**Mission Objectives:**
1. **Search:** Reveal the map to find victims.
2. **Rescue:** Navigate to and secure victims (Priority #1).
3. **Safety:** Monitor battery and avoid/extinguish fire hazards.
4. **Efficiency:** Minimize movement cost. Every step costs money. Do not backtrack unnecessarily.

**Sensor Data:**
You receive a "visible" local grid. Unrevealed cells are "Unknown".

**Protocol:**
- Analyze the local grid topology.
- If a VICTIM is found, create a rescue plan immediately.
- If FIRE blocks a path, extinguish it.
- If the area is clear, choose a frontier (unexplored edge) to explore.
- **Safety Rule:** If battery is critical (< 20%), you **MUST** return to the START position (0,0) to recharge. Set action to 'RECHARGE' and targetCoordinates to {x:0, y:0}.

Return valid JSON complying with the schema.
`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getDecisionFromGemini = async (
  robot: RobotState,
  visibleCells: Cell[],
  gridSize: number
): Promise<DecisionResponse> => {
  const model = "gemini-3-flash-preview";
  let attempts = 0;
  const maxAttempts = 3;
  let backoff = 2000; // Start with 2s delay

  const context = {
    telemetry: {
      battery: robot.battery,
      health: robot.health,
      position: robot.pos,
      status: robot.status
    },
    perception: visibleCells.map(c => ({
      x: c.x,
      y: c.y,
      type: c.type,
      // Only include distance for "AI Perception", logic handles precise distance
      relative_distance: Math.abs(c.x - robot.pos.x) + Math.abs(c.y - robot.pos.y)
    }))
  };

  const prompt = `
    **System Tick: ${Date.now()}**
    
    **World Model State (Context):**
    ${JSON.stringify(context)}
    
    Determine the next tactical maneuver for maximum ROI and safety.
    `;

  while (attempts < maxAttempts) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reasoning: { type: Type.STRING, description: "Chain of thought for the decision." },
              action: { type: Type.STRING, enum: ['MOVE', 'RESCUE', 'EXTINGUISH', 'EXPLORE', 'RECHARGE'] },
              targetCoordinates: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.INTEGER },
                  y: { type: Type.INTEGER }
                },
                description: "Global grid coordinates for the target."
              },
              priority: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] }
            },
            required: ["reasoning", "action", "priority"]
          }
        }
      });

      if (response.text) {
          return JSON.parse(response.text) as DecisionResponse;
      }
      
      throw new Error("Empty response payload from Intelligence Layer");

    } catch (error: any) {
      attempts++;
      const isRateLimit = error.status === 429 || error.code === 429 || 
                          (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')));

      if (isRateLimit && attempts < maxAttempts) {
        console.warn(`[Intelligence Layer] Rate limit detected. Cooling down for ${backoff}ms...`);
        await delay(backoff);
        backoff *= 2;
        continue;
      }

      console.error("Intelligence Layer Fault:", error);
      
      // Fallback
      return {
        reasoning: "Communication fault or Rate Limit with AI Core. Initiating fallback exploration.",
        action: 'EXPLORE',
        priority: 'LOW'
      };
    }
  }

  // Fallback if loop finishes without return (should satisfy TS)
  return {
      reasoning: "System Timeout. Fallback active.",
      action: 'EXPLORE',
      priority: 'LOW'
  };
};
