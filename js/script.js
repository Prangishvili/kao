/**
 * Main 3D Viewer Application
 * Handles Three.js 3D model display and interaction controls
 * Used exclusively for index.html (3D viewer page)
 */

// Import Three.js modules
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// Import modular functionality
import { soundManager } from './sound.js';
import { initOverlayMenu } from './overlay-menu.js';

// Three.js 3D Model Setup
let scene, camera, renderer, model;
let isRotating = true; // Control auto-rotation
let isDragging = false; // Track drag state
let previousMouseX = 0;
let rotationSpeed = 0.2 * Math.PI / (15 * 60); // 15 seconds for full rotation at 60fps
let modelLoaded = false;

// Animation System
let mixer = null; // Animation mixer
let animations = []; // Available animations
let currentAnimation = null; // Currently playing animation
let scrollAnimation = null; // Scroll-triggered animation
let scrollPercent = 0; // Current scroll percentage
let isScrollAnimationEnabled = true; // Toggle for scroll animation

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
      x: -0.3,
      y: -3.6,
      z: -7.3
    },
    rotation: {
      x: 0.11,
      y: -1.3,
      z: 0
    },
    scale: 0.5940867060536089
  }
};

// Target configuration for scroll animation
const scrollTargetConfig = {
  camera: {
    x: -0.5,
    y: -3.3,
    z: 3.9
  },
  model: {
    position: {
      x: -0.8,
      y: -5.7,
      z: -8.9
    },
    rotation: {
      x: 0.13,
      y: -3.1,
      z: -0.01
    },
    scale: 0.5940867060536089
  }
};

// Store original values for reset functionality
let originalModelPosition = { ...defaultConfig.model.position };
let originalModelScale = defaultConfig.model.scale;

// Store current rotation state for scroll animation
let scrollStartRotation = { x: 0, y: 0, z: 0 };
let scrollStartPosition = { x: 0, y: 0, z: 0 };
let scrollStartScale = 1;
let scrollAnimationStarted = false;

// Image overlay system
let imageOverlay = null;
let imageOverlayActive = false;
let imageOverlayTargetReached = false;
let imageOverlayBottomUp = false;
let imageScrollProgress = 0;
let imageScrollStarted = false;

// Introduction text system
let introTextSection = null;
let introTextActive = false;
let introTextScrollProgress = 0;

// Custom scroll indicator system
let scrollIndicator = null;
let scrollIndicatorActive = false;

// Overlay panel system
let overlayPanel = null;
let overlayPanelActive = false;

// Auto-scroll system
let autoScrollStarted = false;
let autoScrollDuration = 3000; // 3 seconds for smooth scroll
let scrollDisabled = false;
let modelScrollCompleted = false; // Track if model scroll has completed

// New scroll behavior system
let isModelAnimationPlaying = false; // Track if model animation is currently playing
let modelAnimationProgress = 0; // Current animation progress (0-1)
let userScrollTriggered = false; // Track if user has triggered scroll
let animationDirection = 1; // 1 for forward, -1 for reverse
let lastScrollY = 0; // Track last scroll position for direction detection

/**
 * Loading Animation Functions
 */
function startLoadingAnimation() {
  // Step 1: Split text into words
  const el = document.getElementById('loader-text');
  if (!el) return;
  
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
        // Only proceed with transition if 3D model is loaded
        if (modelLoaded) {
          document.querySelector('.loader').style.display = 'none';
        }
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
      const loader = document.querySelector('.loader');
      if (loader) {
        loader.style.display = 'none';
      }
    }
  });
}

/**
 * Mouse Info Display Functions
 */
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

/**
 * 3D Model Initialization
 */
function init3DModel() {
  const canvas = document.getElementById('threejs-canvas');
  if (!canvas) {
    console.error('❌ Canvas element not found');
    return;
  }
  
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
  
  // Create renderer with enhanced anti-aliasing
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    alpha: true, 
    antialias: true,
    powerPreference: "high-performance", // Use dedicated GPU if available
    precision: "highp" // High precision for better quality
  });
  renderer.setSize(canvasWidth, canvasHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Improve quality on high-DPI displays
  renderer.setClearColor(0x000000, 0); // Transparent background
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.useLegacyLights = true; // Suppress deprecation warning for physicallyCorrectLights
  
  // Enhanced rendering quality settings
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  
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
    
    // Step 1: Extract animations from GLTF
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      animations = gltf.animations;
      
      console.log(`🎬 Found ${animations.length} animation(s):`, animations.map(anim => anim.name));
      
      // Setup first animation for scroll control
      if (animations[0]) {
        scrollAnimation = mixer.clipAction(animations[0]);
        scrollAnimation.setLoop(THREE.LoopOnce);
        scrollAnimation.clampWhenFinished = true;
        scrollAnimation.enabled = true;
        scrollAnimation.timeScale = 0; // We'll control time manually via scroll
        scrollAnimation.play();
        
        console.log(`🎯 Using "${animations[0].name}" for scroll animation`);
      }
    } else {
      console.log('📝 No animations found in the model');
    }
    
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
    console.log('✅ 3D model loaded successfully');
    
    // Initialize controls after model is loaded
    initControls();
    initDragControls();
    initScrollAnimation(); // Initialize scroll animation system
    animate3D();
    
    // Mark model as loaded and check if we should complete the transition
    modelLoaded = true;
    const loader = document.querySelector('.loader');
    if (loader && loader.style.opacity === '0') {
      completeTransition();
    }
  }, function(progress) {
    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
  }, function(error) {
    console.error('❌ Error loading model:', error);
  });
}

/**
 * Drag Controls for 3D Model
 */
function initDragControls() {
  const canvas = document.getElementById('threejs-canvas');
  if (!canvas) return;
  
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
      // Update mouse info only if not hidden
      if (!mouseInfo || !mouseInfo.dataset.hidden) {
        updateMouseInfo(event, intersects);
      }
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
    if (mouseInfo && !mouseInfo.dataset.hidden) {
      mouseInfo.style.display = 'none';
    }
  });
  
  // Pointer enter event
  canvas.addEventListener('pointerenter', () => {
    if (mouseInfo && !mouseInfo.dataset.hidden) {
      mouseInfo.style.display = 'block';
    }
  });
}

/**
 * Scroll Animation System using GSAP ScrollTrigger
 */
