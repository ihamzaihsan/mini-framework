import { h } from '../framework/vdom.js';
import { createStore } from '../framework/store.js';
import { mount, createRouter, on } from '../framework/core.js';

// Load todos from localStorage
function loadTodos() {
  try {
    const saved = localStorage.getItem('todos-mini-framework');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.warn('Failed to load todos from localStorage:', e);
    return [];
  }
}

// Save todos to localStorage
function saveTodos(todos) {
  try {
    localStorage.setItem('todos-mini-framework', JSON.stringify(todos));
  } catch (e) {
    console.warn('Failed to save todos to localStorage:', e);
    handleError(new Error('Failed to save todos. Storage may be full.'), 'server');
  }
}

// Router for filtering
const routes = {
  '/': 'all',
  '/active': 'active',
  '/completed': 'completed'
};

// Initialize filter based on current route
const currentRoute = window.location.pathname || '/';
const initialFilter = routes[currentRoute] || null;

const initialState = {
  todos: loadTodos(),
  newTodo: '',
  currentFilter: initialFilter,
  error: null, // For error handling (404, 500, etc.)
  errorType: null // 'network', 'notfound', 'server', etc.
};

const store = createStore(initialState);
const router = createRouter(routes);

function filteredTodos(state) {
  const filter = state.currentFilter;
  if (filter === 'active') return state.todos.filter(t => !t.completed);
  if (filter === 'completed') return state.todos.filter(t => t.completed);
  return state.todos;
}

// Error handling functions
function handleError(error, type = 'server') {
  console.error('Application error:', error);
  store.setState({
    error: error.message || 'An unexpected error occurred',
    errorType: type
  });
}

function clearError() {
  store.setState({
    error: null,
    errorType: null
  });
}

// 404 Error View
function notFoundView() {
  return h('div', { class: 'error-container' },
    h('div', { class: 'error-content' },
      h('h1', { 
        class: 'error-code',
        'data-type': '404'
      }, '404'),
      h('h2', { class: 'error-message' }, 'Page Not Found'),
      h('p', { class: 'error-description' }, 
        'The page you are looking for does not exist. It might have been moved, deleted, or you entered the wrong URL.'
      ),
      h('div', { class: 'available-routes' },
        h('h3', { class: 'routes-title' }, 'Available Pages:'),
        h('div', { class: 'routes-list' },
          ...Object.entries(routes).map(([path, filter]) =>
            h('a', {
              href: path,
              class: 'route-link',
              onclick: 'navigateToRoute',
              'data-route': path
            }, `${path} (${filter.charAt(0).toUpperCase() + filter.slice(1)} todos)`)
          )
        )
      ),
      h('div', { class: 'error-actions' },
        h('button', {
          class: 'error-button',
          onclick: 'goHome'
        }, 'Go Home'),
        h('button', {
          class: 'error-button secondary',
          onclick: 'goBack'
        }, 'Go Back')
      )
    )
  );
}

// 500 Error View
function serverErrorView(error) {
  return h('div', { class: 'error-container' },
    h('div', { class: 'error-content' },
      h('h1', { 
        class: 'error-code',
        'data-type': '500'
      }, '500'),
      h('h2', { class: 'error-message' }, 'Internal Server Error'),
      h('p', { class: 'error-description' }, 
        error || 'Something went wrong on our end. Our team has been notified and is working to fix the issue. Please try again later.'
      ),
      h('div', { class: 'error-actions' },
        h('button', {
          class: 'error-button',
          onclick: 'retryAction'
        }, 'Try Again'),
        h('button', {
          class: 'error-button secondary',
          onclick: 'clearError'
        }, 'Dismiss')
      )
    )
  );
}

