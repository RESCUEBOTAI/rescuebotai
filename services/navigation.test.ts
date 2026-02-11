import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { executeControlStep } from './navigation';
import { CellType, RobotConfig } from '../types';

describe('Navigation Service - Property-Based Tests', () => {
  
  /**
   * Property 8: Robot Speed Multiplier Effect
   * 
   * **Validates: Requirements 11.6**
   * 
   * For any robot configuration with speed multiplier M, when the robot moves 
   * through the simulation, the effective movement speed should be proportional 
   * to M (higher M means faster movement).
   * 
   * Since speed multiplier affects battery drain (faster robots drain more), 
   * verify that higher multipliers result in higher battery consumption.
   */
  it('Property 8: Robot Speed Multiplier Effect - higher speed multipliers result in higher battery consumption', () => {
    
    // Define arbitrary generators for robot configurations with varying speed multipliers
    const robotConfigArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      speedMultiplier: fc.double({ min: 0.5, max: 2.0, noNaN: true }),
      batteryDrainRate: fc.double({ min: 0.5, max: 1.5, noNaN: true }),
      maxHealth: fc.integer({ min: 80, max: 120 })
    });

    // Define arbitrary for cell types (excluding WALL since movement fails)
    const traversableCellTypeArbitrary = fc.constantFrom(
      CellType.EMPTY,
      CellType.START,
      CellType.DEBRIS,
      CellType.FIRE,
      CellType.VICTIM
    );

    // Define arbitrary for battery level
    const batteryArbitrary = fc.double({ min: 10, max: 100, noNaN: true });

    fc.assert(
      fc.property(
        robotConfigArbitrary,
        robotConfigArbitrary,
        traversableCellTypeArbitrary,
        batteryArbitrary,
        (robotConfig1, robotConfig2, cellType, initialBattery) => {
          // Ensure we have two different speed multipliers for comparison
          // If they're the same, skip this iteration
          if (robotConfig1.speedMultiplier === robotConfig2.speedMultiplier) {
            return true;
          }

          // Normalize battery drain rates to isolate speed multiplier effect
          const normalizedConfig1: RobotConfig = {
            ...robotConfig1,
            batteryDrainRate: 1.0
          };
          
          const normalizedConfig2: RobotConfig = {
            ...robotConfig2,
            batteryDrainRate: 1.0
          };

          // Execute movement with both configurations
          const currentPos = { x: 0, y: 0 };
          const nextPos = { x: 1, y: 0 };

          const result1 = executeControlStep(
            currentPos,
            nextPos,
            initialBattery,
            cellType,
            normalizedConfig1
          );

          const result2 = executeControlStep(
            currentPos,
            nextPos,
            initialBattery,
            cellType,
            normalizedConfig2
          );

          // Both movements should succeed (not hitting a wall)
          expect(result1.success).toBe(true);
          expect(result2.success).toBe(true);

          // Calculate battery drain for each
          const drain1 = initialBattery - result1.newBattery;
          const drain2 = initialBattery - result2.newBattery;

          // Property: Battery drain should be proportional to speed multiplier
          // If speedMultiplier1 > speedMultiplier2, then drain1 > drain2
          // If speedMultiplier1 < speedMultiplier2, then drain1 < drain2
          
          const speedRatio = normalizedConfig1.speedMultiplier / normalizedConfig2.speedMultiplier;
          const drainRatio = drain1 / drain2;

          // The drain ratio should approximately equal the speed ratio
          // Allow for small floating point differences
          const tolerance = 0.001;
          const ratiosMatch = Math.abs(drainRatio - speedRatio) < tolerance;

          return ratiosMatch;
        }
      ),
      { numRuns: 20 } // Run 20 iterations for faster test execution
    );
  });

  /**
   * Property 8b: Robot Speed Multiplier Effect - Monotonicity
   * 
   * A simpler property: for the same conditions, a robot with higher speed 
   * multiplier should always drain more battery than one with lower speed multiplier.
   */
  it('Property 8b: Robot Speed Multiplier Effect - monotonicity of battery drain', () => {
    
    // Generate two speed multipliers where one is strictly greater with meaningful difference
    // to avoid floating-point precision issues
    const speedMultiplierPairArbitrary = fc.tuple(
      fc.double({ min: 0.5, max: 1.45, noNaN: true }),
      fc.double({ min: 1.55, max: 2.0, noNaN: true })
    );

    const cellTypeArbitrary = fc.constantFrom(
      CellType.EMPTY,
      CellType.START,
      CellType.DEBRIS,
      CellType.FIRE,
      CellType.VICTIM
    );

    const batteryArbitrary = fc.double({ min: 10, max: 100, noNaN: true });
    const batteryDrainRateArbitrary = fc.double({ min: 0.5, max: 1.5, noNaN: true });

    fc.assert(
      fc.property(
        speedMultiplierPairArbitrary,
        cellTypeArbitrary,
        batteryArbitrary,
        batteryDrainRateArbitrary,
        ([lowerSpeed, higherSpeed], cellType, initialBattery, drainRate) => {
          
          const configLower: RobotConfig = {
            id: 'test-lower',
            name: 'Test Lower',
            description: 'Test robot with lower speed',
            speedMultiplier: lowerSpeed,
            batteryDrainRate: drainRate,
            maxHealth: 100
          };

          const configHigher: RobotConfig = {
            id: 'test-higher',
            name: 'Test Higher',
            description: 'Test robot with higher speed',
            speedMultiplier: higherSpeed,
            batteryDrainRate: drainRate,
            maxHealth: 100
          };

          const currentPos = { x: 0, y: 0 };
          const nextPos = { x: 1, y: 0 };

          const resultLower = executeControlStep(
            currentPos,
            nextPos,
            initialBattery,
            cellType,
            configLower
          );

          const resultHigher = executeControlStep(
            currentPos,
            nextPos,
            initialBattery,
            cellType,
            configHigher
          );

          // Both should succeed
          expect(resultLower.success).toBe(true);
          expect(resultHigher.success).toBe(true);

          // Calculate drains
          const drainLower = initialBattery - resultLower.newBattery;
          const drainHigher = initialBattery - resultHigher.newBattery;

          // Property: Higher speed multiplier should result in higher battery drain
          // drainHigher should be strictly greater than drainLower
          return drainHigher > drainLower;
        }
      ),
      { numRuns: 20 } // Run 20 iterations for faster test execution
    );
  });

  /**
   * Property 9: Robot Battery Drain Rate Effect
   * 
   * **Validates: Requirements 11.7**
   * 
   * For any robot configuration with battery drain rate D, when the robot consumes 
   * battery during operations, the battery consumption should be proportional to D 
   * (higher D means faster battery drain).
   */
  it('Property 9: Robot Battery Drain Rate Effect - higher drain rates result in higher battery consumption', () => {
    
    // Generate two battery drain rates where one is strictly greater with meaningful difference
    // to avoid floating-point precision issues
    const batteryDrainRatePairArbitrary = fc.tuple(
      fc.double({ min: 0.5, max: 0.95, noNaN: true }),
      fc.double({ min: 1.05, max: 1.5, noNaN: true })
    );

    const cellTypeArbitrary = fc.constantFrom(
      CellType.EMPTY,
      CellType.START,
      CellType.DEBRIS,
      CellType.FIRE,
      CellType.VICTIM
    );

    const batteryArbitrary = fc.double({ min: 10, max: 100, noNaN: true });
    const speedMultiplierArbitrary = fc.double({ min: 0.5, max: 2.0, noNaN: true });

    fc.assert(
      fc.property(
        batteryDrainRatePairArbitrary,
        cellTypeArbitrary,
        batteryArbitrary,
        speedMultiplierArbitrary,
        ([lowerDrainRate, higherDrainRate], cellType, initialBattery, speedMultiplier) => {
          
          const configLower: RobotConfig = {
            id: 'test-lower-drain',
            name: 'Test Lower Drain',
            description: 'Test robot with lower battery drain rate',
            speedMultiplier: speedMultiplier,
            batteryDrainRate: lowerDrainRate,
            maxHealth: 100
          };

          const configHigher: RobotConfig = {
            id: 'test-higher-drain',
            name: 'Test Higher Drain',
            description: 'Test robot with higher battery drain rate',
            speedMultiplier: speedMultiplier,
            batteryDrainRate: higherDrainRate,
            maxHealth: 100
          };

          const currentPos = { x: 0, y: 0 };
          const nextPos = { x: 1, y: 0 };

          const resultLower = executeControlStep(
            currentPos,
            nextPos,
            initialBattery,
            cellType,
            configLower
          );

          const resultHigher = executeControlStep(
            currentPos,
            nextPos,
            initialBattery,
            cellType,
            configHigher
          );

          // Both should succeed
          expect(resultLower.success).toBe(true);
          expect(resultHigher.success).toBe(true);

          // Calculate drains
          const drainLower = initialBattery - resultLower.newBattery;
          const drainHigher = initialBattery - resultHigher.newBattery;

          // Property: Higher battery drain rate should result in higher battery consumption
          // drainHigher should be strictly greater than drainLower
          return drainHigher > drainLower;
        }
      ),
      { numRuns: 20 } // Run 20 iterations for faster test execution
    );
  });

  /**
   * Property 9b: Robot Battery Drain Rate Effect - Proportionality
   * 
   * Verify that battery drain is proportional to the drain rate multiplier.
   * The ratio of battery drains should equal the ratio of drain rates.
   */
  it('Property 9b: Robot Battery Drain Rate Effect - proportionality of battery consumption', () => {
    
    const robotConfigArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      speedMultiplier: fc.double({ min: 0.5, max: 2.0, noNaN: true }),
      batteryDrainRate: fc.double({ min: 0.5, max: 1.5, noNaN: true }),
      maxHealth: fc.integer({ min: 80, max: 120 })
    });

    const traversableCellTypeArbitrary = fc.constantFrom(
      CellType.EMPTY,
      CellType.START,
      CellType.DEBRIS,
      CellType.FIRE,
      CellType.VICTIM
    );

    const batteryArbitrary = fc.double({ min: 10, max: 100, noNaN: true });

    fc.assert(
      fc.property(
        robotConfigArbitrary,
        robotConfigArbitrary,
        traversableCellTypeArbitrary,
        batteryArbitrary,
        (robotConfig1, robotConfig2, cellType, initialBattery) => {
          // Ensure we have two different battery drain rates for comparison
          if (robotConfig1.batteryDrainRate === robotConfig2.batteryDrainRate) {
            return true;
          }

          // Normalize speed multipliers to isolate battery drain rate effect
          const normalizedConfig1: RobotConfig = {
            ...robotConfig1,
            speedMultiplier: 1.0
          };
          
          const normalizedConfig2: RobotConfig = {
            ...robotConfig2,
            speedMultiplier: 1.0
          };

          // Execute movement with both configurations
          const currentPos = { x: 0, y: 0 };
          const nextPos = { x: 1, y: 0 };

          const result1 = executeControlStep(
            currentPos,
            nextPos,
            initialBattery,
            cellType,
            normalizedConfig1
          );

          const result2 = executeControlStep(
            currentPos,
            nextPos,
            initialBattery,
            cellType,
            normalizedConfig2
          );

          // Both movements should succeed
          expect(result1.success).toBe(true);
          expect(result2.success).toBe(true);

          // Calculate battery drain for each
          const drain1 = initialBattery - result1.newBattery;
          const drain2 = initialBattery - result2.newBattery;

          // Property: Battery drain should be proportional to battery drain rate
          // The ratio of drains should equal the ratio of drain rates
          
          const drainRateRatio = normalizedConfig1.batteryDrainRate / normalizedConfig2.batteryDrainRate;
          const drainRatio = drain1 / drain2;

          // The drain ratio should approximately equal the drain rate ratio
          // Allow for small floating point differences
          const tolerance = 0.001;
          const ratiosMatch = Math.abs(drainRatio - drainRateRatio) < tolerance;

          return ratiosMatch;
        }
      ),
      { numRuns: 20 } // Run 20 iterations for faster test execution
    );
  });
});
