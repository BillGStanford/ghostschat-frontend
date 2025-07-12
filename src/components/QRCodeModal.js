import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';  // Note: Using QRCodeCanvas
import { X } from 'lucide-react';

const QRCodeModal = ({ showQRCode, setShowQRCode, roomId, currentTheme }) => {
  if (!showQRCode) return null;

  const roomLink = `${window.location.origin}?room=${roomId}`;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
      <div className={`${currentTheme.card} border rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-slide-up`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-bold ${currentTheme.textPrimary} gradient-text`}>Share Realm</h2>
          <button
            onClick={() => setShowQRCode(false)}
            className={`${currentTheme.buttonSecondary} p-2 rounded-full ${currentTheme.hover} transition-all duration-200`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex justify-center mb-6 bg-white p-4 rounded-xl">
          {/* Changed from QRCode to QRCodeCanvas */}
          <QRCodeCanvas 
            value={roomLink} 
            size={200} 
            bgColor="#ffffff" 
            fgColor="#1e293b" 
          />
        </div>
        <p className={`text-sm ${currentTheme.textSecondary} text-center break-all font-mono`}>{roomLink}</p>
      </div>
    </div>
  );
};

export default QRCodeModal;