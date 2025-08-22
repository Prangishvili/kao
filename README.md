# KAO Furniture - Interactive 3D Web Experience

A sophisticated multi-page web application showcasing KAO Furniture Studio's work through interactive 3D models, scroll-triggered animations, and modern web technologies. Built with Three.js, GSAP ScrollTrigger, and modular JavaScript architecture.

## 🏗️ Project Structure

```
kao web/
├── 📄 HTML Pages
│   ├── index.html              # Main 3D viewer with scroll animations
│   ├── about.html              # Product showcase with split layout
│   ├── projects.html           # Portfolio grid with sidebar
│   └── kao-loading-minimal.html # Minimal loading page
│
├── 🎨 Styling & Assets
│   ├── style.css               # Comprehensive CSS for all pages
│   ├── assets/
│   │   └── IMG5.jpeg           # Dining room image (6MB)
│   └── sprite/
│       ├── audiomass-output 1.wav  # Click sound 1 (14KB)
│       └── audiomass-output 2.wav  # Click sound 2 (29KB)
│
├── 🎮 JavaScript Modules
│   ├── js/
│   │   ├── script.js           # Main 3D viewer logic (1866 lines)
│   │   ├── about.js            # About page interactions (114 lines)
│   │   ├── projects.js         # Projects page functionality (98 lines)
│   │   ├── sound.js            # Universal sound manager (168 lines)
│   │   └── overlay-menu.js     # Navigation menu system (90 lines)
│   └── script-old.js           # Legacy 3D viewer (852 lines)
│
├── 🎯 3D Models
│   ├── models/
│   │   ├── form.glb            # Main furniture model (8.5MB)
│   │   └── form2.glb           # Alternative model (23MB)
│   └── untitled.glb            # Additional model file
│
└── 📚 Documentation
    ├── README.md               # This comprehensive guide
    ├── ANIMATION_SYSTEM.md     # Scroll animation documentation
    └── SOUND_SYSTEM.md         # Audio system documentation
```

## 🌟 Key Features

### **Interactive 3D Viewer (index.html)**
- **Three.js Integration**: Full 3D model rendering with WebGL
- **Scroll-Triggered Animations**: GSAP ScrollTrigger for smooth model transitions
- **Real-time Controls**: Camera, position, rotation, and scale adjustments
- **State Management**: Save/load 3D configurations as JSON
- **Auto-Rotation**: Smooth model rotation with manual override
- **Mouse Interaction**: Drag controls and raycasting for model interaction
- **Loading Animation**: Staggered text animation with Anime.js

### **Product Showcase (about.html)**
- **Split Layout**: Image gallery with product information
- **Responsive Design**: Adapts to mobile and tablet screens
- **Interactive Elements**: Hover effects and click sounds
- **Social Integration**: Links to designer and studio social media
- **Product Details**: Tea tray collaboration information

### **Portfolio Grid (projects.html)**
- **Sticky Sidebar**: Navigation with project list
- **CSS Grid Layout**: Responsive image grid system
- **Interactive Grid**: Hover effects and click feedback
- **Project Listings**: Studio names and descriptions
- **Mobile Optimized**: Collapsible layout for smaller screens

### **Universal Systems**
- **Sound Manager**: Random click sounds with multiple variations
- **Overlay Menu**: Full-screen navigation with animations
- **Responsive Design**: Mobile-first approach across all pages
- **Performance Optimized**: Efficient loading and rendering

## 🎬 Animation System

### **Scroll-Triggered 3D Animation**
- **GSAP Integration**: Smooth scroll-to-animation synchronization
- **GLTF Animation Support**: Extracts and controls model animations
- **Fallback System**: Works without GSAP using native scroll events
- **Real-time Control**: Manual animation scrubbing via control panel

### **Loading Animations**
- **Text Staggering**: Word-by-word animation using Anime.js
- **Smooth Transitions**: Fade effects between loading and content
- **Performance Optimized**: Hardware-accelerated animations

### **Interactive Feedback**
- **Hover Effects**: Scale and opacity transitions
- **Click Animations**: Visual feedback with sound
- **Menu Animations**: Staggered item reveals

## 🔊 Sound System

### **Random Sound Selection**
- **Multiple Variations**: 2 different click sounds for variety
- **Smart Loading**: Asynchronous audio preloading
- **Cross-Page Compatibility**: Consistent sound across all pages
- **Performance Optimized**: Preloaded audio for instant playback

### **Integration Points**
- **UI Controls**: All buttons and interactive elements
- **Slider Feedback**: Throttled sound for smooth control adjustment
- **Menu Navigation**: Overlay menu interactions
- **Grid Interactions**: Portfolio item clicks

## 🎮 Control Panel (3D Viewer)

### **Camera Controls**
- **Position (X, Y, Z)**: Real-time camera positioning
- **Range**: -10 to +10 units with 0.1 precision
- **Live Updates**: Immediate visual feedback

### **Model Controls**
- **Position (X, Y, Z)**: Model positioning in 3D space
- **Rotation (X, Y, Z)**: Rotation controls in radians (0 to 2π)
- **Scale**: Uniform scaling from 0.1x to 5x
- **Auto-Rotation Toggle**: Enable/disable automatic rotation

### **State Management**
- **Copy State**: Export current configuration as JSON
- **Paste State**: Import and apply saved configurations
- **Reset Function**: Restore default settings
- **Visual Feedback**: Success/error indicators

