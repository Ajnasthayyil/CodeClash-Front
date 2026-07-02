try {
  window.localStorage.clear();
  Object.defineProperty(window, 'localStorage', {
    value: window.sessionStorage,
    configurable: true,
    writable: false
  });
} catch (e) {
  console.warn('LocalStorage override failed:', e);
}

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';


platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
