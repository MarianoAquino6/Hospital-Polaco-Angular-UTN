import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { RecaptchaModule } from 'ng-recaptcha-2';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideFirebaseApp(() => initializeApp({"projectId":"segundo-examen-labo-iv","appId":"1:813455686406:web:087f29f83bd4307d33fc87","storageBucket":"segundo-examen-labo-iv.appspot.com","apiKey":"AIzaSyBjqQRvjQUV6XvbzZBawlkF1Lpm_ryNE1A","authDomain":"segundo-examen-labo-iv.firebaseapp.com","messagingSenderId":"813455686406"})), 
    provideAuth(() => getAuth()), 
    provideFirestore(() => getFirestore()),
    importProvidersFrom(RecaptchaModule, BrowserAnimationsModule), provideCharts(withDefaultRegisterables())
  ]
};
