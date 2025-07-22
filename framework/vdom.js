import { emit } from './events.js';

const isText = node => typeof node === 'string' || typeof node === 'number';
const keyOf = node => isText(node) ? undefined : node?.attrs?.key;

export function h(tag, attrs = {}, ...children) {
  if (typeof tag !== 'string' || !tag || !attrs || typeof attrs !== 'object' || Array.isArray(attrs)) {
    throw new TypeError('h requires a tag name and an attributes object.');
  }
  const normalized = children.flat(Infinity).filter(child => child != null && typeof child !== 'boolean');
  const keys = new Set();
  for (const child of normalized) {
    if (!isText(child) && (!child || typeof child.tag !== 'string')) {
      throw new TypeError('Children must be virtual nodes, strings, or numbers.');
    }
    const key = keyOf(child);
    if (key !== undefined) {
      if (keys.has(key)) throw new TypeError('Sibling keys must be unique.');
      keys.add(key);
    }
  }
  return { tag, attrs: { ...attrs }, children: normalized };
}

function setAttribute(element, name, value) {
  if (name === 'key') return;
  if (name.startsWith('on')) {
    if (value != null && typeof value !== 'string' && typeof value !== 'function') {
      throw new TypeError('Event attributes must be event names or handler functions.');
    }
    element[name.toLowerCase()] = typeof value === 'string' ? event => emit(value, event) : value ?? null;
  } else if (name === 'value') {
    const next = value == null ? '' : String(value);
    if (element.value === next) return;
    const start = document.activeElement === element ? element.selectionStart : null;
    const end = document.activeElement === element ? element.selectionEnd : null;
    element.value = next;
    if (start != null && typeof element.setSelectionRange === 'function') element.setSelectionRange(start, end);
  } else if (name === 'checked' || name === 'selected') {
    element[name] = value != null && value !== false;
    if (element[name]) element.setAttribute(name, '');
    else element.removeAttribute(name);
  } else if (value == null || value === false) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, value === true ? '' : String(value));
  }
}

export function createElement(vnode) {
  if (isText(vnode)) return document.createTextNode(String(vnode));
  if (!vnode || typeof vnode.tag !== 'string') throw new TypeError('Invalid virtual node.');
  const element = document.createElement(vnode.tag);
  for (const [name, value] of Object.entries(vnode.attrs || {})) setAttribute(element, name, value);
  for (const child of vnode.children || []) element.appendChild(createElement(child));
  return element;
}

export function diff(oldVNode, newVNode) {
  if (oldVNode == null) return newVNode == null ? null : { type: 'CREATE', newVNode };
  if (newVNode == null) return { type: 'REMOVE' };
  if (isText(oldVNode) && isText(newVNode)) {
    return String(oldVNode) === String(newVNode) ? null : { type: 'TEXT', value: String(newVNode) };
  }
  if (isText(oldVNode) || isText(newVNode) || oldVNode.tag !== newVNode.tag || keyOf(oldVNode) !== keyOf(newVNode)) {
    return { type: 'REPLACE', newVNode };
  }
  const attrPatches = [];
  for (const name of new Set([...Object.keys(oldVNode.attrs), ...Object.keys(newVNode.attrs)])) {
    if (oldVNode.attrs[name] !== newVNode.attrs[name]) attrPatches.push({ name, value: newVNode.attrs[name] });
  }
  return { type: 'UPDATE', attrPatches, oldChildren: oldVNode.children, newChildren: newVNode.children };
}

// Snapshot the old nodes before moving them, avoiding index shifts on removal.
function reconcileChildren(element, oldChildren, newChildren) {
  const focused = document.activeElement;
  const start = focused?.selectionStart;
  const end = focused?.selectionEnd;
  const nodes = [...element.childNodes];
  const keyed = new Map();
  oldChildren.forEach((child, index) => {
    if (keyOf(child) !== undefined) keyed.set(keyOf(child), index);
  });
  const used = new Set();
  newChildren.forEach((child, index) => {
    const key = keyOf(child);
    const oldIndex = key !== undefined ? keyed.get(key) :
      (keyOf(oldChildren[index]) === undefined ? index : undefined);
    let node;
    if (oldIndex !== undefined && oldIndex < nodes.length && !used.has(oldIndex)) {
      used.add(oldIndex);
      node = applyPatch(element, nodes[oldIndex], diff(oldChildren[oldIndex], child));
    } else {
      node = createElement(child);
    }
    if (element.childNodes[index] !== node) element.insertBefore(node, element.childNodes[index] || null);
  });
  nodes.forEach((node, index) => {
    if (!used.has(index) && node.parentNode === element) element.removeChild(node);
  });
  // Moving a keyed node can blur a descendant even though its identity survives.
  if (focused && element.contains(focused) && document.activeElement !== focused) {
    focused.focus({ preventScroll: true });
    if (start != null) focused.setSelectionRange(start, end);
  }
}

function applyPatch(parent, node, changes) {
  if (!changes) return node;
  switch (changes.type) {
    case 'CREATE': {
      const created = createElement(changes.newVNode);
      parent.appendChild(created);
      return created;
    }
    case 'REMOVE':
      if (node) parent.removeChild(node);
      return null;
    case 'REPLACE': {
      const replacement = createElement(changes.newVNode);
      if (node) parent.replaceChild(replacement, node);
      else parent.appendChild(replacement);
      return replacement;
    }
    case 'TEXT':
      node.nodeValue = changes.value;
      return node;
    case 'UPDATE':
      for (const { name, value } of changes.attrPatches) setAttribute(node, name, value);
      reconcileChildren(node, changes.oldChildren, changes.newChildren);
      return node;
    default:
      throw new TypeError('Unknown patch type.');
  }
}

export function patch(parent, changes, index = 0) {
  return applyPatch(parent, parent.childNodes[index], changes);
}
