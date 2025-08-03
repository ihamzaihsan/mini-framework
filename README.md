# Mini Framework: JavaScript UI Framework

A small, dependency-free JavaScript UI framework built from scratch, with a TodoMVC application that demonstrates its rendering, state, event, and routing APIs.

The project makes the mechanics of a reactive UI visible: views describe virtual nodes, a store notifies subscribers, and the framework schedules rendering and patches the DOM. No React, Vue, Angular, bundler, or runtime package is used.

![TodoMVC demo showing task completion and filters](docs/preview.png)

## Run locally

Requirements: Node.js 22 or newer and a modern browser with ES modules, History API, localStorage, and `crypto.randomUUID()`.

```sh
npm start
```

Open **http://127.0.0.1:3000**. No dependency installation or build step is needed. On Windows PowerShell, use `npm.cmd start` if the execution policy blocks `npm.ps1`.

The development server binds to `127.0.0.1` by default. Set `PORT` to change the port; set `HOST` to change the bind address. For example, in PowerShell:

```powershell
$env:PORT = '3001'
npm.cmd start
```

This is a local demo server, without authentication, TLS, or a production deployment configuration.

## Implemented features

| Framework | TodoMVC demonstration |
| --- | --- |
| Virtual nodes with attributes, nested arrays, text, and conditional children | Add, edit, complete, and delete tasks |
| Keyed child reconciliation and DOM attribute/event updates | Stable task identity while filtering and deleting |
| Observable state with partial or functional updates | Active count and task filters |
| Nested synchronous state batches | One subscriber notification per completed batch |
| Named event bus and declarative DOM event attributes | Buttons, inputs, keyboard controls, and checkboxes |
| History API router with cleanup | All, Active, Completed, browser Back/Forward, and direct-route refresh |
| Rendering batched with requestAnimationFrame; unmount cleanup | Focus and cursor preservation while typing |
| Explicit unknown-route handling | Not-found page with links back to the filters |

The demo also provides localStorage persistence, validation of saved records, nonblocking storage warnings, toggle-all and clear-all controls, F2/Enter keyboard editing, accessible control names, responsive styling, and reduced-motion support.

## Project structure

```text
framework/
  core.js        Router and render lifecycle; event API re-exports
  events.js      Named event subscriptions and dispatch
  store.js       Observable state and nested batching
  vdom.js        Virtual nodes, diff descriptors, and keyed DOM patching
todomvc/
  app.js         TodoMVC views, event handlers, and persistence
  index.html     Browser entry point
  style.css      Responsive demo styling
docs/
  preview.png    Demo screenshot
server.js        Node HTTP server with an explicit public asset list
TUTORIAL.md      Complete example and API guidance
```

## API at a glance

Examples below use browser modules served from this repository.

### Create elements, attributes, and nested children

```js
import { h, createElement } from '/framework/vdom.js';

const card = h('div', { class: 'card', 'aria-label': 'Greeting' },
  h('h2', {}, 'Hello'),
  h('input', { type: 'text', placeholder: 'Your name' }),
  ['First item', 'Second item'].map(text => h('p', { key: text }, text))
);
document.getElementById('app').replaceChildren(createElement(card));
```

`h(tag, attrs, ...children)` creates a plain virtual node. Child arrays are flattened; `null`, `undefined`, and booleans are omitted. Text uses DOM text nodes, so task text is not interpreted as HTML. Sibling keys must be unique; keys stay internal rather than becoming HTML attributes.

### Handle events

```js
import { h } from '/framework/vdom.js';
import { on, once, emit } from '/framework/core.js';

const unsubscribe = on('sayHello', event => {
  console.log(event.currentTarget.textContent);
});
const button = h('button', { type: 'button', onclick: 'sayHello' }, 'Hello');

const stopOnce = once('ready', data => console.log(data));
emit('ready', { loaded: true });
// Later, during teardown:
unsubscribe();
stopOnce();
```

DOM event attributes accept a named bus event or a handler function. The framework installs the DOM handler and dispatches named events synchronously. `on` and `once` return unsubscribe functions; `off(name, handler)` also removes a subscription. Handler errors propagate to the caller.

### Manage state and mount a view

