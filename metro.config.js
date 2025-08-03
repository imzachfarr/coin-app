const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable support for TypeScript path mapping
config.resolver.alias = {
  '@': './src',
  '@/components': './src/components',
  '@/contexts': './src/contexts',
  '@/screens': './src/screens',
  '@/navigation': './src/navigation',
  '@/api': './src/api',
  '@/theme': './src/theme',
  '@/utils': './src/utils',
};

module.exports = config; 