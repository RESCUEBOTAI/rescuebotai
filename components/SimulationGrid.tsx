import React from 'react';
import { Cell, CellType, Coordinates } from '../types';
import { COLORS } from '../constants';

interface SimulationGridProps {
  grid: Cell[][];
  robotPos: Coordinates;
  path: Coordinates[];
  cellSize: number;
}

const SimulationGrid: React.FC<SimulationGridProps> = ({ grid, robotPos, path, cellSize }) => {
  const isPath = (x: number, y: number) => {
    return path.some(p => p.x === x && p.y === y);
  };

  return (
    <div className="relative border-2 border-slate-700 rounded-lg overflow-hidden shadow-2xl bg-black">
      <div 
        className="grid gap-px bg-slate-900"
        style={{
          gridTemplateColumns: `repeat(${grid.length}, ${cellSize}px)`,
          width: 'fit-content'
        }}
      >
        {grid.map((row, y) => (
          row.map((cell, x) => {
            let bgClass = COLORS[CellType.EMPTY];
            let content = null;
            const fontSize = Math.max(10, cellSize * 0.5);

            if (!cell.revealed) {
              bgClass = COLORS.UNKNOWN;
            } else {
              bgClass = COLORS[cell.type] || COLORS[CellType.EMPTY];
              
              if (cell.type === CellType.VICTIM) {
                content = <span style={{ fontSize: `${fontSize}px` }}>🆘</span>;
              } else if (cell.type === CellType.FIRE) {
                content = <span style={{ fontSize: `${fontSize}px` }}>🔥</span>;
              } else if (cell.type === CellType.DEBRIS) {
                content = <span style={{ fontSize: `${fontSize}px` }}>🧱</span>;
              }
            }

            // Path overlay
            const isPathCell = isPath(x, y);
            
            // Robot overlay
            const isRobot = robotPos.x === x && robotPos.y === y;

            return (
              <div
                key={`${x}-${y}`}
                style={{ width: cellSize, height: cellSize }}
                className={`
                  ${bgClass} 
                  flex items-center justify-center relative
                  transition-colors duration-300
                `}
              >
                {/* Fog of war pattern */}
                {!cell.revealed && (
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
                )}

                {/* Path Marker */}
                {isPathCell && !isRobot && (
                  <div className="rounded-full bg-blue-400 opacity-50 animate-pulse" 
                       style={{ width: cellSize * 0.3, height: cellSize * 0.3 }} />
                )}

                {/* Content (Icons) */}
                {content}

                {/* Robot Agent */}
                {isRobot && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div 
                        style={{ 
                            width: `${cellSize * 0.8}px`, 
                            height: `${cellSize * 0.8}px`,
                            fontSize: `${cellSize * 0.5}px`
                        }}
                        className="bg-blue-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(59,130,246,0.8)] flex items-center justify-center"
                    >
                      🤖
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};

export default SimulationGrid;