```js
import { h } from '/framework/vdom.js';
import { createStore } from '/framework/store.js';
import { mount } from '/framework/core.js';

const store = createStore({ count: 0 });
const unmount = mount(document.getElementById('app'), state =>
  h('div', {},
    h('p', {}, 'Count: ' + state.count),
    h('button', {
      type: 'button',
      onclick: () => store.setState(current => ({ count: current.count + 1 }))
    }, 'Increment')
  ), store
);
```

`setState` merges an object patch, creating a new top-level snapshot. Functional patches receive the current state. Subscribers run synchronously, while mounted views render at most once per animation frame. Treat state and nested values as read-only; replace arrays and objects when updating them. Call the returned `unmount()` during teardown to unsubscribe, cancel a pending render, and clear the root.

### Route between views

```js
import { on, createRouter } from '/framework/core.js';

const routes = { '/': 'home', '/about': 'about' };
const stopListening = on('route', path => {
  console.log(Object.hasOwn(routes, path) ? routes[path] : 'not found');
});
// Subscribe first: creation emits the initial route synchronously.
const router = createRouter(routes);
router.navigate('/about');
// router.current is '/about'; router.value is 'about'.
// During teardown: router.stop(); stopListening();
```

The router emits pathnames, including unknown ones, and supports same-origin absolute paths. Query strings and hashes remain in the URL but do not participate in route matching. Link interception belongs to the application; the TodoMVC demo preserves modified clicks so links can open in a new tab.

For a complete runnable view and more API details, read [TUTORIAL.md](TUTORIAL.md).

## Technical decisions and scope

- **Actual DOM patches:** mounting uses the same `diff`/`patch` API exposed to framework consumers. Keyed siblings are matched by identity; unkeyed siblings are matched by position. Retained nodes preserve focus, with focus restored after keyed movement when necessary.
- **Small, separate modules:** the event bus lives in its own module, avoiding a circular dependency between rendering and core lifecycle code.
- **Predictable state:** unchanged top-level patches do not notify. Nested synchronous batches notify once at the outer boundary, including when a callback throws. Batches are not transactions and do not roll back changes.
- **Recoverable persistence:** only task IDs, text, and completion are saved. Edit state is temporary. Invalid or duplicate records are ignored; unreadable storage and failed writes produce a warning while allowing continued use in the tab.
- **Restricted static serving:** only explicitly listed application assets are public. Query strings work for assets, malformed URLs receive 400, unsupported methods receive 405, and unknown extensionless routes reach the application's not-found view.

This is an educational browser framework rather than a general-purpose production framework. It has no component lifecycle system, server rendering, hydration, nested/parameterized routes, or cross-tab state synchronization. Reconciliation visits the rendered tree and is not a minimal-edit algorithm. No 60 fps, stress-test, bundle-size, or performance-parity claim is made.

## Verification

Run the retained JavaScript syntax check:

```sh
npm run check
```

The supplied project specification and audit checklist were reviewed again on **5 October 2026**. Validation used Node.js **22.14.0** and a real headless Microsoft Edge browser through temporary Playwright tooling. All **70 automated assertions** passed:

- TodoMVC creation, trimming, completion, deletion, counts, filters, clear-completed, toggle-all, clear-all, edit focus, Enter/blur saving, Escape cancellation, and empty-edit deletion.
- Initial routes, direct refresh, browser Back/Forward, and unknown-route recovery.
- Persistence across reloads, malformed saved data, duplicate records, transient edit reset, and simulated failed storage writes.
- Keyed insertion/reordering/multiple deletion, changing/removing event handlers, DOM property resets, store batches, event cleanup, mount batching, and teardown.
- Public asset requests with query strings, private/missing asset rejection, malformed URLs, GET/HEAD handling, and method rejection.
- Mobile viewport fit, reduced-motion behavior, and browser runtime errors.
- Automated axe-core WCAG A/AA checks on the populated demo and not-found view found no violations.

The README example and tutorial were also checked in the browser. Temporary browser test scripts and tooling are not project dependencies and are removed after verification, as requested. The original audit's usability recommendations and comparisons with other frameworks are subjective; they are not represented as measured results. Full manual accessibility review and Firefox/Safari validation remain unverified.

## License

[MIT](LICENSE).
