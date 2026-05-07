import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@workspace/api-client-react";
import { initTelegramApp, getTelegramUser } from "@/lib/telegram";

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: "USD" | "RUB";
  setCurrency: (c: "USD" | "RUB") => void;
  language: "en" | "ru";
  setLanguage: (l: "en" | "ru") => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState("wallet");
  const [currency, setCurrency] = useState<"USD" | "RUB">("USD");
  const [language, setLanguage] = useState<"en" | "ru">("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initTelegramApp();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        activeTab,
        setActiveTab,
        currency,
        setCurrency,
        language,
        setLanguage,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
