
export function loadFromLocalStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) return parsed as T;
    return fallback;
  } catch {
    return fallback;
  }
}