function view(state) {
  // Handle error states
  if (state.error) {
    if (state.errorType === 'notfound') {
      return notFoundView();
    } else if (state.errorType === 'server') {
      return serverErrorView(state.error);
    }
  }

  // Handle 404 - unknown filter
  if (state.currentFilter === null) {
    return notFoundView();
  }

  const activeTodos = state.todos.filter(t => !t.completed);
  const completedTodos = state.todos.filter(t => t.completed);
  const hasCompletedTodos = completedTodos.length > 0;
  const hasTodos = state.todos.length > 0;

  return h('div', {},
    h('h2', {}, 'TodoMVC'),
    h('input', {
      id: 'new-todo',
      type: 'text',
      placeholder: 'What needs to be done?',
      value: state.newTodo,
      maxlength: '30',
      autofocus: true,
      oninput: 'inputTodo',
      onkeydown: 'addTodo',
      key: 'new-todo-input' // Add a key for stable identity
    }),
    hasTodos ? h('div', { class: 'main' },
      h('ul', { class: 'todo-list' },
        ...filteredTodos(state).map(todo =>
          h('li', {
            class: `${todo.completed ? 'completed' : ''} ${todo.editing ? 'editing' : ''}`.trim(),
            'data-id': todo.id
          },
            h('div', { class: 'view' },
              h('input', {
                type: 'checkbox',
                checked: todo.completed ? 'checked' : null,
                'data-id': todo.id,
                class: 'toggle',
                onclick: 'toggleTodo'
              }),
              h('label', {
                'data-id': todo.id,
                ondblclick: 'editTodo'
              }, todo.text),
              h('button', {
                class: 'destroy',
                'data-id': todo.id,
                onclick: 'deleteTodo'
              }, '×')
            ),
            todo.editing ? h('input', {
              class: 'edit',
              type: 'text',
              value: todo.text,
              maxlength: '30',
              'data-id': todo.id,
              onblur: 'finishEdit',
              onkeydown: 'handleEditKeydown',
              autofocus: true
            }) : null
          )
        )
      )
    ) : null,
    hasTodos ? h('footer', { class: 'footer' },
      h('span', { class: 'todo-count' },
        h('strong', {}, activeTodos.length),
        ` item${activeTodos.length === 1 ? '' : 's'} left`
      ),
      h('ul', { class: 'filters' },
        h('li', {},
          h('a', {
            href: '/',
            class: state.currentFilter === 'all' ? 'selected' : '',
            onclick: 'navigateToRoute',
            'data-route': '/'
          }, 'All')
        ),
        h('li', {},
          h('a', {
            href: '/active',
            class: state.currentFilter === 'active' ? 'selected' : '',
            onclick: 'navigateToRoute',
            'data-route': '/active'
          }, 'Active')
        ),
        h('li', {},
          h('a', {
            href: '/completed',
            class: state.currentFilter === 'completed' ? 'selected' : '',
            onclick: 'navigateToRoute',
            'data-route': '/completed'
          }, 'Completed')
        ),
        hasCompletedTodos ?        h('li', {},
          h('button', {
            class: 'clear-completed',
            onclick: 'clearCompleted'
          }, 'Clear completed')
        ) : null,
        h('li', {},
          h('button', {
            class: 'select-all',
            onclick: 'selectAll'
          }, activeTodos.length === 0 ? 'Unselect all' : 'Select all')
        ),
        h('li', {},
          h('button', {
            class: 'clear-all',
            onclick: 'clearAll'
          }, 'Clear all')
        )
      ),
    ) : null
  );
}

mount(document.getElementById('app'), view, store);

// Save todos to localStorage whenever state changes
store.subscribe(state => {
  saveTodos(state.todos);
});

on('addTodo', e => {
  try {
    if (e.target.id === 'new-todo' && e.key === 'Enter') {
      const text = e.target.value.trim();
      if (text) {
        store.setState({
          todos: [
            ...store.getState().todos,
            { id: Date.now(), text, completed: false, editing: false }
          ],
          newTodo: ''
        });
      }
    }
  } catch (error) {
    handleError(error, 'server');
  }
});

on('inputTodo', e => {
  if (e.target.id === 'new-todo') {
    // Update state but don't trigger immediate re-render for input changes
    const currentState = store.getState();
    if (currentState.newTodo !== e.target.value) {
      store.setState({ newTodo: e.target.value });
    }
  }
});

