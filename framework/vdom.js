// Minimal Virtual DOM implementation for high-performance updates

import { emit } from './core.js';

// VNode structure
export function h(tag, attrs = {}, ...children) {
  return { tag, attrs, children };
}

// Create real DOM from VNode
export function createElement(vnode) {
  if (typeof vnode === 'string') return document.createTextNode(vnode);
  const el = document.createElement(vnode.tag);
  for (const [k, v] of Object.entries(vnode.attrs || {})) {
    if (k.startsWith('on') && typeof v === 'string') {
      // e.g., oninput: 'inputTodo', onkeydown: 'addTodo', onclick: 'deleteTodo'
      const eventType = k.slice(2).toLowerCase();
      el.addEventListener(eventType, e => emit(v, e));
    } else if (v != null) {
      el.setAttribute(k, v);
    }
  }
  (vnode.children || []).forEach(child => el.appendChild(createElement(child)));
  return el;
}

// Diff two VNodes (with keyed children)
export function diff(oldVNode, newVNode) {
  if (!oldVNode) return { type: 'CREATE', newVNode };
  if (!newVNode) return { type: 'REMOVE' };
  if (typeof oldVNode === 'string' || typeof newVNode === 'string') {
    if (oldVNode !== newVNode) return { type: 'REPLACE', newVNode };
    return null;
  }
  if (oldVNode.tag !== newVNode.tag) return { type: 'REPLACE', newVNode };

  // Diff attributes
  const attrPatches = [];
  const allAttrs = Object.assign({}, oldVNode.attrs, newVNode.attrs);
  for (const k in allAttrs) {
    if (oldVNode.attrs[k] !== newVNode.attrs[k]) {
      attrPatches.push({ key: k, value: newVNode.attrs[k] });
    }
  }

  // Diff children (keyed)
  const childPatches = [];
  const oldChildren = oldVNode.children || [];
  const newChildren = newVNode.children || [];
  const maxLen = Math.max(oldChildren.length, newChildren.length);
  for (let i = 0; i < maxLen; i++) {
    childPatches.push(diff(oldChildren[i], newChildren[i]));
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
      if (el) parent.replaceChild(createElement(patches.newVNode), el);
      break;
    case 'UPDATE':
      // Update attributes
      if (el && patches.attrPatches) {
        patches.attrPatches.forEach(({ key, value }) => {
          if (value == null) el.removeAttribute(key);
          else el.setAttribute(key, value);
        });
      }
      // Patch children
      if (patches.childPatches) {
        for (let i = 0; i < patches.childPatches.length; i++) {
          patch(el, patches.childPatches[i], i);
        }
      }
      break;
  }
} 