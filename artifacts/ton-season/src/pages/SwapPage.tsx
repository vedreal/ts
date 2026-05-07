import { useState } from "react";
import { motion } from "framer-motion";
import { useSwapToken } from "@workspace/api-client-react";
import { haptic, hapticSuccess, hapticError } from "@/lib/telegram";
import { formatTon, formatUsd } from "@/lib/utils";
import { TonIcon } from "@/components/TonIcon";
import { useQueryClient } from "@tanstack/react-query";
import { getGetWalletBalanceQueryKey, getGetTransactionsQueryKey } from "@workspace/api-client-react";
import type { Asset } from "@workspace/api-client-react";

interface Props {
  onBack: () => void;
  assets: Asset[];
}

export default function SwapPage({ onBack, assets }: Props) {
  const [fromSymbol, setFromSymbol] = useState("TON");
  const [toSymbol, setToSymbol] = useState("TONS");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [error, setError] = useState("");
  const [swapResult, setSwapResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const swapToken = useSwapToken();

  const fromAsset = assets.find((a) => a.symbol === fromSymbol);
  const fromBalance = fromAsset?.balance ?? 0;
  const fromPrice = fromAsset?.priceUsd ?? 0;
  const amountNum = parseFloat(amount) || 0;
  const valueUsd = amountNum * fromPrice;

  const handleFlip = () => {
    haptic("medium");
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setAmount("");
  };

  const handleMax = () => {
    setAmount(fromBalance.toString());
    haptic("light");
  };

  const handleNext = () => {
    setError("");
    if (amountNum <= 0) { setError("Please enter an amount"); return; }
    if (amountNum > fromBalance) { setError("Insufficient balance"); return; }
    haptic("medium");
    setStep("confirm");
  };

  const handleSwap = async () => {
    haptic("heavy");
    try {
      const result = await swapToken.mutateAsync({
        data: { fromSymbol, toSymbol, amount: amountNum },
      });
      hapticSuccess();
      setSwapResult(result);
      queryClient.invalidateQueries({ queryKey: getGetWalletBalanceQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
      setStep("success");
    } catch (e: any) {
      hapticError();
      setError(e?.data?.error ?? "Swap failed. Please try again.");
      setStep("form");
    }
  };

  const symbols = ["TON", "TONS"];

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Swapped!</h2>
        <p className="text-gray-500 text-sm text-center mb-1">
          {formatTon(swapResult?.fromAmount ?? amountNum)} {fromSymbol} → {formatTon(swapResult?.toAmount ?? 0)} {toSymbol}
        </p>
        <p className="text-gray-400 text-xs text-center mb-8">Rate: 1 {fromSymbol} = {swapResult?.rate?.toFixed(4) ?? "..."} {toSymbol}</p>
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
          {step === "confirm" ? "Confirm Swap" : "Swap"}
        </h1>
      </div>

      <div className="flex-1 px-4 py-4">
        {step === "form" ? (
          <div className="space-y-2">
            {/* From */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">From</span>
                <span className="text-xs text-gray-400">Balance: {formatTon(fromBalance)} {fromSymbol}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-2xl font-bold text-gray-900 placeholder-gray-300 outline-none w-full"
                  />
                  {amountNum > 0 && (
                    <div className="text-xs text-gray-400 mt-1">≈ {formatUsd(valueUsd)}</div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                    {fromSymbol === "TON" ? <TonIcon size={20} /> : (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">TS</span>
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-900">{fromSymbol}</span>
                  </div>
                  <button onClick={handleMax} className="text-xs text-[#2196F3] font-medium mt-1 w-full text-center">
                    MAX
                  </button>
                </div>
              </div>
            </div>

            {/* Flip button */}
            <div className="flex justify-center">
              <button
                onClick={handleFlip}
                className="w-10 h-10 bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center active:scale-90 transition-transform"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2">
                  <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* To */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">To</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-400">
                    {amountNum > 0 ? `≈ ${formatTon(amountNum * 100)}` : "0.00"}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Estimated amount</div>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                  {toSymbol === "TON" ? <TonIcon size={20} /> : (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">TS</span>
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-900">{toSymbol}</span>
                </div>
              </div>
            </div>

            {/* Rate info */}
            <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-blue-600">Exchange Rate</span>
              <span className="text-xs font-semibold text-blue-700">1 TON = 100 TONS</span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
              <h3 className="font-semibold text-gray-700">Swap Details</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {fromSymbol === "TON" ? <TonIcon size={28} /> : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                  )}
                  <div>
                    <div className="text-sm font-semibold">{formatTon(amountNum)} {fromSymbol}</div>
                    <div className="text-xs text-gray-400">{formatUsd(valueUsd)}</div>
                  </div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex items-center gap-2">
                  {toSymbol === "TON" ? <TonIcon size={28} /> : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500" />
                  )}
                  <div>
                    <div className="text-sm font-semibold">≈ {formatTon(amountNum * 100)} {toSymbol}</div>
                    <div className="text-xs text-gray-400">Estimated</div>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Rate</span>
                  <span className="font-medium">1 TON = 100 TONS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee</span>
                  <span className="font-medium">≈ 0.05 TON</span>
                </div>
              </div>
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
          onClick={step === "form" ? handleNext : handleSwap}
          disabled={swapToken.isPending}
          className="w-full py-3.5 bg-[#2196F3] text-white rounded-2xl font-semibold text-base active:bg-[#1976D2] transition-colors disabled:opacity-60"
        >
          {swapToken.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
              Swapping...
            </span>
          ) : step === "form" ? "Continue" : "Confirm Swap"}
        </button>
      </div>
    </motion.div>
  );
}
