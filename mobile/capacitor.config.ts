import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.fellowshiphub.app",
  appName: "EGF Connect",
  webDir: "dist",
  backgroundColor: "#f6f0e6",
  loggingBehavior: "debug",
  appendUserAgent: " EGFConnectMobile/1.0",
  android: {
    backgroundColor: "#f6f0e6",
    resolveServiceWorkerRequests: false
  },
  ios: {
    backgroundColor: "#f6f0e6",
    contentInset: "automatic",
    preferredContentMode: "mobile",
    allowsLinkPreview: false
  },
  plugins: {
    SystemBars: {
      insetsHandling: "css",
      style: "LIGHT",
      hidden: false,
      animation: "NONE"
    },
    SplashScreen: {
      launchShowDuration: 900,
      launchAutoHide: true,
      backgroundColor: "#1f7369",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: false
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true
    }
  }
};

export default config;
