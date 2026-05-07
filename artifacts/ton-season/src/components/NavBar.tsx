import { useApp } from "@/context/AppContext";
import { haptic } from "@/lib/telegram";

const tabs = [
  {
    id: "wallet",
    label: "Wallet",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="2" y="6" width="20" height="13" rx="3"
          fill={active ? "#2196F3" : "none"}
          stroke={active ? "#2196F3" : "#9CA3AF"}
          strokeWidth="1.8"
        />
        <path
          d="M2 10h20"
          stroke={active ? "white" : "#9CA3AF"}
          strokeWidth="1.8"
        />
        <circle
          cx="16.5" cy="14.5" r="1.5"
          fill={active ? "white" : "#9CA3AF"}
        />
      </svg>
    ),
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
          stroke={active ? "#2196F3" : "#9CA3AF"}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <rect
          x="9" y="3" width="6" height="4" rx="1"
          stroke={active ? "#2196F3" : "#9CA3AF"}
          strokeWidth="1.8"
          fill={active ? "#2196F3" : "none"}
        />
        <path
          d="M9 12l2 2 4-4"
          stroke={active ? "#2196F3" : "#9CA3AF"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "referral",
    label: "Referral",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="18" cy="5" r="2.5" fill={active ? "#2196F3" : "none"} stroke={active ? "#2196F3" : "#9CA3AF"} strokeWidth="1.8" />
        <circle cx="6" cy="12" r="2.5" fill={active ? "#2196F3" : "none"} stroke={active ? "#2196F3" : "#9CA3AF"} strokeWidth="1.8" />
        <circle cx="18" cy="19" r="2.5" fill={active ? "#2196F3" : "none"} stroke={active ? "#2196F3" : "#9CA3AF"} strokeWidth="1.8" />
        <path
          d="M8.5 13.5l7 4M15.5 6.5l-7 4"
          stroke={active ? "#2196F3" : "#9CA3AF"}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
          fill={active ? "#2196F3" : "none"}
          stroke={active ? "#2196F3" : "#9CA3AF"}
          strokeWidth="1.8"
        />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          stroke={active ? "#2196F3" : "#9CA3AF"}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function NavBar() {
  const { activeTab, setActiveTab } = useApp();

  return (
    <div className="nav-bar-wrapper">
      <nav className="nav-bar-float">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                haptic("light");
                setActiveTab(tab.id);
              }}
              className="nav-tab-btn"
            >
              <span className={`nav-tab-icon ${active ? "nav-tab-icon--active" : ""}`}>
                {tab.icon(active)}
              </span>
              <span className={`nav-tab-label ${active ? "nav-tab-label--active" : ""}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
