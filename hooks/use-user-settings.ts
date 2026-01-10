"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "mafia-user-settings";

export interface UserSettings {
  autoplayVoiceMessages: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  autoplayVoiceMessages: true,
};

function loadSettings(): UserSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error("Failed to load user settings:", error);
  }

  return DEFAULT_SETTINGS;
}

function saveSettings(settings: UserSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save user settings:", error);
  }
}

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setIsLoaded(true);
  }, []);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      saveSettings(next);
      return next;
    });
  }, []);

  return {
    settings,
    updateSettings,
    isLoaded,
  };
}
