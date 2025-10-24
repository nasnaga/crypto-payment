// Main entry point for the application
import './styles/main.css';
import { CryptoPaymentApp } from './app.js';

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new CryptoPaymentApp();

  // Expose app instance globally for debugging (optional)
  if (import.meta.env.DEV) {
    window.app = app;
  }
});
