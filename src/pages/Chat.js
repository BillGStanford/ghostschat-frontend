// src/pages/Chat.js
import React, { useState, useEffect, useRef } from 'react';
import { Ghost, Users, Copy, Settings, Phone, PhoneOff } from 'lucide-react';
import Message from '../components/Message';
import UserList from '../components/UserList';
import SettingsModal from '../components/SettingsModal';
import QRCodeModal from '../components/QRCodeModal';
import CallRoom from '../components/CallRoom';
import { THEMES } from '../constants';

const Chat = ({
  socket,
  username,
  roomId,
  roomName,
  messages,
  setMessages,
  users,
  setUsers,
  isAdmin,
  setIsAdmin,
  isSeniorMod,
  setIsSeniorMod,
  isModerator,
  setIsModerator,
  roomSettings,
  setRoomSettings,
  bannedUsers,
  setBannedUsers,
  userJoinTime,
  setCurrentView,
  callState,
  setCallState,
  encrypt,
  resetState
}) => {
  const [message, setMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [joinCooldown, setJoinCooldown] = useState(0);
  const [isInCall, setIsInCall] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentTheme = THEMES[roomSettings.theme] || THEMES.default;

  useEffect(() => {
    socket.on('cooldownSet', (cooldown) => {
      setCooldown(cooldown);
    });

    socket.on('joinCooldownSet', (cooldown) => {
      setJoinCooldown(cooldown);
    });

    return () => {
      socket.off('cooldownSet');
      socket.off('joinCooldownSet');
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (joinCooldown > 0 && userJoinTime) {
      const timer = setInterval(() => {
        const timePassed = Math.floor((Date.now() - userJoinTime) / 1000);
        const remaining = Math.max(0, joinCooldown - timePassed);
        if (remaining <= 0) {
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [joinCooldown, userJoinTime]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const isPrivileged = isAdmin || isSeniorMod || isModerator;
    
    if (!isPrivileged) {
      const timePassed = userJoinTime ? Math.floor((Date.now() - userJoinTime) / 1000) : 0;
      if (joinCooldown > 0 && timePassed < joinCooldown) {
        const remaining = joinCooldown - timePassed;
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'system',
          content: `You must wait ${remaining}s before speaking...`,
          timestamp: new Date().toISOString()
        }]);
        return;
      }

      if (cooldown > 0) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'system',
          content: `You must wait ${cooldown}s before sending another message...`,
          timestamp: new Date().toISOString()
        }]);
        return;
      }

      const containsLink = /https?:\/\/[^\s]+/.test(message);
      if (!roomSettings.allowLinks && containsLink) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'system',
          content: 'Links are disabled in this realm...',
          timestamp: new Date().toISOString()
        }]);
        return;
      }
    }

    const messageData = {
      id: Date.now(),
      username,
      content: message.trim(),
      timestamp: new Date().toISOString(),
      type: 'message'
    };

    const encryptedMessage = encrypt(messageData);
    socket.emit('message', { roomId, message: encryptedMessage });
    setMessage('');
    if (!isPrivileged) {
      setCooldown(roomSettings.cooldown);
    }
  };

  const sendImage = (file) => {
    if (!roomSettings.allowImages && !(isAdmin || isSeniorMod || isModerator)) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: 'Image sharing is disabled in this realm...',
        timestamp: new Date().toISOString()
      }]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const messageData = {
        id: Date.now(),
        username,
        content: e.target.result,
        timestamp: new Date().toISOString(),
        type: 'image'
      };

      const encryptedMessage = encrypt(messageData);
      socket.emit('message', { roomId, message: encryptedMessage });
      if (!(isAdmin || isSeniorMod || isModerator)) {
        setCooldown(roomSettings.cooldown);
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteMessage = (messageId) => {
    socket.emit('deleteMessage', { roomId, messageId });
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(link);
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      content: 'Room link copied to clipboard!',
      timestamp: new Date().toISOString()
    }]);
  };

  const startCall = () => {
    socket.emit('startCall', { roomId });
    setIsInCall(true);
  };

  const joinCall = () => {
    socket.emit('joinCall', { roomId });
    setIsInCall(true);
  };

  const leaveCall = () => {
    socket.emit('leaveCall', { roomId });
    setIsInCall(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      sendImage(file);
    }
  };

  const timePassed = userJoinTime ? Math.floor((Date.now() - userJoinTime) / 1000) : 0;
  const joinCooldownRemaining = Math.max(0, joinCooldown - timePassed);

  return (
    <div className={`h-screen ${currentTheme.bg} flex flex-col transition-all duration-500`}>
      {/* Header */}
      <div className={`${currentTheme.card} border-b ${currentTheme.border} p-4 shadow-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Ghost className="w-8 h-8 text-purple-400 animate-pulse-slow" />
            <div>
              <h1 className="text-xl font-bold gradient-text tracking-tight">{roomName || 'Unnamed Realm'}</h1>
              <p className={`text-xs ${currentTheme.textSecondary}`}>Room ID: {roomId}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`${currentTheme.buttonSecondary} rounded-xl px-3 py-2 flex items-center space-x-2`}>
              <Users className="w-5 h-5 text-purple-400" />
              <span className={`text-sm ${currentTheme.textPrimary}`}>{users.length}</span>
            </div>
            
            <button
              onClick={copyRoomLink}
              className={`${currentTheme.buttonSecondary} rounded-xl px-3 py-2 flex items-center space-x-2 ${currentTheme.hover} transition-all duration-300`}
              title="Copy Room Link"
            >
              <Copy className="w-5 h-5" />
              <span className="hidden sm:inline">Copy</span>
            </button>

            <button
              onClick={() => setShowQRCode(true)}
              className={`${currentTheme.buttonSecondary} rounded-xl px-3 py-2 flex items-center space-x-2 ${currentTheme.hover} transition-all duration-300`}
              title="Share QR Code"
            >
              <Ghost className="w-5 h-5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            
            {(isAdmin || isSeniorMod) && (
              <button
                onClick={() => setShowSettings(true)}
                className={`${currentTheme.buttonSecondary} rounded-xl px-3 py-2 flex items-center space-x-2 ${currentTheme.hover} transition-all duration-300`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}

            {!callState && (
              <button
                onClick={startCall}
                className={`${currentTheme.button} rounded-xl px-3 py-2 flex items-center space-x-2 transform hover:scale-105 transition-all duration-300`}
                title="Start Call"
              >
                <Phone className="w-5 h-5" />
                <span className="hidden sm:inline">Start Call</span>
              </button>
            )}

            {callState && !isInCall && (
              <button
                onClick={joinCall}
                className={`${currentTheme.button} rounded-xl px-3 py-2 flex items-center space-x-2 transform hover:scale-105 transition-all duration-300`}
                title="Join Call"
              >
                <Phone className="w-5 h-5" />
                <span className="hidden sm:inline">Join Call</span>
              </button>
            )}

            {isInCall && (
              <button
                onClick={leaveCall}
                className={`${currentTheme.buttonSecondary} rounded-xl px-3 py-2 flex items-center space-x-2 ${currentTheme.hover} transition-all duration-300`}
                title="Leave Call"
              >
                <PhoneOff className="w-5 h-5" />
                <span className="hidden sm:inline">Leave Call</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages or Call Room */}
        <div className="flex-1 flex flex-col">
          {isInCall && callState ? (
            <CallRoom
              socket={socket}
              roomId={roomId}
              username={username}
              users={users}
              callState={callState}
            />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-ghost-600 scrollbar-track-ghost-800">
                {messages.map((msg) => (
                  <Message
                    key={msg.id}
                    message={msg}
                    currentTheme={currentTheme}
                    isAdmin={isAdmin}
                    isSeniorMod={isSeniorMod}
                    isModerator={isModerator}
                    deleteMessage={deleteMessage}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div className={`border-t ${currentTheme.border} p-4 bg-ghost-800/50 backdrop-blur-md`}>
                {joinCooldownRemaining > 0 && !(isAdmin || isSeniorMod || isModerator) && (
                  <div className="text-center text-sm text-purple-400 mb-2 flex items-center justify-center space-x-1 animate-pulse">
                    <Ghost className="w-4 h-4" />
                    <span>You can speak in {joinCooldownRemaining}s...</span>
                  </div>
                )}
                <form onSubmit={sendMessage} className="flex space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!roomSettings.allowImages && !(isAdmin || isSeniorMod || isModerator)}
                    className={`${currentTheme.buttonSecondary} rounded-xl p-3 flex items-center disabled:opacity-50 disabled:cursor-not-allowed ${currentTheme.hover} transition-all duration-300`}
                  >
                    <Ghost className="w-5 h-5" />
                  </button>
                  
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${currentTheme.input} border rounded-xl flex-1 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300`}
                    placeholder={
                      cooldown > 0 && !(isAdmin || isSeniorMod || isModerator) 
                        ? `Wait ${cooldown}s...` 
                        : "Whisper your secrets..."
                    }
                    maxLength={500}
                    disabled={
                      (cooldown > 0 || 
                      (joinCooldown > 0 && joinCooldownRemaining > 0)) && 
                      !(isAdmin || isSeniorMod || isModerator)
                    }
                  />
                  
                  <button
                    type="submit"
                    disabled={
                      !message.trim() || 
                      (cooldown > 0 && !(isAdmin || isSeniorMod || isModerator)) || 
                      (joinCooldown > 0 && joinCooldownRemaining > 0 && !(isAdmin || isSeniorMod || isModerator))
                    }
                    className={`${currentTheme.button} rounded-xl p-3 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300`}
                  >
                    <Ghost className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
        
        <UserList
          users={users}
          isAdmin={isAdmin}
          isSeniorMod={isSeniorMod}
          isModerator={isModerator}
          roomId={roomId}
          socket={socket}
          currentTheme={currentTheme}
          resetState={resetState}
        />
      </div>

      <SettingsModal
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        users={users}
        isAdmin={isAdmin}
        isSeniorMod={isSeniorMod}
        roomSettings={roomSettings}
        setRoomSettings={setRoomSettings}
        socket={socket}
        roomId={roomId}
        currentTheme={currentTheme}
        resetState={resetState}
      />

      <QRCodeModal
        showQRCode={showQRCode}
        setShowQRCode={setShowQRCode}
        roomId={roomId}
        currentTheme={currentTheme}
      />
    </div>
  );
};

export default Chat;