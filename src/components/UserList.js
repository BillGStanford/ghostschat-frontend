// src/components/UserList.js
import React, { useState } from 'react';
import { Ghost, Users, Crown, Gavel, Shield, UserX, Ban, Eye, EyeOff } from 'lucide-react';
import { ENCRYPTION_KEY } from '../constants';

const UserList = ({ users, isAdmin, isSeniorMod, isModerator, roomId, socket, currentTheme, resetState }) => {
  const [encryptionVisible, setEncryptionVisible] = useState(false);

  const kickUser = (userId) => {
    const userToKick = users.find(u => u.id === userId);
    if (userToKick) {
      socket.emit('kickUser', { roomId, userId, kickedUsername: userToKick.username });
    }
  };

  const banUser = (userId) => {
    const userToBan = users.find(u => u.id === userId);
    if (userToBan) {
      socket.emit('banUser', { roomId, userId, bannedUsername: userToBan.username });
    }
  };

  const leaveRoom = () => {
    socket.emit('leaveRoom', { roomId, username: users.find(u => u.id === socket.id)?.username });
    resetState();
  };

  return (
    <div className={`w-72 ${currentTheme.card} border-l ${currentTheme.border} p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-ghost-600 scrollbar-track-ghost-800`}>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-purple-400 animate-pulse-slow" />
          <span className={`font-semibold ${currentTheme.textPrimary} text-sm`}>Spirits Present ({users.length})</span>
        </div>
        
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className={`${currentTheme.buttonSecondary} rounded-xl p-3 flex items-center justify-between transform hover:scale-105 transition-all duration-200`}>
              <div className="flex items-center space-x-2">
                <Ghost className="w-5 h-5 text-purple-400" />
                <span className={`text-sm ${currentTheme.textPrimary}`}>{user.username}</span>
                {user.isAdmin && <Crown className="w-4 h-4 text-yellow-400" />}
                {user.isSeniorMod && <Gavel className="w-4 h-4 text-blue-400" />}
                {user.isModerator && !user.isSeniorMod && <Shield className="w-4 h-4 text-green-400" />}
              </div>
              
              {(isAdmin || (isSeniorMod && !user.isAdmin && !user.isSeniorMod)) && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => kickUser(user.id)}
                    className={`text-red-400 ${currentTheme.hover} transition-colors duration-200`}
                    title="Kick User"
                  >
                    <UserX className="w-5 h-5" />
                  </button>
                  {(isAdmin || isSeniorMod) && (
                    <button
                      onClick={() => banUser(user.id)}
                      className={`text-red-600 ${currentTheme.hover} transition-colors duration-200`}
                      title="Ban User"
                    >
                      <Ban className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className={`pt-4 border-t ${currentTheme.border}`}>
          <div className="flex items-center space-x-2 text-ghost-400 text-xs">
            <Shield className="w-4 h-4" />
            <span>End-to-end Encrypted</span>
            <button
              onClick={() => setEncryptionVisible(!encryptionVisible)}
              className={`${currentTheme.hover} ml-auto`}
            >
              {encryptionVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          {encryptionVisible && (
            <div className={`mt-2 p-3 ${currentTheme.card} rounded-xl text-xs ${currentTheme.textSecondary} font-mono break-all shadow-md`}>
              Key: {ENCRYPTION_KEY.substring(0, 10)}...
            </div>
          )}
        </div>

        <button
          onClick={leaveRoom}
          className={`${currentTheme.buttonSecondary} w-full mt-4 rounded-xl px-4 py-3 flex items-center justify-center space-x-2 ${currentTheme.hover} transform hover:scale-105 transition-all duration-300`}
        >
          <Ghost className="w-5 h-5" />
          <span>Fade from Realm</span>
        </button>
      </div>
    </div>
  );
};

export default UserList;