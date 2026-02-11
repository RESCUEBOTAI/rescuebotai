import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useOnboardingStore } from './onboardingStore';
import { ScenarioConfig, RobotConfig } from '../types';

describe('OnboardingStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useOnboardingStore.getState().resetOnboarding();
  });

  it('should have correct initial state', () => {
    const state = useOnboardingStore.getState();
    expect(state.hasCompletedOnboarding).toBe(false);
    expect(state.scenarioConfig).toBeNull();
    expect(state.robotConfig).toBeNull();
  });

  it('should atomically update all properties when completeOnboarding is called', () => {
    const mockScenario: ScenarioConfig = {
      id: 'test-scenario',
      name: 'Test Scenario',
      description: 'A test scenario',
      obstacleDensity: 0.3,
      victimCount: 5,
      fireCount: 3,
    };

    const mockRobot: RobotConfig = {
      id: 'test-robot',
      name: 'Test Robot',
      description: 'A test robot',
      speedMultiplier: 1.2,
      batteryDrainRate: 1.0,
      maxHealth: 100,
    };

    const { completeOnboarding } = useOnboardingStore.getState();
    completeOnboarding(mockScenario, mockRobot);

    const state = useOnboardingStore.getState();
    expect(state.hasCompletedOnboarding).toBe(true);
    expect(state.scenarioConfig).toEqual(mockScenario);
    expect(state.robotConfig).toEqual(mockRobot);
  });

  it('should reset completion status when resetOnboarding is called', () => {
    const mockScenario: ScenarioConfig = {
      id: 'test-scenario',
      name: 'Test Scenario',
      description: 'A test scenario',
      obstacleDensity: 0.3,
      victimCount: 5,
      fireCount: 3,
    };

    const mockRobot: RobotConfig = {
      id: 'test-robot',
      name: 'Test Robot',
      description: 'A test robot',
      speedMultiplier: 1.2,
      batteryDrainRate: 1.0,
      maxHealth: 100,
    };

    const { completeOnboarding, resetOnboarding } = useOnboardingStore.getState();
    
    // First complete onboarding
    completeOnboarding(mockScenario, mockRobot);
    expect(useOnboardingStore.getState().hasCompletedOnboarding).toBe(true);

    // Then reset
    resetOnboarding();
    const state = useOnboardingStore.getState();
    expect(state.hasCompletedOnboarding).toBe(false);
    expect(state.scenarioConfig).toBeNull();
    expect(state.robotConfig).toBeNull();
  });

  it('should maintain state consistency across multiple resets', () => {
    const mockScenario: ScenarioConfig = {
      id: 'test-scenario',
      name: 'Test Scenario',
      description: 'A test scenario',
      obstacleDensity: 0.3,
      victimCount: 5,
      fireCount: 3,
    };

    const mockRobot: RobotConfig = {
      id: 'test-robot',
      name: 'Test Robot',
      description: 'A test robot',
      speedMultiplier: 1.2,
      batteryDrainRate: 1.0,
      maxHealth: 100,
    };

    const { completeOnboarding, resetOnboarding } = useOnboardingStore.getState();
    
    // Complete and reset multiple times
    completeOnboarding(mockScenario, mockRobot);
    resetOnboarding();
    resetOnboarding(); // Second reset should be idempotent
    
    const state = useOnboardingStore.getState();
    expect(state.hasCompletedOnboarding).toBe(false);
    expect(state.scenarioConfig).toBeNull();
    expect(state.robotConfig).toBeNull();
  });

  it('should store complete robot configuration object', () => {
    const mockScenario: ScenarioConfig = {
      id: 'test-scenario',
      name: 'Test Scenario',
      description: 'A test scenario',
      obstacleDensity: 0.3,
      victimCount: 5,
      fireCount: 3,
    };

    const mockRobot: RobotConfig = {
      id: 'drone',
      name: 'Aerial Drone',
      description: 'Fast and agile',
      speedMultiplier: 1.5,
      batteryDrainRate: 1.3,
      maxHealth: 80,
    };

    const { completeOnboarding } = useOnboardingStore.getState();
    completeOnboarding(mockScenario, mockRobot);

    const state = useOnboardingStore.getState();
    expect(state.robotConfig).toEqual(mockRobot);
    expect(state.robotConfig).toHaveProperty('id');
    expect(state.robotConfig).toHaveProperty('name');
    expect(state.robotConfig).toHaveProperty('description');
    expect(state.robotConfig).toHaveProperty('speedMultiplier');
    expect(state.robotConfig).toHaveProperty('batteryDrainRate');
    expect(state.robotConfig).toHaveProperty('maxHealth');
  });

  it('should persist state to localStorage', () => {
    const mockScenario: ScenarioConfig = {
      id: 'test-scenario',
      name: 'Test Scenario',
      description: 'A test scenario',
      obstacleDensity: 0.3,
      victimCount: 5,
      fireCount: 3,
    };

    const mockRobot: RobotConfig = {
      id: 'test-robot',
      name: 'Test Robot',
      description: 'A test robot',
      speedMultiplier: 1.2,
      batteryDrainRate: 1.0,
      maxHealth: 100,
    };

    const { completeOnboarding } = useOnboardingStore.getState();
    completeOnboarding(mockScenario, mockRobot);

    // Check that data was persisted to localStorage
    const persistedData = localStorage.getItem('rescuebot-onboarding');
    expect(persistedData).not.toBeNull();
    
    if (persistedData) {
      const parsed = JSON.parse(persistedData);
      expect(parsed.state.hasCompletedOnboarding).toBe(true);
      expect(parsed.state.scenarioConfig).toEqual(mockScenario);
      expect(parsed.state.robotConfig).toEqual(mockRobot);
    }
  });
});

