import { h } from '../framework/vdom.js';
import { createStore } from '../framework/store.js';
import { mount, createRouter, on } from '../framework/core.js';

const STORAGE_KEY = 'todos-mini-framework';
const THEME_KEY = 'theme-mini-framework';
const routes = { '/': 'all', '/active': 'active', '/completed': 'completed' };

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { todos: [], warning: '' };
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) throw new Error('Saved todos must be an array.');
    const ids = new Set();
    const todos = [];
    for (const todo of saved) {
      if (!todo || !['string', 'number'].includes(typeof todo.id) ||
          !String(todo.id) || typeof todo.text !== 'string' || !todo.text.trim() ||
          typeof todo.completed !== 'boolean' || ids.has(String(todo.id))) continue;
      ids.add(String(todo.id));
      todos.push({ id: String(todo.id), text: todo.text.trim(), completed: todo.completed, editing: false });
    }
    return {
      todos,
      warning: todos.length === saved.length ? '' : 'Some invalid saved tasks were ignored.'
    };
  } catch {
    return { todos: [], warning: 'Saved tasks could not be loaded. You can still use the app in this tab.' };
  }
}

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage can be blocked; the system preference still provides a default.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const store = createStore({
  ...loadTodos(), newTodo: '', currentFilter: null, theme: loadTheme(), themeWarning: ''
});
document.documentElement.dataset.theme = store.getState().theme;
store.subscribe(state => {
  if (document.documentElement.dataset.theme !== state.theme) {
    document.documentElement.dataset.theme = state.theme;
  }
});

function themeToggle(state) {
  return h('div', { class: 'theme-controls', key: 'theme-controls' },
    h('button', {
      type: 'button', class: 'theme-toggle', onclick: 'toggleTheme',
      'aria-label': 'Dark mode',
      'aria-pressed': String(state.theme === 'dark'),
      title: state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    },
      h('span', { class: 'theme-icon theme-icon--moon', 'aria-hidden': 'true' }),
      h('span', { class: 'theme-icon theme-icon--sun', 'aria-hidden': 'true' })
    )
  );
}

function storageNotice(state) {
  const message = [state.warning, state.themeWarning].filter(Boolean).join(' ');
  return message ? h('p', { class: 'storage-warning', role: 'status', key: 'warning' }, message) : null;
}

function filteredTodos(state) {
  if (state.currentFilter === 'active') return state.todos.filter(todo => !todo.completed);
  if (state.currentFilter === 'completed') return state.todos.filter(todo => todo.completed);
  return state.todos;
}

function navigation(state) {
  return h('ul', { class: 'filters', 'aria-label': 'Filter tasks' },
    Object.entries(routes).map(([path, filter]) =>
      h('li', { key: path }, h('a', {
        href: path,
        class: state.currentFilter === filter ? 'selected' : '',
        'aria-current': state.currentFilter === filter ? 'page' : null,
        onclick: 'navigateToRoute'
      }, filter.charAt(0).toUpperCase() + filter.slice(1)))
    )
  );
}

function todoView(todo) {
  return h('li', {
    key: todo.id, 'data-id': todo.id,
    class: [todo.completed ? 'completed' : '', todo.editing ? 'editing' : ''].join(' ').trim()
  },
    h('div', { class: 'view' },
      h('input', {
        type: 'checkbox', class: 'toggle', checked: todo.completed,
        'data-id': todo.id, 'aria-label': 'Mark task ' + (todo.completed ? 'active' : 'completed'),
        onchange: 'toggleTodo'
      }),
      h('label', {
        'data-id': todo.id, tabindex: '0', ondblclick: 'editTodo', onkeydown: 'editFromKeyboard',
        title: 'Double-click or press F2 to edit'
      }, todo.text),
      h('button', {
        type: 'button', class: 'destroy', 'data-id': todo.id,
        'aria-label': 'Delete task: ' + todo.text, onclick: 'deleteTodo'
      }, '×')
    ),
    todo.editing ? h('input', {
      class: 'edit', type: 'text', value: todo.text, 'data-id': todo.id,
      'aria-label': 'Edit task', onblur: 'finishEdit', onkeydown: 'handleEditKeydown'
    }) : null
  );
}

