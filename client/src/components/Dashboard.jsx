import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import CanvasEngine from './CanvasEngine';
import { Shield, Activity, BarChart3, Radio, Terminal, Settings2, Download } from 'lucide-react';

const socket = io({ transports: ['websocket'] });

const Dashboard = () => {
  const [trustScore, setTrustScore] = useState(100);
  const [perf, setPerf] = useState({ latency: 0, memory: 0, fps: 0, activeAgents: 0 });
  const [strategy, setStrategy] = useState({ summary: "Monitoring localized trajectories...", timestamp: "" });
  const [showFuture, setShowFuture] = useState(true);

  useEffect(() => {
    socket.on('intelligence_feed', (data) => {
      setTrustScore(data.trustScore);
      setPerf(data.performance);
    });

    socket.on('global_ai_strategy', (data) => {
      setStrategy(data);
    });

    return () => {
      socket.off('intelligence_feed');
      socket.off('global_ai_strategy');
    };
  }, []);

  const triggerReset = () => socket.emit('trigger_scenario', 'reset');
  const triggerFailure = () => socket.emit('trigger_scenario', 'gate_failure');

  const handleExport = () => alert("CRITICAL REPORT EXPORTED: Predictive_Analytics_T120.pdf (Simulation Data Package)");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
      
      {/* Executive Header */}
      <header className="h-14 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-slate-800" />
          <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-slate-800">
            Predictive Command <span className="text-slate-400 font-light">// Elite-S</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 transition-all shadow-sm"
          >
            <Download className="w-3 h-3" /> Export Analytics
          </button>
        </div>
      </header>

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Simulation Window - Prime Visuals */}
        <section className="lg:col-span-9 h-[70vh] relative">
          <CanvasEngine showFutureSight={showFuture} />
          
          {/* Performance Flex Overlay */}
          <div className="absolute top-4 left-4 bg-white/60 backdrop-blur-md p-3 rounded-md border border-slate-200 shadow-sm font-mono text-[10px]">
             <div className="flex gap-4">
               <div><span className="text-slate-400">AGENTS:</span> {perf.activeAgents.toLocaleString()}</div>
               <div><span className="text-slate-400">LATENCY:</span> {perf.latency}ms</div>
               <div><span className="text-slate-400">MEMORY:</span> {perf.memory}MB</div>
               <div className="text-slate-800 font-bold">{perf.fps} FPS</div>
             </div>
          </div>
        </section>

        {/* Executive Sidebar */}
        <aside className="lg:col-span-3 space-y-4">
          
          {/* Autonomous Status */}
          <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-3 h-3" /> System Compliance
            </h2>
            <div className="text-4xl font-light text-slate-900">{trustScore}%</div>
            <div className="mt-2 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-slate-900 transition-all duration-1000" 
                style={{ width: `${trustScore}%` }} 
              />
            </div>
          </div>

          {/* AI Strategy Display */}
          <div className="bg-slate-900 text-white p-5 rounded-lg shadow-xl relative overflow-hidden ring-1 ring-slate-800">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Terminal className="w-3 h-3 text-white" /> Autonomous Logic
            </div>
            <p className="text-xs font-medium leading-relaxed italic opacity-90 min-h-[60px]">
              "{strategy.summary}"
            </p>
            <div className="mt-4 flex items-center justify-between text-[8px] font-mono text-slate-500 uppercase">
               <span>P-Index: High</span>
               <span>{strategy.timestamp || "Syncing..."}</span>
            </div>
          </div>

          {/* Tactical Control Console */}
          <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Settings2 className="w-3 h-3" /> Tactical Hub
            </h2>
            
            <div className="space-y-3">
              <button 
                onClick={() => setShowFuture(!showFuture)}
                className={`w-full text-left px-4 py-2 text-[10px] font-bold rounded border transition-all ${showFuture ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}
              >
                FUTURE-SIGHT (T+120S) : {showFuture ? 'ON' : 'OFF'}
              </button>

              <div className="pt-2 border-t border-slate-100 mt-2 space-y-2">
                 <button 
                   onClick={triggerFailure}
                   className="w-full text-left px-4 py-2 text-[10px] font-bold rounded border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                 >
                   SIMULATE INFRA FAILURE
                 </button>
                 <button 
                   onClick={triggerReset}
                   className="w-full text-left px-4 py-2 text-[10px] font-bold rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                 >
                   PURGE & RECALIBRATE
                 </button>
              </div>
            </div>
          </div>

          {/* Technical Context */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-2">
                <BarChart3 className="w-3 h-3" /> Predictive Load
             </div>
             <p className="text-[9px] text-slate-500 leading-normal">
                Autonomous pre-emption logic active. Monitoring anomaly clusters via Spatial Hashing and Vertex AI. All trajectories validated via Dot Product math.
             </p>
          </div>

        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
