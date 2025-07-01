// Minimal observable state store for reactive updates

let listeners = [];
let state = {};
let batching = false;
let pending = false;

export function createStore(initialState) {
  state = { ...initialState };
  return {
    getState: () => state,
    setState: (patch) => {
      Object.assign(state, patch);
      if (!batching) notify();
      else pending = true;
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

function notify() {
  listeners.forEach(fn => fn(state));
} 