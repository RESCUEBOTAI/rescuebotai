import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalLogProps {
  logs: LogEntry[];
}

const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ERROR': return 'text-red-500';
      case 'WARNING': return 'text-yellow-500';
      case 'SUCCESS': return 'text-emerald-400';
      case 'INFO': default: return 'text-slate-300';
    }
  };

  return (
    <div className="bg-black border border-slate-700 rounded-lg p-4 font-mono text-xs h-64 flex flex-col shadow-inner">
      <div className="text-slate-500 border-b border-slate-800 pb-2 mb-2 flex justify-between">
        <span>MISSION LOGS</span>
        <span className="animate-pulse text-green-500">● ONLINE</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-2">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 opacity-90 hover:opacity-100 transition-opacity">
            <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second:'2-digit' })}]</span>
            <span className={`font-bold ${log.source === 'AI_PLANNER' ? 'text-purple-400' : 'text-blue-400'}`}>
              {log.source}:
            </span>
            <span className={`${getTypeColor(log.type)}`}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default TerminalLog;