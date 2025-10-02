import { type WSEvent, type WSCommand } from "@/shared/api/ws/events";

type EventType = WSEvent["type"];

type EventPayloadMap = {
  connected: void;
  queued: Extract<WSEvent, { type: "queued" }>["data"];
  started: Extract<WSEvent, { type: "started" }>["data"];
  progress: Extract<WSEvent, { type: "progress" }>["data"];
  log: Extract<WSEvent, { type: "log" }>["data"];
  done: Extract<WSEvent, { type: "done" }>["data"];
  error: Extract<WSEvent, { type: "error" }>["data"];
  cancelled: Extract<WSEvent, { type: "cancelled" }>["data"];
  paused: Extract<WSEvent, { type: "paused" }>["data"];
  resumed: Extract<WSEvent, { type: "resumed" }>["data"];
};

type Handler<K extends EventType> = (payload: EventPayloadMap[K]) => void;
type AnyHandler = (payload: unknown) => void;

class Emitter {
  private handlers: Map<EventType, Set<AnyHandler>> = new Map();
  private wrapperMap: Map<EventType, Map<AnyHandler, AnyHandler>> = new Map();

  on<K extends EventType>(type: K, handler: Handler<K>): () => void {
    const wrapped: AnyHandler = (payload: unknown) => {
      handler(payload as EventPayloadMap[K]);
    };
    const key = handler as unknown as AnyHandler;
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set<AnyHandler>();
      this.handlers.set(type, set);
    }
    set.add(wrapped);
    let map = this.wrapperMap.get(type);
    if (!map) {
      map = new Map<AnyHandler, AnyHandler>();
      this.wrapperMap.set(type, map);
    }
    map.set(key, wrapped);
    return () => this.off(type, handler);
  }

  off<K extends EventType>(type: K, handler: Handler<K>): void {
    const key = handler as unknown as AnyHandler;
    const map = this.wrapperMap.get(type);
    const wrapped = map?.get(key);
    if (wrapped) {
      this.handlers.get(type)?.delete(wrapped);
      map?.delete(key);
    }
    if (this.handlers.get(type)?.size === 0) this.handlers.delete(type);
    if (map && map.size === 0) this.wrapperMap.delete(type);
  }

  emit(type: EventType, payload: unknown): void {
    const set = this.handlers.get(type);
    if (!set) return;
    for (const fn of set) {
      fn(payload);
    }
  }
}

export interface WSClient {
  connect: () => void;
  disconnect: () => void;
  send: (cmd: WSCommand) => void;
  on: <K extends EventType>(type: K, handler: Handler<K>) => () => void;
  off: <K extends EventType>(type: K, handler: Handler<K>) => void;
  readonly status: "connecting" | "online" | "offline";
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : undefined;
}

const BACKOFF_STEPS_MS = [1000, 2000, 5000, 10000] as const;

export function createWS(url: string, token?: string): WSClient {
  let ws: WebSocket | null = null;
  const emitter = new Emitter();
  let connecting = false;
  let online = false;
  let shouldReconnect = true;
  let backoffIndex = 0;
  let heartbeatTimer: number | undefined;

  const getStatus = (): WSClient["status"] => (connecting ? "connecting" : online ? "online" : "offline");

  const startHeartbeat = () => {
    stopHeartbeat();
    // Heartbeat отключен - сервер не поддерживает ping команды
    // if (typeof window === "undefined") return;
    // heartbeatTimer = window.setInterval(() => {
    //   if (ws && ws.readyState === WebSocket.OPEN) {
    //     try {
    //       ws.send(JSON.stringify({ type: "ping" }));
    //     } catch { }
    //   }
    // }, 30_000);
  };

  const stopHeartbeat = () => {
    if (heartbeatTimer !== undefined) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = undefined;
    }
  };

  const doConnect = () => {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
    connecting = true;
    online = false;
    const cookieToken = token ?? getCookie("next-auth.session-token") ?? getCookie("authjs.session-token");
    const protocols = cookieToken ? ["jwt", cookieToken] : undefined;
    try {
      ws = new WebSocket(url, protocols);
    } catch {
      // мгновенная ошибка: считаем офлайн и планируем реконнект
      connecting = false;
      online = false;
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      connecting = false;
      online = true;
      backoffIndex = 0;
      emitter.emit("connected", undefined as unknown as void);
      startHeartbeat();
    };

    ws.onmessage = (evt) => {
      const data = evt.data;
      try {
        const parsed: unknown = JSON.parse(String(data));
        const maybe = parsed as { type?: EventType | "ping" | "pong"; data?: unknown } | null;
        if (!maybe || typeof maybe !== "object" || typeof maybe.type !== "string") return;

        // Обработка ping/pong сообщений
        if (maybe.type === "ping" || maybe.type === "pong") {
          return;
        }

        const type = maybe.type as EventType;
        if (type === "connected") {
          emitter.emit("connected", undefined);
        } else {
          emitter.emit(type, maybe.data as unknown);
        }
      } catch {
        // ignore
      }
    };

    ws.onerror = () => {
      // rely on onclose for reconnect
    };

    ws.onclose = () => {
      stopHeartbeat();
      connecting = false;
      online = false;
      if (shouldReconnect) scheduleReconnect();
    };
  };

  const scheduleReconnect = () => {
    const delay = BACKOFF_STEPS_MS[Math.min(backoffIndex, BACKOFF_STEPS_MS.length - 1)];
    backoffIndex = Math.min(backoffIndex + 1, BACKOFF_STEPS_MS.length - 1);
    if (typeof window === "undefined") return;
    window.setTimeout(() => {
      if (shouldReconnect) doConnect();
    }, delay);
  };

  const connect = () => {
    shouldReconnect = true;
    doConnect();
  };

  const disconnect = () => {
    shouldReconnect = false;
    stopHeartbeat();
    if (ws) {
      try { ws.close(); } catch { }
    }
    ws = null;
    connecting = false;
    online = false;
  };

  const send = (cmd: WSCommand) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(cmd));
  };

  return {
    connect,
    disconnect,
    send,
    on: (t, h) => emitter.on(t, h),
    off: (t, h) => emitter.off(t, h),
    get status() { return getStatus(); },
  };
}


