// src/constants.js
export const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'ghostschat-secret-key-2024';

export const THEMES = {
  default: {
    name: 'Phantom',
    bg: 'bg-gradient-to-br from-ghost-900 via-phantom-900 to-ghost-800',
    card: 'bg-ghost-800/80 backdrop-blur-md border-ghost-600',
    input: 'bg-ghost-800/50 border-ghost-600 text-ghost-100 placeholder-ghost-400',
    button: 'bg-purple-600 hover:bg-purple-500 text-white shadow-glow',
    buttonSecondary: 'bg-ghost-700/50 hover:bg-ghost-600/50 text-ghost-100 border-ghost-600',
    textPrimary: 'text-ghost-100',
    textSecondary: 'text-ghost-400',
    border: 'border-ghost-600',
    accent: 'text-purple-400',
    hover: 'hover:text-purple-300'
  },
  dark: {
    name: 'Abyss',
    bg: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900',
    card: 'bg-gray-800/80 backdrop-blur-md border-gray-600',
    input: 'bg-gray-800/50 border-gray-600 text-gray-100 placeholder-gray-400',
    button: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow',
    buttonSecondary: 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-100 border-gray-600',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-400',
    border: 'border-gray-600',
    accent: 'text-indigo-400',
    hover: 'hover:text-indigo-300'
  },
  light: {
    name: 'Specter',
    bg: 'bg-gradient-to-br from-ghost-100 via-ghost-50 to-ghost-100',
    card: 'bg-white/80 backdrop-blur-md border-ghost-200',
    input: 'bg-ghost-50/50 border-ghost-200 text-ghost-900 placeholder-ghost-400',
    button: 'bg-purple-500 hover:bg-purple-400 text-white shadow-glow',
    buttonSecondary: 'bg-ghost-100/50 hover:bg-ghost-200/50 text-ghost-900 border-ghost-200',
    textPrimary: 'text-ghost-900',
    textSecondary: 'text-ghost-500',
    border: 'border-ghost-200',
    accent: 'text-purple-500',
    hover: 'hover:text-purple-400'
  }
};