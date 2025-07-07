// Minimal Virtual DOM implementation for high-performance updates

import { emit } from './core.js';

// VNode structure
export function h(tag, attrs = {}, ...children) {
  return { tag, attrs, children };
}

// Create real DOM from VNode
export function createElement(vnode) {
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return document.createTextNode(String(vnode));
  }
  if (!vnode || !vnode.tag) return document.createTextNode('');

  const el = document.createElement(vnode.tag);

  // Set attributes and event handlers
  for (const [k, v] of Object.entries(vnode.attrs || {})) {
    if (k.startsWith('on') && typeof v === 'string') {
      // e.g., oninput: 'inputTodo', onkeydown: 'addTodo', onclick: 'deleteTodo'
      const eventType = k.slice(2).toLowerCase();
      el.addEventListener(eventType, e => emit(v, e));
    } else if (v != null && v !== false) {
      if (k === 'checked' && v === 'checked') {
        el.checked = true;
      } else if (k === 'value') {
        el.value = v;
      } else {
        el.setAttribute(k, v);
      }
    }
  }

  // Add children
  (vnode.children || []).forEach(child => {
    if (child != null) {
      el.appendChild(createElement(child));
    }
  });

  return el;
}

// Diff two VNodes (with keyed children)
export function diff(oldVNode, newVNode) {
  if (!oldVNode) return { type: 'CREATE', newVNode };
  if (!newVNode) return { type: 'REMOVE' };

  // Handle text nodes and primitives
  if (typeof oldVNode === 'string' || typeof oldVNode === 'number' ||
      typeof newVNode === 'string' || typeof newVNode === 'number') {
    if (String(oldVNode) !== String(newVNode)) {
      return { type: 'REPLACE', newVNode };
    }
    return null;
  }

  // Handle different tag types
  if (!oldVNode.tag || !newVNode.tag || oldVNode.tag !== newVNode.tag) {
    return { type: 'REPLACE', newVNode };
  }

  // Check if elements have the same key (for stable identity)
  const oldKey = oldVNode.attrs && oldVNode.attrs.key;
  const newKey = newVNode.attrs && newVNode.attrs.key;
  if (oldKey !== newKey) {
    return { type: 'REPLACE', newVNode };
  }

  // Diff attributes
  const attrPatches = [];
  const oldAttrs = oldVNode.attrs || {};
  const newAttrs = newVNode.attrs || {};
  const allAttrs = Object.assign({}, oldAttrs, newAttrs);

  for (const k in allAttrs) {
    const oldVal = oldAttrs[k];
    const newVal = newAttrs[k];
    if (oldVal !== newVal) {
      // Skip event handler diffs - they should be immutable
      if (!k.startsWith('on')) {
        attrPatches.push({ key: k, value: newVal });
      }
    }
  }

  // Diff children
  const childPatches = [];
  const oldChildren = oldVNode.children || [];
  const newChildren = newVNode.children || [];
  const maxLen = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < maxLen; i++) {
    childPatches.push(diff(oldChildren[i], newChildren[i]));
  }

  // Only return update if there are actual changes
  if (attrPatches.length === 0 && childPatches.every(patch => patch === null)) {
    return null;
  }

  return { type: 'UPDATE', attrPatches, childPatches };
}

// Patch real DOM based on diff
export function patch(parent, patches, index = 0) {
  if (!patches) return;
  const el = parent.childNodes[index];

  switch (patches.type) {
    case 'CREATE':
      parent.appendChild(createElement(patches.newVNode));
      break;

    case 'REMOVE':
      if (el) parent.removeChild(el);
      break;

    case 'REPLACE':
      if (el) {
        parent.replaceChild(createElement(patches.newVNode), el);
      } else {
        parent.appendChild(createElement(patches.newVNode));
      }
      break;

    case 'UPDATE':
      if (!el) return;

      // Update attributes
      if (patches.attrPatches && patches.attrPatches.length > 0) {
        patches.attrPatches.forEach(({ key, value }) => {
          if (value == null || value === false) {
            el.removeAttribute(key);
            if (key === 'checked') el.checked = false;
          } else if (key === 'checked' && value === 'checked') {
            el.checked = true;
          } else if (key === 'value') {
            // Preserve focus when updating input values
            const activeElement = document.activeElement;
            const shouldPreserveFocus = activeElement === el && el.tagName === 'INPUT';

            if (el.value !== value) {
              const cursorPosition = shouldPreserveFocus ? el.selectionStart : 0;
              el.value = value;

              // Restore cursor position if this element had focus
              if (shouldPreserveFocus) {
                // Use setTimeout to ensure the value is set before restoring cursor
                setTimeout(() => {
                  if (document.activeElement === el) {
                    el.setSelectionRange(cursorPosition, cursorPosition);
                  }
                }, 0);
              }
            }
          } else if (key.startsWith('on')) {
            // Skip event handler updates in patches - they should remain from creation
            // Event handlers are immutable in this implementation
          } else {
            el.setAttribute(key, value);
          }
        });
      }

      // Patch children
      if (patches.childPatches) {
        // Handle dynamic lists properly
        const currentChildCount = el.childNodes.length;
        const patchCount = patches.childPatches.length;

        // Apply patches to existing children
        for (let i = 0; i < Math.min(currentChildCount, patchCount); i++) {
          patch(el, patches.childPatches[i], i);
        }

        // Remove extra children if the new list is shorter
        while (el.childNodes.length > patchCount) {
          el.removeChild(el.lastChild);
        }

        // Add new children if the new list is longer
        for (let i = currentChildCount; i < patchCount; i++) {
          if (patches.childPatches[i] && patches.childPatches[i].type === 'CREATE') {
            el.appendChild(createElement(patches.childPatches[i].newVNode));
          }
        }
      }
      break;
  }
}