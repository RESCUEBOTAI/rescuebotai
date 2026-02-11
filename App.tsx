import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cell, 
  CellType, 
  RobotState, 
  RobotStatus, 
  SimulationMetrics, 
  SystemModule,
  ScenarioConfig
} from './types';
import { 
  GRID_SIZE, 
  TICK_RATE_MS, 
  MAX_BATTERY, 
  MOVEMENT_COST, 
  MAX_HEALTH,
  SCENARIOS,
  CHARGING_RATE,
  CELL_SIZE_PX
} from './constants';
import { getDecisionFromGemini } from './services/geminiService';
import * as Perception from './services/perception';
import * as Navigation from './services/navigation';
import * as Telemetry from './services/telemetry';

import SimulationGrid from './components/SimulationGrid';
import MetricsPanel from './components/MetricsPanel';
import TerminalLog from './components/TerminalLog';
import WizardModal from './components/Onboarding/WizardModal';
import { useOnboardingStore } from './store/onboardingStore';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  // --- Onboarding State ---
  const { hasCompletedOnboarding, scenarioConfig, robotConfig, resetOnboarding } = useOnboardingStore();

  // --- Simulation State (Digital Twin) ---
  const [grid, setGrid] = useState<Cell[][]>([]); // The "Truth"
  const [robot, setRobot] = useState<RobotState>({
    pos: { x: 0, y: 0 },
    battery: MAX_BATTERY,
    health: robotConfig?.maxHealth || MAX_HEALTH,
    status: RobotStatus.IDLE,
    victimsRescued: 0,
    firesExtinguished: 0,
    path: [],
    currentGoal: null,
    logs: []
  });
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    stepsTaken: 0,
    batteryHistory: [],
    explorationRate: [],
    operationalCost: 0,
    valueGenerated: 0
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    scenarioConfig?.id || SCENARIOS[0].id
  );
  const [cellSize, setCellSize] = useState<number>(CELL_SIZE_PX);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // --- Helpers ---
  const log = (source: SystemModule, msg: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') => {
    setRobot(prev => ({
      ...prev,
      logs: [...prev.logs, Telemetry.createLog(source, msg, type)]
    }));
  };

  const handleEmergencyStop = () => {
      setIsRunning(false);
      setRobot(prev => ({ ...prev, status: RobotStatus.EMERGENCY_STOP, path: [] }));
      log(SystemModule.SAFETY, "EMERGENCY STOP TRIGGERED BY OPERATOR. ALL SYSTEMS HALTED.", "ERROR");
  };

  const handleResetOnboarding = () => {
    resetOnboarding();
    setShowResetConfirm(false);
  };

  // --- Initialization (Simulation Layer) ---
  const initSimulation = useCallback(() => {
    // Use scenarioConfig from store if available, otherwise use selected scenario
    const scenario = scenarioConfig || SCENARIOS.find(s => s.id === selectedScenarioId) || SCENARIOS[0];
    const newGrid: Cell[][] = [];
    
    // Generate Procedural Map based on Scenario
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        let type = CellType.EMPTY;
        const rand = Math.random();
        
        if (x === 0 && y === 0) type = CellType.START;
        else if (rand < scenario.obstacleDensity) type = Math.random() > 0.5 ? CellType.WALL : CellType.DEBRIS;
        
        row.push({ x, y, type, revealed: x < 2 && y < 2, difficulty: MOVEMENT_COST[type] });
      }
      newGrid.push(row);
    }
    
    // Asset Placement based on Scenario
    const placeRandom = (type: CellType, count: number) => {
      let placed = 0;
      let attempts = 0;
      while (placed < count && attempts < 1000) {
        attempts++;
        const rx = Math.floor(Math.random() * GRID_SIZE);
        const ry = Math.floor(Math.random() * GRID_SIZE);
        if (newGrid[ry][rx].type === CellType.EMPTY && (rx > 2 || ry > 2)) {
          newGrid[ry][rx].type = type;
          placed++;
        }
      }
    };
    placeRandom(CellType.VICTIM, scenario.victimCount);
    placeRandom(CellType.FIRE, scenario.fireCount);

    setGrid(newGrid);
    setRobot({
      pos: { x: 0, y: 0 },
      battery: MAX_BATTERY,
      health: robotConfig?.maxHealth || MAX_HEALTH,
      status: RobotStatus.IDLE,
      victimsRescued: 0,
      firesExtinguished: 0,
      path: [],
      currentGoal: null,
      logs: []
    });
    setMetrics({ 
        stepsTaken: 0, 
        batteryHistory: [{step: 0, level: 100}], 
        explorationRate: [{step:0, rate:0}],
        operationalCost: 0,
        valueGenerated: 0 
    });
    setIsRunning(false);
    
    // Initial Log
    setRobot(prev => ({
      ...prev,
      logs: [Telemetry.createLog(SystemModule.SIMULATION, `Scenario Loaded: ${scenario.name}`)]
    }));
  }, [selectedScenarioId, scenarioConfig, robotConfig]);

  useEffect(() => { initSimulation(); }, [initSimulation]);

  // --- Intelligence Layer Trigger ---
  const runIntelligenceLayer = async (currentRobot: RobotState, currentGrid: Cell[][]) => {
    if (currentRobot.status === RobotStatus.EMERGENCY_STOP) return;

    setRobot(prev => ({ ...prev, status: RobotStatus.PLANNING }));
    log(SystemModule.INTELLIGENCE, "Acquiring situational awareness...", "INFO");

    // 1. Perception Query (What do I know?)
    const knownWorld = Perception.getKnownWorld(currentGrid);
    
    // 2. Decision Engine (Gemini)
    const decision = await getDecisionFromGemini(currentRobot, knownWorld, GRID_SIZE);
    
    log(SystemModule.INTELLIGENCE, `Strategy: ${decision.action} (${decision.priority}) - ${decision.reasoning}`, "SUCCESS");

    // 3. Planning Layer (Task -> Motion)
    let newPath: import('./types').Coordinates[] = [];
    let nextStatus = RobotStatus.MOVING;

    // Handle immediate actions or movement
    if (decision.action === 'RECHARGE') {
      // Prioritize Charging
      if (currentRobot.pos.x === 0 && currentRobot.pos.y === 0) {
        // Already at base, switch to charging immediately
        setRobot(prev => ({ ...prev, status: RobotStatus.RECHARGING }));
        log(SystemModule.CONTROL, "Docked at charging station. Initiating recharge sequence.", "INFO");
        return;
      }
      
      const chargeTarget = { x: 0, y: 0 };
      newPath = Navigation.planPath(currentRobot.pos, chargeTarget, currentGrid);
      log(SystemModule.PLANNING, "Returning to base for recharge.", "WARNING");
      
    } else if (decision.targetCoordinates) {
      newPath = Navigation.planPath(currentRobot.pos, decision.targetCoordinates, currentGrid);
      
      if (newPath.length === 0) {
        log(SystemModule.PLANNING, "No viable path to target. Aborting.", "WARNING");
        nextStatus = RobotStatus.IDLE;
      } else {
        log(SystemModule.PLANNING, `Path computed: ${newPath.length} steps.`, "INFO");
      }
    } else if (decision.action === 'EXPLORE') {
        // Fallback exploration if no coordinate provided (should adhere to known world)
        // Simple heuristic: Find closest unknown
        const unknownCells = currentGrid.flat().filter(c => !c.revealed);
        if (unknownCells.length > 0) {
           const target = unknownCells[Math.floor(Math.random() * unknownCells.length)];
           newPath = Navigation.planPath(currentRobot.pos, {x: target.x, y: target.y}, currentGrid);
           log(SystemModule.PLANNING, "Exploration vector calculated.", "INFO");
        }
    }

    setRobot(prev => ({
      ...prev,
      status: nextStatus,
      path: newPath,
      currentGoal: decision.targetCoordinates || null
    }));
  };

  // --- Main Simulation Loop (The "Tick") ---
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;

    if (isRunning && robot.status !== RobotStatus.EMERGENCY_STOP) {
      // Allow loop to run even if battery is 0 ONLY if we are recharging.
      // Otherwise stop if battery is 0.
      if (robot.battery <= 0 && robot.status !== RobotStatus.RECHARGING) {
        // Stop simulation if dead
        setIsRunning(false);
        log(SystemModule.SAFETY, "BATTERY DEPLETED. MISSION FAILED.", "ERROR");
        return;
      }

      intervalId = setInterval(() => {
        
        // --- RECHARGING STATE ---
        if (robot.status === RobotStatus.RECHARGING) {
           const newBattery = Math.min(MAX_BATTERY, robot.battery + CHARGING_RATE);
           setRobot(prev => ({ 
               ...prev, 
               battery: newBattery 
           }));

           if (newBattery >= MAX_BATTERY) {
               setRobot(prev => ({ ...prev, status: RobotStatus.IDLE }));
               log(SystemModule.CONTROL, "Battery fully charged. Resuming mission.", "SUCCESS");
           }
           // Skip movement/sensing while charging
           return; 
        }

        // --- LAYER 1: PERCEPTION ---
        // Sensors read the "Truth" grid and update the Robot's "Belief"
        const { newMapState } = Perception.scanEnvironment(grid, robot.pos);
        if (newMapState !== grid) setGrid(newMapState);

        // --- LAYER 2: INTELLIGENCE ---
        // If idle, trigger the decision brain
        if (robot.status === RobotStatus.IDLE || (robot.path.length === 0 && robot.status !== RobotStatus.PLANNING)) {
          if (robot.battery > 0) runIntelligenceLayer(robot, newMapState);
          return; // Wait for async intelligence
        }
        
        // --- LAYER 3: CONTROL & EXECUTION ---
        if (robot.status === RobotStatus.PLANNING) return; // Busy thinking

        if (robot.path.length > 0) {
          const nextStep = robot.path[0];
          const targetCell = grid[nextStep.y][nextStep.x];

          // Action Handling (Interaction with Environment)
          if (targetCell.type === CellType.FIRE) {
             log(SystemModule.CONTROL, "Activating suppression system.", "WARNING");
             setGrid(prev => {
                const ng = prev.map(r => r.map(c => ({...c})));
                ng[nextStep.y][nextStep.x].type = CellType.DEBRIS;
                return ng;
             });
             const batteryDrainRate = robotConfig?.batteryDrainRate || 1.0;
             setRobot(prev => ({ 
               ...prev, 
               battery: prev.battery - (5 * batteryDrainRate), 
               firesExtinguished: prev.firesExtinguished + 1 
             }));
             return; // Action consumes tick
          }

          if (targetCell.type === CellType.VICTIM) {
             log(SystemModule.CONTROL, "Victim secured. Medical protocol initiated.", "SUCCESS");
             setGrid(prev => {
                const ng = prev.map(r => r.map(c => ({...c})));
                ng[nextStep.y][nextStep.x].type = CellType.EMPTY;
                return ng;
             });
             const batteryDrainRate = robotConfig?.batteryDrainRate || 1.0;
             setRobot(prev => ({
               ...prev,
               pos: nextStep,
               path: prev.path.slice(1),
               victimsRescued: prev.victimsRescued + 1,
               battery: prev.battery - (10 * batteryDrainRate)
             }));
             return;
          }

          // Movement Control
          const controlResult = Navigation.executeControlStep(
            robot.pos, 
            nextStep, 
            robot.battery, 
            targetCell.type,
            robotConfig || undefined
          );

          if (controlResult.success) {
            setRobot(prev => ({
              ...prev,
              pos: nextStep,
              path: prev.path.slice(1),
              battery: controlResult.newBattery,
              status: RobotStatus.MOVING
            }));
          } else {
            log(SystemModule.CONTROL, controlResult.message || "Movement Error", "ERROR");
            setRobot(prev => ({ ...prev, path: [], status: RobotStatus.IDLE }));
          }
        } else {
            // Path finished
            // Check if we finished at Start Node and wanted to recharge
            if (robot.pos.x === 0 && robot.pos.y === 0 && robot.battery < MAX_BATTERY) {
                 setRobot(prev => ({ ...prev, status: RobotStatus.RECHARGING }));
                 log(SystemModule.CONTROL, "Docked. Charging...", "INFO");
            } else {
                 setRobot(prev => ({ ...prev, status: RobotStatus.IDLE }));
            }
        }

        // --- LAYER 4: TELEMETRY & OBSERVABILITY ---
        setMetrics(prev => Telemetry.updateMetrics(
            prev, 
            robot.battery, 
            grid.flat().filter(c => c.revealed).length, 
            GRID_SIZE * GRID_SIZE,
            robot.victimsRescued,
            robot.firesExtinguished
        ));

      }, TICK_RATE_MS);
    }

    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isRunning, robot, grid]);

  // --- Conditional Rendering: Show wizard if onboarding not completed ---
  if (!hasCompletedOnboarding) {
    return <WizardModal />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 flex flex-col items-center">
      <header className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-center mb-8 border-b border-slate-700 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono text-blue-400 tracking-tighter">RESCUEBOT.AI</h1>
          <p className="text-slate-500 text-sm">Autonomous Robotics Platform // <span className="text-emerald-500">v2.1 Architecture</span></p>
        </div>
        
        {/* Scenario Selection - Only show if no scenario from onboarding */}
        {!scenarioConfig && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Mission Scenario</label>
                <select 
                    value={selectedScenarioId} 
                    onChange={(e) => {
                        setSelectedScenarioId(e.target.value);
                    }}
                    disabled={isRunning}
                    className="bg-slate-800 text-slate-200 text-sm p-2 rounded border border-slate-700 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                >
                    {SCENARIOS.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            <div className="h-10 w-px bg-slate-700 mx-2"></div>
          </div>
        )}

        <div className="flex items-center gap-4">

            <button 
              onClick={() => setIsRunning(!isRunning)}
              disabled={robot.status === RobotStatus.EMERGENCY_STOP}
              className={`px-6 py-2 rounded font-bold font-mono uppercase tracking-widest transition-all ${
                isRunning 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRunning ? 'PAUSE' : 'START'}
            </button>
            <button 
              onClick={initSimulation}
              className="px-6 py-2 rounded font-bold font-mono uppercase tracking-widest bg-slate-700 hover:bg-slate-600 text-slate-300"
            >
              RESET
            </button>
            
            {/* E-STOP Button (Safety Standard) */}
            <button 
                onClick={handleEmergencyStop}
                className="ml-4 px-4 py-2 rounded-full font-black text-xs font-mono bg-red-600 hover:bg-red-700 text-white border-2 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.7)] animate-pulse"
                title="EMERGENCY STOP - HARDWARE INTERRUPT"
            >
                E-STOP
            </button>

            {/* Reset Onboarding Button */}
            <button 
                onClick={() => setShowResetConfirm(true)}
                className="ml-2 px-3 py-2 rounded font-mono text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600"
                title="Reset Onboarding - Go through setup wizard again"
            >
                ⚙️ RESET SETUP
            </button>
        </div>
      </header>

      {/* Reset Onboarding Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 border-2 border-slate-600 rounded-lg p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold font-mono text-blue-400 mb-3">Reset Onboarding?</h3>
            <p className="text-slate-300 text-sm mb-6">
              This will clear your saved preferences and show the setup wizard again. 
              You'll be able to choose a new scenario and robot type.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded font-mono text-sm bg-slate-700 hover:bg-slate-600 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleResetOnboarding}
                className="px-4 py-2 rounded font-mono text-sm bg-blue-600 hover:bg-blue-700 text-white"
              >
                Reset Setup
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex justify-center bg-slate-800/50 p-6 rounded-xl border border-slate-700 relative overflow-auto">
             <div className="absolute top-4 left-4 text-xs font-mono text-slate-500">CAM_FEED_01 // VISUALIZATION</div>
             
             {/* ZOOM CONTROL */}
             <div className="absolute top-4 right-4 flex items-center gap-2 z-10 bg-slate-900/80 p-2 rounded-lg border border-slate-700 backdrop-blur-sm">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Zoom</span>
                <input 
                    type="range" 
                    min="15" 
                    max="60" 
                    value={cellSize} 
                    onChange={(e) => setCellSize(Number(e.target.value))}
                    className="accent-blue-500 h-1 w-20 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
             </div>

             {/* E-STOP OVERLAY */}
             {robot.status === RobotStatus.EMERGENCY_STOP && (
                 <div className="absolute inset-0 bg-red-900/40 z-50 flex items-center justify-center backdrop-blur-sm rounded-xl">
                     <div className="bg-black border-2 border-red-500 p-6 rounded-lg shadow-2xl text-center">
                         <h2 className="text-3xl font-black text-red-500 mb-2">SYSTEM HALTED</h2>
                         <p className="text-red-200 font-mono text-sm">EMERGENCY PROTOCOL ACTIVE</p>
                         <p className="text-slate-400 text-xs mt-4">Manual reset required.</p>
                     </div>
                 </div>
             )}
             
             <div className="pt-8">
               <SimulationGrid grid={grid} robotPos={robot.pos} path={robot.path} cellSize={cellSize} />
             </div>
          </div>
          <TerminalLog logs={robot.logs} />
        </div>
        <div className="lg:col-span-5 flex flex-col gap-6">
           <MetricsPanel robot={robot} metrics={metrics} />
           <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-xs text-slate-400 grid grid-cols-2 gap-2">
              <div className="col-span-2 text-slate-500 border-b border-slate-700 pb-1 mb-1">LEGEND</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-black border border-slate-600"></span> FOG OF WAR</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-slate-500"></span> OBSTACLE</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-orange-600"></span> THERMAL SIG (FIRE)</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-600"></span> BIO SIG (VICTIM)</div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;