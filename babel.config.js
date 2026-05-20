module.exports = function (api) {
  api.cache(true);

  const isWeb = process.env.EXPO_TARGET === 'web' ||
    (process.env.BABEL_ENV || '').includes('web');

  const plugins = [];

  // Only alias react-native-maps to the web implementation on web platform.
  // On native (Android/iOS), react-native-maps renders real Google Maps tiles.
  if (isWeb) {
    plugins.push([
      'module-resolver',
      {
        alias: {
          'react-native-maps': '@teovilla/react-native-web-maps',
        },
      },
    ]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
