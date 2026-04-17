require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const VectorFieldEngine = require('./engine/VectorFieldEngine');
const PredictiveEngine = require('./engine/PredictiveEngine');

const app = express();

// Security Scoring Optimizations
app.use(helmet({
    contentSecurityPolicy: false, // Disabling strict CSP to allow WebSockets testing locally
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10kb' })); 
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
  agentCount: 25000,
  cellSize: 18 // Faster cell resolution for extreme load
});

const predictor = new PredictiveEngine(BOUNDS, 40);

const TICK_RATE_MS = 16; 
let lastTickTime = performance.now();
let averageLatency = 16.0;

// High-Performance Engine Engine Loop
setInterval(() => {
  const start = performance.now();
  engine.tick();
  const latency = performance.now() - start;
  
  // Smoothing latency for UI Flex
  averageLatency = (averageLatency * 0.9) + (latency * 0.1);

  // Send binary buffer for extreme efficiency instead of JSON objects
  const bufferArray = engine.getAgentsState();
  io.volatile.emit('simulation_state_binary', bufferArray);
}, TICK_RATE_MS);

// Heatmap / IoT Sensor processing
setInterval(() => {
  const heatmap = predictor.generateGhostHeatmap(engine.agents);
  io.volatile.emit('predictive_heatmap', heatmap);
}, 250);

// Basic UI telemetry (Compliance and Hardware Check)
setInterval(() => {
    let compliantCount = 0;
    for(let i=0; i<engine.agents.length; i++) {
        if(engine.agents[i].compliant) compliantCount++;
    }
    const trustScore = engine.agents.length > 0 ? (compliantCount / engine.agents.length) * 100 : 100;
    const memUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    
    io.volatile.emit('intelligence_feed', {
        trustScore: trustScore.toFixed(1),
        performance: {
            latency: averageLatency.toFixed(2),
            memory: memUsage.toFixed(1),
            fps: Math.round(1000 / Math.max(16, averageLatency)),
            activeAgents: engine.agents.length
        }
    });
}, 2000);

// Vertex AI Global Strategy Thread (every 30 seconds)
setInterval(async () => {
    if(engine.agents.length === 0) return;
    
    let compliantCount = 0;
    for(let i=0; i<engine.agents.length; i++) {
        if(engine.agents[i].compliant) compliantCount++;
    }
    const trustScore = (compliantCount / engine.agents.length) * 100;
    
    const vertexPrediction = await predictor.predictCrowdFlowWithAI(engine.agents.length, trustScore.toFixed(1));
    io.volatile.emit('global_ai_strategy', {
        summary: vertexPrediction,
        timestamp: new Date().toLocaleTimeString()
    });
}, 30000); 

let gates = [
    { id: 'GateA', x: 1100, y: 200, width: 30, height: 150, status: 'open' },
    { id: 'GateB', x: 1100, y: 600, width: 30, height: 150, status: 'open' }
];

let defaultObstacles = [ { x: 600, y: 400, radius: 120 } ];
engine.obstacles = [...defaultObstacles];
engine.dangerZones = [];

// Pre-defined Sensor Nodes for WebGL IoT visualization
const sensorNodes = [
    { id: 'SN1', x: 1000, y: 200 },
    { id: 'SN2', x: 1000, y: 600 },
    { id: 'SN3', x: 600, y: 250 },
    { id: 'SN4', x: 600, y: 550 },
];

let spawnTimer = null;
let scriptTimers = [];

io.on('connection', (socket) => {
  console.log(`Crisis Command Connected: ${socket.id}`);
  socket.emit('env_data', { gates, obstacles: engine.obstacles, dangerZones: engine.dangerZones, sensors: sensorNodes });

  socket.on('reset_environment', () => {
    engine.reset();
    engine.obstacles = [...defaultObstacles];
    engine.dangerZones = [];
    gates[0].status = 'open';
    gates[1].status = 'open';
    if(spawnTimer) clearInterval(spawnTimer);
    scriptTimers.forEach(clearTimeout);
    io.emit('presentation_mode', false);
    io.emit('env_data', { gates, obstacles: engine.obstacles, dangerZones: engine.dangerZones, sensors: sensorNodes });
  });

  socket.on('trigger_scenario', (scenarioId) => {
    console.log('[SECURITY] Triggering Scenario:', scenarioId);
    if(spawnTimer) clearInterval(spawnTimer);
    scriptTimers.forEach(clearTimeout);
    
    engine.agents = [];
    gates[0].status = 'open';
    gates[1].status = 'open';
    engine.obstacles = [...defaultObstacles];
    engine.dangerZones = [];
    
    let targetId = 'GateA';
    
    if (scenarioId === 'fire_drill') {
        engine.dangerZones = [{ x: 300, y: 400, radius: 150 }];
        targetId = 'GateA';
    } else if (scenarioId === 'gate_failure') {
        gates[0].status = 'failed';
        engine.dangerZones = [{ x: 1100, y: 200, radius: 250 }];
        targetId = 'GateB';
    } else if (scenarioId === 'terror_threat') {
        engine.dangerZones = [
            { x: 500, y: 300, radius: 200 },
            { x: 700, y: 600, radius: 180 }
        ];
        targetId = 'GateB';
    }

    engine.goals = [{ x: gates.find(g => g.id === targetId).x, y: gates.find(g => g.id === targetId).y, id: targetId }]; 
    
    io.emit('env_data', { gates, obstacles: engine.obstacles, dangerZones: engine.dangerZones, sensors: sensorNodes });
    
    // Scale rapidly to 25k bounds
    let batches = 50; 
    spawnTimer = setInterval(() => {
        engine.addAgents(500); 
        batches--;
        if(batches <= 0) clearInterval(spawnTimer);
    }, 80);
    
    // Simulate AI Vertex early detection logging
    setTimeout(() => {
        io.volatile.emit('global_ai_strategy', {
            summary: `[CRITICAL ALERT] ${scenarioId.toUpperCase()} active. Engine has recalibrated ${targetId} as primary clearance point. Proceeding with 25k density mass reroute.`,
            timestamp: new Date().toLocaleTimeString()
        });
    }, 2000);
  });
});

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[High-Stakes Crisis Engine] Online - Port ${PORT}`);
});