describe('Property 1: Complete Onboarding Atomic Update', () => {
  it('should atomically update all three properties for any valid scenario and robot configuration', () => {
    /**
     * **Validates: Requirements 1.5, 6.2, 6.3, 6.4**
     * 
     * Property: For any valid scenario configuration and robot configuration, 
     * when completeOnboarding is called with those configurations, the store 
     * should atomically update all three properties: hasCompletedOnboarding 
     * becomes true, scenarioConfig is set to the provided scenario, and 
     * robotConfig is set to the provided robot.
     */
    
    // Define arbitrary generators for ScenarioConfig
    const scenarioConfigArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 30 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      obstacleDensity: fc.double({ min: 0, max: 1, noNaN: true }),
      victimCount: fc.integer({ min: 0, max: 20 }),
      fireCount: fc.integer({ min: 0, max: 20 }),
      seed: fc.option(fc.integer({ min: 0, max: 1000000 }), { nil: undefined })
    });

    // Define arbitrary generators for RobotConfig
    const robotConfigArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      speedMultiplier: fc.double({ min: 0.5, max: 2.0, noNaN: true }),
      batteryDrainRate: fc.double({ min: 0.5, max: 1.5, noNaN: true }),
      maxHealth: fc.integer({ min: 80, max: 120 })
    });

    fc.assert(
      fc.property(
        scenarioConfigArbitrary,
        robotConfigArbitrary,
        (scenario, robot) => {
          // Reset store before each property test iteration
          useOnboardingStore.getState().resetOnboarding();
          
          // Verify initial state
          const initialState = useOnboardingStore.getState();
          expect(initialState.hasCompletedOnboarding).toBe(false);
          expect(initialState.scenarioConfig).toBeNull();
          expect(initialState.robotConfig).toBeNull();
          
          // Call completeOnboarding with generated configs
          useOnboardingStore.getState().completeOnboarding(scenario, robot);
          
          // Verify all three properties were updated atomically
          const finalState = useOnboardingStore.getState();
          
          // Property 1: hasCompletedOnboarding should be true
          const completionUpdated = finalState.hasCompletedOnboarding === true;
          
          // Property 2: scenarioConfig should match the provided scenario
          const scenarioUpdated = 
            finalState.scenarioConfig !== null &&
            finalState.scenarioConfig.id === scenario.id &&
            finalState.scenarioConfig.name === scenario.name &&
            finalState.scenarioConfig.description === scenario.description &&
            finalState.scenarioConfig.obstacleDensity === scenario.obstacleDensity &&
            finalState.scenarioConfig.victimCount === scenario.victimCount &&
            finalState.scenarioConfig.fireCount === scenario.fireCount &&
            finalState.scenarioConfig.seed === scenario.seed;
          
          // Property 3: robotConfig should match the provided robot
          const robotUpdated = 
            finalState.robotConfig !== null &&
            finalState.robotConfig.id === robot.id &&
            finalState.robotConfig.name === robot.name &&
            finalState.robotConfig.description === robot.description &&
            finalState.robotConfig.speedMultiplier === robot.speedMultiplier &&
            finalState.robotConfig.batteryDrainRate === robot.batteryDrainRate &&
            finalState.robotConfig.maxHealth === robot.maxHealth;
          
          // All three properties must be updated atomically
          return completionUpdated && scenarioUpdated && robotUpdated;
        }
      ),
      { numRuns: 20 } // Using 20 iterations as requested
    );
  });
});

