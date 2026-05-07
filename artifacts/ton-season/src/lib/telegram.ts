declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      language_code?: string;
    };
    start_param?: string;
    ref?: string;
  };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    onClick: (callback: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  showPopup: (params: object, callback?: (id: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (ok: boolean) => void) => void;
}

export function getTelegramWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function getTelegramUser() {
  const twa = getTelegramWebApp();
  if (!twa) return null;
  return twa.initDataUnsafe?.user ?? null;
}

export function initTelegramApp() {
  const twa = getTelegramWebApp();
  if (twa) {
    twa.ready();
    twa.expand();
  }
}

export function haptic(type: "light" | "medium" | "heavy" = "light") {
  const twa = getTelegramWebApp();
  twa?.HapticFeedback?.impactOccurred(type);
}

export function hapticSuccess() {
  const twa = getTelegramWebApp();
  twa?.HapticFeedback?.notificationOccurred("success");
}

export function hapticError() {
  const twa = getTelegramWebApp();
  twa?.HapticFeedback?.notificationOccurred("error");
}

export function openTelegramLink(url: string) {
  const twa = getTelegramWebApp();
  if (twa) {
    if (url.startsWith("https://t.me/")) {
      twa.openTelegramLink(url);
    } else {
      twa.openLink(url);
    }
  } else {
    window.open(url, "_blank");
  }
}

export function getStartParam(): string | null {
  const twa = getTelegramWebApp();
  return twa?.initDataUnsafe?.start_param ?? null;
}
