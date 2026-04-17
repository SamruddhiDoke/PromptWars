import React, { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * CanvasEngine - Industrial-Glass Edition
 * High-performance rendering for 20,000 agents with Future-Sight overlays.
 */
const CanvasEngine = ({ showFutureSight }) => {
  const canvasRef = useRef(null);
  const bufferRef = useRef(new Float32Array(0));
  const heatRef = useRef([]);
  const envRef = useRef({ gates: [], obstacles: [] });

  useEffect(() => {
    const socket = io({ transports: ['websocket'] });

    socket.on('env_data', (data) => { envRef.current = data; });
    socket.on('simulation_state_binary', (buffer) => { bufferRef.current = new Float32Array(buffer); });
    socket.on('predictive_heatmap', (data) => { heatRef.current = data; });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    let animationId;

    const render = () => {
      // Background: Industrial Slate-900
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid Lines (Subtle Wireframe)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 100) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 100) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      const env = envRef.current;

      // Future-Sight Projections (T+120 Prediction Layer)
      if (showFutureSight) {
        ctx.globalAlpha = 0.4;
        heatRef.current.forEach(pt => {
          const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 40);
          grad.addColorStop(0, `rgba(239, 68, 68, ${pt.intensity})`);
          grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(pt.x, pt.y, 40, 0, Math.PI * 2); ctx.fill();
          
          // Anomaly Marker
          if (pt.intensity > 0.8) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 50, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);
          }
        });
        ctx.globalAlpha = 1.0;
      }

      // Static Infrastructure
      env.obstacles.forEach(o => {
        ctx.fillStyle = '#334155';
        ctx.beginPath(); ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      env.gates.forEach(g => {
        ctx.fillStyle = g.status === 'open' ? 'rgba(71, 85, 105, 0.4)' : 'rgba(220, 38, 38, 0.2)';
        ctx.fillRect(g.x, g.y - g.height/2, g.width, g.height);
        ctx.strokeStyle = g.status === 'open' ? '#94a3b8' : '#ef4444';
        ctx.strokeRect(g.x, g.y - g.height/2, g.width, g.height);
      });

      // Swarm: Monochrome Precision (White-Cyan)
      const agents = bufferRef.current;
      ctx.fillStyle = '#f8fafc';
      for (let i = 0; i < agents.length; i += 2) {
        ctx.fillRect(agents[i], agents[i+1], 1.8, 1.8);
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [showFutureSight]);

  return (
    <div className="w-full h-full bg-[#0f172a] rounded shadow-inner border border-slate-800">
      <canvas ref={canvasRef} width={1200} height={800} className="w-full h-full object-contain" />
    </div>
  );
};

export default CanvasEngine;
