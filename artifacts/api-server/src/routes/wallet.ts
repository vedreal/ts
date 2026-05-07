import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { SendTonBody, SwapTokenBody } from "@workspace/api-zod";

const router = Router();

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key);
}

async function getTonPriceFromBinance(): Promise<{ price: number; changePercent: number; volume: number }> {
  try {
    const [tickerRes, statsRes] = await Promise.all([
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=TONUSDT"),
      fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=TONUSDT"),
    ]);
    const ticker = await tickerRes.json();
    const stats = await statsRes.json();
    return {
      price: parseFloat(ticker.price ?? "0"),
      changePercent: parseFloat(stats.priceChangePercent ?? "0"),
      volume: parseFloat(stats.volume ?? "0"),
    };
  } catch {
    return { price: 2.51, changePercent: 3.38, volume: 0 };
  }
}

async function getUserByTelegramId(supabase: ReturnType<typeof getSupabase>, telegramId: string) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .single();
  return data;
}

// GET /api/ton/price
router.get("/price", async (req, res) => {
  const tonData = await getTonPriceFromBinance();
  return res.json({
    priceUsd: tonData.price,
    changePercent: tonData.changePercent,
    volume: tonData.volume,
  });
});

// GET /api/wallet/balance
router.get("/balance", async (req, res) => {
  const telegramId = req.headers["x-telegram-id"] as string;
  if (!telegramId) return res.status(401).json({ error: "Unauthorized" });

  const supabase = getSupabase();
  const user = await getUserByTelegramId(supabase, telegramId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const tonData = await getTonPriceFromBinance();
  const tonBalance = user.ton_balance ?? 0;
  const tonsBalance = user.tons_balance ?? 0;
  const tonValueUsd = tonBalance * tonData.price;
  const totalUsd = tonValueUsd;
  const changeUsd = totalUsd * (tonData.changePercent / 100);

  return res.json({
    totalUsd,
    changePercent: tonData.changePercent,
    changeUsd,
    address: user.wallet_address ?? "",
    assets: [
      {
        symbol: "TON",
        name: "Toncoin",
        balance: tonBalance,
        priceUsd: tonData.price,
        valueUsd: tonValueUsd,
        changePercent: tonData.changePercent,
        iconUrl: null,
      },
      {
        symbol: "TONS",
        name: "TONS",
        balance: tonsBalance,
        priceUsd: null,
        valueUsd: 0,
        changePercent: null,
        iconUrl: null,
      },
    ],
  });
});

// GET /api/wallet/deposit-address
router.get("/deposit-address", async (req, res) => {
  const telegramId = req.headers["x-telegram-id"] as string;
  if (!telegramId) return res.status(401).json({ error: "Unauthorized" });

  const supabase = getSupabase();
  const user = await getUserByTelegramId(supabase, telegramId);
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({
    address: user.wallet_address ?? "",
    network: "TON",
    memo: null,
  });
});

// POST /api/wallet/send
router.post("/send", async (req, res) => {
  const telegramId = req.headers["x-telegram-id"] as string;
  if (!telegramId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const body = SendTonBody.parse(req.body);
    const supabase = getSupabase();
    const user = await getUserByTelegramId(supabase, telegramId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if ((user.ton_balance ?? 0) < body.amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const tonData = await getTonPriceFromBinance();
    const valueUsd = body.amount * tonData.price;

    // Deduct balance
    await supabase
      .from("users")
      .update({ ton_balance: (user.ton_balance ?? 0) - body.amount })
      .eq("telegram_id", telegramId);

    // Create transaction
    const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { data: tx, error } = await supabase
      .from("transactions")
      .insert({
        id: txId,
        user_id: user.id,
        type: "sent",
        amount: body.amount,
        symbol: "TON",
        value_usd: valueUsd,
        to_address: body.toAddress,
        from_address: user.wallet_address,
        memo: body.memo ?? null,
        status: "completed",
        date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: "Failed to record transaction" });

    return res.json({
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
    });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

// POST /api/wallet/swap
router.post("/swap", async (req, res) => {
  const telegramId = req.headers["x-telegram-id"] as string;
  if (!telegramId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const body = SwapTokenBody.parse(req.body);
    const supabase = getSupabase();
    const user = await getUserByTelegramId(supabase, telegramId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const RATE = body.fromSymbol === "TON" ? 100 : 0.01; // 1 TON = 100 TONS
    const toAmount = body.amount * RATE;
    const txId = `swap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Update balances
    if (body.fromSymbol === "TON") {
      if ((user.ton_balance ?? 0) < body.amount) {
        return res.status(400).json({ error: "Insufficient TON balance" });
      }
      await supabase
        .from("users")
        .update({
          ton_balance: (user.ton_balance ?? 0) - body.amount,
          tons_balance: (user.tons_balance ?? 0) + toAmount,
        })
        .eq("telegram_id", telegramId);
    } else {
      if ((user.tons_balance ?? 0) < body.amount) {
        return res.status(400).json({ error: "Insufficient TONS balance" });
      }
      await supabase
        .from("users")
        .update({
          tons_balance: (user.tons_balance ?? 0) - body.amount,
          ton_balance: (user.ton_balance ?? 0) + toAmount,
        })
        .eq("telegram_id", telegramId);
    }

    // Record swap transaction
    await supabase.from("transactions").insert({
      id: txId,
      user_id: user.id,
      type: "swap",
      amount: body.amount,
      symbol: body.fromSymbol,
      value_usd: 0,
      to_address: null,
      from_address: null,
      memo: `Swap ${body.fromSymbol}→${body.toSymbol}`,
      status: "completed",
      date: new Date().toISOString(),
    });

    return res.json({
      fromSymbol: body.fromSymbol,
      toSymbol: body.toSymbol,
      fromAmount: body.amount,
      toAmount,
      rate: RATE,
      txId,
    });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

export default router;
