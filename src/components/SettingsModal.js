// src/components/SettingsModal.js
import React from 'react';
import { X, Crown, Shield, Gavel, UserX, Trash2, Ghost } from 'lucide-react';
import { THEMES } from '../constants';

const SettingsModal = ({
  showSettings,
  setShowSettings,
  users,
  isAdmin,
  isSeniorMod,
  roomSettings,
  setRoomSettings,
  socket,
  roomId,
  currentTheme,
  resetState
}) => {
  const transferAdmin = (userId) => {
    socket.emit('transferAdmin', { roomId, newAdminId: userId });
    setShowSettings(false);
  };

  const addModerator = (userId, senior = false) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      socket.emit('addModerator', { roomId, userId, username: user.username, senior });
    }
  };

  const removeModerator = (userId, senior = false) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      socket.emit('removeModerator', { roomId, userId, username: user.username, senior });
    }
  };

  const deleteRoom = () => {
    socket.emit('deleteRoom', { roomId });
    setShowSettings(false);
    resetState();
  };

  const updateSettings = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newSettings = {
      cooldown: parseInt(formData.get('cooldown')),
      joinCooldown: parseInt(formData.get('joinCooldown')),
      allowImages: formData.get('allowImages') === 'on',
      allowLinks: formData.get('allowLinks') === 'on',
      theme: formData.get('theme')
    };
    socket.emit('updateRoomSettings', { roomId, settings: newSettings });
    setRoomSettings(newSettings);
    setShowSettings(false);
  };

  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
      <div className={`${currentTheme.card} border rounded-2xl p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-slide-up`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-bold ${currentTheme.textPrimary} gradient-text`}>Realm Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className={`${currentTheme.buttonSecondary} p-2 rounded-full ${currentTheme.hover} transition-all duration-200`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={updateSettings} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
              Message Cooldown (seconds)
            </label>
            <input
              type="number"
              name="cooldown"
              defaultValue={roomSettings.cooldown}
              min="0"
              max="30"
              className={`${currentTheme.input} border rounded-xl w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
              Join Cooldown (seconds)
            </label>
            <input
              type="number"
              name="joinCooldown"
              defaultValue={roomSettings.joinCooldown}
              min="0"
              max="60"
              className={`${currentTheme.input} border rounded-xl w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300`}
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="allowImages"
              defaultChecked={roomSettings.allowImages}
              className="rounded text-purple-600 focus:ring-purple-500 h-5 w-5"
            />
            <label className={`text-sm ${currentTheme.textPrimary}`}>Allow Images</label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="allowLinks"
              defaultChecked={roomSettings.allowLinks}
              className="rounded text-purple-600 focus:ring-purple-500 h-5 w-5"
            />
            <label className={`text-sm ${currentTheme.textPrimary}`}>Allow Links</label>
          </div>

          <div>
            <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
              Theme
            </label>
            <select
              name="theme"
              defaultValue={roomSettings.theme}
              className={`${currentTheme.input} border rounded-xl w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300`}
            >
              {Object.entries(THEMES).map(([key, theme]) => (
                <option key={key} value={key}>{theme.name}</option>
              ))}
            </select>
          </div>

<button
  type="submit"
  className={`${currentTheme.button} rounded-xl w-full px-4 py-3 font-medium flex items-center justify-center space-x-2 transform hover:scale-105 transition-all duration-300`}
>
  <Shield className="w-5 h-5" />
  <span>Save Settings</span>
</button>
        </form>

        {(isAdmin || isSeniorMod) && (
          <div className="mt-6 pt-6 border-t ${currentTheme.border}">
            <h3 className={`text-sm font-semibold ${currentTheme.textPrimary} mb-3`}>Manage Spirits</h3>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-xl ${currentTheme.buttonSecondary} transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${currentTheme.textPrimary}`}>
                      {user.username}
                      {user.isAdmin && ' (Admin)'}
                      {user.isSeniorMod && ' (Senior Mod)'}
                      {user.isModerator && !user.isSeniorMod && ' (Mod)'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {isAdmin && !user.isAdmin && (
                      <button
                        onClick={() => transferAdmin(user.id)}
                        className={`${currentTheme.buttonSecondary} p-2 rounded-full ${currentTheme.hover} transition-all duration-200`}
                        title="Transfer Admin"
                      >
                        <Crown className="w-5 h-5" />
                      </button>
                    )}
                    {(isAdmin || isSeniorMod) && !user.isAdmin && !user.isSeniorMod && !user.isModerator && (
                      <button
                        onClick={() => addModerator(user.id, isAdmin)}
                        className={`${currentTheme.buttonSecondary} p-2 rounded-full ${currentTheme.hover} transition-all duration-200`}
                        title={isAdmin ? "Add Senior Moderator" : "Add Moderator"}
                      >
                        {isAdmin ? <Gavel className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                      </button>
                    )}
                    {(isAdmin || (isSeniorMod && user.isModerator && !user.isSeniorMod)) && (user.isModerator || user.isSeniorMod) && (
                      <button
                        onClick={() => removeModerator(user.id, user.isSeniorMod)}
                        className={`${currentTheme.buttonSecondary} p-2 rounded-full ${currentTheme.hover} transition-all duration-200`}
                        title={user.isSeniorMod ? "Remove Senior Moderator" : "Remove Moderator"}
                      >
                        <UserX className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isAdmin && (
          <button
            onClick={deleteRoom}
            className="mt-6 w-full bg-red-600 hover:bg-red-500 text-white rounded-xl px-4 py-3 flex items-center justify-center space-x-2 transform hover:scale-105 transition-all duration-300 shadow-glow"
          >
            <Trash2 className="w-5 h-5" />
            <span>Annihilate Realm</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;