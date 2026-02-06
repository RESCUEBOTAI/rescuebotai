import { v4 as uuidv4 } from 'uuid';
import { LogEntry, SystemModule, SimulationMetrics } from '../types';
import { COST_PER_STEP, COST_PER_BATTERY_PERCENT, VALUE_PER_RESCUE, VALUE_PER_HAZARD_CLEARED, MAX_BATTERY } from '../constants';

/**
 * Observability Layer
 * Responsibilities:
 * 1. Logging: Centralized structured logging.
 * 2. Metrics: Performance tracking.
 */

export const createLog = (
  source: SystemModule,
  message: string,
  type: LogEntry['type'] = 'INFO'
): LogEntry => {
  return {
    id: uuidv4(),
    timestamp: Date.now(),
    message,
    source,
    type
  };
};

export const updateMetrics = (
  currentMetrics: SimulationMetrics,
  batteryLevel: number,
  exploredCount: number,
  totalCells: number,
  victimsRescued: number,
  firesExtinguished: number
): SimulationMetrics => {
  const step = currentMetrics.stepsTaken + 1;
  
  // ROI Calculation
  const batteryUsed = MAX_BATTERY - batteryLevel;
  const operationalCost = (step * COST_PER_STEP) + (batteryUsed * COST_PER_BATTERY_PERCENT);
  const valueGenerated = (victimsRescued * VALUE_PER_RESCUE) + (firesExtinguished * VALUE_PER_HAZARD_CLEARED);

  return {
    stepsTaken: step,
    batteryHistory: [
      ...currentMetrics.batteryHistory,
      { step, level: batteryLevel }
    ],
    explorationRate: [
      ...currentMetrics.explorationRate,
      { step, rate: Math.round((exploredCount / totalCells) * 100) }
    ],
    operationalCost,
    valueGenerated
  };
};