### **Animation Controls**
- **Scroll Animation Toggle**: Enable/disable scroll-triggered animation
- **Animation Progress**: Manual scrubbing control
- **Real-time Feedback**: Live progress updates

## 📱 Responsive Design

### **Mobile Optimization**
- **Touch Controls**: Optimized for touch interaction
- **Adaptive Layouts**: Collapsible sidebars and grids
- **Performance**: Optimized rendering for mobile devices
- **Navigation**: Touch-friendly menu interactions

### **Breakpoint System**
- **Desktop**: Full feature set with control panel
- **Tablet**: Simplified controls with responsive grids
- **Mobile**: Streamlined interface with essential features

## 🛠️ Technical Stack

### **Frontend Technologies**
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with CSS Grid, Flexbox, and custom properties
- **JavaScript ES6+**: Modular architecture with async/await
- **Three.js r152**: 3D graphics and WebGL rendering
- **GSAP 3.12.2**: Professional animation library
- **Anime.js 3.2.1**: Lightweight animation library

### **3D & Graphics**
- **WebGL**: Hardware-accelerated 3D rendering
- **GLTFLoader**: Efficient 3D model loading
- **DRACOLoader**: Compressed model support
- **Raycasting**: Mouse interaction with 3D objects

### **Performance Features**
- **Module System**: ES6 modules for code organization
- **Lazy Loading**: Efficient resource management
- **Hardware Acceleration**: GPU-optimized rendering
- **Memory Management**: Proper cleanup and disposal

## 🚀 Getting Started

### **Local Development**
```bash
# Using Python (recommended)
python -m http.server 3000

# Using Node.js
npx serve . -p 3000

# Using PHP
php -S localhost:3000
```

Visit `http://localhost:3000/`

**Note**: 3D models require a local server due to CORS restrictions.

### **File Organization**
- **Modular JavaScript**: Each page has its own JS module
- **Shared Components**: Sound and menu systems are reusable
- **Asset Management**: Organized by type and purpose
- **Documentation**: Comprehensive guides for each system

## 🎯 User Experience Flow

### **Main Page (index.html)**
1. **Loading Animation**: Staggered text reveal
2. **3D Model Display**: Auto-rotating furniture model
3. **Scroll Interaction**: Model animates to target position
4. **Image Reveal**: Dining room image appears on scroll
5. **Text Section**: Introduction text with 200px padding
6. **Interactive Controls**: Full 3D manipulation panel

### **About Page (about.html)**
1. **Split Layout**: Image gallery with product details
2. **Interactive Elements**: Hover effects and click sounds
3. **Product Information**: Tea tray collaboration details
4. **Social Links**: Designer and studio connections

### **Projects Page (projects.html)**
1. **Sticky Sidebar**: Project navigation and descriptions
2. **Image Grid**: Portfolio showcase with hover effects
3. **Responsive Layout**: Adapts to screen size
4. **Interactive Grid**: Click feedback and animations

## 🔧 Customization

### **3D Model Replacement**
```javascript
// Update model path in script.js
loader.load('models/your-model.glb', function(gltf) {
  // Model loading logic
});
```

### **Sound System Extension**
```javascript
// Add new sounds in sound.js
this.availableSounds = [
  'sprite/audiomass-output 1.wav',
  'sprite/audiomass-output 2.wav',
  'sprite/your-new-sound.wav'  // Add here
];
```

### **Animation Configuration**
```javascript
// Adjust scroll animation in script.js
const scrollTargetConfig = {
  camera: { x: -0.5, y: -3.3, z: 3.9 },
  model: { position: { x: -0.8, y: -5.7, z: -8.9 } }
};
```

## 📊 Performance Metrics

### **File Sizes**
- **Main Model**: 8.5MB (form.glb)
- **Alternative Model**: 23MB (form2.glb)
- **Images**: 6MB total
- **Audio**: 43KB total
- **CSS**: 1078 lines, optimized
- **JavaScript**: 2336 lines total, modular

### **Loading Performance**
- **3D Model**: Loads asynchronously with progress tracking
- **Audio**: Preloaded for instant playback
- **Images**: Optimized for web delivery
- **Animations**: Hardware-accelerated rendering

## 🔮 Future Enhancements

### **Planned Features**
- **Multiple 3D Models**: Model switching system
- **Advanced Animations**: Complex animation sequences
- **User Accounts**: Saved configurations and preferences
- **E-commerce Integration**: Product purchasing system
- **AR/VR Support**: Extended reality experiences

### **Technical Improvements**
- **PWA Support**: Progressive web app features
- **Offline Capability**: Service worker implementation
- **Performance Monitoring**: Real-time metrics tracking
- **Accessibility**: Enhanced screen reader support

## 📝 Development Notes

### **Code Architecture**
- **Modular Design**: Reusable components across pages
- **Event-Driven**: Clean separation of concerns
- **Error Handling**: Graceful fallbacks and user feedback
- **Documentation**: Comprehensive inline comments

### **Browser Compatibility**
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Support**: iOS Safari, Chrome Mobile
- **Fallback Support**: Graceful degradation for older browsers
- **Performance**: Optimized for 60fps rendering

---

**Perfect for furniture studios, design agencies, and interactive product showcases! 🎨✨**

*Built with modern web technologies and optimized for performance and user experience.*