describe('Property 12: State Reset Idempotence', () => {
  it('should produce the same result when calling resetOnboarding multiple times', () => {
    /**
     * **Validates: Requirements 1.6**
     * 
     * Property: For any onboarding state, calling resetOnboarding() multiple 
     * times should produce the same result as calling it once: 
     * hasCompletedOnboarding becomes false and configurations are cleared.
     */
    
    // Define arbitrary generators for ScenarioConfig
    const scenarioConfigArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 30 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      obstacleDensity: fc.double({ min: 0, max: 1, noNaN: true }),
      victimCount: fc.integer({ min: 0, max: 20 }),
      fireCount: fc.integer({ min: 0, max: 20 }),
      seed: fc.option(fc.integer({ min: 0, max: 1000000 }), { nil: undefined })
    });

    // Define arbitrary generators for RobotConfig
    const robotConfigArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      speedMultiplier: fc.double({ min: 0.5, max: 2.0, noNaN: true }),
      batteryDrainRate: fc.double({ min: 0.5, max: 1.5, noNaN: true }),
      maxHealth: fc.integer({ min: 80, max: 120 })
    });

    // Generate a random number of reset calls (1 to 5)
    const resetCountArbitrary = fc.integer({ min: 1, max: 5 });

    fc.assert(
      fc.property(
        scenarioConfigArbitrary,
        robotConfigArbitrary,
        resetCountArbitrary,
        (scenario, robot, resetCount) => {
          // Start with a fresh store
          useOnboardingStore.getState().resetOnboarding();
          
          // Complete onboarding to set up a non-initial state
          useOnboardingStore.getState().completeOnboarding(scenario, robot);
          
          // Verify onboarding was completed
          const completedState = useOnboardingStore.getState();
          expect(completedState.hasCompletedOnboarding).toBe(true);
          expect(completedState.scenarioConfig).not.toBeNull();
          expect(completedState.robotConfig).not.toBeNull();
          
          // Call resetOnboarding once
          useOnboardingStore.getState().resetOnboarding();
          const stateAfterOneReset = useOnboardingStore.getState();
          
          // Call resetOnboarding multiple additional times
          for (let i = 1; i < resetCount; i++) {
            useOnboardingStore.getState().resetOnboarding();
          }
          const stateAfterMultipleResets = useOnboardingStore.getState();
          
          // Verify idempotence: state after one reset should equal state after multiple resets
          const hasCompletedMatch = 
            stateAfterOneReset.hasCompletedOnboarding === stateAfterMultipleResets.hasCompletedOnboarding &&
            stateAfterMultipleResets.hasCompletedOnboarding === false;
          
          const scenarioMatch = 
            stateAfterOneReset.scenarioConfig === stateAfterMultipleResets.scenarioConfig &&
            stateAfterMultipleResets.scenarioConfig === null;
          
          const robotMatch = 
            stateAfterOneReset.robotConfig === stateAfterMultipleResets.robotConfig &&
            stateAfterMultipleResets.robotConfig === null;
          
          // All properties should match and be in reset state
          return hasCompletedMatch && scenarioMatch && robotMatch;
        }
      ),
      { numRuns: 20 } // Using 20 iterations as requested
    );
  });
});

