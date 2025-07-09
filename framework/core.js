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

// Minimal path-based Router
export function createRouter(routes) {
  let current = null;
  function getRoute() {
    const path = location.pathname || '/';
    return routes[path] ? path : '/';
  }
  function render() {
    current = getRoute();
    emit('route', current);
  }
  function navigate(path) {
    history.pushState(null, null, path);
    render();
  }
  
  // Custom event handling without addEventListener
  const oldPopStateHandler = window.onpopstate;
  window.onpopstate = (e) => {
    render();
    // Call previous handler if it existed
    if (oldPopStateHandler) oldPopStateHandler(e);
  };
  
  // Initial render
  render();
  return {
    get current() { return current; },
    navigate,
    stop() { 
      window.onpopstate = oldPopStateHandler;
    }
  };
}

// App mounting with batching and requestAnimationFrame
export function mount(root, view, store) {
  let scheduled = false;
  let previousState = store.getState();

  function render() {
    const currentState = store.getState();

    // Check if only the newTodo value changed (input typing)
    const onlyInputChanged =
      previousState.todos === currentState.todos &&
      previousState.currentFilter === currentState.currentFilter &&
      previousState.newTodo !== currentState.newTodo;

    if (onlyInputChanged) {
      // Just update the input value directly without full re-render
      const inputElement = root.querySelector('#new-todo');
      if (inputElement && inputElement.value !== currentState.newTodo) {
        const cursorPosition = inputElement.selectionStart;
        inputElement.value = currentState.newTodo;
        inputElement.setSelectionRange(cursorPosition, cursorPosition);
      }
    } else {
      // Full re-render for other changes (todos, filters, etc.)
      // Save input focus state before re-render
      const inputElement = root.querySelector('#new-todo');
      const hadFocus = inputElement && document.activeElement === inputElement;
      const cursorPosition = hadFocus ? inputElement.selectionStart : 0;

      // Clear and re-render
      const newVdom = view(currentState);
      const newNode = createElement(newVdom);
      root.innerHTML = '';
      root.appendChild(newNode);

      // Restore input focus if it had focus before
      if (hadFocus) {
        const newInputElement = root.querySelector('#new-todo');
        if (newInputElement) {
          newInputElement.focus();
          newInputElement.setSelectionRange(cursorPosition, cursorPosition);
        }
      }
    }

    previousState = { ...currentState };
    scheduled = false;
  }

  // Initial render
  render();

  store.subscribe(state => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(render);
    }
  });
}