"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createWS, type WSClient } from "@/shared/api/ws/client";
import { useWebSocketStore } from "@/shared/store/ws";
import { toast } from "sonner";

type WSStatus = "connecting" | "online" | "offline";

interface WSContextValue {
  status: WSStatus;
  send: WSClient["send"];
  on: WSClient["on"];
  off: WSClient["off"];
}

const WSContext = createContext<WSContextValue | null>(null);

export function WSProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WSClient | null>(null);
  const [status, setStatus] = useState<WSStatus>("connecting");
  const { setStatus: setWsStatus } = useWebSocketStore();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (wsRef.current) return;
    const url = process.env.NEXT_PUBLIC_WS_URL ?? "";
    const client = createWS(url);
    wsRef.current = client;
    const update = () => setStatus(client.status);
    const unsubConnected = client.on("connected", () => setStatus("online"));
    client.connect();
    setStatus(client.status);
    const id = window.setInterval(update, 1000);
    return () => {
      unsubConnected();
      window.clearInterval(id);
      client.disconnect();
      wsRef.current = null;
    };
  }, []);

  // Автоматическое восстановление подписок после reconnect:
  // Пользовательский код может вызвать useWS().on(...) на странице анализа.
  // Здесь достаточно по событию "connected" повторно уведомить слушателей —
  // подписка реализована на стороне страницы через повторную отправку subscribe.

  const value = useMemo<WSContextValue>(() => ({
    status,
    send: (cmd) => wsRef.current?.send(cmd),
    on: (t, h) => wsRef.current?.on(t, h) ?? (() => {}),
    off: (t, h) => wsRef.current?.off(t, h),
  }), [status]);

  useEffect(() => {
    // Синхронизация со стором для индикатора
    if (status === "online") setWsStatus("connected");
    else if (status === "connecting") setWsStatus("connecting");
    else setWsStatus("disconnected");
  }, [status, setWsStatus]);

  // Тост при потере подключения (переход в offline)
  const prevStatusRef = useRef<WSStatus | null>(null);
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev !== "offline" && status === "offline") {
      toast.error("Не удалось подключиться к WebSocket. Переподключение...");
    }
    prevStatusRef.current = status;
  }, [status]);

  return <WSContext.Provider value={value}>{children}</WSContext.Provider>;
}

export function useWS(): WSContextValue {
  const ctx = useContext(WSContext);
  if (!ctx) throw new Error("useWS must be used within WSProvider");
  return ctx;
}


