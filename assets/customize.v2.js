(function () {
  const META_SELECTOR_MAP = {
    title: "title",
    description: 'meta[name="description"]',
    ogTitle: 'meta[property="og:title"]',
    ogDescription: 'meta[property="og:description"]',
    twitterTitle: 'meta[name="twitter:title"]',
    twitterDescription: 'meta[name="twitter:description"]'
  };

  const TEXT_TAG_BLOCKLIST = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TITLE"]);
  const DEFAULT_RETIRED_PROJECT_PATTERNS = [
    /\/new-projects\/ancient-architecture\/?$/i,
    /\/new-projects\/inspace\/?$/i,
    /:\/\/www\.eano\.com\/?$/i
  ];

  let activeConfig = null;
  let applyScheduled = false;
  let applying = false;

  function getConfigCandidates() {
    const script =
      document.currentScript ||
      document.querySelector('script[src*="customize.v2.js"], script[src*="customize.js"]');
    const candidates = [];

    if (script && script.src) {
      const scriptUrl = new URL(script.src, window.location.href);
      const rootPath = scriptUrl.pathname.replace(/\/assets\/customize(?:\.v2)?\.js$/, "/");
      candidates.push(new URL("site-config.json", `${scriptUrl.origin}${rootPath}`).toString());
    }

    candidates.push(new URL("/site-config.json", window.location.origin).toString());
    candidates.push(new URL("site-config.json", window.location.href).toString());

    return Array.from(new Set(candidates));
  }

  async function loadConfig() {
    const candidates = getConfigCandidates();

    for (const url of candidates) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          continue;
        }

        return await response.json();
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  function normalizeHref(rawHref) {
    if (!rawHref) {
      return null;
    }

    try {
      const resolved = new URL(rawHref, window.location.href);
      resolved.hash = "";
      return resolved.href.replace(/\/$/, "");
    } catch (error) {
      return null;
    }
  }

  function hrefMatches(currentHref, targetHref) {
    if (!currentHref || !targetHref) {
      return false;
    }

    if (currentHref === targetHref) {
      return true;
    }

    const normalizedCurrent = normalizeHref(currentHref);
    const normalizedTarget = normalizeHref(targetHref);
    return normalizedCurrent && normalizedTarget && normalizedCurrent === normalizedTarget;
  }

  function setMetaContent(config) {
    if (config.lang) {
      document.documentElement.lang = config.lang;
    }

    const meta = config.meta || {};
    Object.entries(META_SELECTOR_MAP).forEach(([key, selector]) => {
      const value = meta[key];
      if (!value) {
        return;
      }

      const element = document.querySelector(selector);
      if (!element) {
        return;
      }

      if (selector === "title") {
        document.title = value;
        return;
      }

      element.setAttribute("content", value);
    });
  }

  function replaceTextNodes(replacements) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.parentElement || TEXT_TAG_BLOCKLIST.has(node.parentElement.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach((node) => {
      let nextValue = node.nodeValue;

      Object.entries(replacements).forEach(([from, to]) => {
        if (!from || from === to || !nextValue.includes(from)) {
          return;
        }

        nextValue = nextValue.split(from).join(to);
      });

      if (nextValue !== node.nodeValue) {
        node.nodeValue = nextValue;
      }
    });
  }

  function replaceComplexTextElements(replacements) {
    const elements = Array.from(document.body.querySelectorAll("*"));

    elements.forEach((element) => {
      if (TEXT_TAG_BLOCKLIST.has(element.tagName)) {
        return;
      }

      const text = element.textContent ? element.textContent.trim() : "";
      if (!text || !element.children.length) {
        return;
      }

      const replacement = replacements[text];
      if (!replacement || replacement === text) {
        return;
      }

      if (element.dataset.customizeExactText === replacement) {
        return;
      }

      element.textContent = replacement;
      element.dataset.customizeExactText = replacement;
    });
  }

  function replaceLinks(replacements) {
    const nodes = document.querySelectorAll("[href]");
    nodes.forEach((node) => {
      const href = node.getAttribute("href");
      if (!href || !(href in replacements)) {
        return;
      }

      if (href !== replacements[href]) {
        node.setAttribute("href", replacements[href]);
      }
    });
  }

  function applySelectorOverrides(overrides) {
    overrides.forEach((override) => {
      if (!override || (!override.selector && !override.containsText)) {
        return;
      }

      let elements = [];

      if (override.selector) {
        elements = Array.from(document.querySelectorAll(override.selector));
      } else if (override.containsText) {
        elements = Array.from(document.querySelectorAll("*")).filter((element) => {
          if (TEXT_TAG_BLOCKLIST.has(element.tagName)) {
            return false;
          }

          const text = element.textContent ? element.textContent.trim() : "";
          return text.includes(override.containsText);
        });
      }

      elements.forEach((element) => {
        const target = override.closest ? element.closest(override.closest) || element : element;

        if (override.remove) {
          target.remove();
          return;
        }

        if (override.text !== undefined) {
          target.textContent = override.text;
        }

        if (override.html !== undefined) {
          target.innerHTML = override.html;
        }

        if (override.attr && override.value !== undefined) {
          target.setAttribute(override.attr, override.value);
        }

        if (override.styles) {
          Object.entries(override.styles).forEach(([property, value]) => {
            target.style.setProperty(property, value);
          });
        }
      });
    });
  }

  function resolveRetiredPatterns(config) {
    if (config.autoRetiredProjectPatterns === false) {
      return [];
    }

    if (!Array.isArray(config.autoRetiredProjectPatterns)) {
      return DEFAULT_RETIRED_PROJECT_PATTERNS;
    }

    const compiled = config.autoRetiredProjectPatterns
      .map((pattern) => {
        if (!pattern || typeof pattern !== "string") {
          return null;
        }

        try {
          return new RegExp(pattern, "i");
        } catch (error) {
          return null;
        }
      })
      .filter(Boolean);

    return compiled.length ? compiled : DEFAULT_RETIRED_PROJECT_PATTERNS;
  }

  function removeRetiredProjectEntries(patterns) {
    if (!patterns.length) {
      return;
    }

    const links = Array.from(document.querySelectorAll("a[href]"));
    links.forEach((link) => {
      const rawHref = link.getAttribute("href");
      if (!rawHref) {
        return;
      }

      const resolvedHref = new URL(rawHref, window.location.href).href;
      const isRetired = patterns.some((pattern) => pattern.test(resolvedHref));
      if (!isRetired) {
        return;
      }

      const removableContainer =
        link.closest(".ssr-variant") ||
        link.closest('[data-framer-component-type="RichTextContainer"]');

      if (removableContainer && removableContainer.parentElement) {
        removableContainer.remove();
      } else {
        link.remove();
      }
    });
  }

  function findFirstAnchorByHref(href) {
    if (!href) {
      return null;
    }

    const links = Array.from(document.querySelectorAll("a[href]"));
    return (
      links.find((link) => hrefMatches(link.getAttribute("href"), href)) ||
      links.find((link) => (link.getAttribute("href") || "").includes(href)) ||
      null
    );
  }

  function findClosestContainer(anchor, closestSelector) {
    if (!anchor) {
      return null;
    }

    return (
      (closestSelector && anchor.closest(closestSelector)) ||
      anchor.closest('[data-framer-component-type="RichTextContainer"]') ||
      anchor
    );
  }

  function applyProjectOperations(operations) {
    operations.forEach((operation) => {
      if (!operation || !operation.type) {
        return;
      }

      const type = String(operation.type).toLowerCase();

      if (type === "remove") {
        const anchor = findFirstAnchorByHref(operation.matchHref || operation.href);
        const target = findClosestContainer(anchor, operation.closest);
        if (target && target.parentElement) {
          target.remove();
        }
        return;
      }

      if (type === "update") {
        const anchor = findFirstAnchorByHref(operation.matchHref || operation.href);
        if (!anchor) {
          return;
        }

        if (operation.text !== undefined) {
          anchor.textContent = operation.text;
        }

        if (operation.newHref) {
          anchor.setAttribute("href", operation.newHref);
        }

        return;
      }

      if (type === "add") {
        if (operation.href && findFirstAnchorByHref(operation.href)) {
          return;
        }

        const sourceAnchor = findFirstAnchorByHref(operation.cloneFromHref);
        const sourceContainer = findClosestContainer(sourceAnchor, operation.closest);
        if (!sourceContainer || !sourceContainer.parentElement) {
          return;
        }

        const clone = sourceContainer.cloneNode(true);
        const cloneAnchor = clone.querySelector("a[href]");
        if (cloneAnchor) {
          if (operation.href) {
            cloneAnchor.setAttribute("href", operation.href);
          }

          if (operation.text !== undefined) {
            cloneAnchor.textContent = operation.text;
          }

          if (operation.target !== undefined) {
            cloneAnchor.setAttribute("target", operation.target);
          }

          if (operation.rel !== undefined) {
            cloneAnchor.setAttribute("rel", operation.rel);
          }
        }

        const insertAfterAnchor = findFirstAnchorByHref(operation.insertAfterHref);
        const insertAfterContainer = findClosestContainer(insertAfterAnchor, operation.closest);

        if (insertAfterContainer && insertAfterContainer.parentElement === sourceContainer.parentElement) {
          insertAfterContainer.insertAdjacentElement("afterend", clone);
        } else {
          sourceContainer.parentElement.appendChild(clone);
        }
      }
    });
  }

  function applyConfig() {
    if (!activeConfig || applying) {
      return;
    }

    applying = true;

    try {
      setMetaContent(activeConfig);
      replaceTextNodes(activeConfig.textReplacements || {});
      replaceComplexTextElements(activeConfig.textReplacements || {});
      replaceLinks(activeConfig.linkReplacements || {});
      applySelectorOverrides(activeConfig.selectorOverrides || []);
      removeRetiredProjectEntries(resolveRetiredPatterns(activeConfig));
      applyProjectOperations(activeConfig.projectOperations || []);
    } finally {
      applying = false;
    }
  }

  function scheduleApply() {
    if (applyScheduled) {
      return;
    }

    applyScheduled = true;
    window.requestAnimationFrame(() => {
      applyScheduled = false;
      applyConfig();
    });
  }

  async function init() {
    activeConfig = await loadConfig();
    if (!activeConfig) {
      return;
    }

    applyConfig();
    window.setTimeout(applyConfig, 300);
    window.setTimeout(applyConfig, 1200);

    const observer = new MutationObserver(() => {
      scheduleApply();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