on('deleteTodo', e => {
  if (e.target.classList.contains('destroy')) {
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

// Clear completed todos
// Clear completed todos
on('clearCompleted', e => {
  if (e.target.classList.contains('clear-completed')) {
    store.setState({
      todos: store.getState().todos.filter(t => !t.completed)
    });
  }
});

// Clear all todos
on('clearAll', e => {
  if (e.target.classList.contains('clear-all')) {
    store.setState({
      todos: []
    });
  }
});

// Select/Unselect all todos
on('selectAll', e => {
  if (e.target.classList.contains('select-all')) {
    const currentState = store.getState();
    const activeTodos = currentState.todos.filter(t => !t.completed);
    const shouldSelectAll = activeTodos.length > 0;
    
    store.setState({
      todos: currentState.todos.map(t => ({ ...t, completed: shouldSelectAll }))
    });
  }
});

// Edit todo
on('editTodo', e => {
  const id = Number(e.target.getAttribute('data-id'));
  store.setState({
    todos: store.getState().todos.map(t =>
      t.id === id ? { ...t, editing: true } : { ...t, editing: false }
    )
  });
  
  // Focus the edit input after DOM update
  setTimeout(() => {
    const editInput = document.querySelector(`.edit[data-id="${id}"]`);
    if (editInput) {
      editInput.focus();
      editInput.select();
    }
  }, 0);
});

// Finish editing
on('finishEdit', e => {
  if (e.target.classList.contains('edit')) {
    const id = Number(e.target.getAttribute('data-id'));
    const text = e.target.value.trim();
    if (text) {
      store.setState({
        todos: store.getState().todos.map(t =>
          t.id === id ? { ...t, text, editing: false } : t
        )
      });
    } else {
      // Delete todo if text is empty
      store.setState({
        todos: store.getState().todos.filter(t => t.id !== id)
      });
    }
  }
});

// Handle edit keydown (Enter to save, Escape to cancel)
on('handleEditKeydown', e => {
  if (e.target.classList.contains('edit')) {
    const id = Number(e.target.getAttribute('data-id'));
    if (e.key === 'Enter') {
      e.target.blur(); // This will trigger finishEdit
    } else if (e.key === 'Escape') {
      // Cancel editing without saving
      store.setState({
        todos: store.getState().todos.map(t =>
          t.id === id ? { ...t, editing: false } : t
        )
      });
    }
  }
});

// Handle navigation clicks
on('navigateToRoute', e => {
  e.preventDefault();
  const route = e.target.getAttribute('data-route');
  if (route) {
    router.navigate(route);
  }
});

on('route', (currentRoute) => {
  const filter = routes[currentRoute];
  if (filter) {
    store.setState({ 
      currentFilter: filter,
      error: null,
      errorType: null
    });
  } else {
    // 404 - Route not found
    store.setState({ 
      currentFilter: null,
      error: 'Page not found',
      errorType: 'notfound'
    });
  }
});

// Error handling event listeners
on('goHome', e => {
  if (e.target.classList.contains('error-button')) {
    router.navigate('/');
  }
});

on('goBack', e => {
  if (e.target.classList.contains('error-button')) {
    history.back();
  }
});

on('retryAction', e => {
  if (e.target.classList.contains('error-button')) {
    // Retry the last action or just clear the error
    clearError();
    // You could implement more sophisticated retry logic here
  }
});

on('clearError', e => {
  if (e.target.classList.contains('error-button')) {
    clearError();
  }
});

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  handleError(new Error(event.message || 'An unexpected error occurred'), 'server');
});

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  handleError(new Error(event.reason || 'An unexpected error occurred'), 'server');
});

// Debug event handlers for testing error states
on('trigger404', e => {
  store.setState({
    error: 'Page not found',
    errorType: 'notfound'
  });
});

on('trigger500', e => {
  store.setState({
    error: 'Internal server error - something went wrong!',
    errorType: 'server'
  });
});