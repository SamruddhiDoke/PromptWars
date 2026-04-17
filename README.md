# AI-Driven Swarm Intelligence & Crowd Dynamics

A high-performance simulation engine for modeling swarm intelligence and analyzing infrastructural bottlenecks in real time.

Built on a Node.js computational layer that feeds live analytics into a lock-step React and HTML5 Canvas frontend.

## Features

*   **High-Density Agent Simulation:** Optimized via an `O(N)` Spatial Hash index, ensuring an efficient server loop that processes multi-goal target mapping and hardware-level bounds collision physics for up to 17,000 concurrent agents.
*   **Dynamic Architectural Failure Modeling:** Simulates extreme density chokepoints and physical architectural shifts (e.g., gate blockages, emergency evacuations), triggering massive localized repulsion vectors.
*   **Mathematical System Compliance:** Derives live, percentage-based system trust scoring by utilizing `Dot Product (V1 • V2)` trajectory analysis against assigned goals.
*   **Explainability Analytics via Vertex AI:** Integrates with Google Cloud's Gemini-1.5-Flash. The system systematically feeds structural coordinates to the LLM and streams tactical predictive forecasts directly to the user dashboard.
*   **Spatial Heatmap Profiling:** Analyzes agent density via an overlayed radial opacity matrix rendered directly inside the Canvas buffer for real-time visualization of structural chokepoints.

## Technical Architecture

*   **Backend:** Node.js, Express.js, Socket.IO
*   **Frontend:** React, Vite, HTML5 Canvas `requestAnimationFrame`, TailwindCSS v4, Framer Motion
*   **AI Integration:** Google Cloud Vertex AI SDK
*   **Deployment:** Containerized and configured for Google Cloud Run via Buildpacks

## Usage Instructions

This application serves both the simulation loop and the front-end view under a single monolithic host.

1.  Ensure local `.env` is populated with relevant Vertex AI credentials if testing locally outside Application Default Credentials.
2.  Install dependencies: `npm install`
3.  Start the application server: `npm start`
4.  The React dashboard is pre-compiled and served statically via `/server/public`. Access the interface at `http://localhost:8080/`.

## Automated Presentation Demo

Initiating the simulated presentation mode executes a predefined infrastructure crisis sequence:
*   **T=0:** Caps lifted; generates thousands of agents mapping towards the primary goal (Gate A).
*   **T=5s:** Simulates a mechanical failure at Gate A, initiating localized repulsion grids.
*   **T=6s+:** The intelligence engine identifies the blockage and dynamically reroutes agent vectors around central structural anomalies to open corridors, recalculating compliance metrics in real-time.
