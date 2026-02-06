import { CellType, ScenarioConfig } from './types';

export const GRID_SIZE = 15;
export const CELL_SIZE_PX = 40;
export const TICK_RATE_MS = 600; // Speed of simulation steps
export const MAX_BATTERY = 100;
export const MAX_HEALTH = 100;
export const CHARGING_RATE = 10; // % per tick

export const MOVEMENT_COST = {
  [CellType.EMPTY]: 1,
  [CellType.START]: 1,
  [CellType.DEBRIS]: 3,
  [CellType.WALL]: 999,
  [CellType.FIRE]: 5, // High cost/danger
  [CellType.VICTIM]: 1,
};

export const COLORS = {
  [CellType.EMPTY]: 'bg-slate-800',
  [CellType.WALL]: 'bg-slate-500',
  [CellType.DEBRIS]: 'bg-stone-700',
  [CellType.FIRE]: 'bg-orange-600 animate-pulse',
  [CellType.VICTIM]: 'bg-emerald-600',
  [CellType.START]: 'bg-blue-900',
  UNKNOWN: 'bg-black',
};

// Default Generation
export const OBSTACLE_DENSITY = 0.2;
export const VICTIM_COUNT = 3;
export const FIRE_COUNT = 4;

// ROI Constants
export const COST_PER_STEP = 0.50; // $ per movement
export const COST_PER_BATTERY_PERCENT = 5.00; // $ per energy unit
export const VALUE_PER_RESCUE = 5000.00; // $ value generated
export const VALUE_PER_HAZARD_CLEARED = 1500.00; // $ value generated

// Scenario Library
export const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'random',
    name: 'Procedural Random',
    description: 'Standard randomized disaster zone generation.',
    obstacleDensity: 0.2,
    victimCount: 3,
    fireCount: 4
  },
  {
    id: 'dense_debris',
    name: 'Urban Collapse',
    description: 'High debris density simulating a collapsed building. Navigation is difficult.',
    obstacleDensity: 0.45,
    victimCount: 2,
    fireCount: 2
  },
  {
    id: 'inferno',
    name: 'Industrial Fire',
    description: 'Extreme fire hazards. Suppression is critical for access.',
    obstacleDensity: 0.15,
    victimCount: 4,
    fireCount: 12
  },
  {
    id: 'search_party',
    name: 'Wide Area Search',
    description: 'Low obstacles, sparse victims. Tests exploration efficiency.',
    obstacleDensity: 0.05,
    victimCount: 5,
    fireCount: 0
  }
];