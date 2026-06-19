/**
 * Wrapper Sentry IPPOO — no-op par défaut, branchable en ajoutant @sentry/react.
 *
 * Activation : remplacer le contenu de init() par :
 *   import * as Sentry from "@sentry/react";
 *   Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, tracesSampleRate: 0.2 });
 *   captureException = Sentry.captureException;
 *   captureMessage   = Sentry.captureMessage;
 *   setUser          = Sentry.setUser;
 */
import { logger } from "./logger";

type SentryUser = { id: string; phone?: string; role?: string } | null;

export const sentry = {
  init() {
    logger.info("sentry.stub.ready", {
      hint: "Branchez @sentry/react dans services/sentry.ts pour activer",
    });
  },
  captureException(e: unknown, ctx?: Record<string, unknown>) {
    logger.error("sentry.exception", { e: String(e), ...ctx });
  },
  captureMessage(msg: string, ctx?: Record<string, unknown>) {
    logger.warn("sentry.message", { msg, ...ctx });
  },
  setUser(user: SentryUser) {
    logger.info("sentry.user", { user });
  },
};
