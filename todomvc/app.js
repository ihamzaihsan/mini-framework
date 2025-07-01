import { h } from '../framework/vdom.js';
import { createStore } from '../framework/store.js';
import { mount, createRouter, on } from '../framework/core.js';

const initialState = {
  todos: [],
  newTodo: ''
};

const store = createStore(initialState);

// Router for filtering
const routes = {
  '/': 'all',
  '/active': 'active',
  '/completed': 'completed'
};
const router = createRouter(routes);

function filteredTodos(state) {
  const filter = routes[router.current] || 'all';
  if (filter === 'active') return state.todos.filter(t => !t.completed);
  if (filter === 'completed') return state.todos.filter(t => t.completed);
  return state.todos;
}

function view(state) {
  return h('div', {},
    h('h2', {}, 'TodoMVC'),
    h('input', {
      id: 'new-todo',
      type: 'text',
      placeholder: 'What needs to be done?',
      value: state.newTodo,
      autofocus: true,
      oninput: 'inputTodo',
      onkeydown: 'addTodo'
    }),
    h('ul', {},
      ...filteredTodos(state).map(todo =>
        h('li', { class: todo.completed ? 'completed' : '' },
          h('input', {
            type: 'checkbox',
            checked: todo.completed ? 'checked' : null,
            'data-id': todo.id,
            class: 'toggle',
            onclick: 'toggleTodo'
          }),
          todo.text,
          h('button', { class: 'delete', 'data-id': todo.id, onclick: 'deleteTodo' }, '×')
        )
      )
    ),
    h('div', { class: 'filters' },
      h('a', { href: '#/', class: router.current === '/' ? 'selected' : '' }, 'All'),
      h('a', { href: '#/active', class: router.current === '/active' ? 'selected' : '' }, 'Active'),
      h('a', { href: '#/completed', class: router.current === '/completed' ? 'selected' : '' }, 'Completed')
    )
  );
}

mount(document.getElementById('app'), view, store);

on('addTodo', e => {
  if (e.target.id === 'new-todo' && e.key === 'Enter') {
    const text = e.target.value.trim();
    if (text) {
      store.setState({
        todos: [
          ...store.getState().todos,
          { id: Date.now(), text, completed: false }
        ],
        newTodo: ''
      });
    }
  }
});

on('inputTodo', e => {
  if (e.target.id === 'new-todo') {
    store.setState({ newTodo: e.target.value });
  }
});

on('deleteTodo', e => {
  if (e.target.classList.contains('delete')) {
    const id = Number(e.target.getAttribute('data-id'));
    store.setState({
      todos: store.getState().todos.filter(t => t.id !== id)
    });
  }
});

on('toggleTodo', e => {
  if (e.target.classList.contains('toggle')) {
    const id = Number(e.target.getAttribute('data-id'));
    store.setState({
      todos: store.getState().todos.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    });
  }
});

on('route', () => {
  store.setState({});
}); 