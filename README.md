# KAO Furniture - Interactive 3D Viewer with Scroll Animation

A sophisticated 3D furniture viewer with scroll-triggered animations, image reveals, and introduction text. Built with Three.js, GSAP ScrollTrigger, and modern web technologies. Perfect for furniture studios showcasing their work with an engaging, interactive experience.

## Project Structure

```
kao_web/
├── assets/
│   ├── kaoblack.png
│   └── outline.svg
├── models/
│   └── form.glb          # 3D furniture model (39MB)
├── index.html            # Main page with loader
├── style.css             # Clean styling
├── script.js             # Animation & 3D logic
└── README.md             # This file
```

## Website Structure & User Experience

### 1. Initial Load & 3D Model Display
- **Loading Animation**: ".KAO FURNITURE" text animates with staggered timing
- **3D Model**: `form.glb` furniture model loads and displays with auto-rotation
- **Subtitle**: "Furniture Studio Woodworking School Tbilisi, Georgia." remains visible
- **Clean Interface**: Minimal design with professional aesthetics

### 2. Scroll-Triggered Auto Animation
- **Scroll Detection**: Any scroll movement triggers automatic animation
- **Auto-Play**: 3-second smooth animation to target configuration with easing
- **Scroll Disabled**: User cannot scroll during auto animation
- **Target Configuration**: Model animates to predefined position, rotation, and scale
- **Easing**: EaseInOutCubic for natural, professional motion
- **Stage 1**: 0-33% of total scroll height (auto animation)
- **Animation Sensitivity**: Model animation completes at 100% when page scroll reaches 33%

### 3. Image5 Reveal (Scroll-Controlled)
- **Manual Control**: After auto animation, user controls image reveal with scroll
- **Image5**: Dining room image (`assets/IMG5.jpeg`) reveals from bottom to top
- **Full Reveal**: Image height 200vh, reveals complete dining room scene
- **Smooth Easing**: EaseInOutCubic easing applied to scroll input
- **Real-time**: Immediate response to scroll changes
- **Stage 2**: 33-66% of total scroll height (image reveal)

### 4. Introduction Text Section
- **Seamless Transition**: Text appears as user scrolls past image5
- **Layout**: Fixed positioning with 200px padding from image
- **Content**: Kao Furniture Studio introduction with Georgian woodworking history
- **Typography**: Professional layout with Object Sans font
- **Dimensions**: Text container width: 1027px, height: 1127px
- **Typography**: 40px font size, 61px line height, 400 font weight
- **Clean Layout**: Text-only content without title or navigation buttons
- **Stage 3**: 66-100% of total scroll height (text reveal)

### Interactive 3D Controls
- **Real-time Manipulation**: Adjust camera and model properties instantly
- **Camera Position**: X, Y, Z sliders for camera positioning
- **Model Position**: X, Y, Z sliders for model positioning  
- **Model Rotation**: X, Y, Z rotation controls (0 to 2π radians)
- **Model Scale**: Uniform scaling from 0.1x to 5x size
- **Reset Function**: Restore all original values with one click

### State Management
- **📋 Copy State**: Captures current 3D configuration as JSON
- **📥 Paste State**: Restores configuration from JSON
- **Shareable Configs**: Copy and share specific viewing angles
- **JSON Format**: Clean, readable state format with metadata
- **Visual Feedback**: Success/error indicators for operations
- **Version Control**: States include timestamp and version info

### Complete User Journey
1. **Page Load**: Loading animation with ".KAO FURNITURE" text and 3D model
2. **Initial State**: 3D model rotates automatically in center viewport
3. **Stage 1 (0-33%)**: User scrolls → Auto animation starts (3 seconds to target)
4. **Stage 2 (33-66%)**: User continues scrolling → Image5 reveals from bottom to top
5. **Stage 3 (66-100%)**: User scrolls past image → Introduction text appears with 200px padding
6. **Reading Experience**: User reads text in 1027px × 1127px container with 40px font size

### 3D Model Display
- **Three.js Integration**: Uses Three.js r152 with GLTFLoader
- **DRACO Compression**: Supports compressed GLB models
- **Full Viewport**: Model fills entire browser window
- **Proper Lighting**: Ambient and directional lighting for realistic appearance
- **Shadow Support**: Enabled shadow mapping for depth
- **Auto-Rotation**: Model rotates automatically until scroll is engaged
- **Scroll Animation**: Smooth transition to target configuration with easing

## How to Use

### Local Development Server (Required for GLB loading)
```bash
# Using Python (recommended)
python -m http.server 3000

# Using Node.js
npx serve . -p 3000
```

Then visit `http://localhost:3000/`

**Note**: The 3D model requires a local server due to CORS restrictions on GLB file loading.

## 3D Control Panel

### Opening Controls
1. **Wait for model to load** after the loading animation
2. **Click the 🎛️ button** in the top-right corner
3. **Use sliders** to adjust camera and model properties
4. **Click × to close** the panel

### State Management Workflow
1. **Adjust 3D settings** using the control sliders
2. **Click "📋 Copy State"** to capture current configuration
3. **Share the JSON** with others or save for later
4. **Paste JSON** into the textarea and click "📥 Paste State" to restore

### Example State JSON
```json
{
  "version": "1.0",
  "timestamp": "2025-01-29T18:35:06.123Z",
  "camera": {
    "x": 0,
    "y": 0,
    "z": 2
  },
  "model": {
    "position": { "x": 0, "y": 0, "z": 0 },
    "rotation": { "x": 0, "y": 1.5, "z": 0 },
    "scale": 1.5
  }
}
```

## Technical Details

### Dependencies
- **Anime.js 3.2.1**: Word animation
- **Three.js r152**: 3D model rendering
- **GSAP 3.12.2**: ScrollTrigger for smooth scroll animations
- **DRACOLoader**: Loading compressed .glb models
- **Object Sans Font**: Typography
- **Inter Font**: Main text

### 3D Model Specifications
- **File**: `models/form.glb` (39MB DRACO-compressed)
- **Canvas Size**: Full viewport (100vw × 100vh)
- **Camera**: PerspectiveCamera with 75° FOV
- **Lighting**: Ambient (0.6) + Directional (0.8)
- **Position**: Center viewport with auto-rotation
- **Interaction**: Auto-rotation until scroll, then animated to target position
- **Target Config**: Predefined position, rotation, and scale for scroll animation

### Animation Timing & Scroll Behavior
- **3D Model**: Loads immediately and rotates automatically
- **Word Animation**: 1000ms duration with 150ms stagger
- **Auto Animation**: 3 seconds with EaseInOutCubic easing
- **Image Reveal**: Scroll-controlled with real-time easing
- **Text Section**: Appears with 200px padding after image
- **Scroll Height**: 300vh total for 3 distinct stages

### State Management
- **Format**: JSON with version and timestamp
- **Storage**: Browser clipboard API
- **Validation**: JSON parsing with error handling
- **Feedback**: Visual success/error indicators
- **Persistence**: States can be saved and shared externally

### Performance & Scroll Experience
- **3D Rendering**: 60fps WebGL with hardware acceleration
- **Model Optimization**: DRACO compression for reduced file size
- **Scroll Performance**: Smooth 60fps scroll animations with easing
- **Image Loading**: Preloaded for instant reveal
- **Responsive Controls**: Auto-resize with viewport changes
- **Memory Management**: Proper cleanup and disposal

## Customization

### 3D Model
Replace `models/form.glb` with your own GLB file:

```
