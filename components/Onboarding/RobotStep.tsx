import React, { useState } from 'react';
import { RobotConfig } from '../../types';

interface RobotStepProps {
  robots: RobotConfig[];
  selectedRobot: RobotConfig | null;
  onSelect: (robot: RobotConfig) => void;
  onLaunch: () => void;
  onPrevious: () => void;
}

const RobotStep: React.FC<RobotStepProps> = ({
  robots,
  selectedRobot,
  onSelect,
  onLaunch,
  onPrevious,
}) => {
  const [showValidation, setShowValidation] = useState(false);

  const handleLaunch = () => {
    if (!selectedRobot) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    onLaunch();
  };

  const handleSelect = (robot: RobotConfig) => {
    onSelect(robot);
    setShowValidation(false);
  };

  // Helper function to render stat bars
  const renderStatBar = (label: string, value: number, maxValue: number, color: string) => {
    const percentage = (value / maxValue) * 100;
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">{label}:</span>
          <span className="text-white font-mono">{value.toFixed(1)}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-900">
      <div className="max-w-5xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-mono font-bold text-blue-400 tracking-tight">
            SELECT YOUR ROBOT
          </h1>
          <p className="text-slate-300 text-lg">
            Choose your autonomous rescue unit for the mission
          </p>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        </div>

        {/* Robot Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {robots.map((robot) => {
            const isSelected = selectedRobot?.id === robot.id;
            return (
              <div
                key={robot.id}
                onClick={() => handleSelect(robot)}
                className={`
                  p-6 rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${
                    isSelected
                      ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600 hover:bg-slate-750'
                  }
                `}
              >
                {/* Robot Name */}
                <h3 className="text-xl font-mono font-bold text-white mb-2">
                  {robot.name}
                </h3>

                {/* Robot Description */}
                <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                  {robot.description}
                </p>

                {/* Robot Stats */}
                <div className="space-y-3">
                  {renderStatBar('Speed', robot.speedMultiplier, 2.0, 'bg-cyan-500')}
                  {renderStatBar('Efficiency', 2.0 - robot.batteryDrainRate, 1.5, 'bg-emerald-500')}
                  {renderStatBar('Durability', robot.maxHealth, 120, 'bg-orange-500')}
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
              ⚠ Please select a robot to continue
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
            onClick={handleLaunch}
            className={`
              px-6 py-3 font-mono font-bold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
              ${
                selectedRobot
                  ? 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-400 cursor-pointer'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
              }
            `}
          >
            LAUNCH 🚀
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center items-center space-x-2 pt-4">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        </div>
      </div>
    </div>
  );
};

export default RobotStep;
