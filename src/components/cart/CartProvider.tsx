"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AddToCartResult } from "@/app/actions/cart";
import { CartDrawer } from "./CartDrawer";

export type Me = { user: { firstName: string; isAdmin: boolean } | null; cartCount: number };
type AddedPayload = Extract<AddToCartResult, { ok: true }>;

type CartContextValue = {
  me: Me | null;
  setCartCount: (count: number) => void;
  refresh: () => Promise<void>;
  showAdded: (payload: AddedPayload) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

async function fetchMe(): Promise<Me | null> {
  try {
    const response = await fetch("/api/me", { cache: "no-store", credentials: "same-origin" });
    return response.ok ? ((await response.json()) as Me) : null;
  } catch {
    return null; // ağ hatasında başlık varsayılan durumda kalır
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [added, setAdded] = useState<AddedPayload | null>(null);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    const next = await fetchMe();
    if (next) setMe(next);
  }, []);

  // Her sayfa geçişinde oturum ve sepet sayısını tazele
  useEffect(() => {
    let cancelled = false;
    fetchMe().then((next) => {
      if (next && !cancelled) setMe(next);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && void refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const value = useMemo<CartContextValue>(
    () => ({
      me,
      setCartCount: (count) => setMe((current) => ({ user: current?.user ?? null, cartCount: count })),
      refresh,
      showAdded: (payload) => setAdded(payload),
    }),
    [me, refresh],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer payload={added} onClose={() => setAdded(null)} />
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart, CartProvider içinde kullanılmalıdır.");
  return context;
}
