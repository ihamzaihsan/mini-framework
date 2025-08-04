# Mini Framework: JavaScript UI Framework — Tutorial

This tutorial shows how the framework controls rendering after you update state. Start the local server with `npm start` from the repository root; see [README.md](README.md) for requirements.

## A complete counter with two routes

In a separate copy of the project, replace `todomvc/app.js` with the example below. Keep `todomvc/index.html` and the server unchanged. Open `http://127.0.0.1:3000/`.

```js
import { h } from '../framework/vdom.js';
import { createStore } from '../framework/store.js';
import { mount, on, createRouter } from '../framework/core.js';

const routes = { '/': 'counter', '/about': 'about' };
const store = createStore({ count: 0, page: null });

const stopRoute = on('route', path => {
  store.setState({ page: Object.hasOwn(routes, path) ? routes[path] : null });
});
const router = createRouter(routes);

const stopIncrement = on('increment', () => {
  store.setState(state => ({ count: state.count + 1 }));
});

function link(path, text) {
  return h('a', {
    href: path,
    onclick: event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey ||
          event.shiftKey || event.altKey) return;
      event.preventDefault();
      router.navigate(path);
    }
  }, text);
}

function view(state) {
  const content = state.page === 'counter'
    ? h('section', { key: 'counter' },
        h('h1', {}, 'Counter'),
        h('p', { role: 'status' }, 'Count: ' + state.count),
        h('button', { type: 'button', onclick: 'increment' }, 'Increment')
      )
    : state.page === 'about'
      ? h('section', { key: 'about' },
          h('h1', {}, 'About'),
          h('p', {}, 'Shared state survives route changes.')
        )
      : h('section', { key: 'not-found' }, h('h1', {}, 'Page not found'));

  return h('div', {},
    h('nav', { 'aria-label': 'Pages' },
      link('/', 'Counter'), ' · ', link('/about', 'About')
    ),
    content
  );
}

const unmount = mount(document.getElementById('app'), view, store);

// Call this if a host application removes this example.
function dispose() {
  unmount();
  stopIncrement();
  stopRoute();
  router.stop();
}
```

Click Increment, visit About, then return to Counter: the count stays in the shared store. Back/Forward and direct refresh at `/about` work with the included server. An unknown extensionless path displays the not-found view.

## Virtual nodes and DOM attributes

```js
const element = h('div', { id: 'card', class: 'card' },
  h('h2', {}, 'A nested heading'),
  h('input', { type: 'text', placeholder: 'Name', value: '' }),
  true ? h('p', {}, 'Visible') : null
);
```

Tags are HTML tag names and attributes use HTML names, such as `class`, `for`, and `tabindex`. Missing, null, and false attributes are removed; true sets an empty attribute. `value`, `checked`, and `selected` also update DOM properties. Use string values such as `'false'` when an ARIA attribute needs that literal value.

Children may be strings, numbers, virtual nodes, or nested arrays. Nullish and boolean children are omitted. Invalid child values and duplicate sibling keys throw helpful errors.

For changing lists, give each item a stable key:

```js
h('ul', {}, tasks.map(task =>
  h('li', { key: task.id }, task.text)
));
```

Use an ID rather than a list index so identity survives removal and reordering. A key is internal metadata. Without keys, reconciliation compares children at their current positions.

## DOM events and custom events

```js
const stopSave = on('save', event => {
  console.log(event.currentTarget.value);
});
h('input', { oninput: 'save' });

// Direct handlers are supported too:
h('button', { type: 'button', onclick: () => console.log('clicked') }, 'Click');
```

Named DOM handlers synchronously emit the browser event through the framework's event bus. Read the event's `currentTarget` inside the handler; for delayed work, capture any needed value first. Use `event.preventDefault()` explicitly where required.

`on(name, handler)` and `once(name, handler)` return cleanup functions. `emit(name, data)` dispatches arbitrary custom data, and `off(name, handler)` removes a specific handler. If a handler throws, dispatch stops and the error propagates. The event bus is shared by modules within this browser application; use distinct names when mounting multiple apps.

## Store updates and batching

```js
const store = createStore({ count: 0, tasks: [] });
const stop = store.subscribe(state => console.log(state));

store.setState(state => ({ count: state.count + 1 }));
store.batch(() => {
  store.setState({ count: 10 });
  store.batch(() => store.setState({ tasks: [{ id: 'a', text: 'Write docs' }] }));
});
// One notification for the completed outer batch.
stop();
```

State must be an object. Updates shallowly merge into a new top-level object; nested objects are not cloned or frozen. Always replace changed arrays and objects rather than mutating the result of `getState()`. A patch whose values are unchanged does not notify subscribers. Subscription does not invoke the listener immediately.

Batches are synchronous: do not pass async callbacks expecting notification suppression across `await`. A throwing batch callback still releases batching and notifies pending changes; changes are not rolled back.

## Rendering and cleanup

`mount(root, view, store)` renders immediately, subscribes to state, and schedules subsequent changes with `requestAnimationFrame`. Multiple updates before a frame share one render. Views should return a virtual node or text and avoid state changes or other side effects while rendering.

DOM nodes are patched rather than rebuilding the entire tree. Retained inputs keep focus and selection; removed nodes cannot retain focus. The framework preserves unchanged uncontrolled input text, while changed `value` attributes update the DOM value.

The returned cleanup function unsubscribes, cancels a pending frame, and removes the rendered content. If you register event subscriptions or a router, clean them up separately.

For low-level DOM work:

```js
import { createElement, diff, patch } from '../framework/vdom.js';

const root = document.getElementById('app');
const before = h('p', {}, 'Before');
root.replaceChildren(createElement(before));
const after = h('p', {}, 'After');
patch(root, diff(before, after));
```

`patch(parent, changes, index = 0)` targets a child of its parent and returns the resulting DOM node. Mount already manages this process; avoid independently patching DOM owned by a mounted view.

## Routing details

Create route listeners before calling `createRouter(routes)`, because the constructor emits the initial `route` event immediately. `router.current` is the current pathname and `router.value` is the corresponding route-table value, or undefined for an unknown path.

`navigate('/about')` pushes browser history and emits the route. It accepts absolute paths on the same origin and rejects external URLs. Matching uses the pathname only. The router does not intercept links or register views automatically; the application connects route events to state and renders the appropriate page.

Call `router.stop()` to remove the browser history listener. Navigation after stopping throws. For another server or deployment, configure SPA fallback for extensionless browser routes and serve the framework's module files with JavaScript MIME types.
