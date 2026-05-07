import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key);
}

// POST /api/setup/tables - creates all required tables via supabase-js
router.post("/tables", async (req, res) => {
  const supabase = getSupabase();

  const results: Record<string, string> = {};

  // We'll use Supabase's built-in SQL execution via the admin endpoint
  // Since we only have anon key, we'll create tables using raw fetch to the Postgres REST API
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1];

  if (!projectRef) {
    return res.status(500).json({ error: "Cannot determine project ref" });
  }

  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      telegram_id TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      first_name TEXT,
      photo_url TEXT,
      referral_code TEXT UNIQUE NOT NULL,
      referred_by TEXT,
      currency TEXT DEFAULT 'USD',
      language TEXT DEFAULT 'en',
      wallet_address TEXT,
      ton_balance NUMERIC DEFAULT 0,
      tons_balance NUMERIC DEFAULT 0,
      joined_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('sent', 'received', 'swap')),
      amount NUMERIC NOT NULL,
      symbol TEXT NOT NULL,
      value_usd NUMERIC DEFAULT 0,
      to_address TEXT,
      from_address TEXT,
      memo TEXT,
      status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
      date TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_tasks (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      task_id TEXT NOT NULL,
      completed_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, task_id)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
    CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
    CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
  `;

  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    const data = await response.text();
    req.log.info({ status: response.status, data }, "Setup tables response");

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed via management API", detail: data });
    }

    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /api/setup/status - check if tables exist
router.get("/status", async (req, res) => {
  const supabase = getSupabase();

  const checks: Record<string, boolean> = {};

  const tables = ["users", "transactions", "user_tasks"];
  for (const table of tables) {
    const { error } = await supabase.from(table).select("*").limit(1);
    checks[table] = !error || error.code !== "PGRST205";
  }

  return res.json({ checks, allReady: Object.values(checks).every(Boolean) });
});

export default router;
