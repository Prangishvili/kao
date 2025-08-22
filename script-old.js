// Import Three.js modules
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// Sound System
class SoundManager {
  constructor() {
    this.clickSound = null;
    this.isEnabled = true;
    this.volume = 0.3;
    this.initSound();
  }

  async initSound() {
    try {
      this.clickSound = new Audio('sprite/421426__jaszunio15__click_136.wav');
      this.clickSound.volume = this.volume;
      this.clickSound.preload = 'auto';
      
      // Preload the audio
      await this.clickSound.load();
      console.log('Click sound loaded successfully');
    } catch (error) {
      console.warn('Could not load click sound:', error);
      this.isEnabled = false;
    }
  }

  playClick() {
    if (!this.isEnabled || !this.clickSound) return;
    
    try {
      // Reset to start and play
      this.clickSound.currentTime = 0;
      this.clickSound.play().catch(e => {
        // Handle autoplay policy restrictions silently
        console.debug('Audio play blocked:', e);
      });
    } catch (error) {
      console.debug('Error playing click sound:', error);
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.clickSound) {
      this.clickSound.volume = this.volume;
    }
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }
}

// Global sound manager instance
const soundManager = new SoundManager();

// Helper function to add click sound to elements
function addClickSound(element) {
  if (element) {
    element.addEventListener('click', () => {
      soundManager.playClick();
    });
  }
}

// Helper function to add subtle sound to sliders (less frequent)
function addSliderSound(slider) {
  if (slider) {
    let lastSoundTime = 0;
    const soundThrottle = 100; // milliseconds
    
    slider.addEventListener('input', () => {
      const now = Date.now();
      if (now - lastSoundTime > soundThrottle) {
        soundManager.playClick();
        lastSoundTime = now;
      }
    });
  }
}

// Three.js 3D Model Setup
let scene, camera, renderer, model;
let isRotating = true; // Control auto-rotation
let isDragging = false; // Track drag state
let previousMouseX = 0;
let rotationSpeed = 0.2 * Math.PI / (15 * 60); // 15 seconds for full rotation at 60fps
let modelLoaded = false;

// Mouse tracking and raycasting
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let mouseInfo = null;



// Default configuration based on provided state
const defaultConfig = {
  camera: {
    x: -0.2,
    y: -0.4,
    z: 2.6
  },
  model: {
    position: {
      x: -0.18703900842885765,
      y: -2.270413711585426,
      z: -5.0
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0
    },
    scale: 0.5940867060536089
  }
};

// Store original values for reset functionality
let originalModelPosition = { ...defaultConfig.model.position };
let originalModelScale = defaultConfig.model.scale;

function startLoadingAnimation() {
  // Step 1: Split text into words
  const el = document.getElementById('loader-text');
  const words = el.textContent.trim().split(' ');
  el.innerHTML = words.map(word => `<span class="word">${word}</span>`).join(' ');

  // Step 2: Animate each word, then transition to 3D view
  anime.timeline()
    .add({
      targets: '.word',
      translateY: [50, 0],
      opacity: [0, 1],
      delay: anime.stagger(150),
      duration: 1000,
      easing: 'easeOutExpo'
    })
    .add({
      targets: '.loader',
      opacity: [1, 0],
      duration: 800,
      delay: 1000, // Wait 1 second after word animation completes
      easing: 'easeInExpo',
      complete: function() {
      }
    });
}

function completeTransition() {
  // Just fade out and hide the loader
  anime({
    targets: '.loader',
    opacity: 0,
    duration: 800,
    easing: 'easeInExpo',
    complete: function() {
      document.querySelector('.loader').style.display = 'none';
    }
  });
}

