"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type SiteSettings = {
  shopName: string;
  supportEmail: string;
  telegramManager: string;
  telegramChannel: string;
  frontendUrl: string;
  yukassaConfigured: boolean;
  shippingCost: number;
  freeShippingThreshold: number;
};

const defaultSettings: SiteSettings = {
  shopName: "BRANDBLESS",
  supportEmail: "support@brandbless.ru",
  telegramManager: "https://t.me/bless_mng",
  telegramChannel: "https://t.me/brandbless",
  frontendUrl: "https://brandbless.ru",
  yukassaConfigured: false,
  shippingCost: 50,
  freeShippingThreshold: 5000,
};

const SettingsContext = createContext<SiteSettings>(defaultSettings);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    fetch(`${API_URL}/api/settings`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setSettings((prev) => ({ ...prev, ...data.data }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