function view(state) {
  if (state.currentFilter === null) {
    return h('section', { class: 'error-content', key: 'not-found' },
      themeToggle(state),
      storageNotice(state),
      h('h1', {}, '404'),
      h('h2', {}, 'Page not found'),
      h('p', {}, 'Choose a task filter to return to your list.'),
      navigation(state),
      h('button', { type: 'button', onclick: 'goBack' }, 'Go back')
    );
  }
  const activeCount = state.todos.filter(todo => !todo.completed).length;
  const hasTodos = state.todos.length > 0;
  return h('section', { class: 'todoapp', key: 'todos' },
    h('header', { class: 'header', key: 'header' },
      h('p', { class: 'project-name' }, 'Mini Framework: JavaScript UI Framework'),
      themeToggle(state),
      h('h1', {}, 'todos'),
      h('input', {
        id: 'new-todo', class: 'new-todo', type: 'text', placeholder: 'What needs to be done?',
        'aria-label': 'New task', value: state.newTodo, autofocus: true,
        oninput: 'inputTodo', onkeydown: 'addTodo'
      })
    ),
    storageNotice(state),
    hasTodos ? h('section', { class: 'main', key: 'main' },
      h('div', { class: 'bulk-actions' },
        h('input', {
          id: 'toggle-all', class: 'toggle-all', type: 'checkbox',
          checked: activeCount === 0, onchange: 'selectAll'
        }),
        h('label', { for: 'toggle-all' }, 'Mark all as complete'),
        h('button', { type: 'button', class: 'clear-all', onclick: 'clearAll' }, 'Clear all')
      ),
      h('ul', { class: 'todo-list' }, filteredTodos(state).map(todoView))
    ) : null,
    hasTodos ? h('footer', { class: 'footer', key: 'footer' },
      h('span', { class: 'todo-count', role: 'status' },
        h('strong', {}, activeCount), ' item' + (activeCount === 1 ? '' : 's') + ' left'
      ),
      navigation(state),
      activeCount < state.todos.length ? h('button', {
        type: 'button', class: 'clear-completed', onclick: 'clearCompleted'
      }, 'Clear completed') : null
    ) : null,
    h('p', { class: 'info', key: 'info' }, 'Double-click or press F2 to edit. Enter saves; Escape cancels.')
  );
}

on('route', path => store.setState({ currentFilter: Object.hasOwn(routes, path) ? routes[path] : null }));
const router = createRouter(routes);
mount(document.getElementById('app'), view, store);

// Persist durable fields only. Cache before notifying about storage failures.
let lastSaved = JSON.stringify(store.getState().todos.map(({ id, text, completed }) => ({ id, text, completed })));
store.subscribe(state => {
  const serialized = JSON.stringify(state.todos.map(({ id, text, completed }) => ({ id, text, completed })));
  if (serialized === lastSaved) return;
  lastSaved = serialized;
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
    if (state.warning) store.setState({ warning: '' });
  } catch {
    store.setState({ warning: 'Tasks could not be saved. Changes will remain available until this tab is closed.' });
  }
});

const idFrom = event => event.currentTarget.dataset.id;

function updateTodo(id, changes) {
  store.setState(state => ({ todos: state.todos.map(todo => todo.id === id ? { ...todo, ...changes } : todo) }));
}

on('toggleTheme', () => {
  const theme = store.getState().theme === 'dark' ? 'light' : 'dark';
  let themeWarning = '';
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    themeWarning = 'The theme preference could not be saved. It will apply in this tab.';
  }
  store.setState({ theme, themeWarning });
});

on('inputTodo', event => store.setState({ newTodo: event.currentTarget.value }));
on('addTodo', event => {
  if (event.key !== 'Enter' || event.isComposing) return;
  const text = event.currentTarget.value.trim();
  if (!text) return;
  store.setState(state => ({
    todos: [...state.todos, { id: crypto.randomUUID(), text, completed: false, editing: false }],
    newTodo: ''
  }));
});
on('toggleTodo', event => updateTodo(idFrom(event), { completed: event.currentTarget.checked }));
on('deleteTodo', event => {
  const id = idFrom(event);
  store.setState(state => ({ todos: state.todos.filter(todo => todo.id !== id) }));
});
on('clearCompleted', () => store.setState(state => ({ todos: state.todos.filter(todo => !todo.completed) })));
on('clearAll', () => store.setState({ todos: [] }));
on('selectAll', event => {
  const completed = event.currentTarget.checked;
  store.setState(state => ({ todos: state.todos.map(todo => ({ ...todo, completed })) }));
});

function startEdit(event) {
  const id = idFrom(event);
  store.setState(state => ({ todos: state.todos.map(todo => ({ ...todo, editing: todo.id === id })) }));
  // mount schedules its render first, so this callback runs after the input exists.
  requestAnimationFrame(() => {
    const input = [...document.querySelectorAll('.edit')].find(element => element.dataset.id === id);
    if (input) {
      input.focus();
      input.select();
    }
  });
}
on('editTodo', startEdit);
on('editFromKeyboard', event => {
  if (event.key === 'F2' || event.key === 'Enter') {
    event.preventDefault();
    startEdit(event);
  }
});
on('finishEdit', event => {
  const id = idFrom(event);
  // An Escape cancellation may remove the input and trigger blur afterward.
  if (!store.getState().todos.some(todo => todo.id === id && todo.editing)) return;
  const text = event.currentTarget.value.trim();
  if (text) updateTodo(id, { text, editing: false });
  else store.setState(state => ({ todos: state.todos.filter(todo => todo.id !== id) }));
});
on('handleEditKeydown', event => {
  if (event.isComposing) return;
  if (event.key === 'Enter') {
    event.preventDefault();
    event.currentTarget.blur();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    updateTodo(idFrom(event), { editing: false });
    requestAnimationFrame(() => document.getElementById('new-todo')?.focus());
  }
});
on('navigateToRoute', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  router.navigate(event.currentTarget.getAttribute('href'));
});
on('goBack', () => history.back());