function createMouseInfo() {
  // Create mouse info display element
  mouseInfo = document.createElement('div');
  mouseInfo.id = 'mouse-info';
  mouseInfo.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 16px;
    border-radius: 10px;
    font-family: monospace;
    font-size: 11px;
    pointer-events: none;
    z-index: 9999;
    min-width: 280px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
  `;
  document.body.appendChild(mouseInfo);
}

function init3DModel() {
  const canvas = document.getElementById('threejs-canvas');
  
  // Enable pointer events on canvas
  canvas.style.pointerEvents = 'auto';
  
  // Create mouse info display
  createMouseInfo();
  
  // Use full viewport dimensions
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  
  // Create scene
  scene = new THREE.Scene();
  
  // Create camera with proper aspect ratio and default position
  camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);
  camera.position.set(defaultConfig.camera.x, defaultConfig.camera.y, defaultConfig.camera.z);
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    alpha: true, 
    antialias: true 
  });
  renderer.setSize(canvasWidth, canvasHeight);
  renderer.setClearColor(0x000000, 0); // Transparent background
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  

  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  // Setup DRACO loader for compressed models
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  
  // Load GLB model with DRACO support
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  
  loader.load('models/form.glb', function(gltf) {
    model = gltf.scene;
    
    // Apply default configuration
    model.position.set(
      defaultConfig.model.position.x,
      defaultConfig.model.position.y,
      defaultConfig.model.position.z
    );
    
    model.rotation.set(
      defaultConfig.model.rotation.x,
      defaultConfig.model.rotation.y,
      defaultConfig.model.rotation.z
    );
    
    const scale = defaultConfig.model.scale;
    model.scale.set(scale, scale, scale);
    
    // Store original values for reset
    originalModelPosition = { ...defaultConfig.model.position };
    originalModelScale = scale;
    
    // Enable shadows
    model.traverse(function(child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    scene.add(model);
    console.log('3D model loaded successfully');
    
    // Initialize controls after model is loaded
    initControls();
    initDragControls();
    animate3D();
    
    // Mark model as loaded and check if we should complete the transition
    modelLoaded = true;
    const loader = document.querySelector('.loader');
    if (loader.style.opacity === '0') {
      completeTransition();
    }
  }, function(progress) {
    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
  }, function(error) {
    console.error('Error loading model:', error);
  });
}

function updateMouseInfo(event, intersects) {
  if (!mouseInfo) return;
  
  const x = event.clientX;
  const y = event.clientY;
  
  let info = `🖱️ Mouse Position\n`;
  info += `Screen: (${x}, ${y})\n`;
  info += `NDC: (${mouse.x.toFixed(3)}, ${mouse.y.toFixed(3)})\n`;
  
  if (intersects.length > 0) {
    const intersection = intersects[0];
    const point = intersection.point;
    const meshName = intersection.object.name || 'Unnamed Mesh';
    const distance = intersection.distance.toFixed(3);
    
    // Get material info if available
    const material = intersection.object.material;
    const materialType = material ? material.type : 'Unknown';
    
    info += `\n✅ Model Intersection\n`;
    info += `━━━━━━━━━━━━━━━━━━━━\n`;
    info += `Mesh: ${meshName}\n`;
    info += `Material: ${materialType}\n`;
    info += `3D Point: (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})\n`;
    info += `Distance: ${distance} units\n`;
    
    if (intersection.face) {
      info += `Face: #${intersection.faceIndex}\n`;
      info += `UV: ${intersection.uv ? `(${intersection.uv.x.toFixed(3)}, ${intersection.uv.y.toFixed(3)})` : 'N/A'}\n`;
    }
    
    mouseInfo.style.background = 'rgba(0, 100, 0, 0.9)';
    mouseInfo.style.border = '1px solid rgba(0, 255, 0, 0.3)';
  } else {
    info += `\n❌ No intersection`;
    mouseInfo.style.background = 'rgba(0, 0, 0, 0.8)';
    mouseInfo.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  }
  
  mouseInfo.innerHTML = `<pre style="margin: 0; font-family: 'Monaco', 'Consolas', monospace;">${info}</pre>`;
  mouseInfo.style.display = 'block';
}

function initDragControls() {
  const canvas = document.getElementById('threejs-canvas');
  
  // Pointer down event
  canvas.addEventListener('pointerdown', (event) => {
    isDragging = true;
    previousMouseX = event.clientX;
  });
  
  // Pointer move event
  canvas.addEventListener('pointermove', (event) => {
    // Update mouse coordinates for raycasting
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Perform raycasting to detect model intersection
    if (camera && model) {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(model, true);
      updateMouseInfo(event, intersects);
    }
    
    // Handle rotation dragging
    if (!isDragging || !model) return;
    
    const deltaX = event.clientX - previousMouseX;
    model.rotation.y += deltaX * 0.01; // Adjust rotation sensitivity
    
    // Update rotation slider
    const rotationY = document.getElementById('rotationY');
    if (rotationY) {
      rotationY.value = model.rotation.y % (2 * Math.PI);
    }
    
    previousMouseX = event.clientX;
  });
  
  // Pointer up event
  canvas.addEventListener('pointerup', () => {
    isDragging = false;
  });
  
  // Pointer leave event
  canvas.addEventListener('pointerleave', () => {
    isDragging = false;
    if (mouseInfo) {
      mouseInfo.style.display = 'none';
    }
  });
  
  // Pointer enter event
  canvas.addEventListener('pointerenter', () => {
    if (mouseInfo) {
      mouseInfo.style.display = 'block';
    }
  });
}

