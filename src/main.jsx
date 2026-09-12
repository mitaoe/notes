import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { MantineEmotionProvider } from '@mantine/emotion';
import App from './App';
import '@mantine/core/styles.css';
import './global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <MantineEmotionProvider>
        <App />
      </MantineEmotionProvider>
    </HelmetProvider>
  </React.StrictMode>
);
