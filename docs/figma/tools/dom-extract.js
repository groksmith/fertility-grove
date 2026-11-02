// Runs inside the page (Runtime.evaluate). Walks the rendered DOM and returns
// a build_nodes tree: frames for anything with a visible box (background,
// border, shadow, clipping, opacity) or a landmark, text with styled runs,
// images by their public path, and inline SVG icons. Positions are relative
// to the nearest emitted frame. Elements without a box are flattened.
(() => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const colorCache = new Map();
  /** Any CSS colour (oklab, color-mix...) to #rrggbb[aa], or null if clear. */
  function hex(c) {
    if (!c || c === "transparent" || c === "none") return null;
    if (colorCache.has(c)) return colorCache.get(c);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const h = (x) => x.toString(16).padStart(2, "0");
    const out = a === 0 ? null : `#${h(r)}${h(g)}${h(b)}${a < 255 ? h(a) : ""}`;
    colorCache.set(c, out);
    return out;
  }
  const px = (v) => parseFloat(v) || 0;
  const LANDMARK = new Set(["ASIDE", "HEADER", "MAIN", "NAV", "FOOTER", "SECTION", "ARTICLE", "FORM", "DIALOG"]);
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "LINK", "META", "BR"]);

  const srOnly = (cs, r) => (cs.position === "absolute" || cs.position === "fixed") && r.width <= 1 && r.height <= 1;
  const hidden = (cs) => cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0;

  function family(cs) {
    return /instrument[ _]serif/i.test(cs.fontFamily) ? "Instrument Serif" : "Instrument Sans";
  }
  function style(cs) {
    const w = +cs.fontWeight;
    const base = w >= 800 ? "ExtraBold" : w >= 700 ? "Bold" : w >= 600 ? "SemiBold" : w >= 500 ? "Medium" : "Regular";
    if (cs.fontStyle === "italic") return base === "Regular" ? "Italic" : `${base} Italic`;
    return base;
  }
  function lineHeight(cs) {
    return cs.lineHeight === "normal" ? Math.round(px(cs.fontSize) * 1.25 * 100) / 100 : px(cs.lineHeight);
  }
  function textFont(cs) {
    const size = px(cs.fontSize);
    const t = {
      font: family(cs),
      style: style(cs),
      size,
      lineHeight: lineHeight(cs),
      color: hex(cs.color) || "#090814",
    };
    const ls = px(cs.letterSpacing);
    if (ls) t.tracking = Math.round((ls / size) * 1000) / 10;
    if (cs.textDecorationLine.includes("underline")) t.decoration = "underline";
    return t;
  }

  function boxStyle(el, cs) {
    const s = {};
    const bg = hex(cs.backgroundColor);
    if (bg) s.fill = bg;
    const sides = ["Top", "Right", "Bottom", "Left"].map((k) => ({ k, w: px(cs[`border${k}Width`]), c: hex(cs[`border${k}Color`]), st: cs[`border${k}Style`] }));
    const live = sides.filter((b) => b.w > 0 && b.c && b.st !== "none");
    if (live.length === 4 && live.every((b) => b.w === live[0].w && b.c === live[0].c)) {
      s.stroke = live[0].c;
      s.strokeWeight = live[0].w;
    } else if (live.length) s.lines = live;
    const rad = ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].map((k) => px(cs[`border${k}Radius`]));
    if (rad.some(Boolean)) s.radius = rad.every((x) => x === rad[0]) ? rad[0] : rad;
    if (cs.boxShadow && cs.boxShadow !== "none") {
      // Each shadow: "color x y blur spread [inset]". Rings (no blur, no
      // offset) become strokes, hairlines (offset only) a line on that side,
      // the first soft one a drop shadow.
      const list = cs.boxShadow.split(/,(?![^(]*\))/);
      for (const one of list) {
        const m = one.trim().match(/^(.*?\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px(?:\s+(-?[\d.]+)px)?(\s+inset)?$/);
        if (!m) continue;
        const c = hex(m[1]);
        if (!c) continue;
        const [x, y, blur, spread] = [m[2], m[3], m[4], m[5] || 0].map(Number);
        if (blur === 0 && x === 0 && y === 0 && spread > 0) {
          if (!s.stroke) {
            s.stroke = c;
            s.strokeWeight = spread;
            if (!m[6]) s.strokeAlign = "OUTSIDE";
          }
        } else if (blur === 0 && spread === 0 && (x !== 0 || y !== 0)) {
          s.lines = (s.lines || []).concat([{ k: y > 0 ? "Bottom" : y < 0 ? "Top" : x > 0 ? "Right" : "Left", w: Math.abs(y || x), c }]);
        } else if (!m[6] && !s.shadow) {
          const a = c.length === 9 ? parseInt(c.slice(7), 16) / 255 : 1;
          s.shadow = { x, y, blur, spread, color: c.slice(0, 7), alpha: Math.round(a * 100) / 100 };
        }
      }
    }
    if (+cs.opacity < 1) s.opacity = +cs.opacity;
    if (cs.overflow !== "visible" || cs.overflowX !== "visible" || cs.overflowY !== "visible") s.clip = true;
    return s;
  }
  /** Does anything inside reach outside el's box (so its clipping shows)? */
  function spills(el, r) {
    if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) return true;
    const all = el.querySelectorAll("*");
    for (let i = 0; i < all.length && i < 400; i++) {
      const q = all[i].getBoundingClientRect();
      if (q.width && q.height && (q.left < r.left - 1 || q.top < r.top - 1 || q.right > r.right + 1 || q.bottom > r.bottom + 1)) return true;
    }
    return false;
  }
  const hasBox = (s) => s.fill || s.stroke || s.lines || s.shadow || s.opacity !== undefined;

  function imgPath(src) {
    try {
      const u = new URL(src, location.href);
      if (u.pathname === "/_next/image") return decodeURIComponent(u.searchParams.get("url") || "");
      return u.origin === location.origin ? u.pathname : null;
    } catch {
      return null;
    }
  }

  /** Is everything under el inline text (so it can be one text node)? */
  function inlineOnly(el) {
    for (const n of el.childNodes) {
      if (n.nodeType === 3) continue;
      if (n.nodeType !== 1) continue;
      if (n.tagName === "BR") continue;
      const cs = getComputedStyle(n);
      if (hidden(cs)) continue;
      if (cs.display !== "inline" && cs.display !== "contents") return false;
      if (["IMG", "SVG", "svg", "INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(n.tagName)) return false;
      if (hasBox(boxStyle(n, cs))) return false;
      if (!inlineOnly(n)) return false;
    }
    return true;
  }

  /** Text and styled runs for an inline-only element. */
  function collect(el, base) {
    let text = "";
    const runs = [];
    const walk = (node, inherited) => {
      for (const n of node.childNodes) {
        if (n.nodeType === 3) {
          const ws = getComputedStyle(node).whiteSpace;
          let t = n.nodeValue;
          if (!/pre/.test(ws)) t = t.replace(/\s+/g, " ");
          if (/^\s/.test(t) && (text === "" || /[\s\n]$/.test(text))) t = t.replace(/^\s+/, "");
          if (getComputedStyle(node).textTransform === "uppercase") t = t.toUpperCase();
          const start = text.length;
          text += t;
          if (inherited && t) runs.push({ start, end: text.length, ...inherited });
        } else if (n.nodeType === 1) {
          if (n.tagName === "BR") {
            text = text.replace(/ $/, "") + "\n";
            continue;
          }
          const cs = getComputedStyle(n);
          if (hidden(cs) || srOnly(cs, n.getBoundingClientRect())) continue;
          const f = textFont(cs);
          const diff = {};
          for (const k of ["font", "style", "size", "color", "decoration"]) if (f[k] !== base[k]) diff[k] = f[k];
          walk(n, Object.keys(diff).length ? { ...(inherited || {}), ...diff } : inherited);
        }
      }
    };
    walk(el, null);
    const lead = text.length - text.replace(/^\s+/, "").length;
    const trimmed = text.trim();
    return {
      text: trimmed,
      runs: runs
        .map((r) => ({ ...r, start: Math.max(0, r.start - lead), end: Math.min(trimmed.length, r.end - lead) }))
        .filter((r) => r.end > r.start),
    };
  }

  /** The text a line-clamped element shows: longest prefix + "…" that fits. */
  function clampedText(el, cs, text, lines) {
    const probe = el.cloneNode(false);
    probe.style.cssText = `position:absolute;visibility:hidden;left:-9999px;top:0;display:block;-webkit-line-clamp:none;overflow:visible;width:${el.getBoundingClientRect().width}px;font:${cs.font};letter-spacing:${cs.letterSpacing};padding:${cs.padding};white-space:${cs.whiteSpace}`;
    document.body.appendChild(probe);
    const max = lines * lineHeight(cs) + px(cs.paddingTop) + px(cs.paddingBottom) + 1;
    probe.textContent = text;
    let out = text;
    if (probe.getBoundingClientRect().height > max) {
      let lo = 0, hi = text.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        probe.textContent = text.slice(0, mid).trimEnd() + "…";
        if (probe.getBoundingClientRect().height <= max) lo = mid;
        else hi = mid - 1;
      }
      out = text.slice(0, lo).replace(/[\s,.;:]+$/, "") + "…";
    }
    probe.remove();
    return out;
  }

  function textNode(el, cs, origin, rangeTarget) {
    const base = textFont(cs);
    const { text, runs } = rangeTarget ? { text: rangeTarget.nodeValue.replace(/\s+/g, " ").trim(), runs: [] } : collect(el, base);
    if (!text) return null;
    const range = document.createRange();
    if (rangeTarget) range.selectNodeContents(rangeTarget);
    else range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((q) => q.width > 0 && q.height > 0);
    if (!rects.length) return null;
    const tops = [];
    for (const q of rects) if (!tops.some((t) => Math.abs(t - q.top) < q.height / 2)) tops.push(q.top);
    const bound = range.getBoundingClientRect();
    const L = base.lineHeight;
    const first = rects[0];
    const node = { type: "text", text: cs.textTransform === "uppercase" ? text.toUpperCase() : text, ...base };
    if (runs.length) node.runs = runs;
    const r = el.getBoundingClientRect();
    const contentLeft = r.left + px(cs.paddingLeft) + px(cs.borderLeftWidth);
    const contentW = r.width - px(cs.paddingLeft) - px(cs.paddingRight) - px(cs.borderLeftWidth) - px(cs.borderRightWidth);
    const clamp = cs.webkitLineClamp && cs.webkitLineClamp !== "none" ? +cs.webkitLineClamp : 0;
    const ellipsis = cs.textOverflow === "ellipsis" && /nowrap/.test(cs.whiteSpace) && el.scrollWidth > el.clientWidth + 1;
    node.y = Math.round((first.top + first.height / 2 - L / 2 - origin.y) * 10) / 10;
    if (tops.length > 1 || clamp || ellipsis) {
      node.x = Math.round((rangeTarget ? bound.left : contentLeft) - origin.x);
      node.width = Math.max(1, Math.round(rangeTarget ? bound.width : contentW) + 1);
      const ta = cs.textAlign;
      if (ta === "center" || ta === "right" || ta === "end") node.textAlign = ta === "center" ? "center" : "right";
      if (clamp) {
        node.text = clampedText(el, cs, node.text, clamp);
        if (node.runs) node.runs = node.runs.filter((q) => q.end <= node.text.length - 1);
      }
      if (ellipsis) node.maxLines = 1;
    } else {
      node.x = Math.round((bound.left - origin.x) * 10) / 10;
    }
    node.name = text.slice(0, 40);
    return node;
  }

  function svgNode(el, cs, r, origin) {
    const clone = el.cloneNode(true);
    const color = cs.color;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", r.width);
    clone.setAttribute("height", r.height);
    clone.removeAttribute("class");
    // Resolve currentColor and computed fill/stroke on each shape.
    const live = [el, ...el.querySelectorAll("*")];
    const copy = [clone, ...clone.querySelectorAll("*")];
    live.forEach((n, i) => {
      const c = getComputedStyle(n);
      const k = copy[i];
      k.removeAttribute("class");
      if (k.getAttribute("fill") === "currentColor" || (!k.getAttribute("fill") && c.fill && c.fill !== "none" && i > 0 && !/url/.test(c.fill))) {
        const f = hex(c.fill === "currentColor" ? color : c.fill);
        if (f && !k.getAttribute("fill")?.startsWith("url")) k.setAttribute("fill", f.slice(0, 7));
      }
      if (k.getAttribute("stroke") === "currentColor") k.setAttribute("stroke", (hex(color) || "#090814").slice(0, 7));
      if (k.getAttribute("fill") === "currentColor") k.setAttribute("fill", (hex(color) || "#090814").slice(0, 7));
    });
    let svg = clone.outerHTML.replace(/currentColor/g, (hex(color) || "#090814").slice(0, 7));
    return { type: "svg", svg, width: Math.max(1, Math.round(r.width)), height: Math.max(1, Math.round(r.height)), x: Math.round(r.left - origin.x), y: Math.round(r.top - origin.y), name: el.getAttribute("aria-label") || "icon" };
  }

  function nameOf(el) {
    const label = el.getAttribute("aria-label") || el.getAttribute("title");
    const tag = el.tagName.toLowerCase();
    if (label) return `${tag} · ${label}`.slice(0, 60);
    if (el.id) return `${tag}#${el.id}`;
    const h = el.querySelector?.("h1,h2,h3");
    if (LANDMARK.has(el.tagName) && h) return `${tag} · ${h.textContent.trim().slice(0, 40)}`;
    return tag;
  }

  function walk(el, list, origin, depth) {
    if (SKIP.has(el.tagName)) return;
    const cs = getComputedStyle(el);
    if (hidden(cs) && cs.display !== "contents") return;
    if (cs.display === "contents") {
      for (const c of el.children) walk(c, list, origin, depth);
      return;
    }
    const r = el.getBoundingClientRect();
    if (srOnly(cs, r)) return;
    if (cs.clip === "rect(0px, 0px, 0px, 0px)" || cs.clipPath === "inset(50%)") return;
    // Off the page to the left/right (closed drawers).
    if (r.right < 0 || r.left > innerWidth) return;

    const tag = el.tagName.toUpperCase();
    if (tag === "IMG") {
      const path = imgPath(el.currentSrc || el.src);
      if (!path || r.width < 1) return;
      const s = boxStyle(el, cs);
      list.push({
        type: "rect", image: path, width: Math.round(r.width), height: Math.round(r.height), x: Math.round(r.left - origin.x), y: Math.round(r.top - origin.y),
        scaleMode: cs.objectFit === "contain" || cs.objectFit === "scale-down" ? "FIT" : "FILL", radius: s.radius, opacity: s.opacity,
        flip: /matrix\(-1/.test(cs.transform) || undefined, mask: cs.maskImage && cs.maskImage !== "none" ? cs.maskImage : undefined,
        name: el.alt || path.split("/").pop(),
      });
      return;
    }
    if (tag === "SVG") {
      if (r.width < 1) return;
      list.push(svgNode(el, cs, r, origin));
      return;
    }
    if (tag === "VIDEO") {
      const poster = el.getAttribute("poster");
      if (poster) list.push({ type: "rect", image: poster, width: Math.round(r.width), height: Math.round(r.height), x: Math.round(r.left - origin.x), y: Math.round(r.top - origin.y), scaleMode: "FILL", name: "video" });
      return;
    }

    const s = boxStyle(el, cs);
    const isField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    if (isField && (el.type === "checkbox" || el.type === "radio" || el.type === "hidden")) return;
    const frame = hasBox(s) || (s.clip && (s.radius || spills(el, r))) || LANDMARK.has(tag) || isField || el.getAttribute("role") === "dialog";
    let kids = list;
    let o = origin;
    if (frame && r.width >= 1 && r.height >= 1) {
      const f = { type: "frame", name: nameOf(el), x: Math.round((r.left - origin.x) * 10) / 10, y: Math.round((r.top - origin.y) * 10) / 10, width: Math.max(1, Math.round(r.width * 10) / 10), height: Math.max(1, Math.round(r.height * 10) / 10), children: [] };
      for (const k of ["fill", "stroke", "strokeWeight", "strokeAlign", "radius", "shadow", "opacity"]) if (s[k] !== undefined) f[k] = s[k];
      if (s.clip) f.clip = true;
      for (const b of s.lines || []) {
        const line = { type: "rect", name: `border ${b.k.toLowerCase()}`, fill: b.c };
        if (b.k === "Top") Object.assign(line, { x: 0, y: 0, width: f.width, height: b.w });
        if (b.k === "Bottom") Object.assign(line, { x: 0, y: f.height - (s.lines.includes(b) && b.w ? b.w : 1), width: f.width, height: b.w });
        if (b.k === "Left") Object.assign(line, { x: 0, y: 0, width: b.w, height: f.height });
        if (b.k === "Right") Object.assign(line, { x: f.width - b.w, y: 0, width: b.w, height: f.height });
        f.children.push(line);
      }
      list.push(f);
      kids = f.children;
      o = { x: r.left, y: r.top };
      if (isField) {
        const value = tag === "SELECT" ? el.selectedOptions[0]?.text || "" : el.value;
        const ph = el.getAttribute("placeholder") || (el.type === "date" ? "mm/dd/yyyy" : "");
        const shown = value || ph;
        if (shown) {
          const base = textFont(value ? cs : getComputedStyle(el, "::placeholder"));
          if (!value) base.color = hex(getComputedStyle(el, "::placeholder").color) || "#666666";
          const padL = px(cs.paddingLeft) + px(cs.borderLeftWidth);
          const padT = px(cs.paddingTop) + px(cs.borderTopWidth);
          const t = { type: "text", text: shown, ...base, name: value ? "value" : "placeholder", x: padL };
          if (tag === "TEXTAREA") Object.assign(t, { y: padT, width: Math.round(r.width - padL - px(cs.paddingRight) - 4) });
          else t.y = Math.round((r.height - base.lineHeight) / 2);
          kids.push(t);
        }
        if (tag === "SELECT" && cs.appearance !== "none") kids.push({ type: "svg", name: "chevron", width: 16, height: 16, x: Math.round(r.width - 30), y: Math.round(r.height / 2 - 8), svg: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' });
        return;
      }
    }

    // Text: the whole element as one text node when its content is inline.
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim());
    if (hasText && inlineOnly(el)) {
      const t = textNode(el, cs, o);
      if (t) kids.push(t);
      return;
    }
    for (const n of el.childNodes) {
      if (n.nodeType === 3) {
        if (n.nodeValue.trim()) {
          const t = textNode(el, cs, o, n);
          if (t) kids.push(t);
        }
      } else if (n.nodeType === 1) {
        // An inline element holding only text, inside a flex/block mix.
        const ncs = getComputedStyle(n);
        if (ncs.display === "inline" && !["IMG", "SVG", "svg"].includes(n.tagName) && inlineOnly(n) && !hasBox(boxStyle(n, ncs)) && n.textContent.trim()) {
          if (hidden(ncs) || srOnly(ncs, n.getBoundingClientRect())) continue;
          const t = textNode(n, ncs, o);
          if (t) kids.push(t);
        } else walk(n, kids, o, depth + 1);
      }
    }
  }

  const root = [];
  walk(document.body, root, { x: 0, y: 0 }, 0);
  return {
    width: innerWidth,
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
    fill: hex(getComputedStyle(document.body).backgroundColor) || "#ffffff",
    children: root,
  };
})();
