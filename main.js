import { FrameLoader } from './frameLoader.js';
import { CinematicEngine } from './cinematicEngine.js';

document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('cinematic-canvas');
  if (!canvas) return;

  // Total continuous frame timeline: 300 (Part 1) + 50 (Part 2) + 35 (Part 3) = 385 frames
  const TOTAL_FRAMES = 385;

  const frameLoader = new FrameLoader(TOTAL_FRAMES);

  // Initialize frame loader with initial priority batch of 30 frames
  frameLoader.onInitialReadyCallback = () => {
    // Instantiate fullscreen cinematic canvas rendering engine
    const engine = new CinematicEngine(canvas, frameLoader);
    // Initial draw frame 0 immediately
    engine.renderFrame(0, true);
  };

  // Start initialization
  await frameLoader.init(30);
});
