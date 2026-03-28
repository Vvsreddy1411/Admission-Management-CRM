import { useState, useCallback, useEffect } from "react";
import { getAll, add, update, remove } from "@/lib/store";

export function useStore(key) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await getAll(key);
    setItems(data);
  }, [key]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getAll(key);
        if (mounted) {
          setItems(data);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [key]);

  const addItem = useCallback(
    async (item) => {
      const newItem = await add(key, item);
      await refresh();
      return newItem;
    },
    [key, refresh],
  );

  const updateItem = useCallback(
    async (id, updates) => {
      const updated = await update(key, id, updates);
      await refresh();
      return updated;
    },
    [key, refresh],
  );

  const removeItem = useCallback(
    async (id) => {
      await remove(key, id);
      await refresh();
    },
    [key, refresh],
  );

  return { items, addItem, updateItem, removeItem, refresh, loading };
}

