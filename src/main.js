import './index.css';
import { initApp } from './App.js';

const rootEl = document.getElementById('app');
if (rootEl) {
  initApp(rootEl);
}
