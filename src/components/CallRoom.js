import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Users, Phone, PhoneOff } from 'lucide-react';
import Peer from 'simple-peer';
import { THEMES } from '../constants';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

const getColorFromName = (name) => {
  if (!name) return '#6b7280';
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const CallRoom = ({ socket, roomId, username, users, callState }) => {
  const [participants, setParticipants] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const userAudio = useRef(null);
  const peersRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const speakingCheckInterval = useRef(null);
  const currentTheme = THEMES.default;

  // Initialize audio analysis for speaking detection
  const initAudioAnalysis = useCallback((stream) => {
    if (audioContextRef.current) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Start checking speaking status
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let speaking = false;
      
      speakingCheckInterval.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / dataArray.length;
        const isCurrentlySpeaking = avg > 10; // Threshold
        
        if (isCurrentlySpeaking !== speaking) {
          speaking = isCurrentlySpeaking;
          setIsSpeaking(speaking);
          socket.emit('speakingStatus', { roomId, isSpeaking: speaking });
        }
      }, 200);
    } catch (err) {
      console.error('Audio analysis error:', err);
    }
  }, [socket, roomId]);

  // Cleanup audio analysis
  const cleanupAudioAnalysis = useCallback(() => {
    if (speakingCheckInterval.current) {
      clearInterval(speakingCheckInterval.current);
      speakingCheckInterval.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // Cleanup a specific peer
  const cleanupPeer = useCallback((peerID) => {
    const peerObj = peersRef.current.find(p => p.peerID === peerID);
    if (peerObj) {
      peerObj.peer.destroy();
      peersRef.current = peersRef.current.filter(p => p.peerID !== peerID);
    }
  }, []);

  // Full cleanup
  const cleanup = useCallback(() => {
    cleanupAudioAnalysis();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    peersRef.current.forEach(({ peer }) => peer.destroy());
    peersRef.current = [];
    
    if (userAudio.current) {
      userAudio.current.srcObject = null;
    }
  }, [cleanupAudioAnalysis]);

  const createPeer = useCallback((userToSignal, callerID, stream) => {
    const existingPeer = peersRef.current.find(p => p.peerID === userToSignal);
    if (existingPeer) return existingPeer.peer;

    const peer = new Peer({
      initiator: true,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', signal => {
      socket.emit('callSignal', { roomId, signal, to: userToSignal });
    });

    peer.on('connect', () => {
      console.log('Peer connected:', userToSignal);
      updateParticipantStatus(userToSignal, 'connected');
    });

    peer.on('error', err => {
      console.error('Peer error:', err);
      updateParticipantStatus(userToSignal, 'disconnected');
      cleanupPeer(userToSignal);
    });

    peer.on('close', () => {
      updateParticipantStatus(userToSignal, 'disconnected');
      cleanupPeer(userToSignal);
    });

    return peer;
  }, [socket, roomId, cleanupPeer]);

  const addPeer = useCallback((incomingSignal, callerID, stream) => {
    const existingPeer = peersRef.current.find(p => p.peerID === callerID);
    if (existingPeer) return existingPeer.peer;

    const peer = new Peer({
      initiator: false,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', signal => {
      socket.emit('callSignal', { roomId, signal, to: callerID });
    });

    peer.on('connect', () => {
      console.log('Peer connected:', callerID);
      updateParticipantStatus(callerID, 'connected');
    });

    peer.on('error', err => {
      console.error('Peer error:', err);
      updateParticipantStatus(callerID, 'disconnected');
      cleanupPeer(callerID);
    });

    peer.on('close', () => {
      updateParticipantStatus(callerID, 'disconnected');
      cleanupPeer(callerID);
    });

    const signalWithRetry = () => {
      try {
        peer.signal(incomingSignal);
      } catch (err) {
        console.error('Signaling error, retrying...', err);
        if (peer.destroyed) return;
        setTimeout(signalWithRetry, 500);
      }
    };

    signalWithRetry();
    
    return peer;
  }, [socket, roomId, cleanupPeer]);

  // Update participant connection status
  const updateParticipantStatus = (peerID, status) => {
    setParticipants(prev => prev.map(p => 
      p.peerID === peerID ? { ...p, connectionStatus: status } : p
    ));
  };

  // Update participant speaking status
  const updateParticipantSpeaking = (peerID, isSpeaking) => {
    setParticipants(prev => prev.map(p => 
      p.peerID === peerID ? { ...p, isSpeaking } : p
    ));
  };

  // Get all participants including connection status
  const updateAllParticipants = useCallback(() => {
    // Start with current user
    const allParticipants = [{ 
      peerID: socket.id, 
      username,
      isSelf: true,
      connectionStatus: 'connected',
      isSpeaking: false,
      initials: getInitials(username),
      color: getColorFromName(username)
    }];

    // Add all call participants
    callState.participants.forEach(participantId => {
      if (participantId !== socket.id) {
        const existingPeer = peersRef.current.find(p => p.peerID === participantId);
        const existingParticipant = allParticipants.find(p => p.peerID === participantId);
        const user = users.find(u => u.id === participantId);
        const participantUsername = user?.username || 'Unknown';
        
        if (!existingParticipant) {
          allParticipants.push({
            peerID: participantId,
            username: participantUsername,
            isSelf: false,
            connectionStatus: existingPeer ? 'connected' : 'connecting',
            isSpeaking: false,
            initials: getInitials(participantUsername),
            color: getColorFromName(participantUsername)
          });
        }
      }
    });

    setParticipants(allParticipants);
  }, [socket.id, username, callState.participants, users]);

  useEffect(() => {
    const initCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        if (userAudio.current) {
          userAudio.current.srcObject = stream;
        }

        // Initialize audio analysis for speaking detection
        initAudioAnalysis(stream);

        // Initialize all participants
        updateAllParticipants();

        // Create peer connections for existing participants
        callState.participants
          .filter(participantId => participantId !== socket.id)
          .forEach(participantId => {
            const peer = createPeer(participantId, socket.id, stream);
            peersRef.current.push({
              peerID: participantId,
              peer,
              username: users.find(u => u.id === participantId)?.username || 'Unknown',
            });
          });

      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    };

    const handleCallSignal = ({ signal, from }) => {
      if (!streamRef.current) return;
      
      const peerObj = peersRef.current.find(p => p.peerID === from);
      if (peerObj) {
        try {
          peerObj.peer.signal(signal);
        } catch (err) {
          console.error('Error signaling existing peer:', err);
          updateParticipantStatus(from, 'disconnected');
          cleanupPeer(from);
        }
      } else {
        const peer = addPeer(signal, from, streamRef.current);
        peersRef.current.push({
          peerID: from,
          peer,
          username: users.find(u => u.id === from)?.username || 'Unknown',
        });
      }
      updateAllParticipants();
    };

    const handleParticipantJoined = ({ userId, username: joinedUsername }) => {
      if (userId !== socket.id && streamRef.current) {
        const peer = createPeer(userId, socket.id, streamRef.current);
        peersRef.current.push({
          peerID: userId,
          peer,
          username: joinedUsername,
        });
      }
      updateAllParticipants();
    };

    const handleParticipantLeft = ({ userId }) => {
      cleanupPeer(userId);
      updateParticipantStatus(userId, 'left');
    };

    const handleSpeakingStatus = ({ userId, isSpeaking }) => {
      updateParticipantSpeaking(userId, isSpeaking);
    };

    initCall();

    socket.on('callSignal', handleCallSignal);
    socket.on('callParticipantJoined', handleParticipantJoined);
    socket.on('callParticipantLeft', handleParticipantLeft);
    socket.on('speakingStatus', handleSpeakingStatus);
    socket.on('callEnded', cleanup);

    // Periodic participant list refresh
    const interval = setInterval(updateAllParticipants, 3000);

    return () => {
      cleanup();
      clearInterval(interval);
      socket.off('callSignal', handleCallSignal);
      socket.off('callParticipantJoined', handleParticipantJoined);
      socket.off('callParticipantLeft', handleParticipantLeft);
      socket.off('speakingStatus', handleSpeakingStatus);
      socket.off('callEnded', cleanup);
    };
  }, [socket, roomId, callState, users, createPeer, addPeer, cleanup, cleanupPeer, updateAllParticipants, initAudioAnalysis]);

  const toggleMute = () => {
    if (streamRef.current) {
      const newMutedState = !isMuted;
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });
      setIsMuted(newMutedState);
      setIsSpeaking(false);
      socket.emit('speakingStatus', { roomId, isSpeaking: false });
    }
  };



  return (
    <div className={`flex-1 ${currentTheme.card} p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-ghost-600 scrollbar-track-ghost-800`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-bold ${currentTheme.textPrimary} gradient-text`}>Voice Call</h2>
        <div className="flex space-x-2">
          <button
            onClick={toggleMute}
            className={`rounded-xl p-2 flex items-center space-x-2 ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            } text-white transition-all duration-200`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {participants.map(({ peerID, username: participantUsername, isSelf, connectionStatus, isSpeaking, initials, color }) => (
          <div 
            key={`${peerID}-${participantUsername}`}
            className={`${currentTheme.buttonSecondary} rounded-xl p-4 flex flex-col items-center transition-all duration-300 ${
              isSpeaking ? 'ring-2 ring-purple-500 transform scale-105' : ''
            }`}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-2 relative"
              style={{ backgroundColor: color }}
            >
              {initials}
              {connectionStatus === 'connected' && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              )}
              {connectionStatus === 'connecting' && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white animate-pulse"></div>
              )}
              {connectionStatus === 'disconnected' && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            
            <span className={`text-sm ${currentTheme.textPrimary} font-medium text-center`}>
              {participantUsername} {isSelf && '(You)'}
            </span>
            
            <span className={`text-xs mt-1 ${
              connectionStatus === 'connected' ? 'text-green-500' :
              connectionStatus === 'connecting' ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting...' :
               'Disconnected'}
            </span>
            
            {isSpeaking && (
              <div className="flex space-x-1 mt-2">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  ></div>
                ))}
              </div>
            )}
            
            {isSelf && <audio ref={userAudio} autoPlay muted={isMuted} />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CallRoom;