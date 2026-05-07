import { useApp } from "@/context/AppContext";
import { haptic } from "@/lib/telegram";

const tabs = [
  {
    id: "wallet",
    label: "Wallet",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#2196F3" : "none"} stroke={active ? "#2196F3" : "#888"} strokeWidth="1.8">
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M16 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" fill={active ? "#2196F3" : "#888"} stroke="none" />
        <path d="M2 9h20" />
      </svg>
    ),
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#2196F3" : "#888"} strokeWidth="1.8">
        <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "referral",
    label: "Referral",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#2196F3" : "#888"} strokeWidth="1.8">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#2196F3" : "#888"} strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function NavBar() {
  const { activeTab, setActiveTab } = useApp();

  return (
    <nav className="nav-bar">
      <div className="flex w-full">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                haptic("light");
                setActiveTab(tab.id);
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200 ${
                active ? "text-[#2196F3]" : "text-gray-400"
              }`}
            >
              {tab.icon(active)}
              <span
                className="text-[10px] font-medium leading-tight"
                style={{ color: active ? "#2196F3" : "#888" }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
