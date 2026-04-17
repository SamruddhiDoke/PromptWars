const { VertexAI } = require('@google-cloud/vertexai');

class PredictiveEngine {
  constructor(bounds, resolution = 30) {
    this.bounds = bounds;
    this.resolution = resolution;
    this.projectionSteps = 150; 
    
    try {
      this.vertex_ai = new VertexAI({project: 'swarmapp-493606', location: 'us-central1'});
      this.generativeModel = this.vertex_ai.preview.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { maxOutputTokens: 256, temperature: 0.2 },
      });
    } catch(e) {
      console.log('Vertex AI Config error. Running in offline mode.', e.message);
    }
  }

  generateGhostHeatmap(agents) {
    const densityMap = new Map();

    for (let i = 0; i < agents.length; i++) {
      let a = agents[i];
      let projX = a.x + a.vx * this.projectionSteps;
      let projY = a.y + a.vy * this.projectionSteps;
      
      projX = Math.max(0, Math.min(projX, this.bounds.width));
      projY = Math.max(0, Math.min(projY, this.bounds.height));
      
      const col = Math.floor(projX / this.resolution);
      const row = Math.floor(projY / this.resolution);
      const key = `${col},${row}`;
      
      let val = densityMap.get(key) || 0;
      densityMap.set(key, val + 1);
    }

    const projectedPoints = [];
    let maxDensity = 1;
    for (const val of densityMap.values()) {
        if(val > maxDensity) maxDensity = val;
    }

    for (let [key, val] of densityMap.entries()) {
      if(val < 3) continue; 
      const [col, row] = key.split(',').map(Number);
      const intensity = val / maxDensity; 
      projectedPoints.push({
        x: col * this.resolution + (this.resolution / 2),
        y: row * this.resolution + (this.resolution / 2),
        intensity
      });
    }
    
    return projectedPoints;
  }

  async predictCrowdFlowWithAI(agentCount, trustScore) {
    if (!this.generativeModel) return "[VERTEX-AI] Offline Context Mode enabled.";
    
    const prompt = `You are a live Swarm AI routing system. The crowd density is currently ${agentCount} agents. Real-time path compliance is ${trustScore}%. Provide a 1-sentence tactical analytical forecast on potential bottleneck formations or system reactions in the next 5 minutes. Prefix response exactly with "[VERTEX-AI]". Keep it urgent, realistic, and strictly under 25 words.`;
    
    try {
       const resp = await this.generativeModel.generateContent(prompt);
       if(resp && resp.response && resp.response.candidates) {
         return resp.response.candidates[0].content.parts[0].text.trim();
       }
       return "[VERTEX-AI] Telemetry empty.";
     } catch (e) {
       console.error("Vertex AI Generation Error:", e.message);
       return `[VERTEX-AI] GCloud authentication or quota failure avoiding backend panic.`;
     }
  }
}

module.exports = PredictiveEngine;
