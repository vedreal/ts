import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key);
}

// GET /api/referrals
router.get("/", async (req, res) => {
  const telegramId = req.headers["x-telegram-id"] as string;
  if (!telegramId) return res.status(401).json({ error: "Unauthorized" });

  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const offset = parseInt(req.query.offset as string) || 0;

  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("id, referral_code")
    .eq("telegram_id", telegramId)
    .single();

  if (!user) return res.status(404).json({ error: "User not found" });

  const { data: referrals, count } = await supabase
    .from("users")
    .select("id, username, first_name, photo_url, joined_at", { count: "exact" })
    .eq("referred_by", user.referral_code)
    .order("joined_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const total = count ?? 0;

  return res.json({
    referralLink: `https://t.me/TONSeasonBot?start=${user.referral_code}`,
    referralCode: user.referral_code,
    totalReferrals: total,
    referrals: (referrals ?? []).map((r) => ({
      id: r.id,
      username: r.username,
      firstName: r.first_name,
      photoUrl: r.photo_url,
      joinedAt: r.joined_at,
    })),
    hasMore: offset + limit < total,
  });
});

export default router;
