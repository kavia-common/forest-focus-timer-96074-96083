const KEY = 'forest_focus_state_v1';

/**
 * PUBLIC_INTERFACE
 * loadState
 * Loads persisted application state from localStorage.
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * saveState
 * Merges and saves state fragment to localStorage under a single key.
 */
export function saveState(patch) {
  try {
    const current = loadState() || {};
    const next = { ...current, ...patch };
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) {
    // ignore
  }
}
