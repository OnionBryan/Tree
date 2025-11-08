import React from 'react';
import FullTreeBuilder from './components/FullTreeBuilder.jsx';
import { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Toaster position="top-right" />
      <FullTreeBuilder />
    </div>
  );
}

export default App;
