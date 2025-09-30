import { create } from "zustand";

export type WebSocketStatus = "connected" | "disconnected" | "connecting";

interface WebSocketState {
  status: WebSocketStatus;
  setStatus: (s: WebSocketStatus) => void;
}

export const useWebSocketStore = create<WebSocketState>((set) => ({
  status: "disconnected",
  setStatus: (s) => set({ status: s }),
}));


