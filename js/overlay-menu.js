/**
 * Universal Overlay Menu System
 * Handles full-screen overlay menu with animations
 * Usage: import { initOverlayMenu } from './js/overlay-menu.js'
 */

import { soundManager } from './sound.js';

/**
 * Initialize overlay menu functionality
 * Requires HTML elements with IDs: subtitle-trigger, overlay-menu, overlay-close
 */
export function initOverlayMenu() {
  const subtitleTrigger = document.getElementById('subtitle-trigger');
  const overlayMenu = document.getElementById('overlay-menu');
  const overlayClose = document.getElementById('overlay-close');
  
  // Validate required elements exist
  if (!subtitleTrigger || !overlayMenu || !overlayClose) {
    console.warn('⚠️ Overlay menu elements not found. Required IDs: subtitle-trigger, overlay-menu, overlay-close');
    return false;
  }

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
  
  // Add click sounds to menu items and setup animations
  const menuItems = overlayMenu.querySelectorAll('.menu-item');
  
  // Add click sound to menu items
  menuItems.forEach(item => {
    soundManager.addToElement(item);
  });
  
  // Animate menu items on open using MutationObserver
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.classList.contains('active')) {
        // Reset and animate each menu item
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
  
  console.log('✅ Overlay menu initialized successfully');
  return true;
}

// Auto-initialize if DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Only auto-init if elements exist (allows manual control)
  if (document.getElementById('subtitle-trigger')) {
    initOverlayMenu();
  }
});

// For non-module usage (fallback)
if (typeof window !== 'undefined') {
  window.KaoOverlayMenu = { initOverlayMenu };
}