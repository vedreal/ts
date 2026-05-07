import { useState } from "react";
import { motion } from "framer-motion";
import { useGetDepositAddress } from "@workspace/api-client-react";
import { copyToClipboard } from "@/lib/utils";
import { haptic, hapticSuccess } from "@/lib/telegram";
import { TonIcon } from "@/components/TonIcon";

interface Props {
  onBack: () => void;
  address: string;
}

export default function DepositPage({ onBack, address }: Props) {
  const { data: depositInfo, isLoading } = useGetDepositAddress();
  const [copied, setCopied] = useState(false);
  const [networkCopied, setNetworkCopied] = useState(false);

  const displayAddress = depositInfo?.address ?? address ?? "";
  const network = depositInfo?.network ?? "TON";

  const handleCopyAddress = async () => {
    await copyToClipboard(displayAddress);
    setCopied(true);
    hapticSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyNetwork = async () => {
    await copyToClipboard(network);
    setNetworkCopied(true);
    haptic("medium");
    setTimeout(() => setNetworkCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "tween", ease: [0.25, 0.46, 0.45, 0.94], duration: 0.35 }}
      className="flex flex-col min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="flex items-center px-4 pt-4 pb-3">
        <button
          onClick={() => { haptic("light"); onBack(); }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 active:scale-95 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-[17px] font-semibold text-gray-900 -ml-9">
          Add Fund
        </h1>
      </div>

      <div className="flex-1 px-4 py-2">
        {/* Icon */}
        <div className="flex flex-col items-center mb-6 mt-4">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-3">
            <TonIcon size={48} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Deposit TON</h2>
          <p className="text-sm text-gray-400 mt-1 text-center">
            Send only TON to this address on the TON network
          </p>
        </div>

        {/* Warning */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4 flex gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="mt-0.5 shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
          </svg>
          <div className="text-sm text-orange-700">
            <strong>Important:</strong> Only send TON (Toncoin) to this address. Sending other assets may result in permanent loss.
          </div>
        </div>

        {/* Network */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3">
          <div className="px-4 py-3 border-b border-gray-50">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Network</span>
          </div>
          <button
            onClick={handleCopyNetwork}
            className="w-full px-4 py-4 flex items-center justify-between active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <TonIcon size={32} />
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">TON Network</div>
                <div className="text-xs text-gray-400">The Open Network</div>
              </div>
            </div>
            {networkCopied ? (
              <span className="text-xs text-green-500 font-medium">Copied!</span>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-50">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Your TON Address</span>
          </div>
          {isLoading ? (
            <div className="p-4">
              <div className="shimmer h-16 rounded-xl" />
            </div>
          ) : (
            <div className="p-4">
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <p className="text-sm font-mono text-gray-700 break-all leading-relaxed">
                  {displayAddress}
                </p>
              </div>
              <button
                onClick={handleCopyAddress}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#2196F3] text-white rounded-xl text-sm font-semibold active:bg-[#1976D2] transition-colors"
              >
                {copied ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Address Copied!
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy Address
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Info steps */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">How to deposit</h3>
          {[
            "Copy the TON address above",
            "Open your TON wallet or exchange",
            "Send TON to this address on TON network",
            "Funds will appear after network confirmation",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-[#2196F3] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <span className="text-sm text-gray-600">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
