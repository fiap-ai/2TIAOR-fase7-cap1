/**
 * Expo configuration — replaces app.json.
 * Reads EXPO_PUBLIC_API_URL from .env so the API base URL
 * is configurable per environment without code changes.
 *
 * @see https://docs.expo.dev/versions/latest/config/app/
 */
export default {
  expo: {
    name: "CardioIA",
    slug: "cardioai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "br.com.fiap.cardioai",
    },
    android: {
      package: "br.com.fiap.cardioai",
      adaptiveIcon: {
        backgroundColor: "#DC2626",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      apiUrl:
        process.env.EXPO_PUBLIC_API_URL ||
        "https://twotiaor-fase7-cap1.onrender.com",
      eas: {
        projectId: "e7da2b21-1c84-4fa4-bc58-975b8e1d60dc",
      },
    },
  },
};