function animate3D() {
  requestAnimationFrame(animate3D);
  
  if (model && isRotating && !isDragging) {
    // Continue rotation from current position when not dragging
    model.rotation.y += rotationSpeed;
    
    // Update rotation slider to match current rotation
    const rotationY = document.getElementById('rotationY');
    if (rotationY) {
      rotationY.value = model.rotation.y % (2 * Math.PI);
    }
  }
  
  renderer.render(scene, camera);
}

// State Management Functions
function getCurrentState() {
  return {
    version: "1.0",
    timestamp: new Date().toISOString(),
    camera: {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    },
    model: {
      position: {
        x: model ? model.position.x : 0,
        y: model ? model.position.y : 0,
        z: model ? model.position.z : 0
      },
      rotation: {
        x: model ? model.rotation.x : 0,
        y: model ? model.rotation.y : 0,
        z: model ? model.rotation.z : 0
      },
      scale: model ? model.scale.x : 1
    }
  };
}

function applyState(state) {
  if (!state || typeof state !== 'object') {
    throw new Error('Invalid state object');
  }

  // Apply camera position
  if (state.camera) {
    camera.position.set(
      state.camera.x || 0,
      state.camera.y || 0,
      state.camera.z || 2
    );
    
    // Update UI sliders
    document.getElementById('cameraX').value = state.camera.x || 0;
    document.getElementById('cameraY').value = state.camera.y || 0;
    document.getElementById('cameraZ').value = state.camera.z || 2;
  }

  // Apply model properties
  if (state.model && model) {
    // Position
    if (state.model.position) {
      model.position.set(
        state.model.position.x || 0,
        state.model.position.y || 0,
        state.model.position.z || 0
      );
      
      document.getElementById('modelX').value = state.model.position.x || 0;
      document.getElementById('modelY').value = state.model.position.y || 0;
      document.getElementById('modelZ').value = state.model.position.z || 0;
    }

    // Rotation
    if (state.model.rotation) {
      model.rotation.set(
        state.model.rotation.x || 0,
        state.model.rotation.y || 0,
        state.model.rotation.z || 0
      );
      
      document.getElementById('rotationX').value = state.model.rotation.x || 0;
      document.getElementById('rotationY').value = state.model.rotation.y || 0;
      document.getElementById('rotationZ').value = state.model.rotation.z || 0;
    }

    // Scale
    if (state.model.scale) {
      const scale = state.model.scale;
      model.scale.set(scale, scale, scale);
      document.getElementById('modelScale').value = scale;
    }
  }
}

function showButtonFeedback(button, type, message, duration = 2000) {
  const originalText = button.textContent;
  button.textContent = message;
  button.classList.add(type);
  
  setTimeout(() => {
    button.textContent = originalText;
    button.classList.remove(type);
  }, duration);
}

