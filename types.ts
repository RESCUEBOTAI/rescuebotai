export enum CellType {
  EMPTY = 'EMPTY',
  WALL = 'WALL',
  DEBRIS = 'DEBRIS', // Slows down
  FIRE = 'FIRE',     // Dangerous, needs extinguishing
  VICTIM = 'VICTIM', // Goal
  START = 'START'
}

export enum RobotStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  PLANNING = 'PLANNING',
  MOVING = 'MOVING',
  ACTING = 'ACTING', // e.g. Extinguishing, Rescuing
  CRITICAL = 'CRITICAL', // Low battery/Damaged
  EMERGENCY_STOP = 'E-STOP', // Safety Override
  RECHARGING = 'RECHARGING'
}

export enum SystemModule {
  SIMULATION = 'SIMULATION',
  PERCEPTION = 'PERCEPTION',
  INTELLIGENCE = 'INTELLIGENCE',
  PLANNING = 'PLANNING',
  CONTROL = 'CONTROL',
  TELEMETRY = 'TELEMETRY',
  SAFETY = 'SAFETY_SYSTEM'
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface Cell {
  x: number;
  y: number;
  type: CellType;
  revealed: boolean; // Fog of war status (World Model belief)
  difficulty: number; // Movement cost
  victimPriority?: 'HIGH' | 'LOW';
}

export interface RobotState {
  pos: Coordinates;
  battery: number;
  health: number;
  status: RobotStatus;
  victimsRescued: number;
  firesExtinguished: number;
  path: Coordinates[]; // Current planned path
  currentGoal: Coordinates | null;
  logs: LogEntry[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  source: SystemModule;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
}

export interface SimulationMetrics {
  stepsTaken: number;
  batteryHistory: { step: number; level: number }[];
  explorationRate: { step: number; rate: number }[];
  operationalCost: number; // Estimated cost in $
  valueGenerated: number; // Estimated value in $
}

export interface DecisionResponse {
  reasoning: string;
  action: 'MOVE' | 'RESCUE' | 'EXTINGUISH' | 'EXPLORE' | 'RECHARGE';
  targetCoordinates?: Coordinates;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

// Sensor Interface Types
export interface SensorReading {
  coordinates: Coordinates;
  type: CellType;
  distance: number;
}

// Scenario Definition for Testing
export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  obstacleDensity: number;
  victimCount: number;
  fireCount: number;
  seed?: number; // For reproducibility
}

// Robot Configuration for Onboarding
export interface RobotConfig {
  id: string;
  name: string;
  description: string;
  speedMultiplier: number;      // 0.5 - 2.0 (affects movement speed)
  batteryDrainRate: number;     // 0.5 - 1.5 (multiplier on battery consumption)
  maxHealth: number;            // 80 - 120 (starting health)
}