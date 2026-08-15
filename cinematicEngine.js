/**
 * Fullscreen Cinematic Canvas Engine
 * Pure 4K UHD renderer preserving 16:9 composition and 100% untampered visual artwork.
 */
export class CinematicEngine {
  constructor(canvasElement, frameLoader) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true });
    this.frameLoader = frameLoader;

    // Timeline state
    this.currentFrame = 0;
    this.targetFrame = 0;
    this.lastRenderedFrame = -1;
    // Use full native devicePixelRatio for 4K UHD display fidelity
    this.dpr = window.devicePixelRatio || 1;

    // Canvas size
    this.width = 0;
    this.height = 0;

    this.initCanvas();
    this.setupScrollController();
    this.startRenderLoop();
  }

  initCanvas() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = window.devicePixelRatio || 1;

    // Set CSS display size
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Set full 4K render buffer size using DPR
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    // Initial fill black
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Force re-render
    this.lastRenderedFrame = -1;
  }

  setupScrollController() {
    const updateScrollProgress = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, scrollY / maxScroll));

      // Map progress (0.0 to 1.0) directly across 385 frame sequence (0 to totalFrames - 1)
      this.targetFrame = progress * (this.frameLoader.totalFrames - 1);
    };

    // Listen to scroll and resize events
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', () => {
      this.initCanvas();
      updateScrollProgress();
    }, { passive: true });

    // Wheel listener for instant response
    window.addEventListener('wheel', (e) => {
      if (document.documentElement.scrollHeight > window.innerHeight) {
        window.scrollBy({ top: e.deltaY, behavior: 'instant' });
      }
    }, { passive: true });

    // Touch listeners
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        touchStartY = touchY;
        window.scrollBy({ top: deltaY, behavior: 'instant' });
      }
    }, { passive: true });

    updateScrollProgress();
  }

  startRenderLoop() {
    const render = () => {
      // Butter-smooth lerp towards target frame
      const diff = this.targetFrame - this.currentFrame;
      
      if (Math.abs(diff) > 0.0001) {
        this.currentFrame += diff * 0.25;
      } else {
        this.currentFrame = this.targetFrame;
      }

      const frameIndex = Math.round(this.currentFrame);

      if (frameIndex !== this.lastRenderedFrame || Math.abs(diff) > 0.001) {
        this.renderFrame(frameIndex);
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  renderFrame(frameIndex, force = false) {
    const img = this.frameLoader.getFrameOrNearest(frameIndex);

    if (!img || !img.complete || img.naturalWidth === 0) {
      return;
    }

    this.lastRenderedFrame = frameIndex;

    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;

    // Pure 16:9 composition using high-quality object-fit cover scaling
    const scale = Math.max(canvasW / imgW, canvasH / imgH);

    const scaledW = imgW * scale;
    const scaledH = imgH * scale;

    // Center 16:9 composition in viewport
    const x = (canvasW - scaledW) / 2;
    const y = (canvasH - scaledH) / 2;

    // Maximum fidelity image smoothing
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    // Clear background to pure black
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, canvasW, canvasH);

    // Render 4K frame image to canvas
    this.ctx.drawImage(img, x, y, scaledW, scaledH);
  }
}
