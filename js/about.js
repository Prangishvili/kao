/**
 * About Page Functionality
 * Handles about-specific interactions and sound effects
 */

import { soundManager } from './sound.js';
import { initOverlayMenu } from './overlay-menu.js';

/**
 * Initialize about page functionality
 */
function initAboutPage() {
  console.log('📖 Initializing About page...');
  
  // Initialize overlay menu
  initOverlayMenu();
  
  // Add click sounds and enhanced interactions to social links
  const socialLinks = document.querySelectorAll('.social-link');
  socialLinks.forEach((link, index) => {
    // Enhanced hover effects
    link.style.transition = 'all 0.2s ease';
    link.style.position = 'relative';
    
    link.addEventListener('mouseenter', () => {
      link.style.transform = 'translateX(2px)';
      link.style.color = '#666';
    });
    
    link.addEventListener('mouseleave', () => {
      link.style.transform = 'translateX(0)';
      link.style.color = '#000';
    });
    
    // Add click sound
    link.addEventListener('click', () => {
      soundManager.playClick();
      console.log(`🔗 Social link ${index + 1} clicked:`, link.href);
    });
  });
  
  // Make logo interactive
  const logo = document.querySelector('.logo');
  if (logo) {
    logo.style.cursor = 'pointer';
    logo.style.transition = 'all 0.3s ease';
    
    logo.addEventListener('mouseenter', () => {
      logo.style.opacity = '0.8';
      logo.style.transform = 'scale(1.02)';
    });
    
    logo.addEventListener('mouseleave', () => {
      logo.style.opacity = '1';
      logo.style.transform = 'scale(1)';
    });
    
    logo.addEventListener('click', () => {
      soundManager.playClick();
      console.log('🏷️ Logo clicked');
      // Future: Add navigation to home or brand info
    });
  }
  
  // Add subtle interactions to content sections
  const contentSections = document.querySelectorAll('.content p');
  contentSections.forEach((paragraph, index) => {
    paragraph.style.transition = 'opacity 0.2s ease';
    
    paragraph.addEventListener('mouseenter', () => {
      paragraph.style.opacity = '0.9';
    });
    
    paragraph.addEventListener('mouseleave', () => {
      paragraph.style.opacity = '1';
    });
  });
  
  // Add interaction to images
  const images = document.querySelectorAll('.left-section img');
  images.forEach((img, index) => {
    img.style.transition = 'transform 0.3s ease, filter 0.3s ease';
    img.style.cursor = 'pointer';
    
    img.addEventListener('mouseenter', () => {
      img.style.transform = 'scale(1.02)';
      img.style.filter = 'brightness(1.05)';
    });
    
    img.addEventListener('mouseleave', () => {
      img.style.transform = 'scale(1)';
      img.style.filter = 'brightness(1)';
    });
    
    img.addEventListener('click', () => {
      soundManager.playClick();
      console.log(`🖼️ Image ${index + 1} clicked`);
      // Future: Add lightbox or gallery functionality
    });
  });
  
  console.log('✅ About page initialized successfully');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAboutPage);

// Export for manual initialization if needed
export { initAboutPage };

// For non-module usage (fallback)
if (typeof window !== 'undefined') {
  window.KaoAbout = { initAboutPage };
}