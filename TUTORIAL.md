# Mini Framework Tutorial 🚀

Learn how to use your mini-framework in simple steps.

## 📝 Table of Contents
1. [How to Create Routes](#1-how-to-create-routes)
2. [How to Create DIV Elements](#2-how-to-create-div-elements)  
3. [How to Create Complete Pages](#3-how-to-create-complete-pages)
4. [Examples](#4-examples)

---

## 1. How to Create Routes 🛣️

### Step 1: Add to Routes Object
```javascript
// Find this object in app.js file
const routes = {
  '/': 'all',
  '/active': 'active',
  '/completed': 'completed',
  '/about': 'about',        // ✅ Add new route
  '/contact': 'contact'     // ✅ Can add more routes
};
```

### Step 2: Add Condition in View Function
```javascript
function view(state) {
  // ...existing code...

  // Show about page
  if (state.currentFilter === 'about') {
    return h('div', {}, 'About Us Page');
  }

  // Show contact page  
  if (state.currentFilter === 'contact') {
    return h('div', {}, 'Contact Us Page');
  }

  // ...existing code...
}
```

### Step 3: Add Navigation Link (Optional)
```javascript
// Add to navigation menu
h('li', {},
  h('a', {
    href: '/about',
    class: state.currentFilter === 'about' ? 'selected' : '',
    onclick: 'navigateToRoute',
    'data-route': '/about'
  }, 'About Us')
),
```

---

## 2. How to Create DIV Elements 📦

### Basic DIV
```javascript
// Simple div
const myDiv = h('div', {}, 'Hello World');

// Div with class
const styledDiv = h('div', { class: 'my-class' }, 'Styled content');

// Div with multiple attributes
const advancedDiv = h('div', {
  class: 'container',
  id: 'main-div',
  style: 'color: red; background: yellow;'
}, 'Advanced div');
```

### Different Elements
```javascript
// Heading
const title = h('h1', {}, 'Page Title');

// Paragraph
const para = h('p', {}, 'This is a paragraph');

// Button
const button = h('button', {
  onclick: 'myButtonClick',
  class: 'my-button'
}, 'Click Me');

// Input
const input = h('input', {
  type: 'text',
  placeholder: 'Type here...',
  oninput: 'handleInput'
});

// List
const list = h('ul', {},
  h('li', {}, 'Item 1'),
  h('li', {}, 'Item 2'),
  h('li', {}, 'Item 3')
);
```

### Nested Elements
```javascript
const complexDiv = h('div', { class: 'container' },
  h('h1', {}, 'Main Title'),
  h('div', { class: 'content' },
    h('p', {}, 'Description here'),
    h('button', { onclick: 'actionHandler' }, 'Action')
  )
);
```

---

## 3. How to Create Complete Pages 📄

### Example: About Us Page

#### Step 1: Add Route
```javascript
const routes = {
  '/': 'all',
  '/active': 'active',
  '/completed': 'completed',
  '/about': 'about'  // ✅ About route
};
```

#### Step 2: Create About Page Function
```javascript
function aboutView() {
  return h('div', { class: 'about-page' },
    h('h1', {}, 'About Us'),
    h('p', {}, 'This is our TodoMVC application.'),
    h('div', { class: 'features' },
      h('h2', {}, 'Features:'),
      h('ul', {},
        h('li', {}, 'Add todos'),
        h('li', {}, 'Mark complete'),
        h('li', {}, 'Filter todos')
      )
    ),
    h('button', {
      onclick: 'goHome',
      class: 'back-button'
    }, 'Back to Home')
  );
}
```

#### Step 3: Add to Main View
```javascript
function view(state) {
  // ...existing error handling...

  // About page condition
  if (state.currentFilter === 'about') {
    return aboutView();
  }

  // ...rest of the code...
}
```

#### Step 4: Add Event Handler
```javascript
// Event handler for button
on('goHome', e => {
  router.navigate('/');
});
```

---

## 4. Examples 📚

### Example 1: Simple Hello World Page
```javascript
// 1. Add route
'/hello': 'hello'

// 2. Add condition
if (state.currentFilter === 'hello') {
  return h('div', {}, 'Hello World!');
}
```

### Example 2: Button Page
```javascript
// 1. Add route
'/button': 'button'

// 2. Create page function
function buttonView() {
  return h('div', { class: 'button-page' },
    h('h1', {}, 'Button Demo'),
    h('button', {
      onclick: 'showAlert',
      style: 'padding: 10px 20px; background: blue; color: white;'
    }, 'Click Me!'),
    h('p', {}, 'Click the button!')
  );
}

// 3. Add to view
if (state.currentFilter === 'button') {
  return buttonView();
}

// 4. Add event handler
on('showAlert', e => {
  alert('Button clicked! 🎉');
});
```

### Example 3: Form Page
```javascript
function contactView() {
  return h('div', { class: 'contact-page' },
    h('h1', {}, 'Contact Us'),
    h('form', {},
      h('input', {
        type: 'text',
        placeholder: 'Your Name',
        style: 'margin: 10px; padding: 8px;'
      }),
      h('input', {
        type: 'email',
        placeholder: 'Your Email',
        style: 'margin: 10px; padding: 8px;'
      }),
      h('button', {
        type: 'submit',
        onclick: 'submitForm',
        style: 'margin: 10px; padding: 10px 20px;'
      }, 'Submit')
    )
  );
}
```

---

## 🎯 Quick Reference

### Pattern for New Page:
1. **Define route:** `'/pagename': 'pagename'`
2. **Add condition:** `if (state.currentFilter === 'pagename')`
3. **Return element:** `return h('div', {}, 'content')`
4. **Add navigation:** (optional) Link in menu
5. **Handle events:** `on('eventName', handler)`

### Testing:
- Type `/pagename` in browser
- Or use navigation link
- Direct URL access also works!

---

## 🚀 Pro Tips:
- **Start simple:** Begin with basic text, then add styling
- **Check console:** Look at browser console for errors  
- **Step by step:** Test each step individually
- **Copy paste:** Start with working examples

Happy Coding! 💻✨