function initScrollAnimation() {
  if (!window.gsap || !window.ScrollTrigger) {
    console.warn('⚠️ GSAP or ScrollTrigger not loaded');
    return;
  }
  
  // Mark GSAP as successfully initialized
  window.gsapInitialized = true;

  // Register ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  // Enable scrolling on the body (only if animations are found)
  if (scrollAnimation && animations.length > 0) {
    document.body.style.height = '400vh'; // 400% height: 100vh (initial) + 200vh (image) + 100vh (text)
    document.body.style.overflowY = 'auto';
    document.body.style.overflow = 'auto'; // Override any existing overflow hidden
    
    // Hide native scrollbar
    document.body.style.setProperty('scrollbar-width', 'none');
    document.body.style.setProperty('-webkit-scrollbar', 'display: none');
    document.documentElement.style.setProperty('scrollbar-width', 'none');
    document.documentElement.style.setProperty('-webkit-scrollbar', 'display: none');
    
    // Enable scrolling from the start
    document.body.style.overflow = 'auto';
    console.log('🔓 Scroll enabled - model animation will sync with scroll progress');
  }

  // Step 2: Setup scroll-triggered animation
  if (scrollAnimation && animations.length > 0) {
    const animationDuration = animations[0].duration;
    
    gsap.to({}, {
      duration: 1,
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1, // Smooth scrubbing
        onUpdate: (self) => {
          // Skip GSAP updates during model-scroll to prevent conflicts
          if (autoScrollStarted) return;
          
          if (isScrollAnimationEnabled && scrollAnimation && mixer && !scrollDisabled) {
            // Update scroll percentage
            scrollPercent = self.progress;
            
                         // Handle new scroll behavior: detect first scroll and play animation to 100%
             if (!modelScrollCompleted) {
               // Detect first scroll event
               if (!userScrollTriggered && scrollPercent > 0) {
                 userScrollTriggered = true;
                 console.log('⬇️ First scroll detected (GSAP) - starting model animation to 100%');
                 
                 // Prevent page from scrolling further
                 document.body.style.overflow = 'hidden';
                 
                 // Start the animation that plays to 100%
                 startModelAnimationTo100();
               }
               
               return; // Exit early - don't process other scroll logic during model animation
             }
            
            // Stop auto-rotation when scroll animation is active
            if (scrollPercent > 0) {
              isRotating = false;
              // Update rotation toggle to reflect the stopped state
              const rotationToggle = document.getElementById('rotationToggle');
              if (rotationToggle) rotationToggle.checked = false;
            }
            
            // Stage 1: Auto animation (0-25% scroll) - First 100vh for 3D model
            // Only update model if animation is not completed
            if (scrollPercent <= 0.25 && !modelScrollCompleted) {
              // Model animation completes at 100% when page scroll reaches 25%
              // This means animation is 4x more sensitive to scroll input
              const animationProgress = Math.min(scrollPercent / 0.25, 1); // 0 to 1
              const animationTime = animationProgress * animationDuration;
              scrollAnimation.time = animationTime;
              
              // Also update model position/rotation/scale during this stage
              if (model && scrollStartPosition && scrollStartRotation) {
                const easedProgress = animationProgress < 0.5 
                  ? 4 * animationProgress * animationProgress * animationProgress 
                  : 1 - Math.pow(-2 * animationProgress + 2, 3) / 2;
                
                // Update model position
                model.position.x = scrollStartPosition.x + (scrollTargetConfig.model.position.x - scrollStartPosition.x) * easedProgress;
                model.position.y = scrollStartPosition.y + (scrollTargetConfig.model.position.y - scrollStartPosition.y) * easedProgress;
                model.position.z = scrollStartPosition.z + (scrollTargetConfig.model.position.z - scrollStartPosition.z) * easedProgress;
                
                // Update model rotation
                model.rotation.x = scrollStartRotation.x + (scrollTargetConfig.model.rotation.x - scrollStartRotation.x) * easedProgress;
                model.rotation.y = scrollStartRotation.y + (scrollTargetConfig.model.rotation.y - scrollStartRotation.y) * easedProgress;
                model.rotation.z = scrollStartRotation.z + (scrollTargetConfig.model.rotation.z - scrollStartRotation.z) * easedProgress;
                
                // Update model scale
                model.scale.setScalar(scrollStartScale + (scrollTargetConfig.model.scale - scrollStartScale) * easedProgress);
                
                // Update camera position
                if (camera) {
                  camera.position.x = defaultConfig.camera.x + (scrollTargetConfig.camera.x - defaultConfig.camera.x) * easedProgress;
                  camera.position.y = defaultConfig.camera.y + (scrollTargetConfig.camera.y - defaultConfig.camera.y) * easedProgress;
                  camera.position.z = defaultConfig.camera.z + (scrollTargetConfig.camera.z - defaultConfig.camera.z) * easedProgress;
                }
                
                // Update control sliders
                updateControlSliders();
              }
            }
            
            // Stage 2: Image animation (25-75% scroll) - 200vh image section
            if (scrollPercent >= 0.25 && !imageScrollStarted) {
              imageScrollStarted = true;
              console.log('🖼️ Starting scroll-controlled image animation');
            }
            
            if (imageScrollStarted && imageOverlay && scrollPercent >= 0.25) {
              // Calculate image progress from 25% to 75% scroll range (50% total range)
              const stage2Progress = (scrollPercent - 0.25) / 0.50; // 0 to 1
              updateImageOverlayPosition(stage2Progress);
            }
            
            // Stage 3: Text animation (75-100% scroll) - 100vh text section
            if (scrollPercent >= 0.75 && !introTextActive) {
              introTextActive = true;
              console.log('📝 Starting introduction text section');
            }
            
            if (introTextActive && introTextSection && scrollPercent >= 0.75) {
              // Calculate text scroll progress from 75% to 100% scroll range (25% total range)
              const stage3Progress = (scrollPercent - 0.75) / 0.25; // 0 to 1
              updateIntroTextPosition(stage3Progress);
            }
            
            // Update mixer
            mixer.update(0); // No delta time since we're setting time manually
            
            console.debug(`🎬 Scroll: ${(scrollPercent * 100).toFixed(1)}% | Stage: ${scrollPercent <= 0.25 ? '1' : scrollPercent <= 0.75 ? '2' : '3'}`);
          }
        },
        onToggle: (self) => {
          if (self.isActive) {
            console.log('🎯 Scroll animation active');
          } else {
            console.log('🎯 Scroll animation inactive');
          }
        }
      }
    });

    console.log('✅ Scroll animation system initialized');
  } else {
    console.log('📝 No animations available for scroll control');
  }

  // Basic scroll listener fallback (if GSAP fails)
  window.addEventListener('scroll', () => {
    // Only run fallback if GSAP is NOT available or not initialized
    if (window.gsapInitialized) return; // Skip fallback if GSAP is working
    if (!isScrollAnimationEnabled || !scrollAnimation || !mixer || scrollDisabled) return;
    
    // Log that fallback is being used (only once)
    if (!window.fallbackLogged) {
      console.log('🔄 Using scroll fallback (GSAP not available)');
      window.fallbackLogged = true;
    }
    
    const scrollY = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    scrollPercent = Math.min(scrollY / maxScroll, 1);
    
    // Handle new scroll behavior: prevent page scroll during model animation
    if (!modelScrollCompleted) {
      handleModelScrollBehavior(scrollY);
      return; // Exit early - don't process other scroll logic during model animation
    }
    
    // Stop auto-rotation when scroll animation is active (fallback)
    if (scrollPercent > 0) {
      isRotating = false;
      // Update rotation toggle to reflect the stopped state
      const rotationToggle = document.getElementById('rotationToggle');
      if (rotationToggle) rotationToggle.checked = false;
    }
    
    // Stage 1: Auto animation (0-25% scroll) - fallback
    // Only update model if animation is not completed
    if (scrollPercent <= 0.25 && !modelScrollCompleted) {
      // Model animation completes at 100% when page scroll reaches 25%
      // This means animation is 4x more sensitive to scroll input
      const animationProgress = Math.min(scrollPercent / 0.25, 1); // 0 to 1
      
      if (animations.length > 0) {
        const animationTime = animationProgress * animations[0].duration;
        scrollAnimation.time = animationTime;
        mixer.update(0);
      }
      
      // Also update model position/rotation/scale during this stage
      if (model && scrollStartPosition && scrollStartRotation) {
        const easedProgress = animationProgress < 0.5 
          ? 4 * animationProgress * animationProgress * animationProgress 
          : 1 - Math.pow(-2 * animationProgress + 2, 3) / 2;
        
        // Update model position
        model.position.x = scrollStartPosition.x + (scrollTargetConfig.model.position.x - scrollStartPosition.x) * easedProgress;
        model.position.y = scrollStartPosition.y + (scrollTargetConfig.model.position.y - scrollStartPosition.y) * easedProgress;
        model.position.z = scrollStartPosition.z + (scrollTargetConfig.model.position.z - scrollStartPosition.z) * easedProgress;
        
        // Update model rotation
        model.rotation.x = scrollStartRotation.x + (scrollTargetConfig.model.rotation.x - scrollStartRotation.x) * easedProgress;
        model.rotation.y = scrollStartRotation.y + (scrollTargetConfig.model.rotation.y - scrollStartRotation.y) * easedProgress;
        model.rotation.z = scrollStartRotation.z + (scrollTargetConfig.model.rotation.z - scrollStartRotation.z) * easedProgress;
        
        // Update model scale
        model.scale.setScalar(scrollStartScale + (scrollTargetConfig.model.scale - scrollStartScale) * easedProgress);
        
        // Update camera position
        if (camera) {
          camera.position.x = defaultConfig.camera.x + (scrollTargetConfig.camera.x - defaultConfig.camera.x) * easedProgress;
          camera.position.y = defaultConfig.camera.y + (scrollTargetConfig.camera.y - defaultConfig.camera.y) * easedProgress;
          camera.position.z = defaultConfig.camera.z + (scrollTargetConfig.camera.z - defaultConfig.camera.z) * easedProgress;
        }
        
        // Update control sliders
        updateControlSliders();
      }
    }
    
    // Stage 2: Image animation (25-75% scroll) - fallback
    if (scrollPercent >= 0.25 && !imageScrollStarted) {
      imageScrollStarted = true;
      console.log('🖼️ Starting scroll-controlled image animation (fallback)');
    }
    
    if (imageScrollStarted && imageOverlay && scrollPercent >= 0.25) {
      // Calculate image progress from 25% to 75% scroll range (50% total range)
      const stage2Progress = (scrollPercent - 0.25) / 0.50; // 0 to 1
      updateImageOverlayPosition(stage2Progress);
    }
    
    // Stage 3: Text animation (75-100% scroll) - fallback
    if (scrollPercent >= 0.75 && !introTextActive) {
      introTextActive = true;
      console.log('📝 Starting introduction text section (fallback)');
    }
    
    if (introTextActive && introTextSection && scrollPercent >= 0.75) {
      // Calculate text scroll progress from 75% to 100% scroll range (25% total range)
      const stage3Progress = (scrollPercent - 0.75) / 0.25; // 0 to 1
      updateIntroTextPosition(stage3Progress);

    }
    
    console.debug(`🎬 Scroll Fallback: ${(scrollPercent * 100).toFixed(1)}% | Stage: ${scrollPercent <= 0.25 ? '1' : scrollPercent <= 0.75 ? '2' : '3'}`);
  });
}

