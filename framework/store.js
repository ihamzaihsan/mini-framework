// Minimal observable state store for reactive updates

export function createStore(initialState) {
  let listeners = [];
  let state = { ...initialState };
  let batching = false;
  let pending = false;

  function notify() {
    listeners.forEach(fn => fn(state));
  }

  return {
    getState: () => state,
    setState: (patch) => {
      Object.assign(state, patch);
      if (!batching) {
        notify();
      } else {
        pending = true;
      }
    },
    subscribe: (fn) => {
      listeners.push(fn);
      return () => listeners = listeners.filter(l => l !== fn);
    },
    batch: (fn) => {
      batching = true;
      fn();
      batching = false;
      if (pending) notify();
      pending = false;
    }
  };
}