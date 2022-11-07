"use strict";

// packages/playwright-core/src/utils/isomorphic/stringUtils.ts
function cssEscape(s) {
  let result = "";
  for (let i = 0; i < s.length; i++)
    result += cssEscapeOne(s, i);
  return result;
}
function cssEscapeOne(s, i) {
  const c = s.charCodeAt(i);
  if (c === 0)
    return "\uFFFD";
  if (c >= 1 && c <= 31 || c >= 48 && c <= 57 && (i === 0 || i === 1 && s.charCodeAt(0) === 45))
    return "\\" + c.toString(16) + " ";
  if (i === 0 && c === 45 && s.length === 1)
    return "\\" + s.charAt(i);
  if (c >= 128 || c === 45 || c === 95 || c >= 48 && c <= 57 || c >= 65 && c <= 90 || c >= 97 && c <= 122)
    return s.charAt(i);
  return "\\" + s.charAt(i);
}
function escapeForRegex(text) {
  return text.replace(/[.*+?^>${}()|[\]\\]/g, "\\$&");
}
function escapeForTextSelector(text, exact, caseSensitive = false) {
  if (typeof text !== "string")
    return String(text);
  if (exact)
    return '"' + text.replace(/["]/g, '\\"') + '"';
  if (text.includes('"') || text.includes(">>") || text[0] === "/")
    return `/${escapeForRegex(text).replace(/\s+/g, "\\s+")}/` + (caseSensitive ? "" : "i");
  return text;
}
function escapeForAttributeSelector(value, exact) {
  return `"${value.replace(/["]/g, '\\"')}"${exact ? "" : "i"}`;
}

// packages/playwright-core/src/server/injected/domUtils.ts
function parentElementOrShadowHost(element) {
  if (element.parentElement)
    return element.parentElement;
  if (!element.parentNode)
    return;
  if (element.parentNode.nodeType === 11 && element.parentNode.host)
    return element.parentNode.host;
}
function enclosingShadowRootOrDocument(element) {
  let node = element;
  while (node.parentNode)
    node = node.parentNode;
  if (node.nodeType === 11 || node.nodeType === 9)
    return node;
}
function enclosingShadowHost(element) {
  while (element.parentElement)
    element = element.parentElement;
  return parentElementOrShadowHost(element);
}
function closestCrossShadow(element, css) {
  while (element) {
    const closest = element.closest(css);
    if (closest)
      return closest;
    element = enclosingShadowHost(element);
  }
}

// packages/playwright-core/src/server/injected/roleUtils.ts
function hasExplicitAccessibleName(e) {
  return e.hasAttribute("aria-label") || e.hasAttribute("aria-labelledby");
}
var kAncestorPreventingLandmark = "article:not([role]), aside:not([role]), main:not([role]), nav:not([role]), section:not([role]), [role=article], [role=complementary], [role=main], [role=navigation], [role=region]";
var kGlobalAriaAttributes = [
  "aria-atomic",
  "aria-busy",
  "aria-controls",
  "aria-current",
  "aria-describedby",
  "aria-details",
  "aria-disabled",
  "aria-dropeffect",
  "aria-errormessage",
  "aria-flowto",
  "aria-grabbed",
  "aria-haspopup",
  "aria-hidden",
  "aria-invalid",
  "aria-keyshortcuts",
  "aria-label",
  "aria-labelledby",
  "aria-live",
  "aria-owns",
  "aria-relevant",
  "aria-roledescription"
];
function hasGlobalAriaAttribute(e) {
  return kGlobalAriaAttributes.some((a) => e.hasAttribute(a));
}
var kImplicitRoleByTagName = {
  "A": (e) => {
    return e.hasAttribute("href") ? "link" : null;
  },
  "AREA": (e) => {
    return e.hasAttribute("href") ? "link" : null;
  },
  "ARTICLE": () => "article",
  "ASIDE": () => "complementary",
  "BLOCKQUOTE": () => "blockquote",
  "BUTTON": () => "button",
  "CAPTION": () => "caption",
  "CODE": () => "code",
  "DATALIST": () => "listbox",
  "DD": () => "definition",
  "DEL": () => "deletion",
  "DETAILS": () => "group",
  "DFN": () => "term",
  "DIALOG": () => "dialog",
  "DT": () => "term",
  "EM": () => "emphasis",
  "FIELDSET": () => "group",
  "FIGURE": () => "figure",
  "FOOTER": (e) => closestCrossShadow(e, kAncestorPreventingLandmark) ? null : "contentinfo",
  "FORM": (e) => hasExplicitAccessibleName(e) ? "form" : null,
  "H1": () => "heading",
  "H2": () => "heading",
  "H3": () => "heading",
  "H4": () => "heading",
  "H5": () => "heading",
  "H6": () => "heading",
  "HEADER": (e) => closestCrossShadow(e, kAncestorPreventingLandmark) ? null : "banner",
  "HR": () => "separator",
  "HTML": () => "document",
  "IMG": (e) => e.getAttribute("alt") === "" && !hasGlobalAriaAttribute(e) && Number.isNaN(Number(String(e.getAttribute("tabindex")))) ? "presentation" : "img",
  "INPUT": (e) => {
    const type = e.type.toLowerCase();
    if (type === "search")
      return e.hasAttribute("list") ? "combobox" : "searchbox";
    if (["email", "tel", "text", "url", ""].includes(type)) {
      const list = getIdRefs(e, e.getAttribute("list"))[0];
      return list && list.tagName === "DATALIST" ? "combobox" : "textbox";
    }
    if (type === "hidden")
      return "";
    return {
      "button": "button",
      "checkbox": "checkbox",
      "image": "button",
      "number": "spinbutton",
      "radio": "radio",
      "range": "slider",
      "reset": "button",
      "submit": "button"
    }[type] || "textbox";
  },
  "INS": () => "insertion",
  "LI": () => "listitem",
  "MAIN": () => "main",
  "MARK": () => "mark",
  "MATH": () => "math",
  "MENU": () => "list",
  "METER": () => "meter",
  "NAV": () => "navigation",
  "OL": () => "list",
  "OPTGROUP": () => "group",
  "OPTION": () => "option",
  "OUTPUT": () => "status",
  "P": () => "paragraph",
  "PROGRESS": () => "progressbar",
  "SECTION": (e) => hasExplicitAccessibleName(e) ? "region" : null,
  "SELECT": (e) => e.hasAttribute("multiple") || e.size > 1 ? "listbox" : "combobox",
  "STRONG": () => "strong",
  "SUB": () => "subscript",
  "SUP": () => "superscript",
  "TABLE": () => "table",
  "TBODY": () => "rowgroup",
  "TD": (e) => {
    const table = closestCrossShadow(e, "table");
    const role = table ? getExplicitAriaRole(table) : "";
    return role === "grid" || role === "treegrid" ? "gridcell" : "cell";
  },
  "TEXTAREA": () => "textbox",
  "TFOOT": () => "rowgroup",
  "TH": (e) => {
    if (e.getAttribute("scope") === "col")
      return "columnheader";
    if (e.getAttribute("scope") === "row")
      return "rowheader";
    const table = closestCrossShadow(e, "table");
    const role = table ? getExplicitAriaRole(table) : "";
    return role === "grid" || role === "treegrid" ? "gridcell" : "cell";
  },
  "THEAD": () => "rowgroup",
  "TIME": () => "time",
  "TR": () => "row",
  "UL": () => "list"
};
var kPresentationInheritanceParents = {
  "DD": ["DL", "DIV"],
  "DIV": ["DL"],
  "DT": ["DL", "DIV"],
  "LI": ["OL", "UL"],
  "TBODY": ["TABLE"],
  "TD": ["TR"],
  "TFOOT": ["TABLE"],
  "TH": ["TR"],
  "THEAD": ["TABLE"],
  "TR": ["THEAD", "TBODY", "TFOOT", "TABLE"]
};
function getImplicitAriaRole(element) {
  var _a;
  const implicitRole = ((_a = kImplicitRoleByTagName[element.tagName]) == null ? void 0 : _a.call(kImplicitRoleByTagName, element)) || "";
  if (!implicitRole)
    return null;
  let ancestor = element;
  while (ancestor) {
    const parent = parentElementOrShadowHost(ancestor);
    const parents = kPresentationInheritanceParents[ancestor.tagName];
    if (!parents || !parent || !parents.includes(parent.tagName))
      break;
    const parentExplicitRole = getExplicitAriaRole(parent);
    if ((parentExplicitRole === "none" || parentExplicitRole === "presentation") && !hasPresentationConflictResolution(parent))
      return parentExplicitRole;
    ancestor = parent;
  }
  return implicitRole;
}
var allRoles = [
  "alert",
  "alertdialog",
  "application",
  "article",
  "banner",
  "blockquote",
  "button",
  "caption",
  "cell",
  "checkbox",
  "code",
  "columnheader",
  "combobox",
  "command",
  "complementary",
  "composite",
  "contentinfo",
  "definition",
  "deletion",
  "dialog",
  "directory",
  "document",
  "emphasis",
  "feed",
  "figure",
  "form",
  "generic",
  "grid",
  "gridcell",
  "group",
  "heading",
  "img",
  "input",
  "insertion",
  "landmark",
  "link",
  "list",
  "listbox",
  "listitem",
  "log",
  "main",
  "marquee",
  "math",
  "meter",
  "menu",
  "menubar",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "navigation",
  "none",
  "note",
  "option",
  "paragraph",
  "presentation",
  "progressbar",
  "radio",
  "radiogroup",
  "range",
  "region",
  "roletype",
  "row",
  "rowgroup",
  "rowheader",
  "scrollbar",
  "search",
  "searchbox",
  "section",
  "sectionhead",
  "select",
  "separator",
  "slider",
  "spinbutton",
  "status",
  "strong",
  "structure",
  "subscript",
  "superscript",
  "switch",
  "tab",
  "table",
  "tablist",
  "tabpanel",
  "term",
  "textbox",
  "time",
  "timer",
  "toolbar",
  "tooltip",
  "tree",
  "treegrid",
  "treeitem",
  "widget",
  "window"
];
var abstractRoles = ["command", "composite", "input", "landmark", "range", "roletype", "section", "sectionhead", "select", "structure", "widget", "window"];
var validRoles = allRoles.filter((role) => !abstractRoles.includes(role));
function getExplicitAriaRole(element) {
  const roles = (element.getAttribute("role") || "").split(" ").map((role) => role.trim());
  return roles.find((role) => validRoles.includes(role)) || null;
}
function hasPresentationConflictResolution(element) {
  return !hasGlobalAriaAttribute(element);
}
function getAriaRole(element) {
  const explicitRole = getExplicitAriaRole(element);
  if (!explicitRole)
    return getImplicitAriaRole(element);
  if ((explicitRole === "none" || explicitRole === "presentation") && hasPresentationConflictResolution(element))
    return getImplicitAriaRole(element);
  return explicitRole;
}
function getAriaBoolean(attr) {
  return attr === null ? void 0 : attr.toLowerCase() === "true";
}
function getComputedStyle(element, pseudo) {
  return element.ownerDocument && element.ownerDocument.defaultView ? element.ownerDocument.defaultView.getComputedStyle(element, pseudo) : void 0;
}
function isElementHiddenForAria(element, cache) {
  if (["STYLE", "SCRIPT", "NOSCRIPT", "TEMPLATE"].includes(element.tagName))
    return true;
  const style = getComputedStyle(element);
  if (!style || style.visibility === "hidden")
    return true;
  return belongsToDisplayNoneOrAriaHidden(element, cache);
}
function belongsToDisplayNoneOrAriaHidden(element, cache) {
  if (!cache.has(element)) {
    const style = getComputedStyle(element);
    let hidden = !style || style.display === "none" || getAriaBoolean(element.getAttribute("aria-hidden")) === true;
    if (!hidden) {
      const parent = parentElementOrShadowHost(element);
      if (parent)
        hidden = hidden || belongsToDisplayNoneOrAriaHidden(parent, cache);
    }
    cache.set(element, hidden);
  }
  return cache.get(element);
}
function getIdRefs(element, ref) {
  if (!ref)
    return [];
  const root = enclosingShadowRootOrDocument(element);
  if (!root)
    return [];
  try {
    const ids = ref.split(" ").filter((id) => !!id);
    const set = /* @__PURE__ */ new Set();
    for (const id of ids) {
      const firstElement = root.querySelector("#" + CSS.escape(id));
      if (firstElement)
        set.add(firstElement);
    }
    return [...set];
  } catch (e) {
    return [];
  }
}
function normalizeAccessbileName(s) {
  return s.replace(/\r\n/g, "\n").replace(/\u00A0/g, " ").replace(/\s\s+/g, " ").trim();
}
function queryInAriaOwned(element, selector) {
  const result = [...element.querySelectorAll(selector)];
  for (const owned of getIdRefs(element, element.getAttribute("aria-owns"))) {
    if (owned.matches(selector))
      result.push(owned);
    result.push(...owned.querySelectorAll(selector));
  }
  return result;
}
function getPseudoContent(pseudoStyle) {
  if (!pseudoStyle)
    return "";
  const content = pseudoStyle.getPropertyValue("content");
  if (content[0] === "'" && content[content.length - 1] === "'" || content[0] === '"' && content[content.length - 1] === '"') {
    const unquoted = content.substring(1, content.length - 1);
    const display = pseudoStyle.getPropertyValue("display") || "inline";
    if (display !== "inline")
      return " " + unquoted + " ";
    return unquoted;
  }
  return "";
}
function getElementAccessibleName(element, includeHidden, hiddenCache) {
  const elementProhibitsNaming = ["caption", "code", "definition", "deletion", "emphasis", "generic", "insertion", "mark", "paragraph", "presentation", "strong", "subscript", "suggestion", "superscript", "term", "time"].includes(getAriaRole(element) || "");
  if (elementProhibitsNaming)
    return "";
  const accessibleName = normalizeAccessbileName(getElementAccessibleNameInternal(element, {
    includeHidden,
    hiddenCache,
    visitedElements: /* @__PURE__ */ new Set(),
    embeddedInLabelledBy: "none",
    embeddedInLabel: "none",
    embeddedInTextAlternativeElement: false,
    embeddedInTargetElement: "self"
  }));
  return accessibleName;
}
function getElementAccessibleNameInternal(element, options) {
  if (options.visitedElements.has(element))
    return "";
  const childOptions = {
    ...options,
    embeddedInLabel: options.embeddedInLabel === "self" ? "descendant" : options.embeddedInLabel,
    embeddedInLabelledBy: options.embeddedInLabelledBy === "self" ? "descendant" : options.embeddedInLabelledBy,
    embeddedInTargetElement: options.embeddedInTargetElement === "self" ? "descendant" : options.embeddedInTargetElement
  };
  if (!options.includeHidden && options.embeddedInLabelledBy !== "self" && isElementHiddenForAria(element, options.hiddenCache)) {
    options.visitedElements.add(element);
    return "";
  }
  if (options.embeddedInLabelledBy === "none") {
    const refs = getIdRefs(element, element.getAttribute("aria-labelledby"));
    const accessibleName = refs.map((ref) => getElementAccessibleNameInternal(ref, {
      ...options,
      embeddedInLabelledBy: "self",
      embeddedInTargetElement: "none",
      embeddedInLabel: "none",
      embeddedInTextAlternativeElement: false
    })).join(" ");
    if (accessibleName)
      return accessibleName;
  }
  const role = getAriaRole(element) || "";
  if (options.embeddedInLabel !== "none" || options.embeddedInLabelledBy !== "none") {
    const isOwnLabel = [...element.labels || []].includes(element);
    const isOwnLabelledBy = getIdRefs(element, element.getAttribute("aria-labelledby")).includes(element);
    if (!isOwnLabel && !isOwnLabelledBy) {
      if (role === "textbox") {
        options.visitedElements.add(element);
        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA")
          return element.value;
        return element.textContent || "";
      }
      if (["combobox", "listbox"].includes(role)) {
        options.visitedElements.add(element);
        let selectedOptions;
        if (element.tagName === "SELECT") {
          selectedOptions = [...element.selectedOptions];
          if (!selectedOptions.length && element.options.length)
            selectedOptions.push(element.options[0]);
        } else {
          const listbox = role === "combobox" ? queryInAriaOwned(element, "*").find((e) => getAriaRole(e) === "listbox") : element;
          selectedOptions = listbox ? queryInAriaOwned(listbox, '[aria-selected="true"]').filter((e) => getAriaRole(e) === "option") : [];
        }
        return selectedOptions.map((option) => getElementAccessibleNameInternal(option, childOptions)).join(" ");
      }
      if (["progressbar", "scrollbar", "slider", "spinbutton", "meter"].includes(role)) {
        options.visitedElements.add(element);
        if (element.hasAttribute("aria-valuetext"))
          return element.getAttribute("aria-valuetext") || "";
        if (element.hasAttribute("aria-valuenow"))
          return element.getAttribute("aria-valuenow") || "";
        return element.getAttribute("value") || "";
      }
      if (["menu"].includes(role)) {
        options.visitedElements.add(element);
        return "";
      }
    }
  }
  const ariaLabel = element.getAttribute("aria-label") || "";
  if (ariaLabel.trim()) {
    options.visitedElements.add(element);
    return ariaLabel;
  }
  if (!["presentation", "none"].includes(role)) {
    if (element.tagName === "INPUT" && ["button", "submit", "reset"].includes(element.type)) {
      options.visitedElements.add(element);
      const value = element.value || "";
      if (value.trim())
        return value;
      if (element.type === "submit")
        return "Submit";
      if (element.type === "reset")
        return "Reset";
      const title = element.getAttribute("title") || "";
      return title;
    }
    if (element.tagName === "INPUT" && element.type === "image") {
      options.visitedElements.add(element);
      const alt = element.getAttribute("alt") || "";
      if (alt.trim())
        return alt;
      const labels = element.labels || [];
      if (labels.length) {
        return [...labels].map((label) => getElementAccessibleNameInternal(label, {
          ...options,
          embeddedInLabel: "self",
          embeddedInTextAlternativeElement: false,
          embeddedInLabelledBy: "none",
          embeddedInTargetElement: "none"
        })).filter((accessibleName) => !!accessibleName).join(" ");
      }
      const title = element.getAttribute("title") || "";
      if (title.trim())
        return title;
      return "Submit";
    }
    if (element.tagName === "TEXTAREA" || element.tagName === "SELECT" || element.tagName === "INPUT") {
      options.visitedElements.add(element);
      const labels = element.labels || [];
      if (labels.length) {
        return [...labels].map((label) => getElementAccessibleNameInternal(label, {
          ...options,
          embeddedInLabel: "self",
          embeddedInTextAlternativeElement: false,
          embeddedInLabelledBy: "none",
          embeddedInTargetElement: "none"
        })).filter((accessibleName) => !!accessibleName).join(" ");
      }
      const usePlaceholder = element.tagName === "INPUT" && ["text", "password", "search", "tel", "email", "url"].includes(element.type) || element.tagName === "TEXTAREA";
      const placeholder = element.getAttribute("placeholder") || "";
      const title = element.getAttribute("title") || "";
      if (!usePlaceholder || title)
        return title;
      return placeholder;
    }
    if (element.tagName === "FIELDSET") {
      options.visitedElements.add(element);
      for (let child = element.firstElementChild; child; child = child.nextElementSibling) {
        if (child.tagName === "LEGEND") {
          return getElementAccessibleNameInternal(child, {
            ...childOptions,
            embeddedInTextAlternativeElement: true
          });
        }
      }
      const title = element.getAttribute("title") || "";
      return title;
    }
    if (element.tagName === "FIGURE") {
      options.visitedElements.add(element);
      for (let child = element.firstElementChild; child; child = child.nextElementSibling) {
        if (child.tagName === "FIGCAPTION") {
          return getElementAccessibleNameInternal(child, {
            ...childOptions,
            embeddedInTextAlternativeElement: true
          });
        }
      }
      const title = element.getAttribute("title") || "";
      return title;
    }
    if (element.tagName === "IMG") {
      options.visitedElements.add(element);
      const alt = element.getAttribute("alt") || "";
      if (alt.trim())
        return alt;
      const title = element.getAttribute("title") || "";
      return title;
    }
    if (element.tagName === "TABLE") {
      options.visitedElements.add(element);
      for (let child = element.firstElementChild; child; child = child.nextElementSibling) {
        if (child.tagName === "CAPTION") {
          return getElementAccessibleNameInternal(child, {
            ...childOptions,
            embeddedInTextAlternativeElement: true
          });
        }
      }
      const summary = element.getAttribute("summary") || "";
      if (summary)
        return summary;
    }
    if (element.tagName === "AREA") {
      options.visitedElements.add(element);
      const alt = element.getAttribute("alt") || "";
      if (alt.trim())
        return alt;
      const title = element.getAttribute("title") || "";
      return title;
    }
    if (element.tagName === "SVG" && element.ownerSVGElement) {
      options.visitedElements.add(element);
      for (let child = element.firstElementChild; child; child = child.nextElementSibling) {
        if (child.tagName === "TITLE" && element.ownerSVGElement) {
          return getElementAccessibleNameInternal(child, {
            ...childOptions,
            embeddedInTextAlternativeElement: true
          });
        }
      }
    }
  }
  const allowsNameFromContent = ["button", "cell", "checkbox", "columnheader", "gridcell", "heading", "link", "menuitem", "menuitemcheckbox", "menuitemradio", "option", "radio", "row", "rowheader", "switch", "tab", "tooltip", "treeitem"].includes(role);
  if (allowsNameFromContent || options.embeddedInLabelledBy !== "none" || options.embeddedInLabel !== "none" || options.embeddedInTextAlternativeElement || options.embeddedInTargetElement === "descendant") {
    options.visitedElements.add(element);
    const tokens = [];
    const visit = (node) => {
      var _a;
      if (node.nodeType === 1) {
        const display = ((_a = getComputedStyle(node)) == null ? void 0 : _a.getPropertyValue("display")) || "inline";
        let token = getElementAccessibleNameInternal(node, childOptions);
        if (display !== "inline" || node.nodeName === "BR")
          token = " " + token + " ";
        tokens.push(token);
      } else if (node.nodeType === 3) {
        tokens.push(node.textContent || "");
      }
    };
    tokens.push(getPseudoContent(getComputedStyle(element, "::before")));
    for (let child = element.firstChild; child; child = child.nextSibling)
      visit(child);
    if (element.shadowRoot) {
      for (let child = element.shadowRoot.firstChild; child; child = child.nextSibling)
        visit(child);
    }
    for (const owned of getIdRefs(element, element.getAttribute("aria-owns")))
      visit(owned);
    tokens.push(getPseudoContent(getComputedStyle(element, "::after")));
    const accessibleName = tokens.join("");
    if (accessibleName.trim())
      return accessibleName;
  }
  if (!["presentation", "none"].includes(role) || element.tagName === "IFRAME") {
    options.visitedElements.add(element);
    const title = element.getAttribute("title") || "";
    if (title.trim())
      return title;
  }
  options.visitedElements.add(element);
  return "";
}

// packages/playwright-core/src/server/injected/selectorUtils.ts
function shouldSkipForTextMatching(element) {
  return element.nodeName === "SCRIPT" || element.nodeName === "NOSCRIPT" || element.nodeName === "STYLE" || document.head && document.head.contains(element);
}
function elementText(cache, root) {
  let value = cache.get(root);
  if (value === void 0) {
    value = { full: "", immediate: [] };
    if (!shouldSkipForTextMatching(root)) {
      let currentImmediate = "";
      if (root instanceof HTMLInputElement && (root.type === "submit" || root.type === "button")) {
        value = { full: root.value, immediate: [root.value] };
      } else {
        for (let child = root.firstChild; child; child = child.nextSibling) {
          if (child.nodeType === Node.TEXT_NODE) {
            value.full += child.nodeValue || "";
            currentImmediate += child.nodeValue || "";
          } else {
            if (currentImmediate)
              value.immediate.push(currentImmediate);
            currentImmediate = "";
            if (child.nodeType === Node.ELEMENT_NODE)
              value.full += elementText(cache, child).full;
          }
        }
        if (currentImmediate)
          value.immediate.push(currentImmediate);
        if (root.shadowRoot)
          value.full += elementText(cache, root.shadowRoot).full;
      }
    }
    cache.set(root, value);
  }
  return value;
}

// packages/playwright-core/src/server/injected/selectorGenerator.ts
var cacheAllowText = /* @__PURE__ */ new Map();
var cacheDisallowText = /* @__PURE__ */ new Map();
var kNthScore = 1e3;
function generateSelector(injectedScript, targetElement, strict) {
  injectedScript._evaluator.begin();
  try {
    targetElement = targetElement.closest("button,select,input,[role=button],[role=checkbox],[role=radio],a,[role=link]") || targetElement;
    const targetTokens = generateSelectorFor(injectedScript, targetElement, strict);
    const bestTokens = targetTokens || cssFallback(injectedScript, targetElement, strict);
    const selector = joinTokens(bestTokens);
    const parsedSelector = injectedScript.parseSelector(selector);
    return {
      selector,
      elements: injectedScript.querySelectorAll(parsedSelector, targetElement.ownerDocument)
    };
  } finally {
    cacheAllowText.clear();
    cacheDisallowText.clear();
    injectedScript._evaluator.end();
  }
}
function filterRegexTokens(textCandidates) {
  return textCandidates.filter((c) => c[0].selector[0] !== "/");
}
function generateSelectorFor(injectedScript, targetElement, strict) {
  if (targetElement.ownerDocument.documentElement === targetElement)
    return [{ engine: "css", selector: "html", score: 1 }];
  const accessibleNameCache = /* @__PURE__ */ new Map();
  const calculate = (element, allowText) => {
    const allowNthMatch = element === targetElement;
    let textCandidates = allowText ? buildTextCandidates(injectedScript, element, element === targetElement).map((token) => [token]) : [];
    if (element !== targetElement) {
      textCandidates = filterRegexTokens(textCandidates);
    }
    const noTextCandidates = buildCandidates(injectedScript, element, accessibleNameCache).map((token) => [token]);
    let result = chooseFirstSelector(injectedScript, targetElement.ownerDocument, element, [...textCandidates, ...noTextCandidates], allowNthMatch, strict);
    textCandidates = filterRegexTokens(textCandidates);
    const checkWithText = (textCandidatesToUse) => {
      const allowParentText = allowText && !textCandidatesToUse.length;
      const candidates = [...textCandidatesToUse, ...noTextCandidates].filter((c) => {
        if (!result)
          return true;
        return combineScores(c) < combineScores(result);
      });
      let bestPossibleInParent = candidates[0];
      if (!bestPossibleInParent)
        return;
      for (let parent = parentElementOrShadowHost2(element); parent; parent = parentElementOrShadowHost2(parent)) {
        const parentTokens = calculateCached(parent, allowParentText);
        if (!parentTokens)
          continue;
        if (result && combineScores([...parentTokens, ...bestPossibleInParent]) >= combineScores(result))
          continue;
        bestPossibleInParent = chooseFirstSelector(injectedScript, parent, element, candidates, allowNthMatch, strict);
        if (!bestPossibleInParent)
          return;
        const combined = [...parentTokens, ...bestPossibleInParent];
        if (!result || combineScores(combined) < combineScores(result))
          result = combined;
      }
    };
    checkWithText(textCandidates);
    if (element === targetElement && textCandidates.length)
      checkWithText([]);
    return result;
  };
  const calculateCached = (element, allowText) => {
    const cache = allowText ? cacheAllowText : cacheDisallowText;
    let value = cache.get(element);
    if (value === void 0) {
      value = calculate(element, allowText);
      cache.set(element, value);
    }
    return value;
  };
  return calculateCached(targetElement, true);
}
function buildCandidates(injectedScript, element, accessibleNameCache) {
  var _a;
  const candidates = [];
  if (element.getAttribute("data-testid"))
    candidates.push({ engine: "internal:attr", selector: `[data-testid=${escapeForAttributeSelector(element.getAttribute("data-testid"), true)}]`, score: 1 });
  for (const attr of ["data-test-id", "data-test"]) {
    if (element.getAttribute(attr))
      candidates.push({ engine: "css", selector: `[${attr}=${quoteAttributeValue(element.getAttribute(attr))}]`, score: 2 });
  }
  if (element.nodeName === "INPUT" || element.nodeName === "TEXTAREA") {
    const input = element;
    if (input.placeholder)
      candidates.push({ engine: "internal:attr", selector: `[placeholder=${escapeForAttributeSelector(input.placeholder, false)}]`, score: 3 });
    const label = (_a = input.labels) == null ? void 0 : _a[0];
    if (label) {
      const labelText = elementText(injectedScript._evaluator._cacheText, label).full.trim();
      candidates.push({ engine: "internal:label", selector: escapeForTextSelector(labelText, false, true), score: 3 });
    }
  }
  const ariaRole = getAriaRole(element);
  if (ariaRole) {
    const ariaName = getElementAccessibleName(element, false, accessibleNameCache);
    if (ariaName)
      candidates.push({ engine: "role", selector: `${ariaRole}[name=${escapeForAttributeSelector(ariaName, true)}]`, score: 3 });
    else
      candidates.push({ engine: "role", selector: ariaRole, score: 150 });
  }
  if (element.getAttribute("alt") && ["APPLET", "AREA", "IMG", "INPUT"].includes(element.nodeName))
    candidates.push({ engine: "internal:attr", selector: `[alt=${escapeForAttributeSelector(element.getAttribute("alt"), false)}]`, score: 10 });
  if (element.getAttribute("name") && ["BUTTON", "FORM", "FIELDSET", "FRAME", "IFRAME", "INPUT", "KEYGEN", "OBJECT", "OUTPUT", "SELECT", "TEXTAREA", "MAP", "META", "PARAM"].includes(element.nodeName))
    candidates.push({ engine: "css", selector: `${cssEscape(element.nodeName.toLowerCase())}[name=${quoteAttributeValue(element.getAttribute("name"))}]`, score: 50 });
  if (["INPUT", "TEXTAREA"].includes(element.nodeName) && element.getAttribute("type") !== "hidden") {
    if (element.getAttribute("type"))
      candidates.push({ engine: "css", selector: `${cssEscape(element.nodeName.toLowerCase())}[type=${quoteAttributeValue(element.getAttribute("type"))}]`, score: 50 });
  }
  if (["INPUT", "TEXTAREA", "SELECT"].includes(element.nodeName))
    candidates.push({ engine: "css", selector: cssEscape(element.nodeName.toLowerCase()), score: 50 });
  const idAttr = element.getAttribute("id");
  if (idAttr && !isGuidLike(idAttr))
    candidates.push({ engine: "css", selector: makeSelectorForId(idAttr), score: 100 });
  candidates.push({ engine: "css", selector: cssEscape(element.nodeName.toLowerCase()), score: 200 });
  return candidates;
}
function buildTextCandidates(injectedScript, element, isTargetNode) {
  if (element.nodeName === "SELECT")
    return [];
  const text = elementText(injectedScript._evaluator._cacheText, element).full.trim().replace(/\s+/g, " ").substring(0, 80);
  if (!text)
    return [];
  const candidates = [];
  const escaped = escapeForTextSelector(text, false, true);
  if (isTargetNode)
    candidates.push({ engine: "text", selector: escaped, score: 10 });
  if (escaped === text) {
    let prefix = element.nodeName.toLowerCase();
    if (element.hasAttribute("role"))
      prefix += `[role=${quoteAttributeValue(element.getAttribute("role"))}]`;
    candidates.push({ engine: "css", selector: `${prefix}:has-text("${text}")`, score: 10 });
  }
  return candidates;
}
function parentElementOrShadowHost2(element) {
  if (element.parentElement)
    return element.parentElement;
  if (!element.parentNode)
    return null;
  if (element.parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE && element.parentNode.host)
    return element.parentNode.host;
  return null;
}
function makeSelectorForId(id) {
  return /^[a-zA-Z][a-zA-Z0-9\-\_]+$/.test(id) ? "#" + id : `[id="${cssEscape(id)}"]`;
}
function cssFallback(injectedScript, targetElement, strict) {
  const kFallbackScore = 1e7;
  const root = targetElement.ownerDocument;
  const tokens = [];
  function uniqueCSSSelector(prefix) {
    const path = tokens.slice();
    if (prefix)
      path.unshift(prefix);
    const selector = path.join(" > ");
    const parsedSelector = injectedScript.parseSelector(selector);
    const node = injectedScript.querySelector(parsedSelector, targetElement.ownerDocument, false);
    return node === targetElement ? selector : void 0;
  }
  function makeStrict(selector) {
    const token = { engine: "css", selector, score: kFallbackScore };
    if (!strict)
      return [token];
    const parsedSelector = injectedScript.parseSelector(selector);
    const elements = injectedScript.querySelectorAll(parsedSelector, targetElement.ownerDocument);
    if (elements.length === 1)
      return [token];
    const nth = { engine: "nth", selector: String(elements.indexOf(targetElement)), score: kNthScore };
    return [token, nth];
  }
  for (let element = targetElement; element && element !== root; element = parentElementOrShadowHost2(element)) {
    const nodeName = element.nodeName.toLowerCase();
    let bestTokenForLevel = "";
    if (element.id) {
      const token = makeSelectorForId(element.id);
      const selector = uniqueCSSSelector(token);
      if (selector)
        return makeStrict(selector);
      bestTokenForLevel = token;
    }
    const parent = element.parentNode;
    const classes = [...element.classList];
    for (let i = 0; i < classes.length; ++i) {
      const token = "." + cssEscape(classes.slice(0, i + 1).join("."));
      const selector = uniqueCSSSelector(token);
      if (selector)
        return makeStrict(selector);
      if (!bestTokenForLevel && parent) {
        const sameClassSiblings = parent.querySelectorAll(token);
        if (sameClassSiblings.length === 1)
          bestTokenForLevel = token;
      }
    }
    if (parent) {
      const siblings = [...parent.children];
      const sameTagSiblings = siblings.filter((sibling) => sibling.nodeName.toLowerCase() === nodeName);
      const token = sameTagSiblings.indexOf(element) === 0 ? cssEscape(nodeName) : `${cssEscape(nodeName)}:nth-child(${1 + siblings.indexOf(element)})`;
      const selector = uniqueCSSSelector(token);
      if (selector)
        return makeStrict(selector);
      if (!bestTokenForLevel)
        bestTokenForLevel = token;
    } else if (!bestTokenForLevel) {
      bestTokenForLevel = nodeName;
    }
    tokens.unshift(bestTokenForLevel);
  }
  return makeStrict(uniqueCSSSelector());
}
function quoteAttributeValue(text) {
  return `"${cssEscape(text).replace(/\\ /g, " ")}"`;
}
function joinTokens(tokens) {
  const parts = [];
  let lastEngine = "";
  for (const { engine, selector } of tokens) {
    if (parts.length && (lastEngine !== "css" || engine !== "css" || selector.startsWith(":nth-match(")))
      parts.push(">>");
    lastEngine = engine;
    if (engine === "css")
      parts.push(selector);
    else
      parts.push(`${engine}=${selector}`);
  }
  return parts.join(" ");
}
function combineScores(tokens) {
  let score = 0;
  for (let i = 0; i < tokens.length; i++)
    score += tokens[i].score * (tokens.length - i);
  return score;
}
function chooseFirstSelector(injectedScript, scope, targetElement, selectors, allowNthMatch, strict) {
  const joined = selectors.map((tokens) => ({ tokens, score: combineScores(tokens) }));
  joined.sort((a, b) => a.score - b.score);
  let bestWithIndex = null;
  for (const { tokens } of joined) {
    const parsedSelector = injectedScript.parseSelector(joinTokens(tokens));
    const result = injectedScript.querySelectorAll(parsedSelector, scope);
    const isStrictEnough = !strict || result.length === 1;
    const index = result.indexOf(targetElement);
    if (index === 0 && isStrictEnough) {
      return tokens;
    }
    if (!allowNthMatch || bestWithIndex || index === -1 || result.length > 5)
      continue;
    const nth = { engine: "nth", selector: String(index), score: kNthScore };
    bestWithIndex = [...tokens, nth];
  }
  return bestWithIndex;
}
function isGuidLike(id) {
  let lastCharacterType;
  let transitionCount = 0;
  for (let i = 0; i < id.length; ++i) {
    const c = id[i];
    let characterType;
    if (c === "-" || c === "_")
      continue;
    if (c >= "a" && c <= "z")
      characterType = "lower";
    else if (c >= "A" && c <= "Z")
      characterType = "upper";
    else if (c >= "0" && c <= "9")
      characterType = "digit";
    else
      characterType = "other";
    if (characterType === "lower" && lastCharacterType === "upper") {
      lastCharacterType = characterType;
      continue;
    }
    if (lastCharacterType && lastCharacterType !== characterType)
      ++transitionCount;
    lastCharacterType = characterType;
  }
  return transitionCount >= id.length / 4;
}

// packages/playwright-core/src/server/injected/consoleApi.ts
function createLocator(injectedScript, initial, options) {
  class Locator {
    constructor(selector, options2) {
      this.selector = selector;
      if (options2 == null ? void 0 : options2.hasText) {
        const textSelector = "text=" + escapeForTextSelector(options2.hasText, false);
        this.selector += ` >> internal:has=${JSON.stringify(textSelector)}`;
      }
      if (options2 == null ? void 0 : options2.has)
        this.selector += ` >> internal:has=` + JSON.stringify(options2.has.selector);
      const parsed = injectedScript.parseSelector(this.selector);
      this.element = injectedScript.querySelector(parsed, document, false);
      this.elements = injectedScript.querySelectorAll(parsed, document);
    }
    locator(selector, options2) {
      return new Locator(this.selector ? this.selector + " >> " + selector : selector, options2);
    }
  }
  return new Locator(initial, options);
}
var ConsoleAPI = class {
  constructor(injectedScript) {
    this._injectedScript = injectedScript;
    if (window.playwright)
      return;
    window.playwright = {
      $: (selector, strict) => this._querySelector(selector, !!strict),
      $$: (selector) => this._querySelectorAll(selector),
      locator: (selector, options) => createLocator(this._injectedScript, selector, options),
      inspect: (selector) => this._inspect(selector),
      selector: (element) => this._selector(element),
      resume: () => this._resume()
    };
  }
  _querySelector(selector, strict) {
    if (typeof selector !== "string")
      throw new Error(`Usage: playwright.query('Playwright >> selector').`);
    const parsed = this._injectedScript.parseSelector(selector);
    return this._injectedScript.querySelector(parsed, document, strict);
  }
  _querySelectorAll(selector) {
    if (typeof selector !== "string")
      throw new Error(`Usage: playwright.$$('Playwright >> selector').`);
    const parsed = this._injectedScript.parseSelector(selector);
    return this._injectedScript.querySelectorAll(parsed, document);
  }
  _inspect(selector) {
    if (typeof selector !== "string")
      throw new Error(`Usage: playwright.inspect('Playwright >> selector').`);
    window.inspect(this._querySelector(selector, false));
  }
  _selector(element) {
    if (!(element instanceof Element))
      throw new Error(`Usage: playwright.selector(element).`);
    return generateSelector(this._injectedScript, element, true).selector;
  }
  _resume() {
    window.__pw_resume().catch(() => {
    });
  }
};
module.exports = ConsoleAPI;
