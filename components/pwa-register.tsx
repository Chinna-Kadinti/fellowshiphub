"use client";

import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1023px)").matches ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIos(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    setShowInstall(mobile && !isInstalled());

    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    const markInstalled = () => {
      setInstallPrompt(null);
      setShowHelp(false);
      setShowInstall(false);
    };

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", markInstalled);

    if (!("serviceWorker" in navigator)) {
      return () => {
        window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
        window.removeEventListener("appinstalled", markInstalled);
      };
    }

    const isLocalhost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(window.location.hostname);
    if (isLocalhost) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      });
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
      }
    } else if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => undefined);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) {
      setShowHelp(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") setShowInstall(false);
  }

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 lg:bottom-5" aria-live="polite">
      {showHelp && (
        <div
          className="mb-3 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border bg-card p-4 shadow-2xl"
          role="dialog"
          aria-label="Install EGF Connect"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Install EGF Connect</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isIos ? (
                  <>In Safari, tap <Share2 className="inline h-4 w-4" aria-hidden="true" /> <b>Share</b>, then <b>Add to Home Screen</b>.</>
                ) : (
                  <>Open your browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.</>
                )}
              </p>
            </div>
            <button
              type="button"
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              onClick={() => setShowHelp(false)}
              aria-label="Close install instructions"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={install}
        className="ml-auto flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform active:scale-95"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Install app
      </button>
    </div>
  );
}
