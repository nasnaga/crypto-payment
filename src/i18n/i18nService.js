import { translations } from './translations.js';

class I18nService {
  constructor() {
    this.currentLanguage = 'en';
    this.translations = translations;
  }

  init() {
    // Check for saved language preference
    const savedLanguage = localStorage.getItem('language');

    // Use saved language or browser language
    if (savedLanguage && this.translations[savedLanguage]) {
      this.currentLanguage = savedLanguage;
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (this.translations[browserLang]) {
        this.currentLanguage = browserLang;
      }
    }

    this.applyTranslations();
  }

  setLanguage(lang) {
    if (!this.translations[lang]) {
      console.error(`Language ${lang} not found`);
      return;
    }

    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
    this.applyTranslations();
  }

  translate(key) {
    return this.translations[this.currentLanguage][key] || key;
  }

  applyTranslations() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.translate(key);

      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.value = translation;
      } else {
        element.textContent = translation;
      }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const translation = this.translate(key);
      element.placeholder = translation;
    });

    // Update HTML lang attribute
    document.documentElement.lang = this.currentLanguage;
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }
}

// Create and export a single instance
export const i18nService = new I18nService();
