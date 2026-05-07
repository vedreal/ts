import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key);
}

const STATIC_TASKS = [
  {
    id: "checkin_daily",
    type: "checkin",
    title: "Daily Check-in",
    description: "Check in today to claim your reward",
    url: null,
    reward: 10,
  },
  {
    id: "channel_1",
    type: "telegram_channel",
    title: "Follow @TONSeasonOfficial",
    description: "Follow our main announcement channel",
    url: "https://t.me/TONSeasonOfficial",
    reward: 50,
  },
  {
    id: "channel_2",
    type: "telegram_channel",
    title: "Follow @TONSeasonNews",
    description: "Follow our news channel",
    url: "https://t.me/TONSeasonNews",
    reward: 50,
  },
  {
    id: "channel_3",
    type: "telegram_channel",
    title: "Follow @TONSeasonUpdates",
    description: "Follow our updates channel",
    url: "https://t.me/TONSeasonUpdates",
    reward: 50,
  },
  {
    id: "group_1",
    type: "telegram_group",
    title: "Join TON Season Community",
    description: "Join our main community group",
    url: "https://t.me/TONSeasonCommunity",
    reward: 30,
  },
  {
    id: "group_2",
    type: "telegram_group",
    title: "Join TON Season Trading",
    description: "Join our trading discussion group",
    url: "https://t.me/TONSeasonTrading",
    reward: 30,
  },
  {
    id: "follow_x",
    type: "follow_x",
    title: "Follow @TONSeason on X",
    description: "Follow us on X (Twitter) for updates",
    url: "https://x.com/TONSeason",
    reward: 40,
  },
];

// GET /api/tasks
router.get("/", async (req, res) => {
  const telegramId = req.headers["x-telegram-id"] as string;
  if (!telegramId) return res.status(401).json({ error: "Unauthorized" });

  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (!user) return res.status(404).json({ error: "User not found" });

  // Get completed tasks for today (checkin) or ever (others)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: completedTasks } = await supabase
    .from("user_tasks")
    .select("task_id, completed_at")
    .eq("user_id", user.id);

  const completedMap = new Map<string, string>();
  (completedTasks ?? []).forEach((ct) => {
    completedMap.set(ct.task_id, ct.completed_at);
  });

  const tasks = STATIC_TASKS.map((task) => {
    let completed = false;
    let completedAt: string | null = null;

    if (completedMap.has(task.id)) {
      const completedDate = new Date(completedMap.get(task.id)!);
      if (task.type === "checkin") {
        // Daily task: reset each day
        completed = completedDate >= today;
      } else {
        completed = true;
      }
      if (completed) completedAt = completedMap.get(task.id)!;
    }

    return {
      id: task.id,
      type: task.type,
      title: task.title,
      description: task.description,
      url: task.url,
      reward: task.reward,
      completed,
      completedAt,
    };
  });

  return res.json(tasks);
});

// POST /api/tasks/:taskId/complete
router.post("/:taskId/complete", async (req, res) => {
  const telegramId = req.headers["x-telegram-id"] as string;
  if (!telegramId) return res.status(401).json({ error: "Unauthorized" });

  const { taskId } = req.params;
  const task = STATIC_TASKS.find((t) => t.id === taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const supabase = getSupabase();

  const { data: user } = await supabase
    .from("users")
    .select("id, tons_balance")
    .eq("telegram_id", telegramId)
    .single();

  if (!user) return res.status(404).json({ error: "User not found" });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already completed (for non-checkin tasks)
  const { data: existing } = await supabase
    .from("user_tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("task_id", taskId)
    .single();

  if (existing) {
    if (task.type !== "checkin") {
      return res.status(400).json({ error: "Task already completed" });
    }
    // For checkin: check if done today
    const completedDate = new Date(existing.completed_at);
    if (completedDate >= today) {
      return res.status(400).json({ error: "Already checked in today" });
    }
    // Update checkin record
    await supabase
      .from("user_tasks")
      .update({ completed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("task_id", taskId);
  } else {
    // Insert completion
    await supabase.from("user_tasks").insert({
      user_id: user.id,
      task_id: taskId,
      completed_at: new Date().toISOString(),
    });
  }

  // Award TONS reward
  await supabase
    .from("users")
    .update({ tons_balance: (user.tons_balance ?? 0) + task.reward })
    .eq("telegram_id", telegramId);

  return res.json({
    id: task.id,
    type: task.type,
    title: task.title,
    description: task.description,
    url: task.url,
    reward: task.reward,
    completed: true,
    completedAt: new Date().toISOString(),
  });
});

export default router;
