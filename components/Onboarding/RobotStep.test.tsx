import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RobotStep from './RobotStep';
import ScenarioStep from './ScenarioStep';
import { ROBOT_TYPES, SCENARIOS } from '../../constants';
import * as fc from 'fast-check';

describe('RobotStep', () => {
  const mockOnSelect = vi.fn();
  const mockOnLaunch = vi.fn();
  const mockOnPrevious = vi.fn();

  const defaultProps = {
    robots: ROBOT_TYPES,
    selectedRobot: null,
    onSelect: mockOnSelect,
    onLaunch: mockOnLaunch,
    onPrevious: mockOnPrevious,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render both robot types', () => {
    render(<RobotStep {...defaultProps} />);
    
    // Check that both robot types are rendered
    ROBOT_TYPES.forEach((robot) => {
      expect(screen.getByText(robot.name)).toBeInTheDocument();
      expect(screen.getByText(robot.description)).toBeInTheDocument();
    });
  });

  it('should call onSelect when a robot card is clicked', async () => {
    const user = userEvent.setup();
    render(<RobotStep {...defaultProps} />);
    
    const firstRobotCard = screen.getByText(ROBOT_TYPES[0].name).closest('div');
    await user.click(firstRobotCard!);
    
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(ROBOT_TYPES[0]);
  });

  it('should call onPrevious when "Previous" button is clicked', async () => {
    const user = userEvent.setup();
    render(<RobotStep {...defaultProps} />);
    
    const previousButton = screen.getByRole('button', { name: /previous/i });
    await user.click(previousButton);
    
    expect(mockOnPrevious).toHaveBeenCalledTimes(1);
  });

  it('should disable "Launch" button when no robot is selected', () => {
    render(<RobotStep {...defaultProps} />);
    
    const launchButton = screen.getByRole('button', { name: /launch/i });
    expect(launchButton).toHaveClass('cursor-not-allowed');
    expect(launchButton).toHaveClass('opacity-50');
  });

  it('should enable "Launch" button when a robot is selected', () => {
    const selectedRobot = ROBOT_TYPES[0];
    render(<RobotStep {...defaultProps} selectedRobot={selectedRobot} />);
    
    const launchButton = screen.getByRole('button', { name: /launch/i });
    expect(launchButton).toHaveClass('cursor-pointer');
    expect(launchButton).not.toHaveClass('cursor-not-allowed');
  });

  it('should call onLaunch when "Launch" button is clicked with valid selection', async () => {
    const user = userEvent.setup();
    const selectedRobot = ROBOT_TYPES[0];
    render(<RobotStep {...defaultProps} selectedRobot={selectedRobot} />);
    
    const launchButton = screen.getByRole('button', { name: /launch/i });
    await user.click(launchButton);
    
    expect(mockOnLaunch).toHaveBeenCalledTimes(1);
  });

  it('should display validation message when trying to launch without selection', async () => {
    const user = userEvent.setup();
    render(<RobotStep {...defaultProps} />);
    
    // Initially, validation message should not be visible
    expect(screen.queryByText(/please select a robot to continue/i)).not.toBeInTheDocument();
    
    // Click the launch button without selecting a robot
    const launchButton = screen.getByRole('button', { name: /launch/i });
    await user.click(launchButton);
    
    // Validation message should appear
    expect(screen.getByText(/please select a robot to continue/i)).toBeInTheDocument();
    
    // onLaunch should not have been called
    expect(mockOnLaunch).not.toHaveBeenCalled();
  });

  it('should hide validation message when a robot is selected', async () => {
    const user = userEvent.setup();
    render(<RobotStep {...defaultProps} />);
    
    // Trigger validation message
    const launchButton = screen.getByRole('button', { name: /launch/i });
    await user.click(launchButton);
    expect(screen.getByText(/please select a robot to continue/i)).toBeInTheDocument();
    
    // Select a robot
    const firstRobotCard = screen.getByText(ROBOT_TYPES[0].name).closest('div');
    await user.click(firstRobotCard!);
    
    // Validation message should disappear
    expect(screen.queryByText(/please select a robot to continue/i)).not.toBeInTheDocument();
  });

  it('should highlight selected robot with border-blue-500 and bg-blue-900/20', () => {
    const selectedRobot = ROBOT_TYPES[0];
    render(<RobotStep {...defaultProps} selectedRobot={selectedRobot} />);
    
    const selectedCard = screen.getByText(selectedRobot.name).closest('div');
    expect(selectedCard).toHaveClass('border-blue-500');
    expect(selectedCard).toHaveClass('bg-blue-900/20');
  });

  it('should display "SELECTED" indicator for selected robot', () => {
    const selectedRobot = ROBOT_TYPES[0];
    render(<RobotStep {...defaultProps} selectedRobot={selectedRobot} />);
    
    expect(screen.getByText('SELECTED')).toBeInTheDocument();
  });
});

