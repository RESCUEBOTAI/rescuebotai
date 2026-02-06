import React from 'react';
import { RobotState, SimulationMetrics, RobotStatus } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MetricsPanelProps {
  robot: RobotState;
  metrics: SimulationMetrics;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ robot, metrics }) => {
  const getStatusColor = (status: RobotStatus) => {
    switch(status) {
      case RobotStatus.PLANNING: return 'text-purple-400 animate-pulse';
      case RobotStatus.CRITICAL: return 'text-red-500 animate-pulse';
      case RobotStatus.EMERGENCY_STOP: return 'text-red-600 font-black animate-pulse';
      case RobotStatus.ACTING: return 'text-emerald-400';
      case RobotStatus.RECHARGING: return 'text-yellow-400 animate-pulse';
      default: return 'text-blue-400';
    }
  };

  const netROI = metrics.valueGenerated - metrics.operationalCost;
  const roiColor = netROI >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="space-y-6">
      {/* Heads Up Display */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 relative overflow-hidden">
          <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">Battery Level</div>
          <div className="text-3xl font-mono font-bold text-white z-10 relative">
            {robot.battery.toFixed(1)}%
          </div>
          <div 
            className={`absolute bottom-0 left-0 h-1 transition-all duration-500 ${robot.battery < 20 ? 'bg-red-500' : 'bg-emerald-500'}`} 
            style={{ width: `${robot.battery}%` }}
          />
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">System Status</div>
          <div className={`text-xl font-mono font-bold truncate ${getStatusColor(robot.status)}`}>
            {robot.status}
          </div>
        </div>
      </div>

      {/* Business ROI Dashboard */}
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 shadow-inner">
        <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs uppercase tracking-widest">Business ROI Analysis</span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-mono">LIVE</span>
        </div>
        <div className="grid grid-cols-3 gap-2 font-mono text-sm">
           <div className="flex flex-col">
              <span className="text-slate-500 text-[10px]">OPS COST</span>
              <span className="text-red-400">-${metrics.operationalCost.toFixed(2)}</span>
           </div>
           <div className="flex flex-col">
              <span className="text-slate-500 text-[10px]">GENERATED</span>
              <span className="text-emerald-400">+${metrics.valueGenerated.toFixed(2)}</span>
           </div>
           <div className="flex flex-col border-l border-slate-700 pl-2">
              <span className="text-slate-500 text-[10px]">NET ROI</span>
              <span className={`font-bold ${roiColor}`}>{netROI >= 0 ? '+' : ''}{netROI.toFixed(2)}</span>
           </div>
        </div>
      </div>

      {/* Safety Monitor */}
      <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
          <div className="text-slate-400 text-xs uppercase tracking-widest mb-2 flex justify-between">
              <span>Safety Watchdog</span>
              <span className="text-emerald-500">● ARMED</span>
          </div>
          <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">BATTERY HEALTH</span>
                  <span className={robot.battery < 20 ? "text-red-500" : "text-emerald-500"}>
                      {robot.battery < 20 ? "CRITICAL" : "NOMINAL"}
                  </span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">NAV SYSTEMS</span>
                  <span className="text-emerald-500">ONLINE</span>
              </div>
               <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-500">MANUAL OVERRIDE</span>
                  <span className={robot.status === RobotStatus.EMERGENCY_STOP ? "text-red-500 blink" : "text-slate-600"}>
                      {robot.status === RobotStatus.EMERGENCY_STOP ? "ENGAGED" : "STANDBY"}
                  </span>
              </div>
          </div>
      </div>

      {/* Charts */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 h-48 flex flex-col">
        <div className="text-slate-400 text-xs uppercase tracking-widest mb-2 shrink-0">Power Consumption</div>
        <div className="flex-1 min-h-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.batteryHistory}>
              <defs>
                <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="step" hide />
              <YAxis domain={[0, 100]} hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Area type="monotone" dataKey="level" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBattery)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default MetricsPanel;