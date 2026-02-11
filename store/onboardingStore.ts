import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ScenarioConfig, RobotConfig } from '../types';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  scenarioConfig: ScenarioConfig | null;
  robotConfig: RobotConfig | null;
  completeOnboarding: (scenario: ScenarioConfig, robot: RobotConfig) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      scenarioConfig: null,
      robotConfig: null,
      completeOnboarding: (scenario: ScenarioConfig, robot: RobotConfig) => {
        set({
          hasCompletedOnboarding: true,
          scenarioConfig: scenario,
          robotConfig: robot,
        });
      },
      resetOnboarding: () => {
        set({
          hasCompletedOnboarding: false,
          scenarioConfig: null,
          robotConfig: null,
        });
      },
    }),
    {
      name: 'rescuebot-onboarding',
    }
  )
);
