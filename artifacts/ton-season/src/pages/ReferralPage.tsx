import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useGetReferrals } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import { haptic, hapticSuccess, openTelegramLink } from "@/lib/telegram";
import { copyToClipboard, generateReferralLink } from "@/lib/utils";

export default function ReferralPage() {
  const { user } = useApp();
  const [offset, setOffset] = useState(0);
  const [allReferrals, setAllReferrals] = useState<any[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);

  const { data, isLoading } = useGetReferrals({ limit: 10, offset });

  useEffect(() => {
    if (data?.referrals) {
      if (offset === 0) {
        setAllReferrals(data.referrals);
      } else {
        setAllReferrals((prev) => [...prev, ...data.referrals]);
      }
    }
  }, [data, offset]);

  const referralLink = data?.referralLink ?? generateReferralLink(user?.referralCode ?? "");
  const referralCode = data?.referralCode ?? user?.referralCode ?? "";

  const handleCopyLink = async () => {
    await copyToClipboard(referralLink);
    setLinkCopied(true);
    hapticSuccess();
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShare = () => {
    haptic("medium");
    const shareText = `Join TON Season and start earning! Use my referral link: ${referralLink}`;
    openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join TON Season and start earning!")}`);
  };

  return (
    <div className="flex flex-col pb-[72px]">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Referral</h1>
        <p className="text-sm text-gray-400 mt-1">Invite friends and earn TONS together</p>
      </div>

      {/* Stats card */}
      <div className="px-4 mb-4">
        <motion.div
          className="ton-card p-5 text-white"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{data?.totalReferrals ?? user?.referralCount ?? 0}</div>
              <div className="text-sm text-white/70 mt-1">Total Referrals</div>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Referral Link */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <span className="text-sm font-semibold text-gray-700">Your Referral Link</span>
          </div>
          <div className="px-4 pb-3">
            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <p className="text-xs font-mono text-gray-600 break-all">{referralLink}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  linkCopied
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-700 active:bg-gray-200"
                }`}
              >
                {linkCopied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2196F3] text-white rounded-xl text-sm font-semibold active:bg-[#1976D2] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" strokeLinecap="round" />
                  <polyline points="16 6 12 2 8 6" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="2" x2="12" y2="15" strokeLinecap="round" />
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Referral code */}
      <div className="px-4 mb-4">
        <div className="bg-blue-50 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-500 font-medium">Your Code</div>
            <div className="text-lg font-bold text-blue-700 font-mono">{referralCode}</div>
          </div>
          <button
            onClick={async () => {
              await copyToClipboard(referralCode);
              haptic("medium");
            }}
            className="bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1.5 rounded-lg active:bg-blue-200"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Referral list */}
      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Referrals</span>
            <span className="text-xs text-gray-400">{data?.totalReferrals ?? 0} total</span>
          </div>

          {isLoading && offset === 0 ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="shimmer w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="shimmer h-3 w-28 rounded" />
                    <div className="shimmer h-3 w-20 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : allReferrals.length === 0 ? (
            <div className="py-10 text-center">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-gray-400 text-sm">No referrals yet</div>
              <div className="text-gray-300 text-xs mt-1">Share your link to invite friends</div>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                {allReferrals.map((ref, i) => (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    {ref.photoUrl ? (
                      <img
                        src={ref.photoUrl}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                        {(ref.username?.[0] ?? ref.firstName?.[0] ?? "U").toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {ref.firstName ?? `@${ref.username}`}
                      </div>
                      <div className="text-xs text-gray-400">@{ref.username}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(ref.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </motion.div>
                ))}
              </div>
              {data?.hasMore && (
                <button
                  onClick={() => {
                    haptic("light");
                    setOffset((prev) => prev + 10);
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
