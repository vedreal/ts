import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetTasks, useCompleteTask } from "@workspace/api-client-react";
import { haptic, hapticSuccess, openTelegramLink } from "@/lib/telegram";
import { useQueryClient } from "@tanstack/react-query";
import { getGetTasksQueryKey } from "@workspace/api-client-react";
import type { Task } from "@workspace/api-client-react";

export default function TasksPage() {
  const { data: tasks, isLoading } = useGetTasks();
  const completeTask = useCompleteTask();
  const queryClient = useQueryClient();
  const [completing, setCompleting] = useState<string | null>(null);

  const handleComplete = async (task: Task) => {
    if (task.completed || completing === task.id) return;
    if (task.url) {
      openTelegramLink(task.url);
    }
    haptic("medium");
    setCompleting(task.id);
    try {
      await completeTask.mutateAsync({ taskId: task.id });
      hapticSuccess();
      queryClient.invalidateQueries({ queryKey: getGetTasksQueryKey() });
    } catch {
      // ignore
    } finally {
      setCompleting(null);
    }
  };

  const taskGroups = {
    checkin: tasks?.filter((t) => t.type === "checkin") ?? [],
    telegram_channel: tasks?.filter((t) => t.type === "telegram_channel") ?? [],
    telegram_group: tasks?.filter((t) => t.type === "telegram_group") ?? [],
    follow_x: tasks?.filter((t) => t.type === "follow_x") ?? [],
  };

  const completedCount = tasks?.filter((t) => t.completed).length ?? 0;
  const totalCount = tasks?.length ?? 0;

  return (
    <div className="flex flex-col pb-[72px]">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Daily Tasks</h1>
        <p className="text-sm text-gray-400 mt-1">Complete tasks to earn TONS rewards</p>
      </div>

      {/* Progress */}
      <div className="px-4 mb-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Progress</span>
            <span className="text-sm font-bold text-[#2196F3]">{completedCount}/{totalCount}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#2196F3] to-[#42A5F5] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="shimmer h-4 w-32 rounded mb-2" />
              <div className="shimmer h-3 w-48 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-4">
          {/* Check-in */}
          {taskGroups.checkin.length > 0 && (
            <TaskSection
              title="Daily Check-in"
              emoji="📅"
              tasks={taskGroups.checkin}
              completing={completing}
              onComplete={handleComplete}
            />
          )}

          {/* Telegram Channels */}
          {taskGroups.telegram_channel.length > 0 && (
            <TaskSection
              title="Follow Channels"
              emoji="📢"
              tasks={taskGroups.telegram_channel}
              completing={completing}
              onComplete={handleComplete}
            />
          )}

          {/* Telegram Groups */}
          {taskGroups.telegram_group.length > 0 && (
            <TaskSection
              title="Join Groups"
              emoji="👥"
              tasks={taskGroups.telegram_group}
              completing={completing}
              onComplete={handleComplete}
            />
          )}

          {/* Follow X */}
          {taskGroups.follow_x.length > 0 && (
            <TaskSection
              title="Follow on X"
              emoji="🐦"
              tasks={taskGroups.follow_x}
              completing={completing}
              onComplete={handleComplete}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TaskSection({
  title,
  emoji,
  tasks,
  completing,
  onComplete,
}: {
  title: string;
  emoji: string;
  tasks: Task[];
  completing: string | null;
  onComplete: (task: Task) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-base">{emoji}</span>
        <span className="text-sm font-semibold text-gray-600">{title}</span>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            completing={completing === task.id}
            onComplete={() => onComplete(task)}
          />
        ))}
      </div>
    </div>
  );
}

function TaskItem({
  task,
  completing,
  onComplete,
}: {
  task: Task;
  completing: boolean;
  onComplete: () => void;
}) {
  const typeIcons: Record<string, string> = {
    checkin: "📅",
    telegram_channel: "📢",
    telegram_group: "👥",
    follow_x: "𝕏",
  };

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0 ${
          task.completed ? "bg-green-100" : "bg-blue-50"
        }`}
      >
        {task.completed ? "✅" : typeIcons[task.type] ?? "⭐"}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 truncate">{task.title}</div>
        <div className="text-xs text-gray-400 truncate">{task.description}</div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-xs font-semibold text-[#2196F3]">+{task.reward} TONS</span>
        </div>
      </div>

      <button
        onClick={onComplete}
        disabled={task.completed || completing}
        className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
          task.completed
            ? "bg-green-100 text-green-600 cursor-default"
            : completing
            ? "bg-gray-100 text-gray-400 cursor-default"
            : "bg-[#2196F3] text-white active:bg-[#1976D2]"
        }`}
      >
        {task.completed ? "Done" : completing ? "..." : task.url ? "Go" : "Claim"}
      </button>
    </motion.div>
  );
}
