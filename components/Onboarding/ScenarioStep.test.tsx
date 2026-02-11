import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScenarioStep from './ScenarioStep';
import { SCENARIOS } from '../../constants';

describe('ScenarioStep', () => {
  const mockOnSelect = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnPrevious = vi.fn();

  const defaultProps = {
    scenarios: SCENARIOS,
    selectedScenario: null,
    onSelect: mockOnSelect,
    onNext: mockOnNext,
    onPrevious: mockOnPrevious,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all scenarios from SCENARIOS constant', () => {
    render(<ScenarioStep {...defaultProps} />);
    
    // Check that all scenarios are rendered
    SCENARIOS.forEach((scenario) => {
      expect(screen.getByText(scenario.name)).toBeInTheDocument();
      expect(screen.getByText(scenario.description)).toBeInTheDocument();
    });
  });

  it('should display scenario name and description for each scenario', () => {
    render(<ScenarioStep {...defaultProps} />);
    
    // Verify first scenario details
    const firstScenario = SCENARIOS[0];
    expect(screen.getByText(firstScenario.name)).toBeInTheDocument();
    expect(screen.getByText(firstScenario.description)).toBeInTheDocument();
  });

  it('should display obstacle density, victim count, and fire count for each scenario', () => {
    render(<ScenarioStep {...defaultProps} />);
    
    // Check that stats are displayed (looking for the exact labels)
    const obstacleLabels = screen.getAllByText('Obstacle Density:');
    const victimLabels = screen.getAllByText('Victims:');
    const fireLabels = screen.getAllByText('Fires:');
    
    expect(obstacleLabels).toHaveLength(SCENARIOS.length);
    expect(victimLabels).toHaveLength(SCENARIOS.length);
    expect(fireLabels).toHaveLength(SCENARIOS.length);
    
    // Verify specific values for first scenario by checking within its card
    const firstScenario = SCENARIOS[0];
    const firstScenarioCard = screen.getByText(firstScenario.name).closest('div');
    
    // Check that the card contains the expected values
    expect(firstScenarioCard).toHaveTextContent(`${Math.round(firstScenario.obstacleDensity * 100)}%`);
    expect(firstScenarioCard).toHaveTextContent(firstScenario.victimCount.toString());
    expect(firstScenarioCard).toHaveTextContent(firstScenario.fireCount.toString());
  });

  it('should call onSelect when a scenario card is clicked', async () => {
    const user = userEvent.setup();
    render(<ScenarioStep {...defaultProps} />);
    
    const firstScenarioCard = screen.getByText(SCENARIOS[0].name).closest('div');
    await user.click(firstScenarioCard!);
    
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(SCENARIOS[0]);
  });

  it('should highlight selected scenario with border-blue-500 and bg-blue-900/20', () => {
    const selectedScenario = SCENARIOS[0];
    render(<ScenarioStep {...defaultProps} selectedScenario={selectedScenario} />);
    
    const selectedCard = screen.getByText(selectedScenario.name).closest('div');
    expect(selectedCard).toHaveClass('border-blue-500');
    expect(selectedCard).toHaveClass('bg-blue-900/20');
  });

  it('should not highlight unselected scenarios', () => {
    const selectedScenario = SCENARIOS[0];
    render(<ScenarioStep {...defaultProps} selectedScenario={selectedScenario} />);
    
    // Check that other scenarios don't have the selected styling
    const unselectedCard = screen.getByText(SCENARIOS[1].name).closest('div');
    expect(unselectedCard).toHaveClass('border-slate-700');
    expect(unselectedCard).not.toHaveClass('border-blue-500');
  });

  it('should display "SELECTED" indicator for selected scenario', () => {
    const selectedScenario = SCENARIOS[0];
    render(<ScenarioStep {...defaultProps} selectedScenario={selectedScenario} />);
    
    expect(screen.getByText('SELECTED')).toBeInTheDocument();
  });

  it('should call onPrevious when "Previous" button is clicked', async () => {
    const user = userEvent.setup();
    render(<ScenarioStep {...defaultProps} />);
    
    const previousButton = screen.getByRole('button', { name: /previous/i });
    await user.click(previousButton);
    
    expect(mockOnPrevious).toHaveBeenCalledTimes(1);
  });

  it('should disable "Next" button when no scenario is selected', () => {
    render(<ScenarioStep {...defaultProps} />);
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    // Button is not technically disabled but styled to look disabled
    expect(nextButton).toHaveClass('cursor-not-allowed');
    expect(nextButton).toHaveClass('opacity-50');
  });

  it('should enable "Next" button when a scenario is selected', () => {
    const selectedScenario = SCENARIOS[0];
    render(<ScenarioStep {...defaultProps} selectedScenario={selectedScenario} />);
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toHaveClass('cursor-pointer');
  });

  it('should call onNext when "Next" button is clicked with valid selection', async () => {
    const user = userEvent.setup();
    const selectedScenario = SCENARIOS[0];
    render(<ScenarioStep {...defaultProps} selectedScenario={selectedScenario} />);
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it('should display validation message when trying to proceed without selection', async () => {
    const user = userEvent.setup();
    render(<ScenarioStep {...defaultProps} />);
    
    // Initially, validation message should not be visible
    expect(screen.queryByText(/please select a scenario to continue/i)).not.toBeInTheDocument();
    
    // Click the next button without selecting a scenario
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    
    // Validation message should appear
    expect(screen.getByText(/please select a scenario to continue/i)).toBeInTheDocument();
    
    // onNext should not have been called
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  it('should hide validation message when a scenario is selected', async () => {
    const user = userEvent.setup();
    render(<ScenarioStep {...defaultProps} />);
    
    // Trigger validation message
    const nextButton = screen.getByRole('button', { name: /next/i });
    await user.click(nextButton);
    expect(screen.getByText(/please select a scenario to continue/i)).toBeInTheDocument();
    
    // Select a scenario
    const firstScenarioCard = screen.getByText(SCENARIOS[0].name).closest('div');
    await user.click(firstScenarioCard!);
    
    // Validation message should disappear
    expect(screen.queryByText(/please select a scenario to continue/i)).not.toBeInTheDocument();
  });

  it('should render grid with 2 columns on desktop (md breakpoint)', () => {
    render(<ScenarioStep {...defaultProps} />);
    
    // Find the grid container
    const gridContainer = screen.getByText(SCENARIOS[0].name).closest('div')?.parentElement;
    expect(gridContainer).toHaveClass('grid');
    expect(gridContainer).toHaveClass('grid-cols-1');
    expect(gridContainer).toHaveClass('md:grid-cols-2');
  });

  it('should render progress indicator showing step 2 of 3', () => {
    render(<ScenarioStep {...defaultProps} />);
    
    // Find progress dots
    const progressContainer = screen.getByText(SCENARIOS[0].name)
      .closest('.min-h-screen')
      ?.querySelector('.flex.justify-center.items-center.space-x-2');
    
    expect(progressContainer).toBeInTheDocument();
    
    // Should have 3 dots
    const dots = progressContainer?.querySelectorAll('.w-2.h-2.rounded-full');
    expect(dots).toHaveLength(3);
    
    // First two should be blue (active), last should be slate (inactive)
    expect(dots?.[0]).toHaveClass('bg-blue-500');
    expect(dots?.[1]).toHaveClass('bg-blue-500');
    expect(dots?.[2]).toHaveClass('bg-slate-600');
  });
});

describe('Property 4: Scenario Display Completeness', () => {
  it('should render all scenarios with both name and description visible for any array of scenarios', () => {
    /**
     * **Validates: Requirements 4.1, 4.2**
     * 
     * Property: For any array of scenarios from the SCENARIOS constant, 
     * the Scenario Selection Step should render all scenarios with both 
     * their name and description visible.
     */
    
    const mockOnSelect = vi.fn();
    const mockOnNext = vi.fn();
    const mockOnPrevious = vi.fn();

    // Import fast-check for property-based testing
    const fc = require('fast-check');

    // Define arbitrary generator for scenario arrays
    // We'll generate non-empty arrays of scenarios with valid structure
    const scenarioArbitrary = fc.record({
      id: fc.stringMatching(/^[a-z0-9_-]+$/).filter((s: string) => s.length >= 1 && s.length <= 30),
      name: fc.string({ minLength: 1, maxLength: 50 }).filter((s: string) => s.trim().length >= 1 && !/\s{2,}/.test(s)),
      description: fc.string({ minLength: 10, maxLength: 200 }).filter((s: string) => s.trim().length >= 10 && !/\s{2,}/.test(s)),
      obstacleDensity: fc.double({ min: 0, max: 1, noNaN: true }),
      victimCount: fc.integer({ min: 0, max: 20 }),
      fireCount: fc.integer({ min: 0, max: 20 }),
      seed: fc.option(fc.integer({ min: 0, max: 1000000 }), { nil: undefined })
    });

    // Generate array of scenarios with unique IDs and names to avoid conflicts
    const scenarioArrayArbitrary = fc.array(scenarioArbitrary, { minLength: 1, maxLength: 10 })
      .map((scenarios: any[]) => {
        // Ensure unique IDs and names by appending index
        return scenarios.map((scenario, index) => ({
          ...scenario,
          id: `${scenario.id}_${index}`,
          name: `${scenario.name}_${index}`,
          description: `${scenario.description}_${index}`
        }));
      });

    fc.assert(
      fc.property(
        scenarioArrayArbitrary,
        (scenarios) => {
          // Render the component with the generated scenarios
          const { container, unmount } = render(
            <ScenarioStep
              scenarios={scenarios}
              selectedScenario={null}
              onSelect={mockOnSelect}
              onNext={mockOnNext}
              onPrevious={mockOnPrevious}
            />
          );

          // Property: All scenarios should be rendered with both name and description
          scenarios.forEach((scenario: any) => {
            // Check that the scenario name is visible in the document
            const nameText = scenario.name.trim();
            const nameElements = screen.getAllByText((content, element) => {
              return element?.textContent?.trim() === nameText;
            });
            expect(nameElements.length).toBeGreaterThan(0);

            // Check that the scenario description is visible in the document
            const descriptionText = scenario.description.trim();
            const descriptionElements = screen.getAllByText((content, element) => {
              return element?.textContent?.trim() === descriptionText;
            });
            expect(descriptionElements.length).toBeGreaterThan(0);
          });

          // Additional check: The number of rendered scenario cards should match the input array length
          const scenarioCards = container.querySelectorAll('[class*="cursor-pointer"]');
          // Filter to only scenario cards (exclude buttons)
          const actualScenarioCards = Array.from(scenarioCards).filter(
            (card) => card.querySelector('h3') !== null
          );
          expect(actualScenarioCards.length).toBe(scenarios.length);

          // Clean up after each iteration
          unmount();

          return true;
        }
      ),
      { numRuns: 20 } // Run 20 iterations for faster test execution
    );
  });
});

describe('Property 5: Selection State Consistency', () => {
  it('should update component state and UI to reflect selection for any selectable item', () => {
    /**
     * **Validates: Requirements 4.3, 5.3**
     * 
     * Property: For any selectable item (scenario or robot), when a user 
     * selects that item, the component state should update to reflect the 
     * selection and the UI should visually indicate the selected state.
     */
    
    // Import fast-check for property-based testing
    const fc = require('fast-check');
    const { fireEvent } = require('@testing-library/react');

    // Define arbitrary generator for scenarios with more constrained values
    const scenarioArbitrary = fc.record({
      id: fc.stringMatching(/^[a-z0-9_-]+$/).filter((s: string) => s.length >= 3 && s.length <= 20),
      name: fc.string({ minLength: 5, maxLength: 30 }).filter((s: string) => s.trim().length >= 5 && !/\s{2,}/.test(s)),
      description: fc.string({ minLength: 15, maxLength: 100 }).filter((s: string) => s.trim().length >= 15 && !/\s{2,}/.test(s)),
      obstacleDensity: fc.double({ min: 0, max: 1, noNaN: true }),
      victimCount: fc.integer({ min: 0, max: 20 }),
      fireCount: fc.integer({ min: 0, max: 20 }),
      seed: fc.option(fc.integer({ min: 0, max: 1000000 }), { nil: undefined })
    });

    // Generate array of scenarios with unique IDs and names
    const scenarioArrayArbitrary = fc.array(scenarioArbitrary, { minLength: 2, maxLength: 4 })
      .map((scenarios: any[]) => {
        // Ensure unique IDs and names by using a timestamp + random number
        const timestamp = Date.now() + Math.random();
        return scenarios.map((scenario, index) => ({
          ...scenario,
          id: `scenario_${timestamp}_${index}`,
          name: `Scenario ${timestamp}_${index}: ${scenario.name}`,
          description: `Description ${timestamp}_${index}: ${scenario.description}`
        }));
      });

    // Generate an index to select from the array
    const selectionIndexArbitrary = fc.nat();

    fc.assert(
      fc.property(
        scenarioArrayArbitrary,
        selectionIndexArbitrary,
        (scenarios, selectionIndex) => {
          // Select a valid index within the scenarios array
          const selectedIndex = selectionIndex % scenarios.length;
          const scenarioToSelect = scenarios[selectedIndex];

          // Create a mock onSelect function to track state updates
          const mockOnSelect = vi.fn();
          const mockOnNext = vi.fn();
          const mockOnPrevious = vi.fn();

          // Render the component with no initial selection
          const { container, unmount, rerender } = render(
            <ScenarioStep
              scenarios={scenarios}
              selectedScenario={null}
              onSelect={mockOnSelect}
              onNext={mockOnNext}
              onPrevious={mockOnPrevious}
            />
          );

          try {
            // Find the scenario card by its ID attribute or by querying all cards
            const scenarioCards = container.querySelectorAll('div[class*="cursor-pointer"][class*="border-2"]');
            expect(scenarioCards.length).toBe(scenarios.length);
            
            // Click the card at the selected index
            const cardToClick = scenarioCards[selectedIndex];
            fireEvent.click(cardToClick);

            // Verify that onSelect was called with the correct scenario
            expect(mockOnSelect).toHaveBeenCalledTimes(1);
            expect(mockOnSelect).toHaveBeenCalledWith(scenarioToSelect);

            // Simulate the parent component updating the selectedScenario prop
            // (this is how React state management works - parent updates child props)
            rerender(
              <ScenarioStep
                scenarios={scenarios}
                selectedScenario={scenarioToSelect}
                onSelect={mockOnSelect}
                onNext={mockOnNext}
                onPrevious={mockOnPrevious}
              />
            );

            // Verify UI reflects the selection
            // 1. The selected card should have the blue border and background
            const updatedScenarioCards = container.querySelectorAll('div[class*="cursor-pointer"][class*="border-2"]');
            const selectedCard = updatedScenarioCards[selectedIndex];
            expect(selectedCard).toHaveClass('border-blue-500');
            expect(selectedCard).toHaveClass('bg-blue-900/20');

            // 2. The "SELECTED" indicator should be visible
            expect(screen.getByText('SELECTED')).toBeInTheDocument();

            // 3. Other scenarios should NOT have the selected styling
            scenarios.forEach((_scenario: any, index: number) => {
              if (index !== selectedIndex) {
                const otherCard = updatedScenarioCards[index];
                expect(otherCard).toHaveClass('border-slate-700');
                expect(otherCard).not.toHaveClass('border-blue-500');
              }
            });

            // 4. The "Next" button should be enabled (not have disabled styling)
            const nextButton = screen.getByRole('button', { name: /next/i });
            expect(nextButton).toHaveClass('cursor-pointer');
            expect(nextButton).not.toHaveClass('cursor-not-allowed');

            return true;
          } finally {
            // Always clean up after each iteration
            unmount();
          }
        }
      ),
      { numRuns: 20 } // Run 20 iterations for faster test execution
    );
  });
});
