import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import CanvasEngine from './CanvasEngine';
import { Activity, AlertTriangle, Crosshair, Users, Expand, ShieldCheck, PowerOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const socket = io({
  transports: ['websocket'],
});

const Dashboard = () => {
  const [agents, setAgents] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [showGhosts, setShowGhosts] = useState(false);
  
  const [presentationMode, setPresentationMode] = useState(false);
  const [trustScore, setTrustScore] = useState(100);
  const [decisions, setDecisions] = useState([]);
  const [envData, setEnvData] = useState({ gates: [], obstacles: [] });

  useEffect(() => {
    socket.on('simulation_state', (data) => setAgents(data));
    socket.on('predictive_heatmap', (data) => setHeatmap(data));
    socket.on('presentation_mode', (mode) => setPresentationMode(mode));
    socket.on('env_data', (data) => setEnvData(data));
    
    socket.on('intelligence_feed', (data) => {
        setTrustScore(data.trustScore);
        setDecisions(prev => {
            const newLog = [...data.decisions, ...prev];
            return newLog.slice(0, 8);
        });
    });

    socket.on('intelligence_feed_alert', (data) => {
        setDecisions(prev => [data.decision, ...prev].slice(0, 8));
    });

    return () => {
      socket.off('simulation_state');
      socket.off('predictive_heatmap');
      socket.off('presentation_mode');
      socket.off('env_data');
      socket.off('intelligence_feed');
      socket.off('intelligence_feed_alert');
    };
  }, []);

  const handlePresentation = () => {
     socket.emit('start_presentation');
  };
  
  const handleReset = () => {
     socket.emit('reset_goals');
  }

  return (
    <div className="min-h-screen bg-cyber-bg p-6 text-gray-200 overflow-hidden font-sans">
      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <Activity className="w-8 h-8 text-cyber-accent" />
          <h1 className="text-3xl font-bold tracking-wider text-white">AI SWARM <span className="text-cyber-accent">DYNAMICS</span></h1>
        </div>

        <div className="flex gap-4">
          <button 
             onClick={() => setShowGhosts(!showGhosts)}
             className={`px-4 py-2 rounded font-medium flex items-center gap-2 border transition-all ${
               showGhosts ? 'bg-cyber-predictive/20 border-cyber-predictive text-white' : 'border-gray-700 hover:border-gray-500'
             }`}
          >
            <Crosshair className="w-4 h-4" />
            T+5 Predictor
          </button>
          
          <button 
             onClick={handlePresentation}
             className="px-6 py-2 rounded font-bold bg-cyber-accent/10 text-cyber-accent border border-cyber-accent shadow-[0_0_15px_#00f0ff] hover:bg-cyber-accent hover:text-black transition-all uppercase tracking-widest flex items-center gap-2"
          >
            <Expand className="w-4 h-4" />
            Start Presentation
          </button>

          <button 
             onClick={handleReset}
             className="px-4 py-2 rounded font-medium bg-gray-800 text-gray-400 border border-gray-600 hover:text-white transition-all uppercase flex items-center gap-2"
          >
            <PowerOff className="w-4 h-4" />
            Reset State
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[800px]">
        {/* LEFT PANEL - STATS */}
        <div className="col-span-1 flex flex-col gap-6">
          <motion.div 
            className="bg-cyber-panel p-6 rounded-lg border border-gray-800/80 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-3 mb-4 text-gray-400">
              <Users className="w-5 h-5 text-cyber-accent" />
              <h2 className="text-lg uppercase tracking-wide cursor-default">Live Agents</h2>
            </div>
            <p className={`text-5xl font-bold transition-colors ${presentationMode && agents.length > 5000 ? 'text-cyber-alert' : 'text-white'}`}>{agents.length}</p>
            <p className="text-sm mt-2 text-gray-500">Volatile Stream @ ~60 FPS</p>
          </motion.div>
          
          <div className="bg-cyber-panel p-6 rounded-lg border border-gray-800 flex-grow flex flex-col">
             <div className="flex items-center gap-3 mb-4 text-gray-400">
                <ShieldCheck className={`w-5 h-5 ${trustScore < 80 ? 'text-cyber-alert' : 'text-green-500'}`} />
                <h2 className="text-lg uppercase tracking-wide cursor-default">System Trust</h2>
             </div>
             
             <div className="flex items-end gap-2 mb-6">
                 <p className={`text-5xl font-bold transition-colors ${trustScore < 80 ? 'text-cyber-alert' : 'text-green-400'}`}>
                     {trustScore}%
                 </p>
                 <p className="text-gray-500 pb-1">Compliance Rate</p>
             </div>
             
             <div className="w-full bg-gray-900 rounded-full h-3 mb-8 border border-gray-700">
                <div 
                  className={`h-3 rounded-full transition-all duration-1000 ${trustScore < 80 ? 'bg-cyber-alert scale-x-105' : 'bg-green-500'}`} 
                  style={{ width: `${trustScore}%` }}
                ></div>
             </div>
          </div>
        </div>

        {/* Viewport Canvas Center */}
        <div className="col-span-1 lg:col-span-3 h-[800px] relative overflow-hidden rounded-lg">
          <CanvasEngine agents={agents} heatmap={showGhosts ? heatmap : []} presentationMode={presentationMode} envData={envData} />
        </div>
        
        {/* RIGHT PANEL - EXPLAINABILITY HUD */}
        <div className="col-span-1 flex flex-col h-full right-panel-hud">
           <div className="bg-cyber-panel/90 backdrop-blur-xl p-6 rounded-lg border border-cyber-accent/30 flex-grow overflow-hidden flex flex-col shadow-[0_0_15px_rgba(0,240,255,0.05)]">
             <div className="flex items-center gap-3 mb-6 text-cyber-accent border-b border-cyber-accent/20 pb-4">
               <AlertTriangle className="w-5 h-5" />
               <h2 className="text-lg uppercase tracking-widest font-bold">Explainability</h2>
             </div>
             
             {/* Live Feed Container */}
             <div className="flex-grow flex flex-col gap-3 overflow-hidden mt-1">
                <AnimatePresence>
                    {decisions.map((decision, i) => {
                        const isCritical = decision.includes('[CRITICAL]');
                        return (
                          <motion.div 
                           key={decision + i}
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           className={`p-3 rounded text-sm font-mono border-l-2 bg-gray-900/50 ${
                             isCritical ? 'border-cyber-alert text-cyber-alert font-bold bg-cyber-alert/10 shadow-[0_0_10px_#ff0055]' : 'border-cyber-accent text-gray-300'
                           }`}
                          >
                              <span className="text-[10px] opacity-70 block mb-1 uppercase tracking-wider">{isCritical ? 'AI_OVERRIDE_LOG' : 'SYS.AI_LOG'}</span>
                              {decision}
                          </motion.div>
                        );
                    })}
                </AnimatePresence>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
