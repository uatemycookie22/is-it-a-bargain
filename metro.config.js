const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Enable package exports for better-auth
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativewind(config, {
  input: "./global.css",
  configPath: "./tailwind.config.js",
});
