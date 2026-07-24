import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";
import { Network } from "@capacitor/network";
import { SplashScreen } from "@capacitor/splash-screen";
import { focusManager, onlineManager } from "@tanstack/react-query";

let nativeInitialized = false;
let launchUrlHandled = false;

const APP_SCHEME = "fellowshiphub:";
const APP_ROUTES = new Set([
  "/dashboard",
  "/meetings",
  "/announcements",
  "/resources",
  "/prayer",
  "/discussions",
  "/reading",
  "/directory",
  "/reports",
  "/login",
  "/register"
]);

function allowedAppPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const pathname = normalized.split(/[?#]/, 1)[0];
  if (APP_ROUTES.has(pathname)) return normalized;
  if (/^\/meetings\/[^/]+$/.test(pathname)) return normalized;
  return null;
}

function appPathFromUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    let path: string;

    if (parsed.protocol === APP_SCHEME) {
      const hostPath = parsed.hostname && parsed.hostname !== "app" ? `/${parsed.hostname}` : "";
      path = `${hostPath}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } else if (parsed.protocol === "https:") {
      const configuredApiUrl = import.meta.env.VITE_API_URL;
      if (!configuredApiUrl || parsed.origin !== new URL(configuredApiUrl).origin) return null;
      path = parsed.hash.startsWith("#/")
        ? parsed.hash.slice(1)
        : `${parsed.pathname}${parsed.search}`;
    } else {
      return null;
    }

    return allowedAppPath(path);
  } catch {
    return null;
  }
}

export async function initializeNativeRuntime() {
  if (nativeInitialized) return;
  nativeInitialized = true;

  onlineManager.setEventListener((setOnline) => {
    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;

    void Network.getStatus().then((status) => {
      if (!disposed) setOnline(status.connected);
    });
    void Network.addListener("networkStatusChange", (status) => {
      setOnline(status.connected);
    }).then((handle) => {
      removeListener = () => handle.remove();
    });

    return () => {
      disposed = true;
      void removeListener?.();
    };
  });

  if (!Capacitor.isNativePlatform()) return;

  await CapacitorApp.addListener("appStateChange", ({ isActive }) => {
    focusManager.setFocused(isActive);
  });

  await Promise.allSettled([
    SystemBars.setStyle({ style: SystemBarsStyle.Light }),
    SystemBars.show(),
    SplashScreen.hide()
  ]);
}

export async function openExternal(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: parsed.toString(), presentationStyle: "popover" });
    return true;
  }
  window.open(parsed.toString(), "_blank", "noopener,noreferrer");
  return true;
}

export function installNativeBackHandler(onBack: () => boolean) {
  if (!Capacitor.isNativePlatform()) return () => undefined;

  let disposed = false;
  let remove: (() => Promise<void>) | undefined;
  void CapacitorApp.addListener("backButton", ({ canGoBack }) => {
    if (onBack()) return;
    if (!canGoBack) void CapacitorApp.exitApp();
  }).then((handle) => {
    if (disposed) {
      void handle.remove();
    } else {
      remove = () => handle.remove();
    }
  });

  return () => {
    disposed = true;
    void remove?.();
  };
}

export function installNativeUrlHandler(onPath: (path: string) => void) {
  if (!Capacitor.isNativePlatform()) return () => undefined;

  let disposed = false;
  let remove: (() => Promise<void>) | undefined;
  void CapacitorApp.addListener("appUrlOpen", ({ url }) => {
    const path = appPathFromUrl(url);
    if (path) onPath(path);
  }).then((handle) => {
    if (disposed) {
      void handle.remove();
    } else {
      remove = () => handle.remove();
    }
  });

  if (!launchUrlHandled) {
    launchUrlHandled = true;
    void CapacitorApp.getLaunchUrl().then((result) => {
      if (disposed || !result?.url) return;
      const path = appPathFromUrl(result.url);
      if (path) onPath(path);
    });
  }

  return () => {
    disposed = true;
    void remove?.();
  };
}
