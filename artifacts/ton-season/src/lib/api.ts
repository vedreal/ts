// Intercept all /api/ fetch calls to inject x-telegram-id header
const originalFetch = window.fetch.bind(window);

window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  const url =
    typeof input === "string"
      ? input
      : input instanceof Request
        ? input.url
        : input.toString();

  if (url.includes("/api/")) {
    const telegramId = (window as any).__tonSeasonTelegramId as string | undefined;
    if (telegramId) {
      const headers = new Headers(init?.headers);
      if (!headers.has("x-telegram-id")) {
        headers.set("x-telegram-id", telegramId);
      }
      return originalFetch(input, { ...init, headers });
    }
  }
  return originalFetch(input, init);
};
