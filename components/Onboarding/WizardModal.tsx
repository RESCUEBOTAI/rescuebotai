import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOnboardingStore } from '../../store/onboardingStore';
import { SCENARIOS, ROBOT_TYPES } from '../../constants';
import { ScenarioConfig, RobotConfig } from '../../types';
import WelcomeStep from './WelcomeStep';
import ScenarioStep from './ScenarioStep';
import RobotStep from './RobotStep';

const WizardModal: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioConfig | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<RobotConfig | null>(null);
  
  const { completeOnboarding } = useOnboardingStore();

  // Step navigation handlers
  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Final submission handler
  const handleLaunch = () => {
    if (selectedScenario && selectedRobot) {
      completeOnboarding(selectedScenario, selectedRobot);
    }
  };

  // Animation variants for step transitions
  const stepVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        {currentStep === 0 && (
          <motion.div
            key="welcome"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <WelcomeStep onNext={handleNext} />
          </motion.div>
        )}

        {currentStep === 1 && (
          <motion.div
            key="scenario"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <ScenarioStep
              scenarios={SCENARIOS}
              selectedScenario={selectedScenario}
              onSelect={setSelectedScenario}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="robot"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <RobotStep
              robots={ROBOT_TYPES}
              selectedRobot={selectedRobot}
              onSelect={setSelectedRobot}
              onLaunch={handleLaunch}
              onPrevious={handlePrevious}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WizardModal;
