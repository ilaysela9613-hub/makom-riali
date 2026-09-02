// Minimal DOM construction helpers. Browser only.
//
// Not a framework and not a step towards one. Every screen builds a detached
// tree and main.js swaps it in whole, so there is no diffing, no reconciliation
// and no component lifecycle to reason about — the DOM is a pure function of the
// run state, rebuilt from scratch each turn.

/**
 * @param {string} tagName
 * @param {object} attributes  className, text, dataset keys, on* listeners,
 *                             anything else is set as an attribute
 * @param {Array|Node|string} children
 */
export function element(tagName, attributes = {}, children = []) {
  const node = document.createElement(tagName);

  for (const [key, value] of Object.entries(attributes)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'className') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : value);
  }

  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === 'object' ? child : document.createTextNode(String(child)));
  }

  return node;
}

/** Shorthand for the tags this UI actually uses. */
export const div = (attributes, children) => element('div', attributes, children);
export const span = (attributes, children) => element('span', attributes, children);
export const paragraph = (attributes, children) => element('p', attributes, children);
export const button = (attributes, children) => element('button', attributes, children);

/**
 * A choice button. `lines` are the outcome rows underneath the label: one row
 * for a certain option, one per branch for a gamble, each with its percentage
 * at the inline-start edge.
 *
 * @param {{ chance: number|null, text: string, valence: string }[]} lines
 */
export function choiceButton({ label, lines = [], onSelect, modifier = null }) {
  return button(
    {
      type: 'button',
      className: `choice${modifier ? ` choice--${modifier}` : ''}`,
      onclick: onSelect,
    },
    [
      span({ className: 'choice__label', text: label }),
      ...lines.map((line) =>
        span({ className: `outcome outcome--${line.valence ?? 'neutral'}` }, [
          span({
            className: `outcome__chance${line.chance === null ? ' outcome__chance--certain' : ''}`,
            text: line.chance === null ? '·' : `${line.chance}%`,
          }),
          span({ className: 'outcome__text', text: line.text }),
        ]),
      ),
    ],
  );
}

/** Percentage formatted the way the HUD wants it. */
export function formatPercentage(fraction, digits = 1) {
  return `${(fraction * 100).toFixed(digits)}%`;
}
