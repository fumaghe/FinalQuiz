import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';

import App from './App';
import './index.css';

/**
 * • In sviluppo usiamo BrowserRouter → hot-reload, path “puliti”.
 * • In produzione (GitHub Pages) usiamo HashRouter per evitare i 404.
 */
const isDev = import.meta.env.DEV;
const Router = isDev ? BrowserRouter : HashRouter;

createRoot(document.getElementById('root')!).render(
  <Router basename="/">   
    <App />
  </Router>,
);
