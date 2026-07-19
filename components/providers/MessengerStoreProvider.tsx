"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { useStore } from "zustand";
import { createMessengerStore, type MessengerStore, type MessengerStoreApi } from "@/stores/messenger-store";

const MessengerStoreContext = createContext<MessengerStoreApi | null>(null);

export function MessengerStoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createMessengerStore);
  useEffect(() => () => store.getState().shutdown(), [store]);
  return <MessengerStoreContext.Provider value={store}>{children}</MessengerStoreContext.Provider>;
}

export function useMessengerStore<T>(selector: (store: MessengerStore) => T): T {
  const store = useContext(MessengerStoreContext);
  if (!store) throw new Error("useMessengerStore must be used within MessengerStoreProvider.");
  return useStore(store, selector);
}
