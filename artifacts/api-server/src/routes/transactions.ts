import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key);
}

// GET /api/transactions
router.get("/", async (req, res) => {
  const telegramId = req.headers["x-telegram-id"] as string;
  if (!telegramId) return res.status(401).json({ error: "Unauthorized" });

  const limit = Math.min(parseInt(req.query.limit as string) || 5, 20);
  const offset = parseInt(req.query.offset as string) || 0;

  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (!user) return res.status(404).json({ error: "User not found" });

  const { data: txs, count, error } = await supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ error: "Failed to fetch transactions" });

  const total = count ?? 0;
  const transactions = (txs ?? []).map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    symbol: tx.symbol,
    valueUsd: tx.value_usd,
    toAddress: tx.to_address,
    fromAddress: tx.from_address,
    memo: tx.memo,
    date: tx.date,
    status: tx.status,
  }));

  return res.json({
    transactions,
    total,
    hasMore: offset + limit < total,
  });
});

export default router;
