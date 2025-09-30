"use client";

import { useWebSocketStore } from "@/shared/store/ws";

export function WSIndicator() {
  const { status } = useWebSocketStore();
  const isActive = status === "connected";
  return (
    <div
      aria-label={isActive ? "WS active" : "WS inactive"}
      className="relative inline-flex items-center justify-center"
      title={isActive ? "WebSocket подключен" : "WebSocket не подключен"}
    >
      <span
        className={
          "block h-2.5 w-2.5 rounded-full border " +
          (isActive
            ? "bg-green-500 border-green-600"
            : "bg-red-500 border-red-600")
        }
      />
    </div>
  );
}


