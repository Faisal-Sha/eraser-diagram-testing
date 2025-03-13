import { isPlatformBrowser } from '@angular/common';
import { APP_INITIALIZER, LOCALE_ID, PLATFORM_ID, Provider } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { I18NEXT_SERVICE, I18NextLoadResult, I18NextTitle, ITranslationService, defaultInterpolationFormat, I18NextModule } from 'angular-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import * as i18n from 'i18next';
import { HttpBackendOptions } from "i18next-http-backend";
import HttpApi from 'i18next-http-backend';


/**
 * Initializes the i18next library for internationalization and localization.
 * This function is designed to be used as an Angular app initializer.
 *
 * @param i18next - The i18next translation service instance.
 * @param platformId - The platform ID to determine if the current environment is a browser.
 *
 * @returns A function that returns a Promise.
 *          If the current environment is not a browser, the Promise resolves immediately.
 *          If the current environment is a browser, the Promise resolves when the i18next library is initialized.
 */
export function appInit(i18next: ITranslationService, platformId: any) {
  return () => {
    if (!isPlatformBrowser(platformId)) {
      return Promise.resolve();
    }
    const promise: Promise<I18NextLoadResult> = i18next
      .use(HttpApi)
      .use(LanguageDetector)
      .init(i18nextOptions);
    return promise;
  };
}

/**
 * A factory function that returns the current language code used by the i18next translation service.
 * This function is designed to be used as a dependency injection token for Angular's LOCALE_ID.
 *
 * @param i18next - The i18next translation service instance.
 *
 * @returns The current language code used by the i18next translation service.
 *
 * @example
 * // In your module's providers array:
 * {
 *   provide: LOCALE_ID,
 *   deps: [I18NEXT_SERVICE],
 *   useFactory: localeIdFactory
 * }
 */
export function localeIdFactory(i18next: ITranslationService) {
  return i18next.language;
}

export const I18N_PROVIDERS: Provider[] = [
  {
    provide: APP_INITIALIZER,
    useFactory: appInit,
    deps: [I18NEXT_SERVICE, PLATFORM_ID],
    multi: true
  },
  {
    provide: LOCALE_ID,
    deps: [I18NEXT_SERVICE],
    useFactory: localeIdFactory
  },
  {
    provide: Title,
    useExisting: I18NextTitle
  }
];

export const supportedLanguages: { [key: string]: string } = {
  'en': 'English',
  'de': 'Deutsch'
};

export const i18nextOptions: i18n.InitOptions & { backend: HttpBackendOptions } = {
  supportedLngs: Object.keys(supportedLanguages),
  fallbackLng: 'de',
  debug: false,
  returnEmptyString: false,
  interpolation: {
    format: I18NextModule.interpolationFormat(defaultInterpolationFormat)
  },
  backend: {
    loadPath: '../../locales/{{lng}}.{{ns}}.json',
  },
  ns: ['translation', 'error'],
  detection: {
    order: ['cookie'],
    lookupCookie: 'lang',
    caches: ['cookie'],
    cookieMinutes: 10080
  }
};
