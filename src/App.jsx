import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MeetPage from './pages/MeetPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/interview/:userId" element={<MeetPage />} />
        <Route path="/:token" element={<MeetPage />} />
        <Route path="/" element={<div className="home-teaser"><h1>AI Interview Agent</h1><p>Please use a valid interview link.</p></div>} />
      </Routes>
    </Router>
  );
}

export default App;
