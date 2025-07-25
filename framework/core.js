import { createElement, diff, patch } from './vdom.js';
import { emit } from './events.js';

export { on, once, off, emit } from './events.js';

// Unknown paths are emitted too, allowing an application to render a 404 view.
export function createRouter(routes) {
  if (!routes || typeof routes !== 'object' || Array.isArray(routes)) {
    throw new TypeError('Routes must be a path-to-value object.');
  }
  let current = location.pathname;
  let stopped = false;
  function update() {
    current = location.pathname;
    emit('route', current);
  }
  window.addEventListener('popstate', update);
  update();
  return {
    get current() { return current; },
    get value() { return Object.hasOwn(routes, current) ? routes[current] : undefined; },
    navigate(path) {
      if (stopped) throw new Error('Cannot navigate with a stopped router.');
      if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
        throw new TypeError('Navigation requires an absolute same-origin path.');
      }
      const target = new URL(path, location.origin);
      if (target.origin !== location.origin) throw new TypeError('Navigation must stay on the same origin.');
      if (target.href !== location.href) history.pushState(null, '', target);
      update();
    },
    stop() {
      stopped = true;
      window.removeEventListener('popstate', update);
    }
  };
}

// One render per animation frame. Retained DOM nodes preserve input focus.
export function mount(root, view, store) {
  if (!root || root.nodeType !== 1 || typeof view !== 'function' ||
      !store || typeof store.subscribe !== 'function' || typeof store.getState !== 'function') {
    throw new TypeError('mount requires a DOM element, view function, and store.');
  }
  let vnode = view(store.getState());
  root.replaceChildren(createElement(vnode));
  let frame = null;
  const unsubscribe = store.subscribe(() => {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      const next = view(store.getState());
      patch(root, diff(vnode, next));
      vnode = next;
    });
  });
  return () => {
    unsubscribe();
    if (frame !== null) cancelAnimationFrame(frame);
    root.replaceChildren();
  };
}