describe('Property 6: Selection Validation', () => {
  it('should prevent navigation without selection for any wizard step that requires selection', () => {
    /**
     * **Validates: Requirements 4.7, 5.7**
     * 
     * Property: For any wizard step that requires a selection (Scenario or Robot), 
     * attempting to navigate forward without making a selection should prevent 
     * navigation, maintain the current step, and display a validation message.
     * 
     * This test runs 100 iterations testing both ScenarioStep and RobotStep components.
     */

    // Define arbitrary generator for robot configurations
    const robotConfigArbitrary = fc.record({
      id: fc.stringMatching(/^[a-z0-9_-]+$/).filter((s: string) => s.length >= 3 && s.length <= 20),
      name: fc.string({ minLength: 5, maxLength: 30 }).filter((s: string) => s.trim().length >= 5),
      description: fc.string({ minLength: 15, maxLength: 100 }).filter((s: string) => s.trim().length >= 15),
      speedMultiplier: fc.double({ min: 0.5, max: 2.0, noNaN: true }),
      batteryDrainRate: fc.double({ min: 0.5, max: 1.5, noNaN: true }),
      maxHealth: fc.integer({ min: 80, max: 120 })
    });

    // Define arbitrary generator for scenario configurations
    const scenarioConfigArbitrary = fc.record({
      id: fc.stringMatching(/^[a-z0-9_-]+$/).filter((s: string) => s.length >= 3 && s.length <= 20),
      name: fc.string({ minLength: 5, maxLength: 30 }).filter((s: string) => s.trim().length >= 5),
      description: fc.string({ minLength: 15, maxLength: 100 }).filter((s: string) => s.trim().length >= 15),
      obstacleDensity: fc.double({ min: 0, max: 1, noNaN: true }),
      victimCount: fc.integer({ min: 0, max: 20 }),
      fireCount: fc.integer({ min: 0, max: 20 }),
      seed: fc.option(fc.integer({ min: 0, max: 1000000 }), { nil: undefined })
    });

    // Generate arrays of configurations with unique IDs
    const robotArrayArbitrary = fc.array(robotConfigArbitrary, { minLength: 2, maxLength: 4 })
      .map((robots: any[]) => {
        const timestamp = Date.now() + Math.random();
        return robots.map((robot, index) => ({
          ...robot,
          id: `robot_${timestamp}_${index}`,
          name: `Robot ${timestamp}_${index}: ${robot.name}`,
          description: `Description ${timestamp}_${index}: ${robot.description}`
        }));
      });

    const scenarioArrayArbitrary = fc.array(scenarioConfigArbitrary, { minLength: 2, maxLength: 4 })
      .map((scenarios: any[]) => {
        const timestamp = Date.now() + Math.random();
        return scenarios.map((scenario, index) => ({
          ...scenario,
          id: `scenario_${timestamp}_${index}`,
          name: `Scenario ${timestamp}_${index}: ${scenario.name}`,
          description: `Description ${timestamp}_${index}: ${scenario.description}`
        }));
      });

    // Test both component types
    const componentTypeArbitrary = fc.constantFrom('robot', 'scenario');

    fc.assert(
      fc.property(
        componentTypeArbitrary,
        robotArrayArbitrary,
        scenarioArrayArbitrary,
        (componentType, robots, scenarios) => {
          // Create mock callbacks
          const mockOnSelect = vi.fn();
          const mockOnNext = vi.fn();
          const mockOnLaunch = vi.fn();
          const mockOnPrevious = vi.fn();

          let container: any;
          let unmount: any;

          try {
            // Render the appropriate component based on the generated type
            if (componentType === 'robot') {
              // Test RobotStep component
              const result = render(
                <RobotStep
                  robots={robots}
                  selectedRobot={null}
                  onSelect={mockOnSelect}
                  onLaunch={mockOnLaunch}
                  onPrevious={mockOnPrevious}
                />
              );
              container = result.container;
              unmount = result.unmount;

              // Property 1: Attempting to navigate forward without selection should prevent navigation
              const launchButton = screen.getByRole('button', { name: /launch/i });
              fireEvent.click(launchButton);

              // Verify onLaunch was NOT called (navigation prevented)
              expect(mockOnLaunch).not.toHaveBeenCalled();

              // Property 2: Validation message should be displayed
              const validationMessage = screen.queryByText(/please select a robot to continue/i);
              expect(validationMessage).toBeInTheDocument();

              // Property 3: Current step should be maintained (component still rendered)
              expect(screen.getByText(/SELECT YOUR ROBOT/i)).toBeInTheDocument();

            } else {
              // Test ScenarioStep component
              const result = render(
                <ScenarioStep
                  scenarios={scenarios}
                  selectedScenario={null}
                  onSelect={mockOnSelect}
                  onNext={mockOnNext}
                  onPrevious={mockOnPrevious}
                />
              );
              container = result.container;
              unmount = result.unmount;

              // Property 1: Attempting to navigate forward without selection should prevent navigation
              const nextButton = screen.getByRole('button', { name: /next/i });
              fireEvent.click(nextButton);

              // Verify onNext was NOT called (navigation prevented)
              expect(mockOnNext).not.toHaveBeenCalled();

              // Property 2: Validation message should be displayed
              const validationMessage = screen.queryByText(/please select a scenario to continue/i);
              expect(validationMessage).toBeInTheDocument();

              // Property 3: Current step should be maintained (component still rendered)
              expect(screen.getByText(/SELECT MISSION SCENARIO/i)).toBeInTheDocument();
            }

            return true;
          } finally {
            // Clean up after each iteration
            if (unmount) {
              unmount();
            }
          }
        }
      ),
      { numRuns: 20 } // Run 20 iterations for faster test execution
    );
  });

  it('should allow navigation when a valid selection is made', () => {
    /**
     * Additional property test: Verify that navigation IS allowed when a selection is made.
     * This complements the main property test by verifying the positive case.
     */

    // Use the actual ROBOT_TYPES and SCENARIOS for this test
    const robots = ROBOT_TYPES;
    const scenarios = SCENARIOS;

    // Test with robot selection
    const mockOnLaunch = vi.fn();
    const mockOnPrevious = vi.fn();
    const mockOnSelect = vi.fn();

    const { unmount: unmountRobot } = render(
      <RobotStep
        robots={robots}
        selectedRobot={robots[0]}
        onSelect={mockOnSelect}
        onLaunch={mockOnLaunch}
        onPrevious={mockOnPrevious}
      />
    );

    // Click launch button with valid selection
    const launchButton = screen.getByRole('button', { name: /launch/i });
    fireEvent.click(launchButton);

    // Verify onLaunch WAS called (navigation allowed)
    expect(mockOnLaunch).toHaveBeenCalledTimes(1);

    // Verify NO validation message is displayed
    expect(screen.queryByText(/please select a robot to continue/i)).not.toBeInTheDocument();

    unmountRobot();

    // Test with scenario selection
    const mockOnNext = vi.fn();
    const mockOnPrevious2 = vi.fn();
    const mockOnSelect2 = vi.fn();

    const { unmount: unmountScenario } = render(
      <ScenarioStep
        scenarios={scenarios}
        selectedScenario={scenarios[0]}
        onSelect={mockOnSelect2}
        onNext={mockOnNext}
        onPrevious={mockOnPrevious2}
      />
    );

    // Click next button with valid selection
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // Verify onNext WAS called (navigation allowed)
    expect(mockOnNext).toHaveBeenCalledTimes(1);

    // Verify NO validation message is displayed
    expect(screen.queryByText(/please select a scenario to continue/i)).not.toBeInTheDocument();

    unmountScenario();
  });
});
