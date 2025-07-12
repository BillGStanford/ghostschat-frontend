import Peer from 'simple-peer';

export const createPeer = (userToSignal, callerID, stream, socket, roomId) => {
  const peer = new Peer({
    initiator: true,
    trickle: false,
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

  peer.on('error', err => {
    console.error('Peer error:', err);
  });

  return peer;
};

export const addPeer = (incomingSignal, callerID, stream, socket, roomId) => {
  const peer = new Peer({
    initiator: false,
    trickle: false,
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

  peer.on('error', err => {
    console.error('Peer error:', err);
  });

  peer.signal(incomingSignal);
  return peer;
};