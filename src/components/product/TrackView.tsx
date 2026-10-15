"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

export function TrackViewItem({ id, name, priceKurus }: { id: string; name: string; priceKurus: number }) {
  useEffect(() => {
    const timer = setTimeout(
      () => track("view_item", { value: priceKurus / 100, items: [{ item_id: id, item_name: name, price: priceKurus / 100, quantity: 1 }] }),
      1500,
    );
    return () => clearTimeout(timer);
  }, [id, name, priceKurus]);
  return null;
}
