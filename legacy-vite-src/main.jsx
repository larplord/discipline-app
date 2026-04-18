import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './layout.css';
import { seedIfEmpty, resetApr9to16 } from './store.js';

// Seed with demo data on first run
seedIfEmpty();
// One-time wipe of Apr 9–16 data for a clean start
resetApr9to16();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
