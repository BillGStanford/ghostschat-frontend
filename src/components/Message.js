// src/components/Message.js
import React from 'react';
import { Ghost, X } from 'lucide-react';

const Message = ({ message, currentTheme, isAdmin, isSeniorMod, isModerator, deleteMessage }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderLink = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`${currentTheme.accent} ${currentTheme.hover} underline transition-colors duration-200`}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className={`${currentTheme.textSecondary} text-sm italic ${currentTheme.card} px-4 py-2 rounded-full shadow-md animate-slide-up`}>
          {message.content}
        </span>
      </div>
    );
  }

  if (message.type === 'image') {
    return (
      <div className="flex flex-col space-y-2 animate-slide-up group relative">
        {(isAdmin || isSeniorMod || isModerator) && (
          <button
            onClick={() => deleteMessage(message.id)}
            className="absolute -right-2 -top-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-glow"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center space-x-2">
          <Ghost className="w-5 h-5 text-purple-400 animate-pulse-slow" />
          <span className={`${currentTheme.textPrimary} text-sm font-semibold`}>{message.username}</span>
          <span className={`${currentTheme.textSecondary} text-xs`}>{formatTime(message.timestamp)}</span>
        </div>
        <div className="ml-8">
          <img 
            src={message.content} 
            alt="Shared image" 
            className="max-w-xs max-h-64 rounded-xl border ${currentTheme.border} shadow-md"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2 animate-slide-up group relative">
      {(isAdmin || isSeniorMod || isModerator) && (
        <button
          onClick={() => deleteMessage(message.id)}
          className="absolute -right-2 -top-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-glow"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="flex items-center space-x-2">
        <Ghost className="w-5 h-5 text-purple-400 animate-pulse-slow" />
        <span className={`${currentTheme.textPrimary} text-sm font-semibold`}>{message.username}</span>
        <span className={`${currentTheme.textSecondary} text-xs`}>{formatTime(message.timestamp)}</span>
      </div>
      <div className={`ml-8 ${currentTheme.textPrimary} break-words text-sm`}>
        {renderLink(message.content)}
      </div>
    </div>
  );
};

export default Message;