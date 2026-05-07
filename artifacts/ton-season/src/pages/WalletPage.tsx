import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetWalletBalance, useGetTransactions, useGetTonPrice } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import { TonIcon, TonBadge } from "@/components/TonIcon";
import { formatUsd, formatTon, formatPercent, shortenAddress, formatDate, formatTime, copyToClipboard } from "@/lib/utils";
import { haptic } from "@/lib/telegram";
import DepositPage from "./DepositPage";
import SendPage from "./SendPage";
import SwapPage from "./SwapPage";

type SubPage = "deposit" | "send" | "swap" | null;

export default function WalletPage() {
  const { user } = useApp();
  const [subPage, setSubPage] = useState<SubPage>(null);
  const [txOffset, setTxOffset] = useState(0);
  const [allTxs, setAllTxs] = useState<any[]>([]);
  const [addressCopied, setAddressCopied] = useState(false);

  const enabled = !!user?.telegramId;
  const { data: balance, isLoading: balanceLoading } = useGetWalletBalance({ query: { enabled } });
  const { data: tonPrice } = useGetTonPrice();
  const { data: txData, isLoading: txLoading } = useGetTransactions({ limit: 5, offset: txOffset }, { query: { enabled } });

  useEffect(() => {
    if (txData?.transactions) {
      if (txOffset === 0) {
        setAllTxs(txData.transactions);
      } else {
        setAllTxs((prev) => [...prev, ...txData.transactions]);
      }
    }
  }, [txData, txOffset]);

  const handleCopyAddress = async () => {
    if (balance?.address) {
      await copyToClipboard(balance.address);
      setAddressCopied(true);
      haptic("medium");
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  if (subPage === "deposit") return <DepositPage onBack={() => setSubPage(null)} address={balance?.address ?? ""} />;
  if (subPage === "send") return <SendPage onBack={() => setSubPage(null)} balance={balance?.assets?.[0]?.balance ?? 0} />;
  if (subPage === "swap") return <SwapPage onBack={() => setSubPage(null)} assets={balance?.assets ?? []} />;

  const tonAsset = balance?.assets?.find((a) => a.symbol === "TON");
  const tonsAsset = balance?.assets?.find((a) => a.symbol === "TONS");

  const displayName = user?.username ? `@${user.username}` : "@user";

  return (
    <div className="flex flex-col pb-[72px]">
      {/* Header with username */}
      <div className="flex items-center justify-center gap-2 pt-4 pb-2 px-4">
        {user?.photoUrl ? (
          <img
            src={user.photoUrl}
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold border-2 border-white shadow">
            {(user?.username?.[0] ?? "U").toUpperCase()}
          </div>
        )}
        <h1 className="text-[17px] font-semibold text-gray-900">{displayName}</h1>
      </div>

      {/* Balance Card */}
      <div className="px-3 mb-4">
        <motion.div
          className="ton-card p-5 text-white"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {balanceLoading ? (
            <div className="shimmer h-10 w-36 rounded-lg mb-2" />
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">
                {formatUsd(balance?.totalUsd ?? 0, 2)}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white" className="opacity-70 mb-1">
                <path d="M12 4l8 8-8 8M4 12h16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          )}

          <div className="flex items-center gap-2 mt-1 mb-4">
            <span className="text-sm bg-white/20 rounded-full px-3 py-0.5 flex items-center gap-1">
              {formatPercent(balance?.changePercent ?? 0)} · {formatUsd(balance?.changeUsd ?? 0)}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </div>

          <button
            onClick={handleCopyAddress}
            className="flex items-center gap-2 text-white/90 text-sm"
          >
            <TonBadge size={18} />
            <span className="font-mono">
              {balance?.address ? shortenAddress(balance.address, 6, 6) : "Loading..."}
            </span>
            <span className="text-white/60 text-xs">⇄</span>
            {addressCopied && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs text-green-300"
              >
                Copied!
              </motion.span>
            )}
          </button>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-around max-w-xs mx-auto">
          {[
            {
              id: "deposit",
              label: "Add",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
                  <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
                </svg>
              ),
            },
            {
              id: "send",
              label: "Send",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="19" x2="12" y2="5" strokeLinecap="round" />
                  <polyline points="5 12 12 5 19 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
            },
            {
              id: "swap",
              label: "Swap",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 8v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ),
            },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => {
                haptic("light");
                setSubPage(btn.id as SubPage);
              }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 active:scale-95 transition-transform">
                {btn.icon}
              </div>
              <span className="text-xs text-gray-600 font-medium">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Assets Section */}
      <div className="px-3 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab */}
          <div className="flex items-center gap-4 px-4 pt-4 pb-3 border-b border-gray-100">
            <button className="flex items-center gap-1 text-sm font-semibold text-gray-900 bg-gray-100 rounded-full px-3 py-1">
              Assets
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* TON Asset */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <TonIcon size={40} />
              <div>
                <div className="font-semibold text-gray-900 text-sm">Toncoin</div>
                <div className="text-xs text-gray-500">
                  {formatUsd(tonAsset?.priceUsd ?? tonPrice?.priceUsd ?? 0)}{" "}
                  <span className="text-green-500">
                    {formatPercent(tonAsset?.changePercent ?? tonPrice?.changePercent ?? 0)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {formatTon(tonAsset?.balance ?? 0)} TON
              </div>
              <div className="text-xs text-gray-500">{formatUsd(tonAsset?.valueUsd ?? 0)}</div>
            </div>
          </div>

          {/* TONS Asset */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">TS</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">TONS</div>
                <div className="text-xs text-gray-400">TON Season Token</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {formatTon(tonsAsset?.balance ?? 0)} TONS
              </div>
              <div className="text-xs text-gray-400">-</div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="px-3">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {txLoading && txOffset === 0 ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="shimmer w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="shimmer h-3 w-24 rounded" />
                    <div className="shimmer h-3 w-32 rounded" />
                  </div>
                  <div className="shimmer h-4 w-16 rounded" />
                </div>
              ))}
            </div>
          ) : allTxs.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No transactions yet</div>
          ) : (
            <>
              <TransactionList transactions={allTxs} />
              {txData?.hasMore && (
                <button
                  onClick={() => {
                    haptic("light");
                    setTxOffset((prev) => prev + 5);
                  }}
                  className="w-full py-3 text-[#2196F3] text-sm font-medium text-center border-t border-gray-100 active:bg-gray-50"
                >
                  Load More
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TransactionList({ transactions }: { transactions: any[] }) {
  // Group by date
  const grouped: { [date: string]: any[] } = {};
  transactions.forEach((tx) => {
    const label = formatDate(tx.date);
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(tx);
  });

  return (
    <div>
      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date}>
          <div className="px-4 py-2 text-[13px] font-semibold text-[#2196F3]">{date}</div>
          {txs.map((tx, i) => (
            <TransactionItem key={tx.id ?? i} tx={tx} />
          ))}
        </div>
      ))}
    </div>
  );
}

function TransactionItem({ tx }: { tx: any }) {
  const isSent = tx.type === "sent";
  const isReceived = tx.type === "received";
  const isSwap = tx.type === "swap";

  const iconBg = isSent ? "bg-orange-100" : isReceived ? "bg-green-100" : "bg-blue-100";
  const iconColor = isSent ? "text-orange-500" : isReceived ? "text-green-500" : "text-blue-500";
  const amountColor = isSent ? "text-gray-900" : isReceived ? "text-green-500" : "text-blue-500";
  const sign = isSent ? "-" : isReceived ? "+" : "⇄";

  const label = isSent ? "Sent" : isReceived ? "Received" : "Swap";
  const sublabel = isSent
    ? `to ${tx.toAddress ? tx.toAddress.slice(0, 8) + "···" : "Unknown"}`
    : isReceived
    ? `from ${tx.fromAddress ? tx.fromAddress.slice(0, 8) + "···" : "Unknown"}`
    : `${tx.symbol}`;

  return (
    <div className="px-4 py-3 border-t border-gray-50">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${iconBg} ${iconColor} flex items-center justify-center`}>
          {isSent ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="7" y1="17" x2="17" y2="7" strokeLinecap="round" />
              <polyline points="7 7 17 7 17 17" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : isReceived ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="17" y1="7" x2="7" y2="17" strokeLinecap="round" />
              <polyline points="17 17 7 17 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">{label}</span>
            <span className={`text-sm font-semibold ${amountColor} flex items-center gap-1`}>
              {sign}{formatTon(tx.amount)} {tx.symbol}
              <TonBadge size={14} />
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-xs text-gray-400">
              {sublabel} · {formatTime(tx.date)}
            </span>
            <span className="text-xs text-gray-400">{formatUsd(tx.valueUsd)}</span>
          </div>
          {tx.memo && (
            <div className={`mt-1.5 text-xs px-3 py-1.5 rounded-xl inline-block max-w-full break-all font-mono ${
              isSent ? "bg-blue-500 text-white" : "bg-green-500 text-white"
            }`}>
              {tx.memo}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