/**
 * 3D Animation Loop
 */
function animate3D() {
  requestAnimationFrame(animate3D);
  
  // Update animation mixer (but not when scroll is controlling time)
  if (mixer && !isScrollAnimationEnabled) {
    const delta = 0.016; // ~60fps
    mixer.update(delta);
  }
  
  if (model && isRotating && !isDragging) {
    // Continue rotation from current position when not dragging
    model.rotation.y += rotationSpeed;
    
    // Update rotation slider to match current rotation
    const rotationY = document.getElementById('rotationY');
    if (rotationY) {
      rotationY.value = model.rotation.y % (2 * Math.PI);
    }
  }
  
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

/**
 * State Management Functions
 */
function getCurrentState() {
  return {
    version: "1.0",
    timestamp: new Date().toISOString(),
    camera: {
      x: camera ? camera.position.x : defaultConfig.camera.x,
      y: camera ? camera.position.y : defaultConfig.camera.y,
      z: camera ? camera.position.z : defaultConfig.camera.z
    },
    model: {
      position: {
        x: model ? model.position.x : defaultConfig.model.position.x,
        y: model ? model.position.y : defaultConfig.model.position.y,
        z: model ? model.position.z : defaultConfig.model.position.z
      },
      rotation: {
        x: model ? model.rotation.x : defaultConfig.model.rotation.x,
        y: model ? model.rotation.y : defaultConfig.model.rotation.y,
        z: model ? model.rotation.z : defaultConfig.model.rotation.z
      },
      scale: model ? model.scale.x : defaultConfig.model.scale
    }
  };
}

function applyState(state) {
  if (!state || typeof state !== 'object') {
    throw new Error('Invalid state object');
  }

  // Apply camera position
  if (state.camera && camera) {
    camera.position.set(
      state.camera.x || 0,
      state.camera.y || 0,
      state.camera.z || 2
    );
    
    // Update UI sliders
    const cameraX = document.getElementById('cameraX');
    const cameraY = document.getElementById('cameraY');
    const cameraZ = document.getElementById('cameraZ');
    
    if (cameraX) cameraX.value = state.camera.x || 0;
    if (cameraY) cameraY.value = state.camera.y || 0;
    if (cameraZ) cameraZ.value = state.camera.z || 2;
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
      
      const modelX = document.getElementById('modelX');
      const modelY = document.getElementById('modelY');
      const modelZ = document.getElementById('modelZ');
      
      if (modelX) modelX.value = state.model.position.x || 0;
      if (modelY) modelY.value = state.model.position.y || 0;
      if (modelZ) modelZ.value = state.model.position.z || 0;
    }

    // Rotation
    if (state.model.rotation) {
      model.rotation.set(
        state.model.rotation.x || 0,
        state.model.rotation.y || 0,
        state.model.rotation.z || 0
      );
      
      const rotationX = document.getElementById('rotationX');
      const rotationY = document.getElementById('rotationY');
      const rotationZ = document.getElementById('rotationZ');
      
      if (rotationX) rotationX.value = state.model.rotation.x || 0;
      if (rotationY) rotationY.value = state.model.rotation.y || 0;
      if (rotationZ) rotationZ.value = state.model.rotation.z || 0;
    }

    // Scale
    if (state.model.scale) {
      const scale = state.model.scale;
      model.scale.set(scale, scale, scale);
      const modelScale = document.getElementById('modelScale');
      if (modelScale) modelScale.value = scale;
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

/**
 * Control Panel Functions
 */
function initControls() {
  const controlPanel = document.getElementById('controlPanel');
  const controlToggle = document.getElementById('controlToggle');
  const toggleControls = document.getElementById('toggleControls');
  const resetControls = document.getElementById('resetControls');
  
  if (!controlPanel) {
    console.warn('⚠️ Control panel not found');
    return;
  }
  
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

  // Add animation controls section
  const animationSection = document.createElement('div');
  animationSection.className = 'control-section';
  animationSection.innerHTML = `
    <h4>Animation Controls</h4>
    <div class="control-group">
      <label class="toggle-label">
        <input type="checkbox" id="scrollAnimationToggle" checked>
        <span>Scroll Animation</span>
      </label>
    </div>
    <div class="control-group">
      <label>Animation Progress: 
        <input type="range" id="animationProgress" min="0" max="1" step="0.01" value="0">
      </label>
      <span id="animationInfo">No animations loaded</span>
    </div>
  `;
  
  // Insert rotation toggle and animation controls before state management section
  const stateSection = controlPanel.querySelector('.control-section:nth-last-child(2)');
  if (stateSection) {
    controlPanel.insertBefore(rotationSection, stateSection);
    controlPanel.insertBefore(animationSection, stateSection);
  }
  
  // Add rotation toggle event listener
  const rotationToggle = document.getElementById('rotationToggle');
  if (rotationToggle) {
    rotationToggle.addEventListener('change', (e) => {
      soundManager.playClick();
      isRotating = e.target.checked;
    });
  }

  // Add animation control event listeners
  const scrollAnimationToggle = document.getElementById('scrollAnimationToggle');
  if (scrollAnimationToggle) {
    scrollAnimationToggle.addEventListener('change', (e) => {
      soundManager.playClick();
      isScrollAnimationEnabled = e.target.checked;
      console.log(`🎬 Scroll animation ${isScrollAnimationEnabled ? 'enabled' : 'disabled'}`);
    });
  }

  const animationProgress = document.getElementById('animationProgress');
  if (animationProgress) {
    animationProgress.addEventListener('input', (e) => {
      if (scrollAnimation && animations.length > 0) {
        const progress = parseFloat(e.target.value);
        const animationTime = progress * animations[0].duration;
        scrollAnimation.time = animationTime;
        if (mixer) mixer.update(0);
        
        // Update info display
        const animationInfo = document.getElementById('animationInfo');
        if (animationInfo) {
          animationInfo.textContent = `${(progress * 100).toFixed(1)}% (${animationTime.toFixed(2)}s)`;
        }
      }
    });
    
    // Add slider sound
    soundManager.addToSlider(animationProgress);
  }

  // Update animation info when animations are loaded
  function updateAnimationInfo() {
    const animationInfo = document.getElementById('animationInfo');
    if (animationInfo && animations.length > 0) {
      animationInfo.textContent = `${animations.length} animation(s) loaded - Duration: ${animations[0].duration.toFixed(2)}s`;
    }
  }

  // Call update when model loads (will be called after animations are extracted)
  setTimeout(updateAnimationInfo, 1000);
  
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
  if (cameraX && camera) cameraX.value = camera.position.x;
  if (cameraY && camera) cameraY.value = camera.position.y;
  if (cameraZ && camera) cameraZ.value = camera.position.z;
  
  if (model) {
    if (modelX) modelX.value = defaultConfig.model.position.x;
    if (modelY) modelY.value = defaultConfig.model.position.y;
    if (modelZ) modelZ.value = defaultConfig.model.position.z;
    if (rotationX) rotationX.value = defaultConfig.model.rotation.x;
    if (rotationY) rotationY.value = defaultConfig.model.rotation.y;
    if (rotationZ) rotationZ.value = defaultConfig.model.rotation.z;
    if (modelScale) modelScale.value = defaultConfig.model.scale;
  }
  
  // Camera position event listeners
  if (cameraX) {
    cameraX.addEventListener('input', (e) => {
      if (camera) camera.position.x = parseFloat(e.target.value);
    });
  }
  
  if (cameraY) {
    cameraY.addEventListener('input', (e) => {
      if (camera) camera.position.y = parseFloat(e.target.value);
    });
  }
  
  if (cameraZ) {
    cameraZ.addEventListener('input', (e) => {
      if (camera) camera.position.z = parseFloat(e.target.value);
    });
  }
  
  // Add subtle sound feedback to sliders
  [cameraX, cameraY, cameraZ, modelX, modelY, modelZ, rotationX, rotationY, rotationZ, modelScale]
    .forEach(slider => soundManager.addToSlider(slider));
  
  // Model position event listeners
  if (modelX) {
    modelX.addEventListener('input', (e) => {
      if (model) model.position.x = parseFloat(e.target.value);
    });
  }
  
  if (modelY) {
    modelY.addEventListener('input', (e) => {
      if (model) model.position.y = parseFloat(e.target.value);
    });
  }
  
  if (modelZ) {
    modelZ.addEventListener('input', (e) => {
      if (model) model.position.z = parseFloat(e.target.value);
    });
  }
  
  // Model rotation event listeners
  if (rotationX) {
    rotationX.addEventListener('input', (e) => {
      if (model) {
        model.rotation.x = parseFloat(e.target.value);
        isRotating = false; // Stop auto-rotation when manually adjusting
        if (rotationToggle) rotationToggle.checked = false;
      }
    });
  }
  
  if (rotationY) {
    rotationY.addEventListener('input', (e) => {
      if (model) {
        model.rotation.y = parseFloat(e.target.value);
        isRotating = false; // Stop auto-rotation when manually adjusting
        if (rotationToggle) rotationToggle.checked = false;
      }
    });
  }
  
  if (rotationZ) {
    rotationZ.addEventListener('input', (e) => {
      if (model) {
        model.rotation.z = parseFloat(e.target.value);
        isRotating = false; // Stop auto-rotation when manually adjusting
        if (rotationToggle) rotationToggle.checked = false;
      }
    });
  }
  
  // Model scale event listener
  if (modelScale) {
    modelScale.addEventListener('input', (e) => {
      if (model) {
        const scale = parseFloat(e.target.value);
        model.scale.set(scale, scale, scale);
      }
    });
  }
  
  // State management event listeners
  if (copyState) {
    copyState.addEventListener('click', async () => {
      soundManager.playClick();
      try {
        const state = getCurrentState();
        const stateJSON = JSON.stringify(state, null, 2);
        
        await navigator.clipboard.writeText(stateJSON);
        showButtonFeedback(copyState, 'success', '✅ Copied!');
        
        // Also populate the textarea for reference
        if (stateInput) stateInput.value = stateJSON;
      } catch (error) {
        console.error('Failed to copy state:', error);
        showButtonFeedback(copyState, 'error', '❌ Failed');
      }
    });
  }
  
  if (pasteState) {
    pasteState.addEventListener('click', () => {
      soundManager.playClick();
      try {
        const stateJSON = stateInput ? stateInput.value.trim() : '';
        if (!stateJSON) {
          showButtonFeedback(pasteState, 'error', '❌ Empty');
          return;
        }
        
        // Reset scroll animation state when applying new state
        resetScrollAnimationState();
        
        const state = JSON.parse(stateJSON);
        applyState(state);
        showButtonFeedback(pasteState, 'success', '✅ Applied!');
      } catch (error) {
        console.error('Failed to apply state:', error);
        showButtonFeedback(pasteState, 'error', '❌ Invalid');
      }
    });
  }
  
  // Toggle panel visibility
  function togglePanel() {
    if (controlPanel && controlToggle) {
      controlPanel.classList.toggle('hidden');
      controlToggle.classList.toggle('hidden');
    }
  }
  
  if (controlToggle) {
    controlToggle.addEventListener('click', () => {
      soundManager.playClick();
      if (controlPanel) {
        controlPanel.classList.remove('hidden');
        controlToggle.classList.add('hidden');
      }
    });
  }
  
  if (toggleControls) {
    toggleControls.addEventListener('click', () => {
      soundManager.playClick();
      togglePanel();
    });
  }
  
  // Reset all controls
  if (resetControls) {
    resetControls.addEventListener('click', () => {
      soundManager.playClick();
      
      // Reset scroll animation state
      resetScrollAnimationState();
      
      // Reset camera
      if (camera) {
        camera.position.set(defaultConfig.camera.x, defaultConfig.camera.y, defaultConfig.camera.z);
        if (cameraX) cameraX.value = defaultConfig.camera.x;
        if (cameraY) cameraY.value = defaultConfig.camera.y;
        if (cameraZ) cameraZ.value = defaultConfig.camera.z;
      }
      
      // Reset model
      if (model) {
        model.position.set(defaultConfig.model.position.x, defaultConfig.model.position.y, defaultConfig.model.position.z);
        model.rotation.set(defaultConfig.model.rotation.x, defaultConfig.model.rotation.y, defaultConfig.model.rotation.z);
        model.scale.set(defaultConfig.model.scale, defaultConfig.model.scale, defaultConfig.model.scale);
        
        if (modelX) modelX.value = defaultConfig.model.position.x;
        if (modelY) modelY.value = defaultConfig.model.position.y;
        if (modelZ) modelZ.value = defaultConfig.model.position.z;
        if (rotationX) rotationX.value = defaultConfig.model.rotation.x;
        if (rotationY) rotationY.value = defaultConfig.model.rotation.y;
        if (rotationZ) rotationZ.value = defaultConfig.model.rotation.z;
        if (modelScale) modelScale.value = defaultConfig.model.scale;
        
              // Reset rotation state
        isRotating = true;
        if (rotationToggle) rotationToggle.checked = true;

        // Reset animation state
        isScrollAnimationEnabled = true;
        const scrollAnimationToggle = document.getElementById('scrollAnimationToggle');
        if (scrollAnimationToggle) scrollAnimationToggle.checked = true;
        
        const animationProgress = document.getElementById('animationProgress');
        if (animationProgress) animationProgress.value = 0;
      }
      
      // Clear state input
      if (stateInput) stateInput.value = '';
    });
  }
  
  // Initially hide the panel
  if (controlPanel) {
    controlPanel.classList.add('hidden');
  }
}

/**
 * Capture current model state for scroll animation start
 */
function captureScrollStartState() {
  if (model && !scrollAnimationStarted) {
    scrollStartRotation = {
      x: model.rotation.x,
      y: model.rotation.y,
      z: model.rotation.z
    };
    scrollStartPosition = {
      x: model.position.x,
      y: model.position.y,
      z: model.position.z
    };
    scrollStartScale = model.scale.x; // Assuming uniform scaling
    scrollAnimationStarted = true;
    console.log('📸 Captured scroll start state:', {
      position: scrollStartPosition,
      rotation: scrollStartRotation,
      scale: scrollStartScale
    });
  }
}

/**
 * Reset scroll animation state
 */
function resetScrollAnimationState() {
  scrollAnimationStarted = false;
  scrollStartRotation = { x: 0, y: 0, z: 0 };
  scrollStartPosition = { x: 0, y: 0, z: 0 };
  scrollStartScale = 1;
  
  // Reset auto-scroll state
  autoScrollStarted = false;
  scrollDisabled = false;
  modelScrollCompleted = false;
  
  // Reset new scroll behavior state
  isModelAnimationPlaying = false;
  modelAnimationProgress = 0;
  userScrollTriggered = false;
  animationDirection = 1;
  lastScrollY = 0;
  
  // Reset image overlay state
  imageOverlayTargetReached = false;
  imageOverlayBottomUp = false;
  imageScrollProgress = 0;
  imageScrollStarted = false;
  if (imageOverlay && imageOverlay.parentNode) {
    imageOverlay.parentNode.removeChild(imageOverlay);
    imageOverlay = null;
    imageOverlayActive = false;
  }
  
  // Reset intro text state
  introTextActive = false;
  introTextScrollProgress = 0;
  if (introTextSection && introTextSection.parentNode) {
    introTextSection.parentNode.removeChild(introTextSection);
    introTextSection = null;
  }
  
  // Reset scroll indicator state
  scrollIndicatorActive = false;
  if (scrollIndicator && scrollIndicator.parentNode) {
    scrollIndicator.parentNode.removeChild(scrollIndicator);
    scrollIndicator = null;
  }
  
  // Reset overlay panel state
  overlayPanelActive = false;
  if (overlayPanel && overlayPanel.parentNode) {
    overlayPanel.parentNode.removeChild(overlayPanel);
    overlayPanel = null;
  }
  
  console.log('🔄 Reset scroll animation state');
}

/**
 * Create main document structure with proper sections
 */
function createDocumentStructure() {
  // Create main container
  const mainContainer = document.createElement('div');
  mainContainer.id = 'main-container';
  mainContainer.style.cssText = `
    position: relative;
    width: 100%;
    height: 400vh;
    margin: 0;
    padding: 0;
  `;
  
  // Create 3D model section (first 100vh)
  const modelSection = document.createElement('div');
  modelSection.id = 'model-section';
  modelSection.style.cssText = `
    position: relative;
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
    z-index: 1;
  `;
  
  // Move the existing canvas into the model section
  const existingCanvas = document.getElementById('threejs-canvas');
  if (existingCanvas) {
    existingCanvas.style.position = 'absolute';
    existingCanvas.style.top = '0';
    existingCanvas.style.left = '0';
    existingCanvas.style.width = '100%';
    existingCanvas.style.height = '100%';
    modelSection.appendChild(existingCanvas);
  }
  
  // Create image section (200vh)
  imageOverlay = document.createElement('div');
  imageOverlay.id = 'image-overlay';
  imageOverlay.style.cssText = `
    position: relative;
    width: 100vw;
    height: 200vh;
    background-image: url('assets/IMG5.jpeg');
    background-size: cover;
    background-position: center top;
    background-repeat: no-repeat;
    z-index: 9998;
    margin: 0;
    padding: 0;
  `;
  
  // Create text section (dynamic height based on content)
  introTextSection = document.createElement('div');
  introTextSection.id = 'intro-text-section';
  introTextSection.style.cssText = `
    position: relative;
    width: 100vw;
    min-height: 100vh;
    background: #ffffff;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    font-family: 'Object Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.8;
    color: #2c3e50;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    margin: 0;
    padding: 100px 0;
  `;
  
  // Hide scrollbar
  introTextSection.style.setProperty('scrollbar-width', 'none');
  introTextSection.style.setProperty('-webkit-scrollbar', 'display: none');
  
  const textContent = `
    <div style="width: 1027px; box-sizing: border-box; text-align: left;">
      <div style="color: #000; font-size: 40px; font-style: normal; font-weight: 400; line-height: 61px;">
        <p style="margin-bottom: 61px;">
          Kao Furniture Studio operates within Georgia's rich tradition of woodworking and furniture making, which has deep historical roots in the region. Traditional Georgian woodworking has been characterized by geometric, astral, zoomorphic, and figurative patterns showing connections with folk beliefs, with craftsmen creating everything from furniture to religious artifacts.
        </p>
        
        <p style="margin-bottom: 61px;">
          The studio emerges from a context where traveling masters from Rach'a, whose hands had made the balconies of the houses in Tbilisi and eastern Georgia, especially stood out among the wood craftsmen, and where wood carving was also widely used as in decorating home furniture and other household objects. This includes traditional items like armchairs, sak'artskhuli (a special chair for the head of the family in Svaneti and Rach'a), settees, chests, cradles.
        </p>
        
        <p style="margin-bottom: 61px;">
          Contemporary Georgian woodworking has evolved to blend traditional techniques with modern design approaches. As evidenced by other Georgian studios, there's a growing movement of artisans and designers collaborating to create products that appeal to a global audience. These contemporary crafts, while rooted in traditional techniques, are adapted to suit modern tastes and uses.
        </p>
      </div>
    </div>
  `;
  
  introTextSection.innerHTML = textContent;
  
  // Assemble the document structure
  mainContainer.appendChild(modelSection);
  mainContainer.appendChild(imageOverlay);
  mainContainer.appendChild(introTextSection);
  document.body.appendChild(mainContainer);
  
  // Calculate dynamic height based on actual content
  const modelSectionHeight = 100; // 100vh
  const imageSectionHeight = 200; // 200vh
  const textSectionHeight = Math.ceil(introTextSection.scrollHeight / window.innerHeight); // Dynamic height in vh
  
  const totalHeight = modelSectionHeight + imageSectionHeight + textSectionHeight;
  
  // Set body height to accommodate all sections
  document.body.style.height = `${totalHeight}vh`;
  
  console.log(`📄 Document structure created: ${modelSectionHeight}vh (model) + ${imageSectionHeight}vh (image) + ${textSectionHeight}vh (text) = ${totalHeight}vh total`);
}

/**
 * Animate image overlay from top to bottom
 */
function animateImageOverlay() {
  if (!imageOverlay || imageOverlayActive) return;
  
  imageOverlayActive = true;
  imageOverlay.style.top = '0vh';
  
  // After 2 seconds, move to bottom
  setTimeout(() => {
    imageOverlay.style.top = '100vh';
    
    // Remove overlay after animation completes
    setTimeout(() => {
      if (imageOverlay && imageOverlay.parentNode) {
        imageOverlay.parentNode.removeChild(imageOverlay);
        imageOverlay = null;
        imageOverlayActive = false;
        imageOverlayTargetReached = false;
        console.log('🖼️ Image overlay removed');
      }
    }, 2000);
  }, 2000);
}

/**
 * Animate image overlay from bottom to top
 */
function animateImageOverlayBottomUp() {
  if (!imageOverlay || imageOverlayActive) return;
  
  imageOverlayActive = true;
  imageOverlay.style.top = '0vh';
  
  // After 2 seconds, move back to bottom
  setTimeout(() => {
    imageOverlay.style.top = '100vh';
    
    // Remove overlay after animation completes
    setTimeout(() => {
      if (imageOverlay && imageOverlay.parentNode) {
        imageOverlay.parentNode.removeChild(imageOverlay);
        imageOverlay = null;
        imageOverlayActive = false;
        imageOverlayBottomUp = false;
        console.log('🖼️ Image overlay removed (bottom-up)');
      }
    }, 2000);
  }, 2000);
}

/**
 * Update image section visibility based on scroll progress
 * Since image is now part of scrollable content, we just track progress
 */
function updateImageOverlayPosition(scrollProgress) {
  if (!imageOverlay) return;
  
  // Apply easing to scroll progress (easeInOutCubic)
  const easedProgress = scrollProgress < 0.5 
    ? 4 * scrollProgress * scrollProgress * scrollProgress 
    : 1 - Math.pow(-2 * scrollProgress + 2, 3) / 2;
  
  // Clamp progress to 1.0 to prevent going beyond full reveal
  const clampedProgress = Math.min(easedProgress, 1.0);
  
  // Since image is now part of scrollable content, we don't need to position it
  // The scroll naturally reveals the image as user scrolls through it
  // We just track the progress for debugging and other systems
  
  // Update progress tracking
  imageScrollProgress = clampedProgress;
  
  console.debug(`🖼️ Image scroll progress: ${(clampedProgress * 100).toFixed(1)}% (natural scroll reveal)`);
}

// Function removed - now handled in createDocumentStructure()

/**
 * Update introduction text visibility based on scroll progress
 * Since text is now part of scrollable content, we just track progress
 */
function updateIntroTextPosition(scrollProgress) {
  if (!introTextSection) {
    console.log('📝 No intro text section to update');
    return;
  }
  
  // Apply easing to scroll progress (easeInOutCubic)
  const easedProgress = scrollProgress < 0.5 
    ? 4 * scrollProgress * scrollProgress * scrollProgress 
    : 1 - Math.pow(-2 * scrollProgress + 2, 3) / 2;
  
  // Clamp progress to 1.0 to prevent going beyond full reveal
  const clampedProgress = Math.min(easedProgress, 1.0);
  
  // Since text is now part of scrollable content, we don't need to position it
  // The scroll naturally reveals the text as user scrolls through it
  // We just track the progress for debugging and other systems
  
  // Update progress tracking
  introTextScrollProgress = clampedProgress;
  
  console.debug(`📝 Text scroll progress: ${(clampedProgress * 100).toFixed(1)}% (natural scroll reveal)`);
}

/**
 * Create custom scroll indicator
 */
function createScrollIndicator() {
  if (scrollIndicator) return; // Already exists
  
  scrollIndicator = document.createElement('div');
  scrollIndicator.id = 'custom-scroll-indicator';
  scrollIndicator.style.cssText = `
    position: fixed;
    top: 50%;
    right: 40px;
    transform: translateY(-50%);
    width: 4px;
    height: 120px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
    z-index: 10000;
    pointer-events: none;
  `;
  
  // Create progress bar
  const progressBar = document.createElement('div');
  progressBar.id = 'scroll-progress-bar';
  progressBar.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 0%;
    background: linear-gradient(180deg, #000 0%, #333 100%);
    border-radius: 2px;
    transition: height 0.1s ease-out;
  `;
  
  scrollIndicator.appendChild(progressBar);
  document.body.appendChild(scrollIndicator);
  scrollIndicatorActive = true;
  console.log('📊 Custom scroll indicator created');
}

/**
 * Update scroll indicator progress
 */
function updateScrollIndicator() {
  if (!scrollIndicator || !scrollIndicatorActive) return;
  
  const scrollY = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const scrollProgress = Math.min(scrollY / maxScroll, 1);
  
  const progressBar = document.getElementById('scroll-progress-bar');
  if (progressBar) {
    progressBar.style.height = `${scrollProgress * 100}%`;
  }
}

/**
 * Create overlay panel for scroll positions
 */
function createOverlayPanel() {
  if (overlayPanel) return; // Already exists
  
  overlayPanel = document.createElement('div');
  overlayPanel.id = 'overlay-panel';
  overlayPanel.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    width: 300px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px;
    border-radius: 12px;
    font-family: 'Object Sans', monospace;
    font-size: 12px;
    line-height: 1.4;
    z-index: 10001;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  `;
  
  const panelContent = `
    <div style="margin-bottom: 15px; font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.2); padding-bottom: 8px;">
      📊 Scroll Positions
    </div>
    <div id="scroll-positions">
      <div>Page Scroll: <span id="page-scroll">0%</span></div>
      <div>Auto Scroll: <span id="auto-scroll">Inactive</span></div>
      <div>Image Progress: <span id="image-progress">0%</span></div>
      <div>Text Progress: <span id="text-progress">0%</span></div>
      <div>Model Position: <span id="model-pos">Initial</span></div>
      <div>Camera Position: <span id="camera-pos">Initial</span></div>
    </div>
    <div style="margin-top: 15px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.2); font-size: 11px; opacity: 0.7;">
      Real-time monitoring
    </div>
  `;
  
  overlayPanel.innerHTML = panelContent;
  document.body.appendChild(overlayPanel);
  overlayPanelActive = true;
  console.log('📊 Overlay panel created');
}

/**
 * Update overlay panel with current positions
 */
function updateOverlayPanel() {
  if (!overlayPanel || !overlayPanelActive) return;
  
  // Calculate page scroll progress
  const scrollY = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const pageScrollProgress = Math.min(scrollY / maxScroll, 1);
  
  // Determine current stage
  let currentStage = 1;
  let stageProgress = 0;
  
  if (pageScrollProgress <= 0.25) {
    currentStage = 1;
    stageProgress = pageScrollProgress / 0.25;
  } else if (pageScrollProgress <= 0.75) {
    currentStage = 2;
    stageProgress = (pageScrollProgress - 0.25) / 0.50;
  } else {
    currentStage = 3;
    stageProgress = (pageScrollProgress - 0.75) / 0.25;
  }
  
  // Update page scroll
  const pageScrollElement = document.getElementById('page-scroll');
  if (pageScrollElement) {
    pageScrollElement.textContent = `${(pageScrollProgress * 100).toFixed(1)}%`;
  }
  
  // Update model scroll status
  const autoScrollElement = document.getElementById('auto-scroll');
  if (autoScrollElement) {
    if (pageScrollProgress <= 0.25) {
      // Show animation progress (0-100%) during Stage 1
      const animationProgress = (pageScrollProgress / 0.25) * 100;
      autoScrollElement.textContent = `${animationProgress.toFixed(1)}%`;
      autoScrollElement.style.color = '#4ade80';
    } else {
      autoScrollElement.textContent = 'Complete';
      autoScrollElement.style.color = '#4ade80';
    }
  }
  
  // Update image progress
  const imageProgressElement = document.getElementById('image-progress');
  if (imageProgressElement) {
    const imageProgress = currentStage >= 2 ? stageProgress * 100 : 0;
    imageProgressElement.textContent = `${imageProgress.toFixed(1)}%`;
  }
  
  // Update text progress
  const textProgressElement = document.getElementById('text-progress');
  if (textProgressElement) {
    const textProgress = currentStage >= 3 ? stageProgress * 100 : 0;
    textProgressElement.textContent = `${textProgress.toFixed(1)}%`;
  }
  
  // Update model position
  const modelPosElement = document.getElementById('model-pos');
  if (modelPosElement && model) {
    const pos = model.position;
    modelPosElement.textContent = `X:${pos.x.toFixed(2)} Y:${pos.y.toFixed(2)} Z:${pos.z.toFixed(2)}`;
  }
  
  // Update camera position
  const cameraPosElement = document.getElementById('camera-pos');
  if (cameraPosElement && camera) {
    const pos = camera.position;
    cameraPosElement.textContent = `X:${pos.x.toFixed(2)} Y:${pos.y.toFixed(2)} Z:${pos.z.toFixed(2)}`;
  }
}



/**
 * Handle scroll behavior during model animation phase
 * Detects first scroll and plays animation to 100% at same position
 */
function handleModelScrollBehavior(scrollY) {
  // Detect first scroll event
  if (!userScrollTriggered && scrollY > 0) {
    userScrollTriggered = true;
    console.log('⬇️ First scroll detected - starting model animation to 100%');
    
    // Prevent page from scrolling further
    document.body.style.overflow = 'hidden';
    
    // Start the animation that plays to 100%
    startModelAnimationTo100();
  }
  
  // Keep page at initial position during animation
  if (userScrollTriggered && !modelScrollCompleted && window.scrollY > 0) {
    window.scrollTo({
      top: 0,
      behavior: 'auto'
    });
  }
}

/**
 * Start model animation that plays to 100% completion
 */
function startModelAnimationTo100() {
  if (isModelAnimationPlaying || !model || !scrollAnimation) return;
  
  isModelAnimationPlaying = true;
  console.log('🎬 Starting model animation to 100% completion');
  
  // Capture current state if not already captured
  if (!scrollAnimationStarted) {
    captureScrollStartState();
  }
  
  // Get start and target states
  const startPos = scrollStartPosition;
  const targetPos = scrollTargetConfig.model.position;
  const startRot = scrollStartRotation;
  const targetRot = scrollTargetConfig.model.rotation;
  const startScale = scrollStartScale;
  const targetScale = scrollTargetConfig.model.scale;
  
  const startCam = defaultConfig.camera;
  const targetCam = scrollTargetConfig.camera;
  
  // Start time for animation
  const startTime = Date.now();
  
  // Model animation loop
  function animateModel() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / autoScrollDuration, 1);
    
    // Apply easing (easeInOutCubic)
    const easedProgress = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    modelAnimationProgress = easedProgress;
    
    // Update model position with easing
    model.position.x = startPos.x + (targetPos.x - startPos.x) * easedProgress;
    model.position.y = startPos.y + (targetPos.y - startPos.y) * easedProgress;
    model.position.z = startPos.z + (targetPos.z - startPos.z) * easedProgress;
    
    // Update model rotation with easing
    model.rotation.x = startRot.x + (targetRot.x - startRot.x) * easedProgress;
    model.rotation.y = startRot.y + (targetRot.y - startRot.y) * easedProgress;
    model.rotation.z = startRot.z + (targetRot.z - startRot.z) * easedProgress;
    
    // Update model scale with easing
    model.scale.setScalar(startScale + (targetScale - startScale) * easedProgress);
    
    // Update camera position with easing
    if (camera) {
      camera.position.x = startCam.x + (targetCam.x - startCam.x) * easedProgress;
      camera.position.y = startCam.y + (targetCam.y - startCam.y) * easedProgress;
      camera.position.z = startCam.z + (targetCam.z - startCam.z) * easedProgress;
    }
    
    // Update model animations if available
    if (scrollAnimation && animations.length > 0) {
      const animationTime = easedProgress * animations[0].duration;
      scrollAnimation.time = animationTime;
      if (mixer) mixer.update(0);
    }
    
    // Update control panel sliders
    updateControlSliders();
    
    // Continue animation if not complete
    if (progress < 1) {
      requestAnimationFrame(animateModel);
    } else {
      // Animation complete
      console.log('✅ Model animation completed to 100%');
      
      // Mark model scroll as completed
      modelScrollCompleted = true;
      
      // Re-enable page scrolling
      document.body.style.overflow = 'auto';
      console.log('🔓 Page scrolling enabled - user can now scroll the page');
      
      // Reset animation state
      isModelAnimationPlaying = false;
    }
  }
  
  // Start the animation
  requestAnimationFrame(animateModel);
}

/**
 * Update model animation based on scroll progress
 */
function updateModelAnimationFromScroll(scrollProgress) {
  if (!model || !scrollAnimation) return;
  
  // Capture current state if not already captured
  if (!scrollAnimationStarted) {
    captureScrollStartState();
  }
  
  // Get start and target states
  const startPos = scrollStartPosition;
  const targetPos = scrollTargetConfig.model.position;
  const startRot = scrollStartRotation;
  const targetRot = scrollTargetConfig.model.rotation;
  const startScale = scrollStartScale;
  const targetScale = scrollTargetConfig.model.scale;
  
  const startCam = defaultConfig.camera;
  const targetCam = scrollTargetConfig.camera;
  
  // Apply easing to scroll progress
  const easedProgress = scrollProgress < 0.5 
    ? 4 * scrollProgress * scrollProgress * scrollProgress 
    : 1 - Math.pow(-2 * scrollProgress + 2, 3) / 2;
  
  // Update model position with easing
  model.position.x = startPos.x + (targetPos.x - startPos.x) * easedProgress;
  model.position.y = startPos.y + (targetPos.y - startPos.y) * easedProgress;
  model.position.z = startPos.z + (targetPos.z - startPos.z) * easedProgress;
  
  // Update model rotation with easing
  model.rotation.x = startRot.x + (targetRot.x - startRot.x) * easedProgress;
  model.rotation.y = startRot.y + (targetRot.y - startRot.y) * easedProgress;
  model.rotation.z = startRot.z + (targetRot.z - startRot.z) * easedProgress;
  
  // Update model scale with easing
  model.scale.setScalar(startScale + (targetScale - startScale) * easedProgress);
  
  // Update camera position with easing
  if (camera) {
    camera.position.x = startCam.x + (targetCam.x - startCam.x) * easedProgress;
    camera.position.y = startCam.y + (targetCam.y - startCam.y) * easedProgress;
    camera.position.z = startCam.z + (targetCam.z - startCam.z) * easedProgress;
  }
  
  // Update model animations if available
  if (scrollAnimation && animations.length > 0) {
    const animationTime = easedProgress * animations[0].duration;
    scrollAnimation.time = animationTime;
    if (mixer) mixer.update(0);
  }
  
  // Update control panel sliders
  updateControlSliders();
  
  // Check if animation is complete (scroll reached 100% of stage 1)
  if (scrollProgress >= 1) {
    modelScrollCompleted = true;
    console.log('✅ Model animation completed - user can now continue scrolling');
  }
}

/**
 * Start model animation based on user scroll direction
 */
function startModelAnimation() {
  if (isModelAnimationPlaying || !model || !scrollAnimation) return;
  
  isModelAnimationPlaying = true;
  console.log(`🎬 Starting model animation (direction: ${animationDirection > 0 ? 'forward' : 'reverse'})`);
  
  // Disable user scrolling during animation
  document.body.style.overflow = 'hidden';
  
  // Capture current state if not already captured
  if (!scrollAnimationStarted) {
    captureScrollStartState();
  }
  
  // Get start and target states
  const startPos = scrollStartPosition;
  const targetPos = scrollTargetConfig.model.position;
  const startRot = scrollStartRotation;
  const targetRot = scrollTargetConfig.model.rotation;
  const startScale = scrollStartScale;
  const targetScale = scrollTargetConfig.model.scale;
  
  const startCam = defaultConfig.camera;
  const targetCam = scrollTargetConfig.camera;
  
  // Start time for animation
  const startTime = Date.now();
  
  // Model animation loop
  function animateModel() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / autoScrollDuration, 1);
    
    // Apply easing (easeInOutCubic)
    const easedProgress = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    // Apply direction
    const finalProgress = animationDirection > 0 ? easedProgress : (1 - easedProgress);
    modelAnimationProgress = finalProgress;
    
    // Update model position with easing
    model.position.x = startPos.x + (targetPos.x - startPos.x) * finalProgress;
    model.position.y = startPos.y + (targetPos.y - startPos.y) * finalProgress;
    model.position.z = startPos.z + (targetPos.z - startPos.z) * finalProgress;
    
    // Update model rotation with easing
    model.rotation.x = startRot.x + (targetRot.x - startRot.x) * finalProgress;
    model.rotation.y = startRot.y + (targetRot.y - startRot.y) * finalProgress;
    model.rotation.z = startRot.z + (targetRot.z - startRot.z) * finalProgress;
    
    // Update model scale with easing
    model.scale.setScalar(startScale + (targetScale - startScale) * finalProgress);
    
    // Update camera position with easing
    if (camera) {
      camera.position.x = startCam.x + (targetCam.x - startCam.x) * finalProgress;
      camera.position.y = startCam.y + (targetCam.y - startCam.y) * finalProgress;
      camera.position.z = startCam.z + (targetCam.z - startCam.z) * finalProgress;
    }
    
    // Update model animations if available
    if (scrollAnimation && animations.length > 0) {
      const animationTime = finalProgress * animations[0].duration;
      scrollAnimation.time = animationTime;
      if (mixer) mixer.update(0);
    }
    
    // Update control panel sliders
    updateControlSliders();
    
    // Continue animation if not complete
    if (progress < 1) {
      requestAnimationFrame(animateModel);
    } else {
      // Animation complete
      console.log(`✅ Model animation completed (${animationDirection > 0 ? 'forward' : 'reverse'})`);
      
      // If animation completed forward (100%), allow continued scrolling
      if (animationDirection > 0 && finalProgress >= 1) {
        modelScrollCompleted = true;
        document.body.style.overflow = 'auto';
        console.log('🔓 Model animation completed - user can now scroll the page');
      }
      
      // Reset animation state
      isModelAnimationPlaying = false;
      userScrollTriggered = false;
    }
  }
  
  // Start the animation
  requestAnimationFrame(animateModel);
}

