// src/pages/Join.js
import React from 'react';
import { Ghost } from 'lucide-react';
import { THEMES } from '../constants';

const Join = ({ username, setUsername, roomId, roomExists, joinRoom, setCurrentView }) => {
  const currentTheme = THEMES.default;

  return (
    <div className={`min-h-screen ${currentTheme.bg} flex items-center justify-center p-4 transition-all duration-500`}>
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="text-center">
          <Ghost className="w-20 h-20 text-purple-400 mx-auto mb-4 animate-pulse-slow" />
          <h1 className="text-3xl font-bold gradient-text mb-2 tracking-tight">Join Shadow Realm</h1>
          <p className={`${currentTheme.textSecondary} text-sm`}>Room ID: {roomId}</p>
        </div>
        
        <div className={`${currentTheme.card} border rounded-2xl p-8 shadow-2xl space-y-6 transform hover:scale-105 transition-transform duration-300`}>
          <div>
            <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
              Ghost Identity
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`${currentTheme.input} border rounded-xl w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300`}
              placeholder="Choose your alias..."
              maxLength={20}
            />
          </div>
          
          <div className="space-y-3">
            <button
              onClick={joinRoom}
              disabled={!username.trim()}
              className={`${currentTheme.button} rounded-xl w-full px-4 py-3 font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300`}
            >
              <Ghost className="w-5 h-5" />
              <span>Enter the Shadows</span>
            </button>
            
            <button
              onClick={() => setCurrentView('home')}
              className={`${currentTheme.buttonSecondary} rounded-xl w-full px-4 py-3 font-medium flex items-center justify-center space-x-2`}
            >
              <Ghost className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
        
        {!roomExists && (
          <div className="text-center text-red-400 text-sm animate-pulse">
            This shadow realm has vanished or never existed...
          </div>
        )}
      </div>
    </div>
  );
};

export default Join;