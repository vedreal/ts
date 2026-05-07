import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { RegisterUserBody, UpdateSettingsBody } from "@workspace/api-zod";
import { z } from "zod/v4";

const router = Router();

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key);
}

function generateReferralCode(length = 8): string {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}

function generateWalletAddress(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  let addr = "EQ";
  for (let i = 0; i < 46; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)];
  }
  return addr;
}

// POST /api/users/register
router.post("/register", async (req, res) => {
  try {
    const body = RegisterUserBody.parse(req.body);
    const supabase = getSupabase();

    // Check if user exists
    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", body.telegramId)
      .single();

    if (existing) {
      // Update photo/username if changed
      await supabase
        .from("users")
        .update({
          username: body.username,
          first_name: body.firstName,
          photo_url: body.photoUrl,
        })
        .eq("telegram_id", body.telegramId);

      const { count: refCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("referred_by", existing.referral_code);

      return res.json({
        id: existing.id,
        telegramId: existing.telegram_id,
        username: existing.username,
        firstName: existing.first_name,
        photoUrl: existing.photo_url,
        referralCode: existing.referral_code,
        referredBy: existing.referred_by,
        currency: existing.currency ?? "USD",
        language: existing.language ?? "en",
        joinedAt: existing.joined_at,
        referralCount: refCount ?? 0,
        walletAddress: existing.wallet_address,
      });
    }

    // New user
    const referralCode = generateReferralCode();
    const walletAddress = generateWalletAddress();

    // Handle referral
    let referredBy: string | null = null;
    if (body.referralCode) {
      const { data: referrer } = await supabase
        .from("users")
        .select("referral_code")
        .eq("referral_code", body.referralCode)
        .single();
      if (referrer) referredBy = body.referralCode;
    }

    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        telegram_id: body.telegramId,
        username: body.username,
        first_name: body.firstName ?? null,
        photo_url: body.photoUrl ?? null,
        referral_code: referralCode,
        referred_by: referredBy,
        currency: "USD",
        language: "en",
        wallet_address: walletAddress,
        ton_balance: 0,
        tons_balance: 0,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      req.log.error({ error }, "Failed to create user");
      return res.status(500).json({ error: "Failed to create user" });
    }

    return res.json({
      id: newUser.id,
      telegramId: newUser.telegram_id,
      username: newUser.username,
      firstName: newUser.first_name,
      photoUrl: newUser.photo_url,
      referralCode: newUser.referral_code,
      referredBy: newUser.referred_by,
      currency: newUser.currency,
      language: newUser.language,
      joinedAt: newUser.joined_at,
      referralCount: 0,
      walletAddress: newUser.wallet_address,
    });
  } catch (e: any) {
    req.log.error({ e }, "Register error");
    return res.status(400).json({ error: e.message ?? "Invalid request" });
  }
});

// GET /api/users/me
router.get("/me", async (req, res) => {
  const telegramId = req.headers["x-telegram-id"] as string;
  if (!telegramId) return res.status(401).json({ error: "Unauthorized" });

  const supabase = getSupabase();
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .single();

  if (!user) return res.status(404).json({ error: "User not found" });

  const { count: refCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("referred_by", user.referral_code);

  return res.json({
    id: user.id,
    telegramId: user.telegram_id,
    username: user.username,
    firstName: user.first_name,
    photoUrl: user.photo_url,
    referralCode: user.referral_code,
    referredBy: user.referred_by,
    currency: user.currency ?? "USD",
    language: user.language ?? "en",
    joinedAt: user.joined_at,
    referralCount: refCount ?? 0,
    walletAddress: user.wallet_address,
  });
});

// PATCH /api/users/settings
router.patch("/settings", async (req, res) => {
  const telegramId = req.headers["x-telegram-id"] as string;
  if (!telegramId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const body = UpdateSettingsBody.parse(req.body);
    const supabase = getSupabase();

    const updates: Record<string, string> = {};
    if (body.currency) updates.currency = body.currency;
    if (body.language) updates.language = body.language;

    const { data: user, error } = await supabase
      .from("users")
      .update(updates)
      .eq("telegram_id", telegramId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: "Failed to update" });

    const { count: refCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("referred_by", user.referral_code);

    return res.json({
      id: user.id,
      telegramId: user.telegram_id,
      username: user.username,
      firstName: user.first_name,
      photoUrl: user.photo_url,
      referralCode: user.referral_code,
      referredBy: user.referred_by,
      currency: user.currency,
      language: user.language,
      joinedAt: user.joined_at,
      referralCount: refCount ?? 0,
      walletAddress: user.wallet_address,
    });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
});

export default router;
