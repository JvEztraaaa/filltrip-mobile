module.exports = function (api) {
  api.cache(true);
  return {
    // Use Expo preset and NativeWind preset
    presets: ["babel-preset-expo", "nativewind/babel"],
  };
};
