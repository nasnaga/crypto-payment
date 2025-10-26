import { describe, it, expect, beforeEach, vi } from 'vitest';
import { i18nService } from '../src/i18n/i18nService.js';

describe('I18nService', () => {
  beforeEach(() => {
    // Reset to default state
    i18nService.currentLanguage = 'en';
    localStorage.clear();
    document.documentElement.innerHTML = '<html><body></body></html>';
    vi.clearAllMocks();
  });

  describe('init()', () => {
    it('should default to English when no saved language', () => {
      i18nService.init();
      expect(i18nService.currentLanguage).toBe('en');
    });

    it('should use saved language from localStorage', () => {
      localStorage.setItem('language', 'es');
      i18nService.init();
      expect(i18nService.currentLanguage).toBe('es');
    });

    it('should detect browser language when available', () => {
      Object.defineProperty(window.navigator, 'language', {
        value: 'fr-FR',
        configurable: true,
      });
      i18nService.init();
      expect(i18nService.currentLanguage).toBe('fr');
    });

    it('should prioritize saved language over browser language', () => {
      localStorage.setItem('language', 'ja');
      Object.defineProperty(window.navigator, 'language', {
        value: 'es-ES',
        configurable: true,
      });
      i18nService.init();
      expect(i18nService.currentLanguage).toBe('ja');
    });

    it('should ignore unsupported saved language', () => {
      // Reset browser language to something not in translations
      Object.defineProperty(window.navigator, 'language', {
        value: 'de-DE',
        configurable: true,
      });
      localStorage.setItem('language', 'unsupported');
      i18nService.init();
      expect(i18nService.currentLanguage).toBe('en');
    });
  });

  describe('setLanguage()', () => {
    it('should change language successfully', () => {
      i18nService.setLanguage('es');
      expect(i18nService.currentLanguage).toBe('es');
      expect(localStorage.setItem).toHaveBeenCalledWith('language', 'es');
    });

    it('should save language to localStorage', () => {
      i18nService.setLanguage('fr');
      expect(localStorage.setItem).toHaveBeenCalledWith('language', 'fr');
    });

    it('should not change language for unsupported language code', () => {
      i18nService.currentLanguage = 'en';
      i18nService.setLanguage('invalid');
      expect(i18nService.currentLanguage).toBe('en');
      expect(console.error).toHaveBeenCalledWith('Language invalid not found');
    });

    it('should apply translations after language change', () => {
      const element = document.createElement('div');
      element.setAttribute('data-i18n', 'appTitle');
      document.body.appendChild(element);

      i18nService.setLanguage('es');
      expect(element.textContent).toBe('Pasarela de Pago Cripto');
    });
  });

  describe('translate()', () => {
    it('should translate key in current language', () => {
      i18nService.currentLanguage = 'en';
      expect(i18nService.translate('appTitle')).toBe('Crypto Payment Gateway');
    });

    it('should translate key in Spanish', () => {
      i18nService.currentLanguage = 'es';
      expect(i18nService.translate('appTitle')).toBe('Pasarela de Pago Cripto');
    });

    it('should return key if translation not found', () => {
      expect(i18nService.translate('nonExistentKey')).toBe('nonExistentKey');
    });

    it('should translate in Japanese', () => {
      i18nService.currentLanguage = 'ja';
      expect(i18nService.translate('connected')).toBe('接続済み');
    });

    it('should translate in Chinese', () => {
      i18nService.currentLanguage = 'zh';
      expect(i18nService.translate('connected')).toBe('已连接');
    });
  });

  describe('applyTranslations()', () => {
    it('should update text content for elements with data-i18n', () => {
      const element = document.createElement('div');
      element.setAttribute('data-i18n', 'appTitle');
      document.body.appendChild(element);

      i18nService.currentLanguage = 'en';
      i18nService.applyTranslations();

      expect(element.textContent).toBe('Crypto Payment Gateway');
    });

    it('should update input value for input elements with data-i18n', () => {
      const input = document.createElement('input');
      input.setAttribute('data-i18n', 'amount');
      document.body.appendChild(input);

      i18nService.currentLanguage = 'es';
      i18nService.applyTranslations();

      expect(input.value).toBe('Cantidad');
    });

    it('should update placeholder for elements with data-i18n-placeholder', () => {
      const input = document.createElement('input');
      input.setAttribute('data-i18n-placeholder', 'enterRecipient');
      document.body.appendChild(input);

      i18nService.currentLanguage = 'fr';
      i18nService.applyTranslations();

      expect(input.placeholder).toBe('Entrer l\'adresse du destinataire');
    });

    it('should update document lang attribute', () => {
      i18nService.currentLanguage = 'ja';
      i18nService.applyTranslations();

      expect(document.documentElement.lang).toBe('ja');
    });

    it('should handle multiple elements at once', () => {
      const title = document.createElement('h1');
      title.setAttribute('data-i18n', 'appTitle');
      const subtitle = document.createElement('p');
      subtitle.setAttribute('data-i18n', 'appSubtitle');
      document.body.appendChild(title);
      document.body.appendChild(subtitle);

      i18nService.currentLanguage = 'zh';
      i18nService.applyTranslations();

      expect(title.textContent).toBe('加密货币支付网关');
      expect(subtitle.textContent).toBe('使用 Phantom 钱包支付');
    });
  });

  describe('getCurrentLanguage()', () => {
    it('should return current language code', () => {
      i18nService.currentLanguage = 'en';
      expect(i18nService.getCurrentLanguage()).toBe('en');
    });

    it('should return updated language after change', () => {
      i18nService.setLanguage('fr');
      expect(i18nService.getCurrentLanguage()).toBe('fr');
    });
  });

  describe('All supported languages', () => {
    const languages = ['en', 'es', 'fr', 'ja', 'zh'];

    languages.forEach((lang) => {
      it(`should have valid translations for ${lang}`, () => {
        i18nService.currentLanguage = lang;
        expect(i18nService.translate('appTitle')).not.toBe('appTitle');
        expect(i18nService.translate('sendPayment')).not.toBe('sendPayment');
        expect(i18nService.translate('connected')).not.toBe('connected');
      });
    });
  });
});