/**
 * Start model-scroll to target position with easing
 */
function startAutoScroll() {
  if (autoScrollStarted || !model) return;
  
  autoScrollStarted = true;
  console.log('🎬 Starting model-scroll to target position');
  
  // Disable user scrolling during auto-animation
  document.body.style.overflow = 'hidden';
  console.log('🔒 User scrolling disabled during auto-animation');
  
  // Capture current state if not already captured
  if (!scrollAnimationStarted) {
    captureScrollStartState();
  }
  
  // Get start and target states
  const startPos = scrollStartPosition;
  const targetPos = scrollTargetConfig.model.position;
  const startRot = scrollStartRotation;
  const targetRot = scrollTargetConfig.model.rotation;
  const startScale = scrollStartScale;
  const targetScale = scrollTargetConfig.model.scale;
  
  const startCam = defaultConfig.camera;
  const targetCam = scrollTargetConfig.camera;
  
  // Start time for scroll animation
  const startTime = Date.now();
  
  // Auto-scroll animation
  function autoScroll() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / autoScrollDuration, 1);
    
    // Apply easing (easeInOutCubic)
    const easedProgress = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    // Calculate scroll position (scroll to 25% of page height for Stage 1 completion)
    const targetScrollY = (document.body.scrollHeight - window.innerHeight) * 0.25;
    const currentScrollY = easedProgress * targetScrollY;
    
    // Perform smooth scroll
    window.scrollTo({
      top: currentScrollY,
      behavior: 'auto' // Use 'auto' for smooth animation control
    });
    
    // Update model position with easing
    model.position.x = startPos.x + (targetPos.x - startPos.x) * easedProgress;
    model.position.y = startPos.y + (targetPos.y - startPos.y) * easedProgress;
    model.position.z = startPos.z + (targetPos.z - startPos.z) * easedProgress;
    
    // Update model rotation with easing
    model.rotation.x = startRot.x + (targetRot.x - startRot.x) * easedProgress;
    model.rotation.y = startRot.y + (targetRot.y - startRot.y) * easedProgress;
    model.rotation.z = startRot.z + (targetRot.z - startRot.z) * easedProgress;
    
    // Update model scale with easing
    model.scale.setScalar(startScale + (targetScale - startScale) * easedProgress);
    
    // Update camera position with easing
    if (camera) {
      camera.position.x = startCam.x + (targetCam.x - startCam.x) * easedProgress;
      camera.position.y = startCam.y + (targetCam.y - startCam.y) * easedProgress;
      camera.position.z = startCam.z + (targetCam.z - startCam.z) * easedProgress;
    }
    
    // Update model animations if available
    if (scrollAnimation && animations.length > 0) {
      const animationTime = easedProgress * animations[0].duration;
      scrollAnimation.time = animationTime;
      if (mixer) mixer.update(0);
    }
    
    // Update control panel sliders
    updateControlSliders();
    
    // Continue auto-scroll if not complete
    if (progress < 1) {
      requestAnimationFrame(autoScroll);
    } else {
      // Model-scroll complete
      console.log('✅ Model-scroll completed to 100%');
      
      // Re-enable user scrolling after auto-animation completes
      document.body.style.overflow = 'auto';
      console.log('🔓 User scrolling re-enabled - ready for manual scroll');
      
      // Image and text sections are already created as part of document structure
      if (!imageOverlayTargetReached) {
        imageOverlayTargetReached = true;
        console.log('🖼️ Image section ready for scroll-controlled animation');
      }
      
      // Reset flag after a short delay to ensure smooth transition
      setTimeout(() => {
        autoScrollStarted = false; // Reset flag so GSAP can resume
        modelScrollCompleted = true; // Mark model scroll as permanently completed
      }, 100);
    }
  }
  
  // Start the auto-scroll
  requestAnimationFrame(autoScroll);
}

