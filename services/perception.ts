import { Cell, Coordinates, SensorReading, CellType } from '../types';
import { GRID_SIZE } from '../constants';

/**
 * Perception Layer
 * Responsibilities:
 * 1. Sensor Interface: Simulates Lidar/Camera reading from the "Truth" grid.
 * 2. State Estimation: Updates the robot's internal World Model (revealed map).
 */

const SENSOR_RADIUS = 2; // Simulating a short-range Lidar/Depth sensor

export const scanEnvironment = (
  truthGrid: Cell[][],
  robotPos: Coordinates
): { readings: SensorReading[], newMapState: Cell[][] } => {
  
  const readings: SensorReading[] = [];
  const newMapState = truthGrid.map(row => row.map(cell => ({ ...cell })));
  let mapUpdated = false;

  // Simulate Raycasting/Field of View
  for (let dy = -SENSOR_RADIUS; dy <= SENSOR_RADIUS; dy++) {
    for (let dx = -SENSOR_RADIUS; dx <= SENSOR_RADIUS; dx++) {
      const nx = robotPos.x + dx;
      const ny = robotPos.y + dy;
      
      // Bounds check
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        // Line of sight check could go here for advanced physics
        
        // 1. Get Sensor Data
        const cell = truthGrid[ny][nx];
        readings.push({
          coordinates: { x: nx, y: ny },
          type: cell.type,
          distance: Math.abs(dx) + Math.abs(dy)
        });

        // 2. Update World Model (Fog of War)
        if (!newMapState[ny][nx].revealed) {
          newMapState[ny][nx].revealed = true;
          mapUpdated = true;
        }
      }
    }
  }

  return { readings, newMapState: mapUpdated ? newMapState : truthGrid };
};

export const getKnownWorld = (grid: Cell[][]): Cell[] => {
  return grid.flat().filter(c => c.revealed);
};
