const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];
config.resolver.useWatchman = false;
config.watcher = {
  watchman: { deferStates: [] },
  health: { enabled: false },
  additionalExts: [],
  useWatchman: false,
  fs: {
    polling: {
      enabled: true,
      interval: 2000,
    },
  },
};

module.exports = config;