/**
 * Update control panel sliders to reflect current model/camera values
 * Used during scroll animation to keep UI in sync
 */
function updateControlSliders() {
  // Update camera sliders
  const cameraX = document.getElementById('cameraX');
  const cameraY = document.getElementById('cameraY');
  const cameraZ = document.getElementById('cameraZ');
  
  if (camera) {
    if (cameraX) cameraX.value = camera.position.x;
    if (cameraY) cameraY.value = camera.position.y;
    if (cameraZ) cameraZ.value = camera.position.z;
  }
  
  // Update model sliders
  const modelX = document.getElementById('modelX');
  const modelY = document.getElementById('modelY');
  const modelZ = document.getElementById('modelZ');
  const rotationX = document.getElementById('rotationX');
  const rotationY = document.getElementById('rotationY');
  const rotationZ = document.getElementById('rotationZ');
  const modelScale = document.getElementById('modelScale');
  
  if (model) {
    if (modelX) modelX.value = model.position.x;
    if (modelY) modelY.value = model.position.y;
    if (modelZ) modelZ.value = model.position.z;
    if (rotationX) rotationX.value = model.rotation.x;
    if (rotationY) rotationY.value = model.rotation.y;
    if (rotationZ) rotationZ.value = model.rotation.z;
    if (modelScale) modelScale.value = model.scale.x; // Assuming uniform scaling
  }
}

