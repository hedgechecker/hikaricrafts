import { showDialog } from "../../features/global/useDialog";
import type { AppLogContext, LogLevel } from "./types";

function logToService(
  level: LogLevel,
  message: string,
  context?: AppLogContext,
) {
  // later: send to Sentry / Datadog etc.
  level;
  message;
  context;
}

function flattenContext(context?: AppLogContext) {
  if (!context) return {};

  const { metadata, ...rest } = context;

  const prefixedMetadata = Object.fromEntries(
    Object.entries(metadata ?? {}).map(([key, value]) => [
      `meta_${key}`,
      value,
    ]),
  );

  return {
    ...rest,
    ...prefixedMetadata,
  };
}

export function log(level: LogLevel, message: string, context?: AppLogContext) {
  if (context && context.UIvisible) {
    showDialog({
      type: "alert",
      message: message,
      confirmText: "Ok",
    });
  }
  const flatContext = flattenContext(context);
  if (import.meta.env.DEV || true) {
    let err;
    switch (level) {
      case "error":
        err = new Error(message);
        console.error(err, flatContext);
        break;
      case "warn":
        err = new Error(message);
        console.warn(err, flatContext);
        break;
      case "info":
        console.info(message, flatContext);
        break;
      case "debug":
        console.debug(message, flatContext);
        break;
    }
  } else {
    if (level === "error" || level === "warn") {
      logToService(level, message, flatContext);
    }
    // optionally ignore info/debug in prod
  }
}

export const logError = (message: string, context?: AppLogContext) =>
  log("error", message, context);

export const logWarn = (message: string, context?: AppLogContext) =>
  log("warn", message, context);

export const logInfo = (message: string, context?: AppLogContext) =>
  log("info", message, context);

export const logDebug = (message: string, context?: AppLogContext) =>
  log("debug", message, context);

export function setupGlobalErrorHandling() {
  window.addEventListener("error", (event) => {
    logError(event.error, { function: "window.error" });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logError(event.reason, { function: "unhandledrejection" });
  });
}