// Control Panel Functions
function initControls() {
  const controlPanel = document.getElementById('controlPanel');
  const controlToggle = document.getElementById('controlToggle');
  const toggleControls = document.getElementById('toggleControls');
  const resetControls = document.getElementById('resetControls');
  
  // Add rotation toggle button
  const rotationSection = document.createElement('div');
  rotationSection.className = 'control-section';
  rotationSection.innerHTML = `
    <h4>Auto Rotation</h4>
    <div class="control-group">
      <label class="toggle-label">
        <input type="checkbox" id="rotationToggle" checked>
        <span>Enable Auto-Rotate</span>
      </label>
    </div>
  `;
  
  // Insert rotation toggle before state management section
  const stateSection = controlPanel.querySelector('.control-section:nth-last-child(2)');
  controlPanel.insertBefore(rotationSection, stateSection);
  
  // Add rotation toggle event listener
  const rotationToggle = document.getElementById('rotationToggle');
  rotationToggle.addEventListener('change', (e) => {
    soundManager.playClick();
    isRotating = e.target.checked;
  });
  
  // State management elements
  const copyState = document.getElementById('copyState');
  const pasteState = document.getElementById('pasteState');
  const stateInput = document.getElementById('stateInput');
  
  // Camera controls
  const cameraX = document.getElementById('cameraX');
  const cameraY = document.getElementById('cameraY');
  const cameraZ = document.getElementById('cameraZ');
  
  // Model position controls
  const modelX = document.getElementById('modelX');
  const modelY = document.getElementById('modelY');
  const modelZ = document.getElementById('modelZ');
  
  // Model rotation controls
  const rotationX = document.getElementById('rotationX');
  const rotationY = document.getElementById('rotationY');
  const rotationZ = document.getElementById('rotationZ');
  
  // Model scale control
  const modelScale = document.getElementById('modelScale');
  
  // Set initial values
  cameraX.value = camera.position.x;
  cameraY.value = camera.position.y;
  cameraZ.value = camera.position.z;
  
  if (model) {
    modelX.value = defaultConfig.model.position.x;
    modelY.value = defaultConfig.model.position.y;
    modelZ.value = defaultConfig.model.position.z;
    rotationX.value = defaultConfig.model.rotation.x;
    rotationY.value = defaultConfig.model.rotation.y;
    rotationZ.value = defaultConfig.model.rotation.z;
    modelScale.value = defaultConfig.model.scale;
  }
  
  // Camera position event listeners
  cameraX.addEventListener('input', (e) => {
    camera.position.x = parseFloat(e.target.value);
  });
  
  cameraY.addEventListener('input', (e) => {
    camera.position.y = parseFloat(e.target.value);
  });
  
  cameraZ.addEventListener('input', (e) => {
    camera.position.z = parseFloat(e.target.value);
  });
  
  // Add subtle sound feedback to sliders
  addSliderSound(cameraX);
  addSliderSound(cameraY);
  addSliderSound(cameraZ);
  addSliderSound(modelX);
  addSliderSound(modelY);
  addSliderSound(modelZ);
  addSliderSound(rotationX);
  addSliderSound(rotationY);
  addSliderSound(rotationZ);
  addSliderSound(modelScale);
  
  // Model position event listeners
  modelX.addEventListener('input', (e) => {
    if (model) model.position.x = parseFloat(e.target.value);
  });
  
  modelY.addEventListener('input', (e) => {
    if (model) model.position.y = parseFloat(e.target.value);
  });
  
  modelZ.addEventListener('input', (e) => {
    if (model) model.position.z = parseFloat(e.target.value);
  });
  
  // Model rotation event listeners
  rotationX.addEventListener('input', (e) => {
    if (model) {
      model.rotation.x = parseFloat(e.target.value);
      isRotating = false; // Stop auto-rotation when manually adjusting
      rotationToggle.checked = false;
    }
  });
  
  rotationY.addEventListener('input', (e) => {
    if (model) {
      model.rotation.y = parseFloat(e.target.value);
      isRotating = false; // Stop auto-rotation when manually adjusting
      rotationToggle.checked = false;
    }
  });
  
  rotationZ.addEventListener('input', (e) => {
    if (model) {
      model.rotation.z = parseFloat(e.target.value);
      isRotating = false; // Stop auto-rotation when manually adjusting
      rotationToggle.checked = false;
    }
  });
  
  // Model scale event listener
  modelScale.addEventListener('input', (e) => {
    if (model) {
      const scale = parseFloat(e.target.value);
      model.scale.set(scale, scale, scale);
    }
  });
  
  // State management event listeners
  copyState.addEventListener('click', async () => {
    soundManager.playClick();
    try {
      const state = getCurrentState();
      const stateJSON = JSON.stringify(state, null, 2);
      
      await navigator.clipboard.writeText(stateJSON);
      showButtonFeedback(copyState, 'success', '✅ Copied!');
      
      // Also populate the textarea for reference
      stateInput.value = stateJSON;
    } catch (error) {
      console.error('Failed to copy state:', error);
      showButtonFeedback(copyState, 'error', '❌ Failed');
    }
  });
  
  pasteState.addEventListener('click', () => {
    soundManager.playClick();
    try {
      const stateJSON = stateInput.value.trim();
      if (!stateJSON) {
        showButtonFeedback(pasteState, 'error', '❌ Empty');
        return;
      }
      
      const state = JSON.parse(stateJSON);
      applyState(state);
      showButtonFeedback(pasteState, 'success', '✅ Applied!');
    } catch (error) {
      console.error('Failed to apply state:', error);
      showButtonFeedback(pasteState, 'error', '❌ Invalid');
    }
  });
  
  // Toggle panel visibility
  function togglePanel() {
    controlPanel.classList.toggle('hidden');
    controlToggle.classList.toggle('hidden');
  }
  
  controlToggle.addEventListener('click', () => {
    soundManager.playClick();
    controlPanel.classList.remove('hidden');
    controlToggle.classList.add('hidden');
  });
  
  toggleControls.addEventListener('click', () => {
    soundManager.playClick();
    togglePanel();
  });
  
  // Reset all controls
  resetControls.addEventListener('click', () => {
    soundManager.playClick();
    // Reset camera
    camera.position.set(defaultConfig.camera.x, defaultConfig.camera.y, defaultConfig.camera.z);
    cameraX.value = defaultConfig.camera.x;
    cameraY.value = defaultConfig.camera.y;
    cameraZ.value = defaultConfig.camera.z;
    
    // Reset model
    if (model) {
      model.position.set(defaultConfig.model.position.x, defaultConfig.model.position.y, defaultConfig.model.position.z);
      model.rotation.set(defaultConfig.model.rotation.x, defaultConfig.model.rotation.y, defaultConfig.model.rotation.z);
      model.scale.set(defaultConfig.model.scale, defaultConfig.model.scale, defaultConfig.model.scale);
      
      modelX.value = defaultConfig.model.position.x;
      modelY.value = defaultConfig.model.position.y;
      modelZ.value = defaultConfig.model.position.z;
      rotationX.value = defaultConfig.model.rotation.x;
      rotationY.value = defaultConfig.model.rotation.y;
      rotationZ.value = defaultConfig.model.rotation.z;
      modelScale.value = defaultConfig.model.scale;
      
      // Reset rotation state
      isRotating = true;
      rotationToggle.checked = true;
    }
    
    // Clear state input
    stateInput.value = '';
  });
  
  // Initially hide the panel
  controlPanel.classList.add('hidden');
}

