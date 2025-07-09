# Minimal JS Framework

## Philosophy
- **Simplicity:** Minimal, readable code for easy understanding and extension.
- **Performance:** Optimized for 60fps, rapid updates, and future Bomberman game requirements.
- **No dependencies:** Pure ES6+, <15kb minified, no external libraries.

## Features
- Virtual DOM abstraction (VNode, diff, patch)
- Centralized observable state store
- Custom event bus
- Minimal router (stub)
- Batching and requestAnimationFrame for efficient updates

## API Usage

### 1. Create an element
```js
import { h, createElement } from './vdom.js';
const vnode = h('div', { class: 'box' }, 'Hello');
const el = createElement(vnode);
document.body.appendChild(el);
```

### 2. Nest elements
```js
const vnode = h('ul', {},
  h('li', {}, 'A'),
  h('li', {}, 'B')
);
```

### 3. Add attributes
```js
h('input', { type: 'text', placeholder: 'Name' });
```

### 4. Event handling
```js
import { on, once, off, emit } from './core.js';
on('customEvent', data => console.log(data));
once('oneTimeEvent', data => console.log('Called once:', data));
emit('customEvent', { foo: 1 });
off('customEvent', handler); // Remove specific handler
```

### 5. State management
```js
import { createStore } from './store.js';
const store = createStore({ count: 0 });
store.subscribe(state => console.log(state));
store.setState({ count: 1 });
```

### 6. Routing
```js
import { createRouter } from './core.js';
const router = createRouter({ '/': 'all', '/active': 'active', '/completed': 'completed' });
// Router starts automatically and listens to path changes
// Navigate programmatically:
router.navigate('/active');
// Stop the router:
router.stop();
```

### 7. Mounting the app
```js
import { mount } from './core.js';
mount(document.getElementById('app'), view, store);
```

## How the Framework Works

### Core Architecture
The framework is built around three main concepts:

1. **Virtual DOM (VNode)**: Elements are represented as plain JavaScript objects using the `h()` function
2. **Observable State Store**: Centralized state management with subscription-based updates
3. **Event Bus**: Decoupled communication between components using custom events

### Rendering Process
1. **State Change**: When `store.setState()` is called, the store notifies all subscribers
2. **Batched Updates**: The mount function batches updates using `requestAnimationFrame` for optimal performance
3. **Smart Re-rendering**: The framework optimizes input updates to avoid full re-renders during typing
4. **Focus Preservation**: Cursor position and focus state are preserved across re-renders

### Event Handling
Events are handled through a custom event bus system:
- DOM events are captured and re-emitted through the event bus
- Components listen for these events using `on()` 
- This decouples event handling from DOM structure

### Router Integration  
The router uses path-based navigation and integrates with the event bus:
- Route changes emit 'route' events
- Components can listen for route changes and update state accordingly
- Automatic initialization based on current URL path
- Server-side routing support for single-page applications

## Performance Notes
- Virtual DOM diff/patch is minimal for rapid updates (critical for Bomberman)
- Batching and requestAnimationFrame for efficient rendering
- Designed for stress tests (100+ moving objects @ 60fps)

## Bomberman Optimizations
- Keyed updates for game objects
- Batch DOM updates
- Custom event bus for game actions
- WebSocket-ready architecture

## TodoMVC
- Fully supports TodoMVC requirements for validation

## Why this design?
- Minimal API surface for easy learning and extension
- All features required for modern SPA and real-time games
- No hidden magic, everything is explicit and modular 