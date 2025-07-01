// Core framework: event bus, router stub, and glue code
import { h, createElement, diff, patch } from './vdom.js';
import { createStore } from './store.js';

// Enhanced Event Bus
const events = {};
export function on(event, handler) {
  (events[event] = events[event] || []).push(handler);
}
export function once(event, handler) {
  function wrapper(data) {
    off(event, wrapper);
    handler(data);
  }
  on(event, wrapper);
}
export function off(event, handler) {
  if (events[event]) events[event] = events[event].filter(h => h !== handler);
}
export function emit(event, data) {
  (events[event] || []).forEach(fn => fn(data));
}

// Minimal hash-based Router
export function createRouter(routes) {
  let current = null;
  function getRoute() {
    const hash = location.hash.replace(/^#/, '') || '/';
    return routes[hash] ? hash : '/';
  }
  function render() {
    current = getRoute();
    emit('route', current);
  }
  function navigate(path) {
    location.hash = path;
  }
  window.addEventListener('hashchange', render);
  // Initial render
  render();
  return {
    get current() { return current; },
    navigate,
    stop() { window.removeEventListener('hashchange', render); }
  };
}

// App mounting with batching and requestAnimationFrame
export function mount(root, view, store) {
  let vdom = view(store.getState());
  let node = createElement(vdom);
  root.appendChild(node);
  let scheduled = false;
  let latestState = store.getState();

  function render() {
    const newVdom = view(latestState);
    const patches = diff(vdom, newVdom);
    patch(root, patches, 0);
    vdom = newVdom;
    scheduled = false;
  }

  store.subscribe(state => {
    latestState = state;
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(render);
    }
  });
} 