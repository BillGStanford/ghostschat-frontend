// src/App.js
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import Home from './pages/Home';
import Join from './pages/Join';
import Chat from './pages/Chat';
import { ENCRYPTION_KEY, THEMES } from './constants';
import CryptoJS from 'crypto-js';

function App() {
  const [socket, setSocket] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeniorMod, setIsSeniorMod] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [roomExists, setRoomExists] = useState(true);
  const [roomSettings, setRoomSettings] = useState({
    cooldown: 0,
    joinCooldown: 10,
    allowImages: true,
    allowLinks: true,
    theme: 'default'
  });
  const [bannedUsers, setBannedUsers] = useState([]);
  const [userJoinTime, setUserJoinTime] = useState(null);
  const [callState, setCallState] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setRoomId(roomParam);
      setCurrentView('join');
    }
  }, []);

  useEffect(() => {
    document.title = roomName ? `${roomName} | GhostsChat` : 'GhostsChat - Anonymous Chat App';
  }, [roomName]);

  useEffect(() => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
    const newSocket = io(serverUrl, { withCredentials: true });
    setSocket(newSocket);

    newSocket.on('message', (encryptedData) => {
      const decryptedMessage = decrypt(encryptedData);
      if (decryptedMessage) {
        setMessages(prev => [...prev, decryptedMessage]);
      }
    });

    newSocket.on('messageDeleted', (messageId) => {
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    });

    newSocket.on('userJoined', (data) => {
      setUsers(data.users);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: `${data.username} materialized in the shadows...`,
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('userLeft', (data) => {
      setUsers(data.users);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: `${data.username} vanished into the void...`,
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('userKicked', (data) => {
      setUsers(data.users);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: `${data.username} has been banished by ${data.kickedBy}...`,
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('youWereKicked', () => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: 'You have been banished from this realm...',
        timestamp: new Date().toISOString()
      }]);
      setTimeout(() => resetState(), 2000);
    });

    newSocket.on('roomDeleted', () => {
      setRoomExists(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: 'The realm has been consumed by darkness...',
        timestamp: new Date().toISOString()
      }]);
      setTimeout(() => resetState(), 2000);
    });

    newSocket.on('adminTransferred', (data) => {
      setIsAdmin(data.newAdmin === newSocket.id);
      setIsSeniorMod(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: `${data.username} has been crowned as the new shadow lord...`,
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('moderatorAdded', (data) => {
      if (data.userId === newSocket.id) {
        setIsModerator(!data.senior);
        setIsSeniorMod(data.senior);
      }
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: `${data.username} has been ${data.senior ? 'promoted to Senior Moderator' : 'made a Moderator'}...`,
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('moderatorRemoved', (data) => {
      if (data.userId === newSocket.id) {
        setIsModerator(false);
        setIsSeniorMod(false);
      }
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: `${data.username} has been ${data.senior ? 'demoted from Senior Moderator' : 'removed as Moderator'}...`,
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('userBanned', (data) => {
      setBannedUsers(prev => [...prev, data.username.toLowerCase()]);
      setUsers(data.users);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: `${data.username} has been eternally banished by ${data.bannedBy}...`,
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('youWereBanned', () => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: 'You have been eternally banished from this realm...',
        timestamp: new Date().toISOString()
      }]);
      setTimeout(() => resetState(), 2000);
    });

    newSocket.on('roomSettingsUpdated', (settings) => {
      setRoomSettings(settings);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: 'Realm settings have been updated...',
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('roomNotFound', () => {
      setRoomExists(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: 'This realm does not exist...',
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('callStarted', (data) => {
      setCallState({ hostId: data.hostId, participants: [data.hostId] });
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: 'A call has started in the realm...',
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('callEnded', () => {
      setCallState(null);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: 'The call has ended...',
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('callParticipantJoined', (data) => {
      setCallState(prev => prev ? { ...prev, participants: [...prev.participants, data.userId] } : null);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: `${data.username} joined the call...`,
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('callParticipantLeft', (data) => {
      setCallState(prev => prev ? { ...prev, participants: prev.participants.filter(id => id !== data.userId) } : null);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: `${data.username} left the call...`,
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('callHostChanged', (data) => {
      setCallState(prev => prev ? { ...prev, hostId: data.newHostId } : null);
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        content: 'The call host has changed...',
        timestamp: new Date().toISOString()
      }]);
    });

    newSocket.on('callActive', (data) => {
      setCallState(data);
    });

    newSocket.on('callSignal', (data) => {
      // Handled in CallRoom component
    });

    return () => newSocket.close();
  }, []);

  const resetState = () => {
    setCurrentView('home');
    setRoomId('');
    setRoomName('');
    setMessages([]);
    setUsers([]);
    setIsAdmin(false);
    setIsSeniorMod(false);
    setIsModerator(false);
    setCallState(null);
    setBannedUsers([]);
    setRoomExists(true);
  };

  const encrypt = (text) => {
    return CryptoJS.AES.encrypt(JSON.stringify(text), ENCRYPTION_KEY).toString();
  };

  const decrypt = (encryptedText) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  };

  const createRoom = () => {
    if (!username.trim() || !roomName.trim()) return;
    const newRoomId = uuidv4().substring(0, 8);
    setRoomId(newRoomId);
    setIsAdmin(true);
    socket.emit('createRoom', { 
      roomId: newRoomId, 
      username: username.trim(),
      roomName: roomName.trim(),
      settings: roomSettings
    });
    setCurrentView('chat');
  };

  const joinRoom = () => {
    if (!username.trim() || !roomId.trim()) return;
    socket.emit('joinRoom', { 
      roomId: roomId.trim(), 
      username: username.trim(),
      bannedUsers
    });
    setCurrentView('chat');
    setUserJoinTime(Date.now());
  };

  if (currentView === 'home') {
    return (
      <Home
        username={username}
        setUsername={setUsername}
        roomName={roomName}
        setRoomName={setRoomName}
        roomId={roomId}
        setRoomId={setRoomId}
        createRoom={createRoom}
        setCurrentView={setCurrentView}
      />
    );
  }

  if (currentView === 'join') {
    return (
      <Join
        username={username}
        setUsername={setUsername}
        roomId={roomId}
        roomExists={roomExists}
        joinRoom={joinRoom}
        setCurrentView={setCurrentView}
      />
    );
  }

  return (
    <Chat
      socket={socket}
      username={username}
      roomId={roomId}
      roomName={roomName}
      messages={messages}
      setMessages={setMessages}
      users={users}
      setUsers={setUsers}
      isAdmin={isAdmin}
      setIsAdmin={setIsAdmin}
      isSeniorMod={isSeniorMod}
      setIsSeniorMod={setIsSeniorMod}
      isModerator={isModerator}
      setIsModerator={setIsModerator}
      roomSettings={roomSettings}
      setRoomSettings={setRoomSettings}
      bannedUsers={bannedUsers}
      setBannedUsers={setBannedUsers}
      userJoinTime={userJoinTime}
      setCurrentView={setCurrentView}
      callState={callState}
      setCallState={setCallState}
      encrypt={encrypt}
      resetState={resetState}
    />
  );
}

export default App;