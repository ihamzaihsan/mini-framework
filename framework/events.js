// A Map prevents event names from colliding with Object prototype properties.
const events = new Map();

export function on(event, handler) {
  if (typeof event !== 'string' || !event || typeof handler !== 'function') {
    throw new TypeError('Events require a nonempty name and a handler function.');
  }
  if (!events.has(event)) events.set(event, new Set());
  events.get(event).add(handler);
  return () => off(event, handler);
}

export function once(event, handler) {
  if (typeof handler !== 'function') throw new TypeError('Event handler must be a function.');
  const unsubscribe = on(event, data => {
    unsubscribe();
    handler(data);
  });
  return unsubscribe;
}

export function off(event, handler) {
  const handlers = events.get(event);
  if (!handlers) return;
  handlers.delete(handler);
  if (!handlers.size) events.delete(event);
}

export function emit(event, data) {
  for (const handler of [...(events.get(event) || [])]) handler(data);
}
