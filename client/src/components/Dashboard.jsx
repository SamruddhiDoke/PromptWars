import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import CanvasEngine from './CanvasEngine';
import { Activity, ShieldAlert, Cpu, Network, Layers, Camera, AlertTriangle } from 'lucide-react';

const socket = io({
  transports: ['websocket'],
});

const Dashboard = () => {
  const [trustScore, setTrustScore] = useState(100);
  const [perfStats, setPerfStats] = useState({ latency: 0, memory: 0, fps: 60, activeAgents: 0 });
  const [aiStrategy, setAiStrategy] = useState({ summary: "System initializing telemetry...", timestamp: "" });
  const [showGhosts, setShowGhosts] = useState(false);
  const [isBlurMode, setIsBlurMode] = useState(false);
  const [activeScenario, setActiveScenario] = useState('none');

  useEffect(() => {
    socket.on('intelligence_feed', (data) => {
      setTrustScore(Number(data.trustScore));
      if(data.performance) setPerfStats(data.performance);
    });

    socket.on('global_ai_strategy', (data) => {
      setAiStrategy(data);
    });

    return () => {
      socket.off('intelligence_feed');
      socket.off('global_ai_strategy');
    };
  }, []);

  const handleScenario = (scenario) => {
    setActiveScenario(scenario);
    socket.emit('trigger_scenario', scenario);
  };

  const resetEnv = () => {
    setActiveScenario('none');
    socket.emit('reset_environment');
    setAiStrategy({ summary: "Environment reset. Waiting for Vertex AI batch...", timestamp: new Date().toLocaleTimeString() });
  };

  const handleExportPDF = () => {
     alert("Generating High-Stakes Analytics PDF Report... (Mocked for Demo)");
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-cyan-50 font-sans selection:bg-cyan-500/30">
      
      <header className="border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-cyan-400" aria-hidden="true" />
            <h1 className="text-xl font-bold tracking-wider text-slate-200">
              CRISIS-CORE <span className="text-cyan-500 font-normal">v9.2</span>
            </h1>
          </div>
          <div className="flex gap-4">
             <button 
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-cyan-400 rounded border border-slate-700 text-sm font-semibold transition-all shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                aria-label="Export Analytics PDF Report"
             >
                <Camera className="w-4 h-4" /> Snapshot Report
             </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Canvas Viewport */}
        <section className="lg:col-span-3 h-[75vh]" aria-label="Crisis Simulation Area">
           <CanvasEngine showGhosts={showGhosts} isBlurMode={isBlurMode} />
        </section>

        {/* Global Strategy & Scenario Command Panel */}
        <aside className="space-y-6" aria-label="System Controls and Metrics">
          
          {/* Performance Benchmark Flex Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-2xl">
            <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Hardware Telemetry
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-3 rounded">
                <div className="text-xs text-slate-400">Agents</div>
                <div className="text-lg font-mono text-cyan-300">{perfStats.activeAgents.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded">
                <div className="text-xs text-slate-400">Engine Tick</div>
                <div className="text-lg font-mono text-cyan-300">{perfStats.latency}ms</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded">
                <div className="text-xs text-slate-400">Memory Load</div>
                <div className="text-lg font-mono text-cyan-300">{perfStats.memory} MB</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded">
                <div className="text-xs text-slate-400">FPS</div>
                <div className="text-lg font-mono text-cyan-300">{perfStats.fps}Hz</div>
              </div>
            </div>
          </div>

          {/* System Compliance */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
            <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Compliance Rating
            </h2>
            <div className="flex items-end gap-3 mb-2">
              <span className={`text-5xl font-mono ${trustScore < 60 ? 'text-red-400' : 'text-cyan-400'}`}>
                {trustScore}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
               <div 
                 className={`h-full ${trustScore < 60 ? 'bg-red-500' : 'bg-cyan-500'}`} 
                 style={{ width: `${trustScore}%`, transition: 'width 0.5s ease-in-out' }}
                 aria-label="System Trust Progress Bar"
               />
            </div>
          </div>

          {/* Global AI Strategy Panel */}
          <div className="bg-slate-900 border border-cyan-900/50 rounded-lg p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
                <Network className="w-24 h-24 text-cyan-500" />
            </div>
            <h2 className="text-xs uppercase tracking-widest text-cyan-500 mb-4 flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4" /> Vertex AI Strategy
            </h2>
            <div className="text-sm font-mono text-slate-300 leading-relaxed min-h-[80px] z-10 relative">
               {aiStrategy.summary}
            </div>
            <div className="text-[10px] text-slate-500 mt-4 font-mono z-10 relative">
               LAST SYNC: {aiStrategy.timestamp || "PENDING"}
            </div>
          </div>

          {/* Scenario Command Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-2xl">
            <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-4">Command Matrix</h2>
            
            <div className="space-y-2 mb-6">
                <button 
                  onClick={() => handleScenario('fire_drill')}
                  className={`w-full text-left px-4 py-2 text-sm rounded border transition-colors ${activeScenario === 'fire_drill' ? 'bg-cyan-900/40 border-cyan-500 text-cyan-100' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}
                >
                  <span className="text-xs text-slate-500 mr-2">[01]</span> Station Fire Drill
                </button>
                <button 
                  onClick={() => handleScenario('gate_failure')}
                  className={`w-full text-left px-4 py-2 text-sm rounded border transition-colors ${activeScenario === 'gate_failure' ? 'bg-cyan-900/40 border-cyan-500 text-cyan-100' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}
                >
                  <span className="text-xs text-slate-500 mr-2">[02]</span> Gate Malfunction
                </button>
                <button 
                  onClick={() => handleScenario('terror_threat')}
                  className={`w-full text-left px-4 py-2 text-sm rounded border transition-colors ${activeScenario === 'terror_threat' ? 'bg-red-900/40 border-red-500 text-red-100' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}
                >
                  <span className="text-xs text-slate-500 mr-2">[03]</span> Terror Threat Level High
                </button>
            </div>

            <h2 className="text-xs uppercase tracking-widest text-slate-400 mb-3">IoT Overlays</h2>
            <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => setShowGhosts(!showGhosts)}
                  className={`flex-1 py-1.5 rounded text-xs font-semibold border ${showGhosts ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                >
                  {showGhosts ? 'T+5 ACTIVE' : 'T+5 GHOSTS'}
                </button>
                <button 
                  onClick={() => setIsBlurMode(!isBlurMode)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-semibold border ${isBlurMode ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                >
                  <Layers className="w-3 h-3" /> BLUR MAP
                </button>
            </div>

            <button 
              onClick={resetEnv}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm font-semibold transition-colors uppercase tracking-widest"
              aria-label="Reset Security Environment"
            >
              Reset Physics Engine
            </button>
          </div>

        </aside>
      </div>
    </main>
  );
};

export default Dashboard;
