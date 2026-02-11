import React, { useState } from 'react';
import { ScenarioConfig } from '../../types';

interface ScenarioStepProps {
  scenarios: ScenarioConfig[];
  selectedScenario: ScenarioConfig | null;
  onSelect: (scenario: ScenarioConfig) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const ScenarioStep: React.FC<ScenarioStepProps> = ({
  scenarios,
  selectedScenario,
  onSelect,
  onNext,
  onPrevious,
}) => {
  const [showValidation, setShowValidation] = useState(false);

  const handleNext = () => {
    if (!selectedScenario) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    onNext();
  };

  const handleSelect = (scenario: ScenarioConfig) => {
    onSelect(scenario);
    setShowValidation(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-900">
      <div className="max-w-5xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-mono font-bold text-blue-400 tracking-tight">
            SELECT MISSION SCENARIO
          </h1>
          <p className="text-slate-300 text-lg">
            Choose the disaster environment for your rescue operation
          </p>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        </div>

        {/* Scenario Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((scenario) => {
            const isSelected = selectedScenario?.id === scenario.id;
            return (
              <div
                key={scenario.id}
                onClick={() => handleSelect(scenario)}
                className={`
                  p-6 rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${
                    isSelected
                      ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600 hover:bg-slate-750'
                  }
                `}
              >
                {/* Scenario Name */}
                <h3 className="text-xl font-mono font-bold text-white mb-2">
                  {scenario.name}
                </h3>

                {/* Scenario Description */}
                <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                  {scenario.description}
                </p>

                {/* Scenario Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Obstacle Density:</span>
                    <span className="text-white font-mono">
                      {Math.round(scenario.obstacleDensity * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Victims:</span>
                    <span className="text-emerald-400 font-mono">
                      {scenario.victimCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Fires:</span>
                    <span className="text-orange-400 font-mono">
                      {scenario.fireCount}
                    </span>
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-blue-500/30">
                    <div className="flex items-center justify-center text-blue-400 text-sm font-mono">
                      <span className="mr-2">✓</span>
                      <span>SELECTED</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Validation Message */}
        {showValidation && (
          <div className="text-center">
            <p className="text-red-400 text-sm font-mono animate-pulse">
              ⚠ Please select a scenario to continue
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={onPrevious}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-mono font-bold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            ← PREVIOUS
          </button>

          <button
            onClick={handleNext}
            className={`
              px-6 py-3 font-mono font-bold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
              ${
                selectedScenario
                  ? 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-400 cursor-pointer'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
              }
            `}
          >
            NEXT →
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center items-center space-x-2 pt-4">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <div className="w-2 h-2 rounded-full bg-slate-600"></div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioStep;
