/**
 * Projects Page Functionality
 * Handles projects-specific interactions and sound effects
 */

import { soundManager } from './sound.js';
import { initOverlayMenu } from './overlay-menu.js';

/**
 * Initialize projects page functionality
 */
function initProjectsPage() {
  console.log('🎨 Initializing Projects page...');
  
  // Initialize overlay menu
  initOverlayMenu();
  
  // Add interactive click sounds to grid items
  const gridItems = document.querySelectorAll('.grid-item');
  gridItems.forEach((item, index) => {
    // Make grid items visually clickable
    item.style.cursor = 'pointer';
    item.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    
    // Add hover effects
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'scale(1.02)';
      item.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'scale(1)';
      item.style.boxShadow = 'none';
    });
    
    // Add click sound and future-ready click handler
    item.addEventListener('click', () => {
      soundManager.playClick();
      console.log(`🖼️ Grid item ${index + 1} clicked`);
      
      // Future: Add lightbox, navigation, or detail view here
      // For now, just provide visual feedback
      item.style.transform = 'scale(0.98)';
      setTimeout(() => {
        item.style.transform = 'scale(1.02)';
      }, 100);
    });
  });
  
  // Add click sound to projects title
  const projectsTitle = document.querySelector('.projects-title');
  if (projectsTitle) {
    projectsTitle.style.cursor = 'pointer';
    projectsTitle.style.transition = 'opacity 0.2s ease';
    
    projectsTitle.addEventListener('mouseenter', () => {
      projectsTitle.style.opacity = '0.8';
    });
    
    projectsTitle.addEventListener('mouseleave', () => {
      projectsTitle.style.opacity = '1';
    });
    
    projectsTitle.addEventListener('click', () => {
      soundManager.playClick();
      console.log('📋 Projects title clicked');
      // Future: Add functionality like filter toggle, search, etc.
    });
  }
  
  // Add subtle interaction to projects text
  const projectsText = document.querySelector('.projects-text');
  if (projectsText) {
    projectsText.style.cursor = 'default';
    projectsText.style.transition = 'opacity 0.3s ease';
    
    projectsText.addEventListener('mouseenter', () => {
      projectsText.style.opacity = '0.9';
    });
    
    projectsText.addEventListener('mouseleave', () => {
      projectsText.style.opacity = '1';
    });
  }
  
  console.log('✅ Projects page initialized successfully');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initProjectsPage);

// Export for manual initialization if needed
export { initProjectsPage };

// For non-module usage (fallback)
if (typeof window !== 'undefined') {
  window.KaoProjects = { initProjectsPage };
}