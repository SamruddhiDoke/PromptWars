import React, { useRef, useEffect } from 'react';

const CanvasEngine = ({ agents, heatmap, presentationMode, envData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      // Background and Trailing Effect
      ctx.fillStyle = 'rgba(10, 10, 15, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Simple camera shift if needed (currently we just draw environment normally to see everything)
      
      // Draw Obstacles (Central Pillar)
      if (envData?.obstacles) {
        envData.obstacles.forEach((obs, idx) => {
            // First obstacle is gray pillar, subsequent are repulsion zones (invisible or slight red)
            if (idx === 0) {
               ctx.beginPath();
               ctx.arc(obs.x, obs.y, obs.radius, 0, 2 * Math.PI);
               ctx.fillStyle = '#22222a';
               ctx.fill();
               ctx.lineWidth = 2;
               ctx.strokeStyle = '#444450';
               ctx.stroke();
            } else {
               // Render Gate A repulsion zone faintly
               ctx.beginPath();
               ctx.arc(obs.x, obs.y, obs.radius, 0, 2 * Math.PI);
               ctx.fillStyle = 'rgba(255, 0, 85, 0.05)';
               ctx.fill();
               ctx.setLineDash([5, 15]);
               ctx.strokeStyle = 'rgba(255, 0, 85, 0.4)';
               ctx.lineWidth = 1;
               ctx.stroke();
               ctx.setLineDash([]);
            }
        });
      }

      // Draw Exit Gates
      if (envData?.gates) {
        envData.gates.forEach(gate => {
            const isOpen = gate.status === 'open';
            ctx.fillStyle = isOpen ? 'rgba(0, 255, 100, 0.8)' : 'rgba(255, 0, 50, 0.8)';
            ctx.shadowBlur = 30;
            ctx.shadowColor = isOpen ? '#00ff64' : '#ff0032';
            ctx.fillRect(gate.x, gate.y - gate.height/2, gate.width, gate.height);
            ctx.shadowBlur = 0; // reset
            
            // Draw text over gate
            ctx.fillStyle = 'white';
            ctx.font = '12px Courier New';
            ctx.fillText(gate.id, gate.x - 40, gate.y);
        });
      }

      // Ghost Heatmap (T+5 Predictor)
      if (heatmap && heatmap.length > 0) {
        heatmap.forEach(pt => {
           ctx.beginPath();
           ctx.arc(pt.x, pt.y, 15, 0, 2 * Math.PI);
           ctx.fillStyle = `rgba(176, 0, 255, ${pt.intensity * 0.5})`;
           ctx.fill();
        });
      }

      if (agents && agents.length > 0) {
        const len = agents.length;
        
        // 1. VISUAL DENSITY HEATMAP LAYER
        // Draw faint overlapping bounds to create intense orange/red core in bottlenecks
        ctx.fillStyle = 'rgba(255, 40, 0, 0.015)';
        for (let i = 0; i < len; i++) {
          const a = agents[i];
          ctx.beginPath();
          ctx.arc(a[0], a[1], 12, 0, 2 * Math.PI);
          ctx.fill();
        }

        // 2. AGENT CORES LAYER
        ctx.fillStyle = '#00f0ff';
        for (let i = 0; i < len; i++) {
          const a = agents[i];
          ctx.beginPath();
          ctx.arc(a[0], a[1], 1.2, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      ctx.restore();
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [agents, heatmap, presentationMode, envData]);

  return (
    <canvas 
      ref={canvasRef} 
      width={1200} 
      height={800} 
      className="w-full h-full rounded-lg border border-cyber-accent/20 shadow-[0_0_20px_rgba(0,240,255,0.1)] bg-cyber-panel transition-all"
    />
  );
};

export default CanvasEngine;
