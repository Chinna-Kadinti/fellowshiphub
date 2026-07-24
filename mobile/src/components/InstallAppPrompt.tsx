import { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Download, MoreVertical, Share2, X } from "lucide-react";
import { Button } from "./ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as NavigatorWithStandalone).standalone === true
  );
}

export function InstallAppPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [installed, setInstalled] = useState(isStandalone);
  const isIos = useMemo(() => /iPad|iPhone|iPod/.test(navigator.userAgent), []);

  useEffect(() => {
    if (Capacitor.isNativePlatform() || installed) return;

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const markInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setHelpOpen(false);
    };

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", markInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, [installed]);

  if (Capacitor.isNativePlatform() || installed) return null;

  async function requestInstall() {
    if (!installPrompt) {
      setHelpOpen(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") setInstalled(true);
  }

  return (
    <aside className={`install-app${helpOpen ? " install-app--open" : ""}`}>
      {helpOpen ? (
        <div aria-label="Install EGF Connect" className="install-app__panel" role="dialog">
          <header>
            <div>
              <strong>Install EGF Connect</strong>
              <small>Keep it on your home screen like an app.</small>
            </div>
            <button
              aria-label="Close installation instructions"
              className="install-app__close"
              onClick={() => setHelpOpen(false)}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </header>

          {isIos ? (
            <p>
              Open this page in Safari, tap <Share2 aria-hidden="true" size={16} /> <b>Share</b>,
              then choose <b>Add to Home Screen</b>.
            </p>
          ) : installPrompt ? (
            <Button className="button--full" onClick={requestInstall}>
              <Download aria-hidden="true" size={18} />
              Install now
            </Button>
          ) : (
            <p>
              In Chrome, keep this page open for about 30 seconds and tap the page once. Then
              tap <MoreVertical aria-hidden="true" size={17} /> and choose <b>Install app</b> or
              <b> Add to Home screen</b>. Installation is unavailable in Incognito mode.
            </p>
          )}
        </div>
      ) : (
        <button className="install-app__trigger" onClick={requestInstall} type="button">
          <Download aria-hidden="true" size={18} />
          Install app
        </button>
      )}
    </aside>
  );
}
