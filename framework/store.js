function assertObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('State must be an object.');
  }
}

export function createStore(initialState) {
  assertObject(initialState);
  let state = { ...initialState };
  const listeners = new Set();
  let depth = 0;
  let pending = false;
  function notify() {
    const snapshot = state;
    for (const listener of [...listeners]) listener(snapshot);
  }
  return {
    getState: () => state,
    setState(update) {
      const changes = typeof update === 'function' ? update(state) : update;
      assertObject(changes);
      if (Object.keys(changes).every(key => Object.is(state[key], changes[key]))) return;
      state = { ...state, ...changes };
      if (depth) pending = true;
      else notify();
    },
    subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('Subscriber must be a function.');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    batch(callback) {
      if (typeof callback !== 'function') throw new TypeError('Batch callback must be a function.');
      depth++;
      try {
        return callback();
      } finally {
        depth--;
        if (!depth && pending) {
          pending = false;
          notify();
        }
      }
    }
  };
}
