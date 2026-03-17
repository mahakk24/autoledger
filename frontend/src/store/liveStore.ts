import { create } from "zustand";
import { Transaction, connectWebSocket } from "../services/api";

interface LiveStore {
  liveFeed: Transaction[];
  wsConnected: boolean;
  startLiveFeed: () => () => void;
  addTransaction: (t: Transaction) => void;
}

export const useLiveStore = create<LiveStore>((set) => ({
  liveFeed: [],
  wsConnected: false,

  addTransaction: (t) =>
    set((s) => ({ liveFeed: [t, ...s.liveFeed].slice(0, 50) })),

  startLiveFeed: () => {
    const ws = connectWebSocket((msg) => {
      if (msg.type === "new_transaction") {
        set((s) => ({
          liveFeed: [msg.data, ...s.liveFeed].slice(0, 50),
        }));
      }
    });

    ws.onopen = () => set({ wsConnected: true });
    ws.onclose = () => set({ wsConnected: false });

    return () => ws.close();
  },
}));
