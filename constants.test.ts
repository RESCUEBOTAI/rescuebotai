import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ROBOT_TYPES } from './constants';
import { RobotConfig } from './types';

describe('Robot Configuration', () => {
  describe('Property 10: Robot Configuration Completeness', () => {
    it('should have all required properties for every robot type', () => {
      /**
       * **Validates: Requirements 11.2**
       * 
       * Property: For any robot type in the ROBOT_TYPES constant, the configuration 
       * object should contain all required properties: id, name, description, 
       * speedMultiplier, batteryDrainRate, and maxHealth.
       */
      
      // Test each robot in ROBOT_TYPES
      ROBOT_TYPES.forEach((robot: RobotConfig) => {
        // Check that all required properties exist
        expect(robot).toHaveProperty('id');
        expect(robot).toHaveProperty('name');
        expect(robot).toHaveProperty('description');
        expect(robot).toHaveProperty('speedMultiplier');
        expect(robot).toHaveProperty('batteryDrainRate');
        expect(robot).toHaveProperty('maxHealth');
        
        // Check that properties have the correct types
        expect(typeof robot.id).toBe('string');
        expect(typeof robot.name).toBe('string');
        expect(typeof robot.description).toBe('string');
        expect(typeof robot.speedMultiplier).toBe('number');
        expect(typeof robot.batteryDrainRate).toBe('number');
        expect(typeof robot.maxHealth).toBe('number');
        
        // Check that string properties are non-empty
        expect(robot.id.length).toBeGreaterThan(0);
        expect(robot.name.length).toBeGreaterThan(0);
        expect(robot.description.length).toBeGreaterThan(0);
        
        // Check that numeric properties are within reasonable ranges
        expect(robot.speedMultiplier).toBeGreaterThan(0);
        expect(robot.speedMultiplier).toBeLessThanOrEqual(2.0);
        expect(robot.batteryDrainRate).toBeGreaterThan(0);
        expect(robot.batteryDrainRate).toBeLessThanOrEqual(2.0);
        expect(robot.maxHealth).toBeGreaterThanOrEqual(50);
        expect(robot.maxHealth).toBeLessThanOrEqual(150);
      });
    });

    it('should maintain completeness property for arbitrary robot configurations', () => {
      /**
       * **Validates: Requirements 11.2**
       * 
       * Property-based test: For any valid robot configuration object, it should 
       * contain all required properties with appropriate types and values.
       */
      
      // Define an arbitrary robot config generator
      const robotConfigArbitrary = fc.record({
        id: fc.string({ minLength: 1, maxLength: 20 }),
        name: fc.string({ minLength: 1, maxLength: 50 }),
        description: fc.string({ minLength: 10, maxLength: 200 }),
        speedMultiplier: fc.double({ min: 0.5, max: 2.0, noNaN: true }),
        batteryDrainRate: fc.double({ min: 0.5, max: 1.5, noNaN: true }),
        maxHealth: fc.integer({ min: 80, max: 120 })
      });

      fc.assert(
        fc.property(robotConfigArbitrary, (robot) => {
          // Verify all required properties exist
          const hasAllProperties = 
            'id' in robot &&
            'name' in robot &&
            'description' in robot &&
            'speedMultiplier' in robot &&
            'batteryDrainRate' in robot &&
            'maxHealth' in robot;
          
          // Verify types are correct
          const hasCorrectTypes =
            typeof robot.id === 'string' &&
            typeof robot.name === 'string' &&
            typeof robot.description === 'string' &&
            typeof robot.speedMultiplier === 'number' &&
            typeof robot.batteryDrainRate === 'number' &&
            typeof robot.maxHealth === 'number';
          
          // Verify values are non-empty/valid
          const hasValidValues =
            robot.id.length > 0 &&
            robot.name.length > 0 &&
            robot.description.length > 0 &&
            !isNaN(robot.speedMultiplier) &&
            !isNaN(robot.batteryDrainRate) &&
            !isNaN(robot.maxHealth);
          
          return hasAllProperties && hasCorrectTypes && hasValidValues;
        }),
        { numRuns: 20 }
      );
    });
  });
});
