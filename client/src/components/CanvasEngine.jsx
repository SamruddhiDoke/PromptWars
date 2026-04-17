import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const CanvasEngine = ({ showGhosts, isBlurMode }) => {
  const canvasRef = useRef(null);
  const bufferRef = useRef(new Float32Array(0));
  const ghostRef = useRef([]);
  const envRef = useRef({ gates: [], obstacles: [], dangerZones: [], sensors: [] });

  useEffect(() => {
    // Dynamic host binding for serverless Google Cloud Run
    const socket = io({ transports: ['websocket'] });

    socket.on('env_data', (data) => {
      envRef.current = data;
    });

    socket.on('simulation_state_binary', (buffer) => {
      bufferRef.current = new Float32Array(buffer);
    });

    socket.on('predictive_heatmap', (heatmapData) => {
      if (showGhosts) {
        ghostRef.current = heatmapData;
      } else {
        ghostRef.current = [];
      }
    });

    return () => socket.disconnect();
  }, [showGhosts]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    let animationFrameId;

    const render = () => {
      // Fluid Trailing Effect -> Cyber Blue Theme
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const env = envRef.current;

      // Render Structural Gates
      env.gates.forEach(g => {
        ctx.fillStyle = g.status === 'open' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.3)';
        ctx.fillRect(g.x, g.y - g.height/2, g.width, g.height);
        ctx.strokeStyle = g.status === 'open' ? '#34d399' : '#f87171';
        ctx.lineWidth = 2;
        ctx.strokeRect(g.x, g.y - g.height/2, g.width, g.height);
      });

      // Render Central Obstacles
      env.obstacles.forEach(obs => {
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#334155';
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.stroke();
      });

      // Render Danger Zones (Pulsing Red)
      const pulse = Math.abs(Math.sin(Date.now() / 300));
      env.dangerZones?.forEach(dz => {
         const gradient = ctx.createRadialGradient(dz.x, dz.y, 0, dz.x, dz.y, dz.radius);
         gradient.addColorStop(0, `rgba(220, 38, 38, ${0.4 + pulse * 0.2})`);
         gradient.addColorStop(1, 'rgba(220, 38, 38, 0)');
         ctx.beginPath();
         ctx.arc(dz.x, dz.y, dz.radius, 0, Math.PI * 2);
         ctx.fillStyle = gradient;
         ctx.fill();
      });

      // Render IoT Sensor Nodes
      env.sensors?.forEach(sn => {
         ctx.beginPath();
         // Simulate checking overlapping density dynamically on client side for visual flair
         let localDensity = 0;
         const agents = bufferRef.current;
         for(let i=0; i<agents.length; i+=2) {
             let dx = agents[i] - sn.x;
             let dy = agents[i+1] - sn.y;
             if(Math.hypot(dx, dy) < 80) localDensity++;
         }
         
         const isCritical = localDensity > 120; // 80% density proxy
         ctx.arc(sn.x, sn.y, isCritical ? 10 : 6, 0, Math.PI * 2);
         ctx.fillStyle = isCritical ? '#ef4444' : '#22d3ee';
         ctx.fill();
         
         // Radar ping
         ctx.beginPath();
         ctx.arc(sn.x, sn.y, 25 + (pulse * (isCritical ? 15 : 5)), 0, Math.PI * 2);
         ctx.strokeStyle = isCritical ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 211, 238, 0.3)';
         ctx.stroke();
      });

      // Render Heatmap T+5 (Prediction overlay)
      if (showGhosts) {
        ghostRef.current.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 30, 0, Math.PI * 2);
          const heatOpacity = Math.min(point.intensity * 0.8, 0.8);
          ctx.fillStyle = `rgba(245, 158, 11, ${heatOpacity})`; // Orange ghosting
          ctx.fill();
        });
      }

      // Render Agent Buffer natively (Extremely fast Float32Array loop)
      const agents = bufferRef.current;
      
      // Toggle WebGL-style composite blur for aesthetic Density mapping
      if(isBlurMode) {
          ctx.globalCompositeOperation = 'screen';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#22d3ee';
      }

      ctx.fillStyle = '#67e8f9';
      for (let i = 0; i < agents.length; i += 2) {
        ctx.fillRect(agents[i], agents[i+1], 2, 2);
      }
      
      if(isBlurMode) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [showGhosts, isBlurMode]);

  return (
    <div className="relative w-full h-full bg-[#0f172a] rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        className="w-full h-full object-contain"
        aria-label="High-Stakes Crisis Simulation Viewport"
      />
    </div>
  );
};

export default CanvasEngine;
