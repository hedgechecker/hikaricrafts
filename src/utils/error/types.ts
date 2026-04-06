export interface AppLogContext {
  function?: string;
  userId?: string;
  UIvisible?: boolean;
  [key: string]: any;
}

export type LogLevel = "error" | "warn" | "info" | "debug";
