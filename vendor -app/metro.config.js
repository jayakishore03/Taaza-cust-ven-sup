// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure Metro resolves from the vendor-app directory
config.projectRoot = __dirname;
config.watchFolders = [__dirname];

module.exports = config;