// Handle window resize for 3D canvas
function onWindowResize() {
  if (renderer && camera) {
    // Use full viewport dimensions
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    
    renderer.setSize(canvasWidth, canvasHeight);
    camera.aspect = canvasWidth / canvasHeight;
    camera.updateProjectionMatrix();
  }
}

window.addEventListener('resize', onWindowResize);

// Word Animation (existing code)
// Step 1: Split text into words
const el = document.getElementById('loader-text');
const words = el.textContent.trim().split(' ');
el.innerHTML = words.map(word => `<span class="word">${word}</span>`).join(' ');

// Step 2: Animate each word, then transition to blank page
anime.timeline()
  .add({
    targets: '.word',
    translateY: [50, 0],
    opacity: [0, 1],
    delay: anime.stagger(150),
    duration: 1000,
    easing: 'easeOutExpo'
  })
  .add({
    targets: '.loader',
    opacity: [1, 0],
    duration: 800,
    delay: 1000, // Wait 1 second after word animation completes
    easing: 'easeInExpo',
    complete: function() {
      // Hide loader completely
      const loader = document.querySelector('.loader');
      if (loader) {
        loader.style.display = 'none';
        loader.style.pointerEvents = 'none';
      }
    }
  });

// Initialize 3D model when page loads
document.addEventListener('DOMContentLoaded', function() {
  startLoadingAnimation();
  init3DModel();
  
  // Initialize overlay menu
  initOverlayMenu();
});

// Overlay Menu Functions
function initOverlayMenu() {
  const subtitleTrigger = document.getElementById('subtitle-trigger');
  const overlayMenu = document.getElementById('overlay-menu');
  const overlayClose = document.getElementById('overlay-close');
  
  // Open menu when clicking subtitle
  subtitleTrigger.addEventListener('click', () => {
    soundManager.playClick();
    overlayMenu.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
  });
  
  // Close menu when clicking close button
  overlayClose.addEventListener('click', () => {
    soundManager.playClick();
    overlayMenu.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
  });
  
  // Close menu with Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlayMenu.classList.contains('active')) {
      overlayMenu.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
  
  // Animate menu items on open and add click sounds
  const menuItems = overlayMenu.querySelectorAll('.menu-item');
  
  // Add click sound to menu items
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      soundManager.playClick();
    });
  });
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.classList.contains('active')) {
        menuItems.forEach((item, index) => {
          item.style.opacity = '0';
          item.style.transform = 'translateY(50px) scale(0.9)';
          setTimeout(() => {
            item.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            item.style.opacity = '1';
            item.style.transform = 'translateY(0) scale(1)';
          }, index * 200);
        });
      }
    });
  });
  
  observer.observe(overlayMenu, { attributes: true, attributeFilter: ['class'] });
}
