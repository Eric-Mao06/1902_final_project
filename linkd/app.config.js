module.exports = {
  expo: {
    name: 'linkd',
    slug: 'linkd',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    scheme: 'linkd',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.linkd.app'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.linkd.app'
    },
    web: {
      favicon: './assets/favicon.png'
    },
    extra: {
      googleClientId: process.env.GOOGLE_CLIENT_ID
    },
    plugins: ['expo-secure-store']
  }
};
