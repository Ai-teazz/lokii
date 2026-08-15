/**
 * High-Performance Intelligent Frame Sequence Loader
 * Handles 235 continuous WebP frames across 3 source ZIP sequences.
 */
export class FrameLoader {
  constructor(totalFrames = 235) {
    this.totalFrames = totalFrames;
    this.images = new Array(totalFrames);
    this.loadingPromises = new Map();
    this.loadedCount = 0;
    this.onProgressCallback = null;
    this.onInitialReadyCallback = null;
    this.isInitialReady = false;
  }

  getFramePath(index) {
    // index is 0-based, files are frame_001.webp .. frame_235.webp
    const frameNum = String(index + 1).padStart(3, '0');
    return `./frames/frame_${frameNum}.webp`;
  }

  // Preload priority frames around current frame index, then load remaining
  async init(initialBatchSize = 30) {
    // 1. Load initial frames first to start experience immediately
    const initialPromises = [];
    for (let i = 0; i < Math.min(initialBatchSize, this.totalFrames); i++) {
      initialPromises.push(this.loadFrame(i));
    }
    
    await Promise.all(initialPromises);
    this.isInitialReady = true;
    if (this.onInitialReadyCallback) {
      this.onInitialReadyCallback();
    }

    // 2. Start progressive preloading for all remaining frames in background
    this.preloadRemaining();
  }

  loadFrame(index) {
    if (index < 0 || index >= this.totalFrames) return Promise.resolve(null);
    if (this.images[index]) return Promise.resolve(this.images[index]);
    if (this.loadingPromises.has(index)) return this.loadingPromises.get(index);

    const promise = new Promise((resolve) => {
      const img = new Image();
      img.src = this.getFramePath(index);
      
      const onDone = () => {
        this.images[index] = img;
        this.loadedCount++;
        this.loadingPromises.delete(index);
        if (this.onProgressCallback) {
          this.onProgressCallback(this.loadedCount, this.totalFrames);
        }
        resolve(img);
      };

      img.onload = onDone;
      img.onerror = () => {
        console.warn(`Frame failed to load: ${this.getFramePath(index)}`);
        // Fallback placeholder or retry logic
        this.loadingPromises.delete(index);
        resolve(null);
      };

      // Use decode() for off-thread GPU decoding if supported
      if ('decode' in img) {
        img.decode().then(onDone).catch(() => onDone());
      }
    });

    this.loadingPromises.set(index, promise);
    return promise;
  }

  // Prioritize loading frames in a window around current index when scrubbing fast
  prioritizeRange(centerIndex, radius = 20) {
    const start = Math.max(0, centerIndex - 10);
    const end = Math.min(this.totalFrames - 1, centerIndex + radius);

    for (let i = start; i <= end; i++) {
      if (!this.images[i]) {
        this.loadFrame(i);
      }
    }
  }

  async preloadRemaining() {
    // Load remaining frames sequentially with low priority to prevent main thread blocking
    for (let i = 0; i < this.totalFrames; i++) {
      if (!this.images[i]) {
        await this.loadFrame(i);
        // Small yield for smooth UI frame rate during preloading
        if (i % 5 === 0) {
          await new Promise((r) => setTimeout(r, 16));
        }
      }
    }
  }

  // Returns exact image if loaded, or nearest loaded image to eliminate blank/flashing frames
  getFrameOrNearest(index) {
    const clampedIndex = Math.max(0, Math.min(this.totalFrames - 1, Math.round(index)));
    
    if (this.images[clampedIndex] && this.images[clampedIndex].complete) {
      return this.images[clampedIndex];
    }

    // Trigger loading of target frame and surrounding frames
    this.prioritizeRange(clampedIndex);

    // Search outwards for nearest loaded frame
    for (let offset = 1; offset < 30; offset++) {
      const prev = clampedIndex - offset;
      if (prev >= 0 && this.images[prev] && this.images[prev].complete) {
        return this.images[prev];
      }
      const next = clampedIndex + offset;
      if (next < this.totalFrames && this.images[next] && this.images[next].complete) {
        return this.images[next];
      }
    }

    return null;
  }
}
