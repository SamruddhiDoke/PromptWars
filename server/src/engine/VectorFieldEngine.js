class SpatialHashGrid {
  constructor(bounds, cellSize) {
    this.bounds = bounds;
    this.cellSize = cellSize;
    this.cells = new Map();
  }
  
  _getKey(x, y) {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    return `${col},${row}`;
  }

  insert(agent) {
    const key = this._getKey(agent.x, agent.y);
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key).push(agent);
  }

  clear() {
    this.cells.clear();
  }

  getNearby(x, y, radius) {
    const minCol = Math.floor((x - radius) / this.cellSize);
    const maxCol = Math.floor((x + radius) / this.cellSize);
    const minRow = Math.floor((y - radius) / this.cellSize);
    const maxRow = Math.floor((y + radius) / this.cellSize);
    
    let result = [];
    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        const key = `${c},${r}`;
        let cellAgents = this.cells.get(key);
        if (cellAgents) {
          for(let i=0; i<cellAgents.length; i++){
            result.push(cellAgents[i]);
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
    this.goals = config.goals || [{ x: 1100, y: 400, id: 'ExitA' }]; 
    this.obstacles = [ { x: 600, y: 400, radius: 100 } ];
    
    this.maxSpeed = 2.0;
    this.maxForce = 0.08;
    this.generateAgents(config.agentCount || 5000);
  }

  reset() {
    this.agents = [];
    this.goals = [{ x: 1100, y: 400, id: 'ExitA' }];
    this.obstacles = [{ x: 600, y: 400, radius: 100 }];
    this.generateAgents(5000);
  }

  generateAgents(count) {
    this.agents = [];
    this.addAgents(count);
  }

  addAgents(count) {
    const startIndex = this.agents.length;
    for (let i = 0; i < count; i++) {
        const startX = Math.random() * 300 + 20; 
        const startY = Math.random() * (this.bounds.height - 40) + 20;
        let targetId = 'ExitA';
        if(this.goals.length > 0) targetId = this.goals[Math.floor(Math.random() * this.goals.length)].id;

        this.agents.push({
            id: `agent_${startIndex + i}`,
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
    this.grid.clear();
    for (let i = 0; i < this.agents.length; i++) {
      this.grid.insert(this.agents[i]);
    }
    
    for (let i = 0; i < this.agents.length; i++) {
      let current = this.agents[i];
      let goal = this.goals.find(g => g.id === current.targetGoalId) || this.goals[0];
      
      let fGoalX = 0, fGoalY = 0;
      if (goal) {
          let desiredX = goal.x - current.x;
          let desiredY = goal.y - current.y;
          let distance = Math.hypot(desiredX, desiredY);
          
          if (distance > 0) {
            desiredX = (desiredX / distance) * this.maxSpeed;
            desiredY = (desiredY / distance) * this.maxSpeed;
            fGoalX = desiredX - current.vx;
            fGoalY = desiredY - current.vy;
          }
      }
      
      let fRepX = 0, fRepY = 0;
      let neighbors = this.grid.getNearby(current.x, current.y, this.cellSize);
      let count = 0;
      
      for (let j = 0; j < neighbors.length; j++) {
        let other = neighbors[j];
        if (other.id !== current.id) {
          let dx = current.x - other.x;
          let dy = current.y - other.y;
          let distSq = dx*dx + dy*dy;
          
          if (distSq > 0 && distSq < this.cellSize * this.cellSize) {
            let d = Math.sqrt(distSq);
            let repStrength = (this.cellSize - d) / this.cellSize;
            fRepX += (dx / d) * repStrength;
            fRepY += (dy / d) * repStrength;
            count++;
            if(count > 8) break; 
          }
        }
      }
      if (count > 0) {
        fRepX /= count;
        fRepY /= count;
        fRepX *= this.maxSpeed; 
        fRepY *= this.maxSpeed;
      }

      let fObsX = 0, fObsY = 0;
      for (let o = 0; o < this.obstacles.length; o++) {
         let obs = this.obstacles[o];
         let dx = current.x - obs.x;
         let dy = current.y - obs.y;
         let dist = Math.hypot(dx, dy);
         
         if (dist < obs.radius + 40) {
            let pushStrength = (obs.radius + 40 - dist) / 10; 
            if(dist <= obs.radius) pushStrength = 15.0;
            fObsX += (dx / dist) * pushStrength;
            fObsY += (dy / dist) * pushStrength;
         }
      }

      const frictionScale = 0.05;
      let fFrictX = -current.vx * frictionScale;
      let fFrictY = -current.vy * frictionScale;
      
      let F_totX = (fGoalX * 1.0) + (fRepX * 2.5) + fObsX + fFrictX;
      let F_totY = (fGoalY * 1.0) + (fRepY * 2.5) + fObsY + fFrictY;
      
      let totalForce = Math.hypot(F_totX, F_totY);
      if (totalForce > this.maxForce) {
        F_totX = (F_totX / totalForce) * this.maxForce;
        F_totY = (F_totY / totalForce) * this.maxForce;
      }

      current.vx += (F_totX / current.mass);
      current.vy += (F_totY / current.mass);
      
      let speed = Math.hypot(current.vx, current.vy);
      if (speed > this.maxSpeed) {
        current.vx = (current.vx / speed) * this.maxSpeed;
        current.vy = (current.vy / speed) * this.maxSpeed;
      }
      
      // Calculate true compliance (is velocity vector aligning with goal vector?)
      if(goal && speed > 0.1) {
          let gx = goal.x - current.x;
          let gy = goal.y - current.y;
          let dotProduct = (gx * current.vx + gy * current.vy);
          current.compliant = dotProduct > 0;
      } else {
          current.compliant = false;
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
    const minified = new Array(this.agents.length);
    for(let i=0; i<this.agents.length; i++){
      let a = this.agents[i];
      minified[i] = [
        Math.round(a.x * 10) / 10,
        Math.round(a.y * 10) / 10
      ];
    }
    return minified;
  }
}

module.exports = VectorFieldEngine;
