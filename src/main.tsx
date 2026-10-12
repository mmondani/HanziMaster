import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/noto-serif-sc/chinese-simplified-500.css';
import '@fontsource/noto-serif-sc/chinese-simplified-700.css';
import '@/styles/base.css';
import { App } from '@/app/app';
import { initTheme } from '@/lib/theme';

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
