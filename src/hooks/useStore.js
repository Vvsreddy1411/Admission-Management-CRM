import { useState, useCallback, useEffect } from "react";
import { getAll, add, update, remove } from "@/lib/store";

export function useStore(key) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getAll(key);
      setItems(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [key]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getAll(key);
        if (mounted) {
          setItems(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err);
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
      try {
        const newItem = await add(key, item);
        await refresh();
        return newItem;
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [key, refresh],
  );

  const updateItem = useCallback(
    async (id, updates) => {
      try {
        const updated = await update(key, id, updates);
        await refresh();
        return updated;
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [key, refresh],
  );

  const removeItem = useCallback(
    async (id) => {
      try {
        await remove(key, id);
        await refresh();
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [key, refresh],
  );

  return { items, addItem, updateItem, removeItem, refresh, loading, error };
}