/**
 * Handle window resize for 3D canvas
 */
function onWindowResize() {
  if (renderer && camera) {
    // Use full viewport dimensions
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Maintain pixel ratio on resize
    camera.aspect = canvasWidth / canvasHeight;
    camera.updateProjectionMatrix();
  }
}

window.addEventListener('resize', onWindowResize);

// Add scroll event listener for custom indicator and overlay panel
window.addEventListener('scroll', () => {
  updateScrollIndicator();
  updateOverlayPanel();
});

/**
 * Word Animation (existing code)
 */
function initWordAnimation() {
  // Step 1: Split text into words
  const el = document.getElementById('loader-text');
  if (!el) return;
  
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
}

/**
 * Initialize main application
 */
function initApp() {
  console.log('🚀 Initializing 3D Viewer Application...');
  
  // Create main document structure
  createDocumentStructure();
  
  // Initialize loading animation
  startLoadingAnimation();
  
  // Initialize 3D model
  init3DModel();
  
  // Initialize overlay menu
  initOverlayMenu();
  
  // Initialize word animation
  initWordAnimation();
  
  // Preload image for overlay system
  const img = new Image();
  img.src = 'assets/IMG5.jpeg';
  img.onload = () => {
    console.log('🖼️ Image preloaded for overlay system');
  };
  
  // Create custom scroll indicator
  createScrollIndicator();
  
  // Create overlay panel
  createOverlayPanel();
  
  // Hide UI elements initially
  hideUIElements();
  
  console.log('✅ 3D Viewer Application initialized successfully');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);



