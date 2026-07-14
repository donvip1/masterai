"use client";

import { useEffect, useState } from "react";

export function AppRuntime() {
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    }

    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  useEffect(() => {
    const buttons = Array.from(document.querySelectorAll("[data-install-app]"));
    buttons.forEach((button) => {
      button.hidden = !installPrompt;
      button.onclick = async () => {
        if (!installPrompt) {
          return;
        }

        installPrompt.prompt();
        await installPrompt.userChoice;
        setInstallPrompt(null);
      };
    });

    return () => {
      buttons.forEach((button) => {
        button.onclick = null;
      });
    };
  }, [installPrompt]);

  return null;
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
