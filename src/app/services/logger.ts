/**
 * Logger applicatif IPPOO - front uniquement, prêt à brancher Sentry/LogRocket.
 * Buffer les 100 derniers événements pour exfiltration via "Signaler un bug".
 */
type Level = "debug" | "info" | "warn" | "error";
type LogEntry = { ts: number; level: Level; msg: string; ctx?: Record<string, unknown> };

const buffer: LogEntry[] = [];
const MAX = 100;

function push(level: Level, msg: string, ctx?: Record<string, unknown>) {
  const entry: LogEntry = { ts: Date.now(), level, msg, ctx };
  buffer.push(entry);
  if (buffer.length > MAX) buffer.shift();
  const fn = console[level] ?? console.log;
  fn(`[${level.toUpperCase()}] ${msg}`, ctx ?? "");
  // TODO: brancher Sentry.captureMessage(msg, level) ici en prod
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => push("debug", m, c),
  info: (m: string, c?: Record<string, unknown>) => push("info", m, c),
  warn: (m: string, c?: Record<string, unknown>) => push("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => push("error", m, c),
  dump: () => [...buffer],
  clear: () => { buffer.length = 0; },
};

// Captures globales
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => logger.error("window.error", { msg: e.message }));
  window.addEventListener("unhandledrejection", (e) =>
    logger.error("unhandledrejection", { reason: String(e.reason) }),
  );
}
