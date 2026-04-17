/**
 * VectorFieldEngine
 * High-performance swarm intelligence physics processor.
 * Optimized for O(N) complexity using Spatial Hashing.
 */

class SpatialHashGrid {
  constructor(bounds, cellSize) {
    this.bounds = bounds;
    this.cellSize = cellSize;
    this.cells = new Map();
  }
  
  _getKey(x, y) {
    const col = (x / this.cellSize) | 0;
    const row = (y / this.cellSize) | 0;
    return `${col},${row}`;
  }

  insert(agent) {
    const key = this._getKey(agent.x, agent.y);
    let cell = this.cells.get(key);
    if (!cell) {
      cell = [];
      this.cells.set(key, cell);
    }
    cell.push(agent);
  }

  clear() {
    this.cells.clear();
  }

  getNearby(x, y, radius) {
    const minCol = ((x - radius) / this.cellSize) | 0;
    const maxCol = ((x + radius) / this.cellSize) | 0;
    const minRow = ((y - radius) / this.cellSize) | 0;
    const maxRow = ((y + radius) / this.cellSize) | 0;
    
    const result = [];
    let count = 0;
    
    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        const cellAgents = this.cells.get(`${c},${r}`);
        if (cellAgents) {
          for (let i = 0; i < cellAgents.length; i++) {
            result.push(cellAgents[i]);
            if (++count > 20) return result; 
          }
        }
      }
    }
    return result;
  }
}

class VectorFieldEngine {
  constructor(config = {}) {
    this.agents = [];
    this.bounds = config.bounds || { width: 1200, height: 800 };
    this.cellSize = config.cellSize || 25; 
    this.grid = new SpatialHashGrid(this.bounds, this.cellSize);
    
    this.goals = config.goals || [{ x: 1100, y: 400, id: 'GateA' }]; 
    this.obstacles = [{ x: 600, y: 400, radius: 100 }];
    this.predictiveAnomalies = []; 
    
    this.maxSpeed = 2.2;
    this.maxForce = 0.1;
    this.generateAgents(config.agentCount || 20000);
  }

  reset() {
    this.agents = [];
    this.predictiveAnomalies = [];
    this.generateAgents(20000);
  }

  generateAgents(count) {
    this.agents = [];
    this.addAgents(count);
  }

  addAgents(count) {
    const startIndex = this.agents.length;
    for (let i = 0; i < count; i++) {
      const startX = Math.random() * 250 + 50; 
      const startY = Math.random() * (this.bounds.height - 100) + 50;
      let targetId = this.goals.length > 0 ? this.goals[Math.floor(Math.random() * this.goals.length)].id : 'GateA';

      this.agents.push({
        id: startIndex + i,
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 2,
        mass: 1,
        targetGoalId: targetId,
        compliant: true
      });
    }
  }

  tick() {
    const grid = this.grid;
    grid.clear();
    const agents = this.agents;
    const count = agents.length;
    
    for (let i = 0; i < count; i++) {
      grid.insert(agents[i]);
    }
    
    const maxSpeed = this.maxSpeed;
    const maxForce = this.maxForce;
    const cellSize = this.cellSize;
    const goals = this.goals;
    const obstacles = this.obstacles;
    const anomalies = this.predictiveAnomalies;

    for (let i = 0; i < count; i++) {
      let current = agents[i];
      let goal = goals.find(g => g.id === current.targetGoalId) || goals[0];
      
      let fGoalX = 0, fGoalY = 0;
      if (goal) {
          let dx = goal.x - current.x;
          let dy = goal.y - current.y;
          let dist = Math.sqrt(dx*dx + dy*dy);
          
          if (dist > 1) {
            dx = (dx / dist) * maxSpeed;
            dy = (dy / dist) * maxSpeed;
            fGoalX = dx - current.vx;
            fGoalY = dy - current.vy;
          }
      }
      
      let fRepX = 0, fRepY = 0;
      let neighbors = grid.getNearby(current.x, current.y, cellSize);
      let repCount = 0;
      
      for (let j = 0; j < neighbors.length; j++) {
        let other = neighbors[j];
        if (other.id !== current.id) {
          let dx = current.x - other.x;
          let dy = current.y - other.y;
          let distSq = dx*dx + dy*dy;
          
          if (distSq > 0 && distSq < cellSize * cellSize) {
            let d = Math.sqrt(distSq);
            let force = (cellSize - d) / cellSize;
            fRepX += (dx / d) * force;
            fRepY += (dy / d) * force;
            repCount++;
          }
        }
      }
      
      if (repCount > 0) {
        fRepX = (fRepX / repCount) * maxSpeed; 
        fRepY = (fRepY / repCount) * maxSpeed;
      }

      // Hard Obstacles
      let fObsX = 0, fObsY = 0;
      for (let o = 0; o < obstacles.length; o++) {
         let obs = obstacles[o];
         let dx = current.x - obs.x;
         let dy = current.y - obs.y;
         let dist = Math.sqrt(dx*dx + dy*dy);
         if (dist < obs.radius + 30) {
            let push = (obs.radius + 30 - dist) / 5; 
            fObsX += (dx / dist) * push;
            fObsY += (dy / dist) * push;
         }
      }

      // Proactive Future-Sight Avoidance (Predictive Anomalies)
      let fPredX = 0, fPredY = 0;
      for (let a = 0; a < anomalies.length; a++) {
        let anom = anomalies[a];
        let dx = current.x - anom.x;
        let dy = current.y - anom.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < anom.radius + 100) { 
            // Exponential repulsion for proactive avoidance
            let push = Math.pow((anom.radius + 100 - dist) / 20, 1.8); 
            fPredX += (dx / dist) * push;
            fPredY += (dy / dist) * push;
        }
      }

      const friction = 0.04;
      let F_totX = fGoalX + fRepX * 2.2 + fObsX * 1.5 + fPredX * 3.0 - current.vx * friction;
      let F_totY = fGoalY + fRepY * 2.2 + fObsY * 1.5 + fPredY * 3.0 - current.vy * friction;
      
      let fMag = Math.sqrt(F_totX*F_totX + F_totY*F_totY);
      if (fMag > maxForce) {
        F_totX = (F_totX / fMag) * maxForce;
        F_totY = (F_totY / fMag) * maxForce;
      }

      current.vx += F_totX;
      current.vy += F_totY;
      
      let speed = Math.sqrt(current.vx*current.vx + current.vy*current.vy);
      if (speed > maxSpeed) {
        current.vx = (current.vx / speed) * maxSpeed;
        current.vy = (current.vy / speed) * maxSpeed;
      }
      
      // Vector Compliance Dot Product
      if (goal && speed > 0.1) {
          let gx = goal.x - current.x;
          let gy = goal.y - current.y;
          current.compliant = (gx * current.vx + gy * current.vy) > 0;
      }

      current.x += current.vx;
      current.y += current.vy;
      
      if (current.x < 10) current.x = 10;
      if (current.y < 10) current.y = 10;
      if (current.x > this.bounds.width - 10) current.x = this.bounds.width - 10;
      if (current.y > this.bounds.height - 10) current.y = this.bounds.height - 10;
    }
  }

  getAgentsState() {
    const buffer = new Float32Array(this.agents.length * 2);
    const agents = this.agents;
    for (let i = 0; i < agents.length; i++) {
      buffer[i * 2] = agents[i].x;
      buffer[i * 2 + 1] = agents[i].y;
    }
    return buffer;
  }
}

module.exports = VectorFieldEngine;
