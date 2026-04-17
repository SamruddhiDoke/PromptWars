require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const VectorFieldEngine = require('./engine/VectorFieldEngine');
const PredictiveEngine = require('./engine/PredictiveEngine');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const BOUNDS = { width: 1200, height: 800 };
const engine = new VectorFieldEngine({
  bounds: BOUNDS,
  agentCount: 5000,
  cellSize: 20
});

const predictor = new PredictiveEngine(BOUNDS, 40);

const TICK_RATE_MS = 16; 

setInterval(() => {
  engine.tick();
  const agents = engine.getAgentsState();
  io.volatile.emit('simulation_state', agents);
}, TICK_RATE_MS);

// Heatmap updates
setInterval(() => {
  const heatmap = predictor.generateGhostHeatmap(engine.agents);
  io.volatile.emit('predictive_heatmap', heatmap);
}, 250);

// Basic explainability tick
setInterval(() => {
    let compliantCount = 0;
    for(let i=0; i<engine.agents.length; i++) {
        if(engine.agents[i].compliant) compliantCount++;
    }
    const trustScore = engine.agents.length > 0 ? (compliantCount / engine.agents.length) * 100 : 100;
    
    io.volatile.emit('intelligence_feed', {
        trustScore: trustScore.toFixed(1),
        decisions: [
            `[${(Math.random() * 1.5).toFixed(2)}s] Friction calculated.`
        ]
    });
}, 2000);

// Background Vertex AI SDK prediction loop
setInterval(async () => {
    if(engine.agents.length === 0) return;
    
    let compliantCount = 0;
    for(let i=0; i<engine.agents.length; i++) {
        if(engine.agents[i].compliant) compliantCount++;
    }
    const trustScore = engine.agents.length > 0 ? (compliantCount / engine.agents.length) * 100 : 100;
    
    // Calls out to the Vertex generative SDK with crowd analytics
    const vertexPrediction = await predictor.predictCrowdFlowWithAI(engine.agents.length, trustScore.toFixed(1));
    io.volatile.emit('intelligence_feed_alert', {
        decision: vertexPrediction
    });
}, 12000);

let gates = [
    { id: 'GateA', x: 1100, y: 200, width: 30, height: 150, status: 'open' },
    { id: 'GateB', x: 1100, y: 600, width: 30, height: 150, status: 'open' }
];
let defaultObstacles = [
    { x: 600, y: 400, radius: 120 }
];

engine.obstacles = [...defaultObstacles];

let spawnTimer = null;
let scriptTimers = [];

io.on('connection', (socket) => {
  console.log(`Client Connected: ${socket.id}`);
  socket.emit('env_data', { gates, obstacles: engine.obstacles });

  socket.on('reset_goals', () => {
    engine.reset();
    engine.obstacles = [...defaultObstacles];
    gates[0].status = 'open';
    gates[1].status = 'open';
    if(spawnTimer) clearInterval(spawnTimer);
    scriptTimers.forEach(clearTimeout);
    io.emit('presentation_mode', false);
    io.emit('env_data', { gates, obstacles: engine.obstacles });
  });

  socket.on('start_presentation', () => {
    console.log('PRESENTATION STARTED: 17k Limit');
    if(spawnTimer) clearInterval(spawnTimer);
    scriptTimers.forEach(clearTimeout);
    
    engine.agents = [];
    gates[0].status = 'open';
    gates[1].status = 'open';
    engine.obstacles = [...defaultObstacles];
    engine.goals = [{ x: 1100, y: 200, id: 'GateA' }]; 
    
    io.emit('presentation_mode', true);
    io.emit('env_data', { gates, obstacles: engine.obstacles });
    
    let batches = 34; // max 17k
    spawnTimer = setInterval(() => {
        engine.addAgents(500); 
        batches--;
        if(batches <= 0) clearInterval(spawnTimer);
    }, 100);

    scriptTimers.push(setTimeout(() => {
        gates[0].status = 'failed';
        io.emit('env_data', { gates, obstacles: engine.obstacles });
        engine.obstacles.push({ x: 1100, y: 200, radius: 180 });
    }, 5000));

    scriptTimers.push(setTimeout(() => {
        io.volatile.emit('intelligence_feed_alert', {
            decision: `[CRITICAL] Gate A Blockage Detected. Recalculating global swarm vectors...`
        });
        
        engine.goals = [{ x: 1100, y: 600, id: 'GateB' }];
        for(let a of engine.agents) {
            a.targetGoalId = 'GateB';
        }
    }, 6000));
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Swarm Engine] Running on port ${PORT}`);
});
