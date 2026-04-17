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

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10kb' })); 
app.use(express.static(path.join(__dirname, '../public')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const BOUNDS = { width: 1200, height: 800 };
const engine = new VectorFieldEngine({
  bounds: BOUNDS,
  agentCount: 20000,
  cellSize: 22 
});

const predictor = new PredictiveEngine(BOUNDS, 45);

const TICK_RATE_MS = 16; 
let averageLatency = 16.0;

// High-Performance Core Loop
setInterval(() => {
  const start = performance.now();
  engine.tick();
  averageLatency = (averageLatency * 0.9) + ((performance.now() - start) * 0.1);

  // Binary stream for 20,000 agents
  io.volatile.emit('simulation_state_binary', engine.getAgentsState());
}, TICK_RATE_MS);

/**
 * AUTONOMOUS PROACTIVE LOOP
 * Detects future bottlenecks and triggers prevention logic without user input.
 */
setInterval(async () => {
    if (engine.agents.length === 0) return;

    // 1. Predictive Future-Sight Analysis (T+120s)
    const { heatmap, anomalies } = predictor.analyzeFuture(engine.agents);
    
    // 2. Feed anomalies back to Physics Engine for Autonomous Avoidance
    engine.predictiveAnomalies = anomalies;
    io.volatile.emit('predictive_heatmap', heatmap);

    // 3. Autonomous Decision Logic
    // If anomalies detected at primary gate, shift a percentage of targets to secondary gate
    if (anomalies.length > 0) {
        const criticalAnomalies = anomalies.filter(a => a.x > 1000); // Near exits
        if (criticalAnomalies.length > 0) {
            // Divert 20% of the swarm to GateB if GateA is predicted to crush
            const diversionCount = Math.floor(engine.agents.length * 0.2);
            let diverted = 0;
            for (let a of engine.agents) {
                if (a.targetGoalId === 'GateA') {
                   a.targetGoalId = 'GateB';
                   if (++diverted >= diversionCount) break;
                }
            }
        }
    }

    // 4. Vertex AI Strategic Intelligence
    let compliantCount = 0;
    for (let a of engine.agents) if (a.compliant) compliantCount++;
    const trustScore = ((compliantCount / engine.agents.length) * 100).toFixed(1);
    
    const strategy = await predictor.generateAutonomousStrategy(
        engine.agents.length, 
        anomalies.length, 
        trustScore
    );

    io.volatile.emit('global_ai_strategy', {
        summary: strategy,
        timestamp: new Date().toLocaleTimeString(),
        anomalies: anomalies.length
    });

    const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    io.volatile.emit('intelligence_feed', {
        trustScore,
        performance: {
            latency: averageLatency.toFixed(2),
            memory: memUsage,
            fps: Math.round(1000 / Math.max(16, averageLatency)),
            activeAgents: engine.agents.length
        }
    });

}, 4000); // 4s intelligence cycle

let gates = [
    { id: 'GateA', x: 1100, y: 200, width: 30, height: 150, status: 'open' },
    { id: 'GateB', x: 1100, y: 600, width: 30, height: 150, status: 'open' }
];

io.on('connection', (socket) => {
  socket.emit('env_data', { gates, obstacles: engine.obstacles });

  socket.on('trigger_scenario', (scenarioId) => {
    engine.agents = [];
    if (scenarioId === 'reset') {
        engine.reset();
        gates[0].status = 'open';
    } else if (scenarioId === 'gate_failure') {
        gates[0].status = 'failed';
        engine.goals = [{ x: 1100, y: 600, id: 'GateB' }];
        for (let a of engine.agents) a.targetGoalId = 'GateB';
    }
    io.emit('env_data', { gates, obstacles: engine.obstacles });
    engine.addAgents(20000);
  });
});

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Autonomous Predictive Prevention] Online - Port ${PORT}`);
});