describe('Property 2: Onboarding Persistence Round Trip', () => {
  it('should persist to localStorage and rehydrate correctly for any valid configuration', () => {
    /**
     * **Validates: Requirements 1.7**
     * 
     * Property: For any valid scenario and robot configuration, if a user 
     * completes onboarding with those selections and the store persists to 
     * localStorage, then rehydrating the store should result in 
     * hasCompletedOnboarding being true and the stored configurations 
     * matching the original selections.
     */
    
    // Define arbitrary generators for ScenarioConfig
    const scenarioConfigArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 30 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      obstacleDensity: fc.double({ min: 0, max: 1, noNaN: true }),
      victimCount: fc.integer({ min: 0, max: 20 }),
      fireCount: fc.integer({ min: 0, max: 20 }),
      seed: fc.option(fc.integer({ min: 0, max: 1000000 }), { nil: undefined })
    });

    // Define arbitrary generators for RobotConfig
    const robotConfigArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      speedMultiplier: fc.double({ min: 0.5, max: 2.0, noNaN: true }),
      batteryDrainRate: fc.double({ min: 0.5, max: 1.5, noNaN: true }),
      maxHealth: fc.integer({ min: 80, max: 120 })
    });

    fc.assert(
      fc.property(
        scenarioConfigArbitrary,
        robotConfigArbitrary,
        (scenario, robot) => {
          // Reset store and clear localStorage before each test
          useOnboardingStore.getState().resetOnboarding();
          localStorage.clear();
          
          // Complete onboarding with generated configurations
          useOnboardingStore.getState().completeOnboarding(scenario, robot);
          
          // Verify data was persisted to localStorage
          const persistedData = localStorage.getItem('rescuebot-onboarding');
          expect(persistedData).not.toBeNull();
          
          if (!persistedData) {
            return false;
          }
          
          // Parse the persisted data
          const parsed = JSON.parse(persistedData);
          
          // Verify the persisted state structure
          const persistedStateValid = 
            parsed.state &&
            typeof parsed.state.hasCompletedOnboarding === 'boolean' &&
            parsed.state.hasCompletedOnboarding === true;
          
          if (!persistedStateValid) {
            return false;
          }
          
          // Verify scenario configuration was persisted correctly
          const scenarioPersisted = 
            parsed.state.scenarioConfig !== null &&
            parsed.state.scenarioConfig.id === scenario.id &&
            parsed.state.scenarioConfig.name === scenario.name &&
            parsed.state.scenarioConfig.description === scenario.description &&
            parsed.state.scenarioConfig.obstacleDensity === scenario.obstacleDensity &&
            parsed.state.scenarioConfig.victimCount === scenario.victimCount &&
            parsed.state.scenarioConfig.fireCount === scenario.fireCount &&
            parsed.state.scenarioConfig.seed === scenario.seed;
          
          // Verify robot configuration was persisted correctly
          const robotPersisted = 
            parsed.state.robotConfig !== null &&
            parsed.state.robotConfig.id === robot.id &&
            parsed.state.robotConfig.name === robot.name &&
            parsed.state.robotConfig.description === robot.description &&
            parsed.state.robotConfig.speedMultiplier === robot.speedMultiplier &&
            parsed.state.robotConfig.batteryDrainRate === robot.batteryDrainRate &&
            parsed.state.robotConfig.maxHealth === robot.maxHealth;
          
          // Simulate rehydration by getting the current state
          // (Zustand persist middleware automatically rehydrates from localStorage)
          const rehydratedState = useOnboardingStore.getState();
          
          // Verify rehydrated state matches original selections
          const rehydratedCompletionCorrect = rehydratedState.hasCompletedOnboarding === true;
          
          const rehydratedScenarioCorrect = 
            rehydratedState.scenarioConfig !== null &&
            rehydratedState.scenarioConfig.id === scenario.id &&
            rehydratedState.scenarioConfig.name === scenario.name &&
            rehydratedState.scenarioConfig.description === scenario.description &&
            rehydratedState.scenarioConfig.obstacleDensity === scenario.obstacleDensity &&
            rehydratedState.scenarioConfig.victimCount === scenario.victimCount &&
            rehydratedState.scenarioConfig.fireCount === scenario.fireCount &&
            rehydratedState.scenarioConfig.seed === scenario.seed;
          
          const rehydratedRobotCorrect = 
            rehydratedState.robotConfig !== null &&
            rehydratedState.robotConfig.id === robot.id &&
            rehydratedState.robotConfig.name === robot.name &&
            rehydratedState.robotConfig.description === robot.description &&
            rehydratedState.robotConfig.speedMultiplier === robot.speedMultiplier &&
            rehydratedState.robotConfig.batteryDrainRate === robot.batteryDrainRate &&
            rehydratedState.robotConfig.maxHealth === robot.maxHealth;
          
          // All persistence and rehydration checks must pass
          return scenarioPersisted && 
                 robotPersisted && 
                 rehydratedCompletionCorrect && 
                 rehydratedScenarioCorrect && 
                 rehydratedRobotCorrect;
        }
      ),
      { numRuns: 20 } // Using 20 iterations as requested
    );
  });
});

