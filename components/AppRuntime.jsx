"use client";

import { useEffect, useState } from "react";

const INSTALL_DISMISSED_KEY = "eff-academy-install-dismissed-at";
const INSTALL_CONFIRMED_KEY = "eff-academy-app-installed";
const INSTALL_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;
const OPEN_INSTALL_EVENT = "eff-academy-open-install";
const INSTALL_STATUS_EVENT = "eff-academy-install-status";

function isStandaloneApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.navigator.standalone === true
  );
}

function isIosDevice() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const ipadDesktopMode =
    window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;

  return /iphone|ipad|ipod/.test(userAgent) || ipadDesktopMode;
}

function isSafariBrowser() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return (
    userAgent.includes("safari") &&
    !userAgent.includes("chrome") &&
    !userAgent.includes("crios") &&
    !userAgent.includes("android")
  );
}

function wasRecentlyDismissed() {
  const dismissedAt = Number(window.localStorage.getItem(INSTALL_DISMISSED_KEY) || 0);
  return dismissedAt > 0 && Date.now() - dismissedAt < INSTALL_DISMISS_DURATION;
}

function hasConfirmedInstallation() {
  return isStandaloneApp() || window.localStorage.getItem(INSTALL_CONFIRMED_KEY) === "true";
}

function announceInstallStatus(installed) {
  document.documentElement.dataset.appInstalled = installed ? "true" : "false";
  window.dispatchEvent(new CustomEvent(INSTALL_STATUS_EVENT, { detail: { installed } }));
}

export function AppRuntime() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(true);
  const [platform, setPlatform] = useState("browser");
  const [popupOpen, setPopupOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const alreadyInstalled = hasConfirmedInstallation();
    const ios = isIosDevice();
    const safari = isSafariBrowser();

    setInstalled(alreadyInstalled);
    setPlatform(ios ? "ios" : safari ? "safari" : "browser");
    announceInstallStatus(alreadyInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js", { scope: "/" })
        .then((registration) => registration.update())
        .catch(() => {});
    }

    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleInstalled = () => {
      window.localStorage.setItem(INSTALL_CONFIRMED_KEY, "true");
      window.localStorage.removeItem(INSTALL_DISMISSED_KEY);
      setInstalled(true);
      setInstallPrompt(null);
      setPopupOpen(false);
      announceInstallStatus(true);
    };
    const handleOpenInstall = () => {
      if (!hasConfirmedInstallation()) {
        setPopupOpen(true);
      }
    };
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const handleDisplayMode = () => {
      if (isStandaloneApp()) {
        handleInstalled();
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener(OPEN_INSTALL_EVENT, handleOpenInstall);
    displayMode.addEventListener?.("change", handleDisplayMode);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener(OPEN_INSTALL_EVENT, handleOpenInstall);
      displayMode.removeEventListener?.("change", handleDisplayMode);
    };
  }, []);

  useEffect(() => {
    const shouldOfferInstall = !installed && !wasRecentlyDismissed();

    if (!shouldOfferInstall) {
      return undefined;
    }

    const timer = window.setTimeout(() => setPopupOpen(true), 1800);
    return () => window.clearTimeout(timer);
  }, [installPrompt, installed, platform]);

  function dismissInstall() {
    window.localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now()));
    setPopupOpen(false);
  }

  async function installApp() {
    if (!installPrompt || installing) {
      return;
    }

    setInstalling(true);

    try {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        window.localStorage.setItem(INSTALL_CONFIRMED_KEY, "true");
        window.localStorage.removeItem(INSTALL_DISMISSED_KEY);
        setInstalled(true);
        setPopupOpen(false);
        announceInstallStatus(true);
      } else {
        window.localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now()));
        setPopupOpen(false);
      }
    } finally {
      setInstallPrompt(null);
      setInstalling(false);
    }
  }

  if (installed || !popupOpen) {
    return null;
  }

  const manualInstall = !installPrompt;
  const iosInstall = manualInstall && platform === "ios";
  const safariInstall = manualInstall && platform === "safari";

  return (
    <aside
      className="install-prompt"
      role="dialog"
      aria-modal="false"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-description"
    >
      <div className="install-prompt-heading">
        <img src="/app-icon-192.png" alt="" width="56" height="56" />
        <div>
          <span>EFF Academy App</span>
          <h2 id="install-prompt-title">Install on this device</h2>
        </div>
        <button
          className="install-prompt-close"
          type="button"
          onClick={dismissInstall}
          aria-label="Dismiss app installation"
          title="Not now"
        >
          X
        </button>
      </div>

      <p id="install-prompt-description">
        Add EFF Academy to your home screen for faster access to your dashboard and classes.
      </p>

      {manualInstall && (
        <ol className="install-prompt-steps">
          {iosInstall ? (
            <>
              <li><strong>1</strong><span>Tap the Share button in your browser.</span></li>
              <li><strong>2</strong><span>Select Add to Home Screen, then confirm.</span></li>
            </>
          ) : safariInstall ? (
            <>
              <li><strong>1</strong><span>Open the File menu in Safari.</span></li>
              <li><strong>2</strong><span>Select Add to Dock, then confirm.</span></li>
            </>
          ) : (
            <>
              <li><strong>1</strong><span>Open your browser menu.</span></li>
              <li><strong>2</strong><span>Select Install app, Add to Home screen, or Create shortcut.</span></li>
            </>
          )}
        </ol>
      )}

      <div className="install-prompt-actions">
        {installPrompt && (
          <button className="button primary" type="button" onClick={installApp} disabled={installing}>
            {installing ? "Opening..." : "Install App"}
          </button>
        )}
        <button className="button ghost-button" type="button" onClick={dismissInstall}>
          {manualInstall ? "Got It" : "Not Now"}
        </button>
      </div>
    </aside>
  );
}

export function InstallAppButton({ className = "button ghost-button" }) {
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    const updateStatus = (event) => {
      setInstalled(event?.detail?.installed ?? hasConfirmedInstallation());
    };

    setInstalled(hasConfirmedInstallation());
    window.addEventListener(INSTALL_STATUS_EVENT, updateStatus);
    return () => window.removeEventListener(INSTALL_STATUS_EVENT, updateStatus);
  }, []);

  if (installed) {
    return null;
  }

  return (
    <button
      className={className}
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_INSTALL_EVENT))}
    >
      Install App
    </button>
  );
}

export function ConnectionStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <span className={`status-pill ${online ? "is-online" : "is-offline"}`}>
      {online ? "Online" : "Offline"}
    </span>
  );
}
