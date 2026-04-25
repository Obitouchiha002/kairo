import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA
try {
  if ('serviceWorker' in navigator) {
    registerSW({ 
      immediate: true,
      onRegisterError(error: any) {
        console.error('SW registration error', error);
      }
    });
  }
} catch (e) {
  console.error('PWA registration failed', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
