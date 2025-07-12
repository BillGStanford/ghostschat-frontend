// src/pages/Home.js
import React from 'react';
import { Ghost, Shield, Eye } from 'lucide-react';
import { THEMES } from '../constants';

const Home = ({ username, setUsername, roomName, setRoomName, roomId, setRoomId, createRoom, setCurrentView }) => {
  const currentTheme = THEMES.default;

  return (
    <div className={`min-h-screen ${currentTheme.bg} flex items-center justify-center p-6 sm:p-12 transition-all duration-500`}>
      <div className="w-full max-w-lg glass-card backdrop-blur-lg bg-white/5 rounded-3xl shadow-2xl border border-white/10 p-8 sm:p-10 space-y-10 animate-fade-in">
        
        {/* Logo & Tagline */}
        <div className="text-center space-y-4">
          <Ghost className="w-20 h-20 text-purple-400 mx-auto animate-pulse-slow" />
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight gradient-text">GhostsChat</h1>
          <p className={`${currentTheme.textSecondary} text-sm sm:text-base italic`}>
            Whisper in the Shadows • Secure • Anonymous • Free
          </p>
        </div>

        {/* Form Card */}
        <div className="space-y-6">
          {/* Username Input */}
          <div>
            <label className={`block text-sm font-semibold ${currentTheme.textPrimary} mb-2`}>
              Your Ghost Identity
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              placeholder="Choose your alias..."
              maxLength={20}
            />
          </div>

          {/* Room Name Input */}
          <div>
            <label className={`block text-sm font-semibold ${currentTheme.textPrimary} mb-2`}>
              Shadow Realm Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              placeholder="Name your realm..."
              maxLength={30}
            />
          </div>

          {/* Create Room Button */}
          <button
            onClick={createRoom}
            disabled={!username.trim() || !roomName.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/40 text-white w-full py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-transform hover:scale-105 disabled:cursor-not-allowed"
          >
            <Ghost className="w-5 h-5" />
            <span>Create Shadow Realm</span>
          </button>

          {/* Divider */}
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <hr className="flex-1 border-gray-600" />
            <span>or</span>
            <hr className="flex-1 border-gray-600" />
          </div>

          {/* Join Room Section */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="bg-white/10 border border-white/20 text-white placeholder-gray-400 flex-1 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              placeholder="Enter Room ID..."
            />
            <button
              onClick={() => setCurrentView('join')}
              disabled={!username.trim() || !roomId.trim()}
              className="bg-gray-700 hover:bg-gray-800 disabled:bg-gray-700/40 text-white px-4 py-3 rounded-xl font-semibold flex items-center space-x-2 disabled:cursor-not-allowed"
            >
              <Ghost className="w-5 h-5" />
              <span>Join</span>
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center space-y-2 text-ghost-300 text-xs sm:text-sm">
          <div className="flex justify-center items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>End-to-End Encrypted</span>
          </div>
          <div className="flex justify-center items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>No Registration Required</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
