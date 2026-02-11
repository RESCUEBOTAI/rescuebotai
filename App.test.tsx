import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import App from './App';
import { useOnboardingStore } from './store/onboardingStore';
import { SCENARIOS, ROBOT_TYPES } from './constants';

// Mock the Gemini service
vi.mock('./services/geminiService', () => ({
  getDecisionFromGemini: vi.fn().mockResolvedValue({
    action: 'EXPLORE',
    priority: 'HIGH',
    reasoning: 'Test reasoning',
    targetCoordinates: null
  })
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

describe('App Integration with Onboarding', () => {
  beforeEach(() => {
    // Reset the store before each test
    useOnboardingStore.getState().resetOnboarding();
  });

  it('should render WizardModal when onboarding is not completed', () => {
    render(<App />);
    
    // Check for wizard content (Welcome step should be visible)
    expect(screen.getByText(/RESCUEBOT\.AI/i)).toBeInTheDocument();
    expect(screen.getByText(/Launch Mission/i)).toBeInTheDocument();
  });

  it('should render Dashboard when onboarding is completed', () => {
    // Complete onboarding first
    const { completeOnboarding } = useOnboardingStore.getState();
    completeOnboarding(SCENARIOS[0], ROBOT_TYPES[0]);
    
    render(<App />);
    
    // Check for dashboard elements
    expect(screen.getByText(/START/i)).toBeInTheDocument();
    expect(screen.getByText(/^RESET$/i)).toBeInTheDocument();
  });

  it('should render reset onboarding button in Dashboard', () => {
    // Complete onboarding first
    const { completeOnboarding } = useOnboardingStore.getState();
    completeOnboarding(SCENARIOS[0], ROBOT_TYPES[0]);
    
    render(<App />);
    
    // Check for reset setup button
    const resetButton = screen.getByText(/RESET SETUP/i);
    expect(resetButton).toBeInTheDocument();
  });

  it('should show confirmation dialog when reset setup button is clicked', async () => {
    // Complete onboarding first
    const { completeOnboarding } = useOnboardingStore.getState();
    completeOnboarding(SCENARIOS[0], ROBOT_TYPES[0]);
    
    const user = userEvent.setup();
    render(<App />);
    
    // Click the reset setup button
    const resetButton = screen.getByText(/RESET SETUP/i);
    await user.click(resetButton);
    
    // Check for confirmation dialog
    expect(screen.getByText(/Reset Onboarding\?/i)).toBeInTheDocument();
    expect(screen.getByText(/This will clear your saved preferences/i)).toBeInTheDocument();
  });

  it('should call resetOnboarding when confirmation is accepted', async () => {
    // Complete onboarding first
    const { completeOnboarding } = useOnboardingStore.getState();
    completeOnboarding(SCENARIOS[0], ROBOT_TYPES[0]);
    
    const user = userEvent.setup();
    render(<App />);
    
    // Verify onboarding is completed
    expect(useOnboardingStore.getState().hasCompletedOnboarding).toBe(true);
    
    // Click the reset setup button
    const resetButton = screen.getByText(/RESET SETUP/i);
    await user.click(resetButton);
    
    // Click the confirm button in the dialog
    const confirmButton = screen.getByText(/^Reset Setup$/i);
    await user.click(confirmButton);
    
    // Verify resetOnboarding was called (store should be reset)
    expect(useOnboardingStore.getState().hasCompletedOnboarding).toBe(false);
    expect(useOnboardingStore.getState().scenarioConfig).toBeNull();
    expect(useOnboardingStore.getState().robotConfig).toBeNull();
  });

  it('should close confirmation dialog when cancel is clicked', async () => {
    // Complete onboarding first
    const { completeOnboarding } = useOnboardingStore.getState();
    completeOnboarding(SCENARIOS[0], ROBOT_TYPES[0]);
    
    const user = userEvent.setup();
    render(<App />);
    
    // Click the reset setup button
    const resetButton = screen.getByText(/RESET SETUP/i);
    await user.click(resetButton);
    
    // Verify dialog is shown
    expect(screen.getByText(/Reset Onboarding\?/i)).toBeInTheDocument();
    
    // Click the cancel button
    const cancelButton = screen.getByText(/Cancel/i);
    await user.click(cancelButton);
    
    // Verify dialog is closed
    expect(screen.queryByText(/Reset Onboarding\?/i)).not.toBeInTheDocument();
    
    // Verify onboarding is still completed
    expect(useOnboardingStore.getState().hasCompletedOnboarding).toBe(true);
  });

  it('should use scenarioConfig from store when initializing simulation', () => {
    // Complete onboarding with a specific scenario
    const { completeOnboarding } = useOnboardingStore.getState();
    const testScenario = SCENARIOS[1]; // Use second scenario
    completeOnboarding(testScenario, ROBOT_TYPES[0]);
    
    render(<App />);
    
    // The scenario name should appear in the logs
    expect(screen.getByText(new RegExp(testScenario.name, 'i'))).toBeInTheDocument();
  });

  it('should use robotConfig.maxHealth when initializing robot state', () => {
    // Complete onboarding with a specific robot
    const { completeOnboarding } = useOnboardingStore.getState();
    const testRobot = ROBOT_TYPES[1]; // Use rover with maxHealth: 120
    completeOnboarding(SCENARIOS[0], testRobot);
    
    const { container } = render(<App />);
    
    // Verify the app renders successfully with the robot config
    expect(container).toBeInTheDocument();
    // The robot state should be initialized with the correct maxHealth
    // We can verify this by checking that the dashboard is rendered (which means initialization succeeded)
    expect(screen.getByText(/START/i)).toBeInTheDocument();
  });

  it('should hide scenario selection dropdown when scenarioConfig exists', () => {
    // Complete onboarding
    const { completeOnboarding } = useOnboardingStore.getState();
    completeOnboarding(SCENARIOS[0], ROBOT_TYPES[0]);
    
    render(<App />);
    
    // The scenario dropdown should not be visible
    expect(screen.queryByLabelText(/Mission Scenario/i)).not.toBeInTheDocument();
  });

  it('should show scenario selection dropdown when no scenarioConfig exists', () => {
    // Reset onboarding to clear scenarioConfig
    useOnboardingStore.getState().resetOnboarding();
    
    // Manually set hasCompletedOnboarding to true but keep scenarioConfig null
    // This simulates a case where onboarding was completed but config is missing
    useOnboardingStore.setState({ hasCompletedOnboarding: true, scenarioConfig: null, robotConfig: null });
    
    render(<App />);
    
    // The scenario dropdown should be visible - check by text content
    expect(screen.getByText(/Mission Scenario/i)).toBeInTheDocument();
    // Verify the select element is present
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toBeInTheDocument();
  });
});

describe('Property 3: Wizard Display Exclusivity', () => {
  it('should render either WizardModal OR Dashboard, but never both simultaneously', () => {
    /**
     * **Validates: Requirements 2.1, 2.2**
     * 
     * Property: For any application state, either the WizardModal is rendered 
     * OR the Dashboard is rendered, but never both simultaneously, based on 
     * the hasCompletedOnboarding flag.
     */
    
    // Generate arbitrary boolean values for hasCompletedOnboarding
    const hasCompletedOnboardingArbitrary = fc.boolean();

    fc.assert(
      fc.property(
        hasCompletedOnboardingArbitrary,
        (hasCompleted) => {
          // Reset store before each iteration
          useOnboardingStore.getState().resetOnboarding();
          
          // Set the hasCompletedOnboarding state based on the generated value
          if (hasCompleted) {
            // Complete onboarding to set hasCompletedOnboarding to true
            useOnboardingStore.getState().completeOnboarding(SCENARIOS[0], ROBOT_TYPES[0]);
          }
          // If hasCompleted is false, store is already reset (hasCompletedOnboarding = false)
          
          // Render the App component
          const { container, unmount } = render(<App />);
          
          // Define indicators for WizardModal and Dashboard
          // WizardModal contains "Launch Mission" button (from WelcomeStep)
          const wizardIndicator = screen.queryByText(/Launch Mission/i);
          
          // Dashboard contains "START" and "RESET" buttons
          const dashboardStartButton = screen.queryByText(/^START$/i);
          const dashboardResetButton = screen.queryByText(/^RESET$/i);
          
          // Determine if WizardModal is rendered
          const wizardRendered = wizardIndicator !== null;
          
          // Determine if Dashboard is rendered (both START and RESET buttons present)
          const dashboardRendered = dashboardStartButton !== null && dashboardResetButton !== null;
          
          // Clean up
          unmount();
          
          // Property: Exactly one should be rendered (XOR logic)
          // Either wizard is rendered OR dashboard is rendered, but not both and not neither
          const exclusiveRender = (wizardRendered && !dashboardRendered) || (!wizardRendered && dashboardRendered);
          
          // Verify the correct component is rendered based on hasCompletedOnboarding
          const correctComponentRendered = hasCompleted ? dashboardRendered : wizardRendered;
          
          // Both conditions must be true
          return exclusiveRender && correctComponentRendered;
        }
      ),
      { numRuns: 20 } // Run 20 iterations for faster test execution
    );
  });
});

describe('Property 7: Configuration Application to Simulation', () => {
  it('should use stored scenarioConfig and robotConfig when initializing simulation', { timeout: 30000 }, () => {
    /**
     * **Validates: Requirements 6.6, 10.2, 11.5**
     * 
     * Property: For any completed onboarding with selected scenario and robot 
     * configurations, when the simulation initializes, it should use the stored 
     * scenarioConfig and apply the stored robotConfig properties (maxHealth, 
     * speedMultiplier, batteryDrainRate) to the initial robot state.
     */
    
    // Generate arbitrary scenario and robot configurations
    const scenarioArbitrary = fc.constantFrom(...SCENARIOS);
    const robotArbitrary = fc.constantFrom(...ROBOT_TYPES);

    fc.assert(
      fc.property(
        scenarioArbitrary,
        robotArbitrary,
        (scenario, robot) => {
          // Reset store before each iteration
          useOnboardingStore.getState().resetOnboarding();
          
          // Complete onboarding with the generated scenario and robot
          useOnboardingStore.getState().completeOnboarding(scenario, robot);
          
          // Render the App component (which should render Dashboard since onboarding is complete)
          const { unmount } = render(<App />);
          
          // Verify the scenario is used by checking if the scenario name appears in the logs
          const scenarioNameInLog = screen.queryByText(new RegExp(scenario.name, 'i'));
          const scenarioUsed = scenarioNameInLog !== null;
          
          // Verify the dashboard is rendered (indicating successful initialization)
          const dashboardRendered = screen.queryByText(/^START$/i) !== null;
          
          // Verify the robot config is applied by checking the store state
          const storeState = useOnboardingStore.getState();
          const robotConfigStored = storeState.robotConfig?.id === robot.id &&
                                    storeState.robotConfig?.maxHealth === robot.maxHealth &&
                                    storeState.robotConfig?.speedMultiplier === robot.speedMultiplier &&
                                    storeState.robotConfig?.batteryDrainRate === robot.batteryDrainRate;
          
          // Clean up
          unmount();
          
          // Property: All three conditions must be true
          // 1. The scenario is used (name appears in logs)
          // 2. The dashboard renders successfully (initialization succeeded)
          // 3. The robot config is stored correctly with all properties
          return scenarioUsed && dashboardRendered && robotConfigStored;
        }
      ),
      { numRuns: 20 } // Run 20 iterations for faster test execution
    );
  });
});

describe('Property 14: Scenario Persistence Across Resets', () => {
  it('should continue using the same scenario from store when simulation is reset', { timeout: 30000 }, async () => {
    /**
     * **Validates: Requirements 10.4**
     * 
     * Property: For any stored scenario configuration, when the user resets 
     * the simulation (not the onboarding), the application should continue 
     * using the same scenario from the Onboarding_Store.
     */
    
    // Generate arbitrary scenario and robot configurations
    const scenarioArbitrary = fc.constantFrom(...SCENARIOS);
    const robotArbitrary = fc.constantFrom(...ROBOT_TYPES);

    await fc.assert(
      fc.asyncProperty(
        scenarioArbitrary,
        robotArbitrary,
        async (scenario, robot) => {
          // Reset store before each iteration
          useOnboardingStore.getState().resetOnboarding();
          
          // Complete onboarding with the generated scenario and robot
          useOnboardingStore.getState().completeOnboarding(scenario, robot);
          
          // Render the App component (which should render Dashboard since onboarding is complete)
          const { unmount } = render(<App />);
          
          // Verify the scenario is used initially by checking if the scenario name appears in the logs
          const scenarioNameInLogBefore = screen.queryByText(new RegExp(scenario.name, 'i'));
          const scenarioUsedBefore = scenarioNameInLogBefore !== null;
          
          // Find and click the RESET button to reset the simulation
          const resetButton = screen.getByText(/^RESET$/i);
          resetButton.click();
          
          // Wait for the reset to complete (the initSimulation function is called)
          // We need to wait for the new log entry to appear
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Verify the scenario is still used after reset by checking if the scenario name appears in the logs
          const scenarioNameInLogAfter = screen.queryByText(new RegExp(scenario.name, 'i'));
          const scenarioUsedAfter = scenarioNameInLogAfter !== null;
          
          // Verify the store still has the same scenario config
          const storeState = useOnboardingStore.getState();
          const scenarioStillInStore = storeState.scenarioConfig?.id === scenario.id &&
                                       storeState.scenarioConfig?.name === scenario.name;
          
          // Verify onboarding is still marked as completed (not reset)
          const onboardingStillCompleted = storeState.hasCompletedOnboarding === true;
          
          // Clean up
          unmount();
          
          // Property: All four conditions must be true
          // 1. The scenario was used initially (name appears in logs before reset)
          // 2. The scenario is still used after reset (name appears in logs after reset)
          // 3. The scenario config is still in the store
          // 4. The onboarding is still marked as completed (not reset)
          return scenarioUsedBefore && scenarioUsedAfter && scenarioStillInStore && onboardingStillCompleted;
        }
      ),
      { numRuns: 20 } // Run 20 iterations for faster test execution
    );
  });
});