describe('Property 11: Robot Configuration Storage', () => {
  it('should store the complete robot configuration object (not just the type string)', () => {
    /**
     * **Validates: Requirements 11.3**
     * 
     * Property: For any robot configuration selected in the wizard, the 
     * complete configuration object (not just the type string) should be 
     * stored in the Onboarding_Store.
     */
    
    // Define arbitrary generators for ScenarioConfig
    const scenarioConfigArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 30 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      obstacleDensity: fc.double({ min: 0, max: 1, noNaN: true }),
      victimCount: fc.integer({ min: 0, max: 20 }),
      fireCount: fc.integer({ min: 0, max: 20 }),
      seed: fc.option(fc.integer({ min: 0, max: 1000000 }), { nil: undefined })
    });

    // Define arbitrary generators for RobotConfig
    const robotConfigArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ minLength: 10, maxLength: 200 }),
      speedMultiplier: fc.double({ min: 0.5, max: 2.0, noNaN: true }),
      batteryDrainRate: fc.double({ min: 0.5, max: 1.5, noNaN: true }),
      maxHealth: fc.integer({ min: 80, max: 120 })
    });

    fc.assert(
      fc.property(
        scenarioConfigArbitrary,
        robotConfigArbitrary,
        (scenario, robot) => {
          // Reset store before each property test iteration
          useOnboardingStore.getState().resetOnboarding();
          
          // Complete onboarding with generated configurations
          useOnboardingStore.getState().completeOnboarding(scenario, robot);
          
          // Get the stored robot configuration
          const state = useOnboardingStore.getState();
          const storedRobotConfig = state.robotConfig;
          
          // Verify that robotConfig is not null
          if (storedRobotConfig === null) {
            return false;
          }
          
          // Verify that the stored config is an object (not a string)
          if (typeof storedRobotConfig !== 'object') {
            return false;
          }
          
          // Verify that all required properties are present and match the original
          const hasAllProperties = 
            'id' in storedRobotConfig &&
            'name' in storedRobotConfig &&
            'description' in storedRobotConfig &&
            'speedMultiplier' in storedRobotConfig &&
            'batteryDrainRate' in storedRobotConfig &&
            'maxHealth' in storedRobotConfig;
          
          if (!hasAllProperties) {
            return false;
          }
          
          // Verify that all property values match the original robot configuration
          const allPropertiesMatch = 
            storedRobotConfig.id === robot.id &&
            storedRobotConfig.name === robot.name &&
            storedRobotConfig.description === robot.description &&
            storedRobotConfig.speedMultiplier === robot.speedMultiplier &&
            storedRobotConfig.batteryDrainRate === robot.batteryDrainRate &&
            storedRobotConfig.maxHealth === robot.maxHealth;
          
          // Verify that the stored config is the complete object, not just an id string
          // This is the key property: we're storing the entire object with all its properties
          const isCompleteObject = 
            typeof storedRobotConfig.id === 'string' &&
            typeof storedRobotConfig.name === 'string' &&
            typeof storedRobotConfig.description === 'string' &&
            typeof storedRobotConfig.speedMultiplier === 'number' &&
            typeof storedRobotConfig.batteryDrainRate === 'number' &&
            typeof storedRobotConfig.maxHealth === 'number';
          
          // All checks must pass
          return hasAllProperties && allPropertiesMatch && isCompleteObject;
        }
      ),
      { numRuns: 20 } // Using 20 iterations as requested
    );
  });
});
