import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Intercept browser extension unhandled rejections and errors
if (typeof window !== 'undefined') {
  const isExtensionNoise = (errOrMsg: unknown, source?: string): boolean => {
    const text = String(
      (errOrMsg instanceof Error ? errOrMsg.message + ' ' + (errOrMsg.stack || '') : errOrMsg) || ''
    );
    const src = String(source || '');
    return (
      text.includes('Failed to connect to MetaMask') ||
      text.includes('MetaMask') ||
      text.includes('chrome-extension://') ||
      text.includes('moz-extension://') ||
      text.includes('inpage.js') ||
      src.includes('chrome-extension://') ||
      src.includes('moz-extension://') ||
      src.includes('inpage.js')
    );
  };

  window.addEventListener(
    'error',
    (event) => {
      if (isExtensionNoise(event.error || event.message, event.filename)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (isExtensionNoise(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return true;
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
