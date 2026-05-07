import { useState } from "react";
import { motion } from "framer-motion";
import { useSendTon, useGetWalletBalance } from "@workspace/api-client-react";
import { haptic, hapticSuccess, hapticError } from "@/lib/telegram";
import { formatTon, formatUsd } from "@/lib/utils";
import { TonIcon } from "@/components/TonIcon";
import { useQueryClient } from "@tanstack/react-query";
import { getGetWalletBalanceQueryKey, getGetTransactionsQueryKey } from "@workspace/api-client-react";

interface Props {
  onBack: () => void;
  balance: number;
}

export default function SendPage({ onBack, balance }: Props) {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const sendTon = useSendTon();
  const { data: walletData } = useGetWalletBalance();
  const tonBalance = walletData?.assets?.find((a) => a.symbol === "TON")?.balance ?? balance;
  const tonPrice = walletData?.assets?.find((a) => a.symbol === "TON")?.priceUsd ?? 0;

  const amountNum = parseFloat(amount) || 0;
  const valueUsd = amountNum * tonPrice;

  const handleMax = () => {
    setAmount(tonBalance.toString());
    haptic("light");
  };

  const handleNext = () => {
    setError("");
    if (!toAddress.trim()) { setError("Please enter a destination address"); return; }
    if (toAddress.length < 20) { setError("Invalid TON address"); return; }
    if (amountNum <= 0) { setError("Please enter an amount"); return; }
    if (amountNum > tonBalance) { setError("Insufficient balance"); return; }
    haptic("medium");
    setStep("confirm");
  };

  const handleSend = async () => {
    haptic("heavy");
    try {
      await sendTon.mutateAsync({
        data: {
          toAddress,
          amount: amountNum,
          memo: memo || null,
        },
      });
      hapticSuccess();
      queryClient.invalidateQueries({ queryKey: getGetWalletBalanceQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
      setStep("success");
    } catch (e: any) {
      hapticError();
      setError(e?.data?.error ?? "Transaction failed. Please try again.");
      setStep("form");
    }
  };

  if (step === "success") {
    return (
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex flex-col min-h-screen bg-gray-50 items-center justify-center px-6"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring" }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sent!</h2>
        <p className="text-gray-500 text-sm text-center mb-1">
          {formatTon(amountNum)} TON sent successfully
        </p>
        <p className="text-gray-400 text-xs text-center mb-8">≈ {formatUsd(valueUsd)}</p>
        <button
          onClick={onBack}
          className="w-full py-3.5 bg-[#2196F3] text-white rounded-2xl font-semibold text-base active:bg-[#1976D2] transition-colors"
        >
          Back to Wallet
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "tween", ease: [0.25, 0.46, 0.45, 0.94], duration: 0.35 }}
      className="flex flex-col min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="flex items-center px-4 pt-4 pb-3">
        <button
          onClick={() => { haptic("light"); if (step === "confirm") { setStep("form"); } else { onBack(); } }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 active:scale-95 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-[17px] font-semibold text-gray-900 -ml-9">
          {step === "confirm" ? "Confirm Send" : "Send TON"}
        </h1>
      </div>

      <div className="flex-1 px-4 py-4">
        {step === "form" ? (
          <>
            {/* Balance display */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <TonIcon size={36} />
              <div>
                <div className="text-2xl font-bold text-gray-900">{formatTon(tonBalance)} TON</div>
                <div className="text-sm text-gray-400 text-center">{formatUsd(tonBalance * tonPrice)}</div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-50">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">To Address</span>
                </div>
                <textarea
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="Enter TON wallet address..."
                  className="w-full px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none outline-none font-mono"
                  rows={2}
                />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center px-4 py-2 border-b border-gray-50">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide flex-1">Amount (TON)</span>
                  <button onClick={handleMax} className="text-xs text-[#2196F3] font-semibold">MAX</button>
                </div>
                <div className="flex items-center px-4 py-3 gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 text-xl font-semibold text-gray-900 placeholder-gray-300 outline-none"
                  />
                  <span className="text-gray-400 text-sm">TON</span>
                </div>
                {amountNum > 0 && (
                  <div className="px-4 pb-3 text-xs text-gray-400">≈ {formatUsd(valueUsd)}</div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-50">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Memo (optional)</span>
                </div>
                <input
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Add a memo..."
                  className="w-full px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </motion.div>
              )}
            </div>
          </>
        ) : (
          /* Confirm step */
          <div className="space-y-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
              <h3 className="font-semibold text-gray-700">Transaction Details</h3>
              <DetailRow label="To" value={`${toAddress.slice(0, 12)}···${toAddress.slice(-8)}`} mono />
              <DetailRow label="Amount" value={`${formatTon(amountNum)} TON`} />
              <DetailRow label="Value" value={formatUsd(valueUsd)} />
              {memo && <DetailRow label="Memo" value={memo} />}
              <DetailRow label="Network" value="TON Network" />
              <DetailRow label="Fee" value="≈ 0.01 TON" />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-8 pt-2">
        <button
          onClick={step === "form" ? handleNext : handleSend}
          disabled={sendTon.isPending}
          className="w-full py-3.5 bg-[#2196F3] text-white rounded-2xl font-semibold text-base active:bg-[#1976D2] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {sendTon.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
              Processing...
            </span>
          ) : step === "form" ? "Continue" : "Confirm & Send"}
        </button>
      </div>
    </motion.div>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-medium text-gray-900 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
