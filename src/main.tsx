import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  HashRouter,
  RouterProvider,
  createBrowserRouter,
  createHashRouter,
} from 'react-router-dom';

import App from './App.tsx';
import './index.css';

/**
 *  • In sviluppo usiamo BrowserRouter → hot-reload, path “puliti”.
 *  • In produzione (GitHub Pages) usiamo HashRouter, così evitiamo i 404
 *    quando l’utente ricarica o incolla un deep-link.
 */
const isDev = import.meta.env.DEV;

const Router = isDev ? BrowserRouter : HashRouter;

createRoot(document.getElementById('root')!).render(
  <Router basename={isDev ? '/' : '/'} /* hashRouter ignora basename */>
    <App />
  </Router>,
);
