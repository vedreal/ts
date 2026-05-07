import { useState } from "react";
import { motion } from "framer-motion";
import { useUpdateSettings } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import { haptic, hapticSuccess } from "@/lib/telegram";
import { copyToClipboard } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

export default function SettingsPage() {
  const { user, currency, setCurrency, language, setLanguage } = useApp();
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const MOCK_PRIVATE_KEY = "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••";
  const REAL_KEY = "KEEP_SAFE_NEVER_SHARE_5a3b7c2d9e1f...";

  const handleCurrencyChange = async (val: "USD" | "RUB") => {
    haptic("light");
    setCurrency(val);
    await updateSettings.mutateAsync({ data: { currency: val } });
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  const handleLanguageChange = async (val: "en" | "ru") => {
    haptic("light");
    setLanguage(val);
    await updateSettings.mutateAsync({ data: { language: val } });
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  const handleCopyKey = async () => {
    await copyToClipboard(REAL_KEY);
    setKeyCopied(true);
    hapticSuccess();
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const joinDate = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="flex flex-col pb-[72px]">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Profile Stats Card */}
      <div className="px-4 mb-4">
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Avatar + name */}
          <div className="flex items-center gap-4 p-4 border-b border-gray-50">
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt="avatar"
                className="w-14 h-14 rounded-full object-cover border-2 border-blue-100"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold border-2 border-blue-100">
                {(user?.username?.[0] ?? "U").toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-base font-bold text-gray-900">
                {user?.firstName ?? user?.username ?? "User"}
              </div>
              <div className="text-sm text-gray-400">@{user?.username ?? "username"}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 space-y-3">
            <ProfileRow label="Nickname" value={user?.firstName ?? "—"} />
            <ProfileRow label="Username" value={`@${user?.username ?? "—"}`} />
            <ProfileRow label="Joined" value={joinDate} />
            <ProfileRow label="Referrals" value={String(user?.referralCount ?? 0)} />
          </div>
        </motion.div>
      </div>

      {/* Currency */}
      <div className="px-4 mb-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Currency
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex">
            {(["USD", "RUB"] as const).map((c) => (
              <button
                key={c}
                onClick={() => handleCurrencyChange(c)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-all ${
                  currency === c
                    ? "bg-[#2196F3] text-white"
                    : "text-gray-500 active:bg-gray-50"
                }`}
              >
                {c === "USD" ? "🇺🇸 USD" : "🇷🇺 RUB"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="px-4 mb-3">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Language
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex">
            {(["en", "ru"] as const).map((l) => (
              <button
                key={l}
                onClick={() => handleLanguageChange(l)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-all ${
                  language === l
                    ? "bg-[#2196F3] text-white"
                    : "text-gray-500 active:bg-gray-50"
                }`}
              >
                {l === "en" ? "🇬🇧 English" : "🇷🇺 Russian"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Private Key */}
      <div className="px-4 mb-4">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
          Security
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => { haptic("light"); setShowPrivateKey((v) => !v); }}
            className="w-full flex items-center justify-between px-4 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f44336" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">Private Key</div>
                <div className="text-xs text-gray-400">Never share with anyone</div>
              </div>
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"
              className={`transition-transform ${showPrivateKey ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showPrivateKey && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="border-t border-gray-50"
            >
              <div className="px-4 py-3">
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                  <p className="text-xs text-red-600 font-semibold mb-1">⚠️ Warning</p>
                  <p className="text-xs text-red-500">Never share your private key with anyone. Anyone with your private key can steal your funds.</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 mb-2">
                  <p className="text-xs font-mono text-gray-600 break-all">{MOCK_PRIVATE_KEY}</p>
                </div>
                <button
                  onClick={handleCopyKey}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-xl text-xs font-semibold active:bg-red-600"
                >
                  {keyCopied ? "Copied!" : "Copy Private Key"}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Version */}
      <div className="px-4 pb-4 text-center">
        <span className="text-xs text-gray-300">TON Season v1.0.0</span>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
