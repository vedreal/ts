import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import NavBar from "@/components/NavBar";
import WalletPage from "@/pages/WalletPage";
import TasksPage from "@/pages/TasksPage";
import ReferralPage from "@/pages/ReferralPage";
import SettingsPage from "@/pages/SettingsPage";
import { getTelegramUser, getStartParam } from "@/lib/telegram";
import "@/lib/api";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -40 },
};

const pageTransition = {
  type: "tween" as const,
  ease: [0.25, 0.46, 0.45, 0.94],
  duration: 0.32,
};

function AppContent() {
  const { activeTab, setUser, setIsLoading } = useApp();

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const tgUser = getTelegramUser();
        const startParam = getStartParam();

        const tgIdValue = tgUser
          ? String(tgUser.id)
          : "demo_" + Math.random().toString(36).slice(2, 8);

        const payload = tgUser
          ? {
              telegramId: tgIdValue,
              username: tgUser.username ?? `user${tgUser.id}`,
              firstName: tgUser.first_name ?? null,
              photoUrl: tgUser.photo_url ?? null,
              referralCode: startParam ?? null,
            }
          : {
              telegramId: tgIdValue,
              username: "demo_user",
              firstName: "Demo",
              photoUrl: null,
              referralCode: null,
            };

        // Store telegram ID globally for API calls
        (window as any).__tonSeasonTelegramId = tgIdValue;

        const res = await fetch("/api/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const user = await res.json();
          setUser(user);
        }
      } catch (e) {
        console.error("Init failed:", e);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [setUser, setIsLoading]);

  const pages: Record<string, JSX.Element> = {
    wallet: <WalletPage />,
    tasks: <TasksPage />,
    referral: <ReferralPage />,
    settings: <SettingsPage />,
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-[480px] mx-auto relative">
      <div className="flex-1 overflow-y-auto hide-scrollbar relative" style={{ paddingBottom: "60px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            {pages[activeTab] ?? pages["wallet"]}
          </motion.div>
        </AnimatePresence>
      </div>
      <NavBar />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </QueryClientProvider>
  );
}