/**
 * Hide UI elements (scroll indicator, mouse info, overlay panel, gear icon)
 */
function hideUIElements() {
  // Hide scroll indicator
  if (scrollIndicator) {
    scrollIndicator.style.display = 'none';
    scrollIndicatorActive = false;
  }
  
  // Hide mouse info and prevent it from showing on pointer events
  if (mouseInfo) {
    mouseInfo.style.display = 'none';
    // Add a flag to prevent showing on pointer events
    mouseInfo.dataset.hidden = 'true';
  }
  
  // Hide overlay panel
  if (overlayPanel) {
    overlayPanel.style.display = 'none';
    overlayPanelActive = false;
  }
  
  // Hide gear icon (control toggle)
  const controlToggle = document.getElementById('controlToggle');
  if (controlToggle) {
    controlToggle.style.display = 'none';
  }
  
  console.log('👁️ UI elements hidden');
}

/**
 * Show UI elements (scroll indicator, mouse info, overlay panel, gear icon)
 */
function showUIElements() {
  // Show scroll indicator
  if (scrollIndicator) {
    scrollIndicator.style.display = 'block';
    scrollIndicatorActive = true;
  }
  
  // Show mouse info and enable pointer events
  if (mouseInfo) {
    mouseInfo.style.display = 'block';
    // Remove the hidden flag to allow showing on pointer events
    delete mouseInfo.dataset.hidden;
  }
  
  // Show overlay panel
  if (overlayPanel) {
    overlayPanel.style.display = 'block';
    overlayPanelActive = true;
  }
  
  // Show gear icon (control toggle)
  const controlToggle = document.getElementById('controlToggle');
  if (controlToggle) {
    controlToggle.style.display = 'block';
  }
  
  console.log('👁️ UI elements shown');
}

// Export functions for potential external use
export {
  initApp,
  getCurrentState,
  applyState,
  soundManager,
  hideUIElements,
  showUIElements
};