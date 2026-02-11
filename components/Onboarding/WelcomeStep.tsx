import React from 'react';

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-slate-900">
      <div className="max-w-2xl w-full space-y-8 text-center">
        {/* Application Title */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-mono font-bold text-blue-400 tracking-tight">
            RESCUEBOT.AI
          </h1>
          <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        </div>

        {/* Mission Briefing */}
        <div className="space-y-4 text-slate-300">
          <p className="text-lg md:text-xl leading-relaxed">
            Welcome to the autonomous rescue robot simulation platform. 
            Your mission: deploy AI-powered robots to navigate disaster zones, 
            rescue victims, and extinguish fires while managing critical resources.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-left">
          <h2 className="text-slate-400 text-sm uppercase tracking-widest mb-4 text-center">
            Mission Capabilities
          </h2>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start">
              <span className="text-blue-400 mr-3 mt-1">▸</span>
              <span>
                <strong className="text-white">AI-Driven Navigation:</strong> Advanced pathfinding 
                through hazardous terrain with real-time decision making
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-3 mt-1">▸</span>
              <span>
                <strong className="text-white">Resource Management:</strong> Monitor battery levels, 
                health status, and operational costs in real-time
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-3 mt-1">▸</span>
              <span>
                <strong className="text-white">Strategic Planning:</strong> Choose from multiple 
                disaster scenarios and robot configurations
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-3 mt-1">▸</span>
              <span>
                <strong className="text-white">ROI Analytics:</strong> Track mission value generation 
                and operational efficiency metrics
              </span>
            </li>
          </ul>
        </div>

        {/* Launch Button */}
        <div className="pt-4">
          <button
            onClick={onNext}
            className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <span className="relative z-10">LAUNCH MISSION</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>

        {/* Footer Note */}
        <div className="text-slate-500 text-sm pt-4">
          Configure your mission parameters in the next steps
        </div>
      </div>
    </div>
  );
};

export default WelcomeStep;
