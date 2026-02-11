import { Cell, Coordinates, CellType, RobotState, SystemModule, RobotConfig } from '../types';
import { GRID_SIZE, MOVEMENT_COST } from '../constants';

/**
 * Planning & Control Layers
 * Responsibilities:
 * 1. Task & Motion Planning: Calculate optimal paths (A*).
 * 2. Control: Execute movement physics and collision checks.
 */

// A* Pathfinding Node
interface Node {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic to end
  f: number; // Total cost
  parent: Node | null;
}

export const planPath = (
  start: Coordinates,
  target: Coordinates,
  worldModel: Cell[][]
): Coordinates[] => {
  // A* Implementation
  const openList: Node[] = [];
  const closedList = new Set<string>();
  
  const startNode: Node = { x: start.x, y: start.y, g: 0, h: 0, f: 0, parent: null };
  openList.push(startNode);

  while (openList.length > 0) {
    // Sort by lowest F cost
    openList.sort((a, b) => a.f - b.f);
    const currentNode = openList.shift()!;

    // Check Goal
    if (currentNode.x === target.x && currentNode.y === target.y) {
      const path: Coordinates[] = [];
      let curr: Node | null = currentNode;
      while (curr) {
        path.push({ x: curr.x, y: curr.y });
        curr = curr.parent;
      }
      return path.reverse().slice(1); // Exclude start position
    }

    closedList.add(`${currentNode.x},${currentNode.y}`);

    const neighbors = [
      { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
    ];

    for (const offset of neighbors) {
      const nx = currentNode.x + offset.x;
      const ny = currentNode.y + offset.y;

      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
      if (closedList.has(`${nx},${ny}`)) continue;

      const cell = worldModel[ny][nx];
      
      // Physics: Check traversability
      // We assume robot can plan through unrevealed cells (exploration), but prefers revealed empty ones.
      // Walls are known obstacles.
      if (cell.type === CellType.WALL && cell.revealed) continue;

      const gCost = currentNode.g + (MOVEMENT_COST[cell.type] || 1);
      const hCost = Math.abs(nx - target.x) + Math.abs(ny - target.y); // Manhattan
      const fCost = gCost + hCost;

      const existingNode = openList.find(n => n.x === nx && n.y === ny);
      if (existingNode && gCost >= existingNode.g) continue;

      const neighborNode: Node = {
        x: nx,
        y: ny,
        g: gCost,
        h: hCost,
        f: fCost,
        parent: currentNode
      };

      if (!existingNode) {
        openList.push(neighborNode);
      }
    }
  }

  return []; // No path found
};

export const executeControlStep = (
  currentPos: Coordinates,
  nextPos: Coordinates,
  currentBattery: number,
  cellType: CellType,
  robotConfig?: RobotConfig
): { success: boolean, newBattery: number, message?: string } => {
  
  // Physics Check
  if (cellType === CellType.WALL) {
    return { success: false, newBattery: currentBattery, message: "COLLISION DETECTED" };
  }

  // Energy Physics
  const cost = MOVEMENT_COST[cellType] || 1;
  // Base drain + Terrain Modifier
  // Apply speed multiplier: faster robots drain more battery
  // Apply battery drain rate: affects how quickly battery depletes
  const speedMultiplier = robotConfig?.speedMultiplier || 1.0;
  const batteryDrainRate = robotConfig?.batteryDrainRate || 1.0;
  const drain = 0.5 * cost * speedMultiplier * batteryDrainRate; 
  const newBattery = Math.max(0, currentBattery - drain);

  return { success: true, newBattery };
};
