/**
 * Universal Sound Manager with Random Sound Selection
 * Handles click sound effects across all pages with variety
 * Randomly selects from multiple sound sprites for each click
 * Usage: import { soundManager } from './js/sound.js'
 */

class SoundManager {
  constructor() {
    this.clickSounds = [];
    this.availableSounds = [
      'sprite/audiomass-output 1.wav', 
      'sprite/audiomass-output 2.wav'
    ];
    this.isEnabled = true;
    this.volume = 0.3;
    this.isInitialized = false;
    this.loadedSounds = 0;
    this.initSounds();
  }

  async initSounds() {
    try {
      console.log('🎵 Loading random click sounds...');
      
      // Load all available sounds
      const loadPromises = this.availableSounds.map(async (soundPath, index) => {
        try {
          const audio = new Audio(soundPath);
          audio.volume = this.volume;
          audio.preload = 'auto';
          
          await new Promise((resolve, reject) => {
            audio.addEventListener('canplaythrough', resolve, { once: true });
            audio.addEventListener('error', reject, { once: true });
            audio.load();
          });
          
          this.clickSounds.push(audio);
          this.loadedSounds++;
          console.log(`✅ Sound ${index + 1}/${this.availableSounds.length} loaded: ${soundPath.split('/').pop()}`);
          
        } catch (error) {
          console.warn(`⚠️ Could not load sound: ${soundPath}`, error);
        }
      });
      
      await Promise.allSettled(loadPromises);
      
      if (this.clickSounds.length > 0) {
        this.isInitialized = true;
        console.log(`🎉 Sound system ready! ${this.clickSounds.length} sounds available for random playback`);
      } else {
        console.error('❌ No sounds could be loaded');
        this.isEnabled = false;
      }
    } catch (error) {
      console.warn('⚠️ Could not initialize sound system:', error);
      this.isEnabled = false;
    }
  }

  playClick() {
    if (!this.isEnabled || this.clickSounds.length === 0 || !this.isInitialized) return;
    
    try {
      // Randomly select a sound from the loaded sounds
      const randomIndex = Math.floor(Math.random() * this.clickSounds.length);
      const selectedSound = this.clickSounds[randomIndex];
      
      // Reset to start and play
      selectedSound.currentTime = 0;
      selectedSound.play().catch(e => {
        // Handle autoplay policy restrictions silently
        console.debug('Audio play blocked by browser policy:', e);
      });
      
      // Optional: Log which sound was played (for debugging - disable in production)
      // console.debug(`🔊 Playing sound ${randomIndex + 1}/${this.clickSounds.length}`);
      
    } catch (error) {
      console.debug('Error playing click sound:', error);
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    // Apply volume to all loaded sounds
    this.clickSounds.forEach(sound => {
      if (sound) {
        sound.volume = this.volume;
      }
    });
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  // Helper method to add click sound to any element
  addToElement(element) {
    if (element) {
      element.addEventListener('click', () => {
        this.playClick();
      });
    }
  }

  // Helper method to add throttled sound to sliders
  addToSlider(slider, throttleMs = 100) {
    if (!slider) return;
    
    let lastSoundTime = 0;
    slider.addEventListener('input', () => {
      const now = Date.now();
      if (now - lastSoundTime > throttleMs) {
        this.playClick();
        lastSoundTime = now;
      }
    });
  }

  // Get information about loaded sounds
  getSoundInfo() {
    return {
      totalSounds: this.clickSounds.length,
      availablePaths: this.availableSounds,
      isEnabled: this.isEnabled,
      isInitialized: this.isInitialized,
      volume: this.volume
    };
  }

  // Add a new sound dynamically (for future expansion)
  async addSound(soundPath) {
    try {
      const audio = new Audio(soundPath);
      audio.volume = this.volume;
      audio.preload = 'auto';
      
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', reject, { once: true });
        audio.load();
      });
      
      this.clickSounds.push(audio);
      this.availableSounds.push(soundPath);
      console.log(`✅ New sound added: ${soundPath.split('/').pop()}`);
      return true;
    } catch (error) {
      console.warn(`⚠️ Could not add sound: ${soundPath}`, error);
      return false;
    }
  }
}

// Create and export singleton instance
export const soundManager = new SoundManager();

// For non-module usage (fallback)
if (typeof window !== 'undefined') {
  window.KaoSoundManager = soundManager;
}