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
import { on, emit } from './core.js';
on('customEvent', data => console.log(data));
emit('customEvent', { foo: 1 });
```

### 5. State management
```js
import { createStore } from './store.js';
const store = createStore({ count: 0 });
store.subscribe(state => console.log(state));
store.setState({ count: 1 });
```

### 6. Routing (stub)
```js
import { createRouter } from './core.js';
const router = createRouter({ '/': Home, '/game': Game });
router.start();
```

### 7. Mounting the app
```js
import { mount } from './core.js';
mount(document.getElementById('app'), view, store);
```

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