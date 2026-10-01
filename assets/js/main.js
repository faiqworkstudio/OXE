/* OXE Marketing — site interactions (no dependencies) */
(function () {
  "use strict";

  var CONTACT_EMAIL = "Sales@oxemarketingth.com";
  var WHATSAPP_NUMBER = "66824480050";

  /* ---------- Header: compact on scroll + mobile menu ---------- */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");

  // The header is position:fixed, so compacting it never shifts the page.
  // Separate on/off thresholds (hysteresis) stop it flickering at one point.
  var compact = false;
  function onScroll() {
    if (!header) return;
    var y = window.scrollY;
    if (!compact && y > 40) compact = true;
    else if (compact && y < 8) compact = false;
    header.classList.toggle("is-scrolled", compact);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    if (!open) closeAll();
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setNav(!document.body.classList.contains("nav-open"));
    });
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () { setNav(false); });
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024) setNav(false);
    });
  }

  /* ---------- Menu panels ----------
     Desktop (mouse): hover intent. A panel opens only after the pointer has
     actually moved over a menu item and rested ~180ms; it never opens while
     the page is scrolling, and it closes on scroll, Escape or outside click.
     Keyboard / touch: the chevron button toggles the panel.
     Phones & tablets: the same button expands the item as an accordion. */
  var items = document.querySelectorAll("[data-menu]");
  var desktop = window.matchMedia("(min-width: 1024px)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var openTimer = null, closeTimer = null, lastScroll = 0;

  function setItem(item, open) {
    item.classList.toggle("is-open", open);
    var b = item.querySelector(".nav__more");
    if (b) b.setAttribute("aria-expanded", String(open));
  }
  function closeAll(except) {
    items.forEach(function (it) { if (it !== except) setItem(it, false); });
  }
  function clearTimers() { clearTimeout(openTimer); clearTimeout(closeTimer); }

  items.forEach(function (item) {
    var more = item.querySelector(".nav__more");
    if (more) more.addEventListener("click", function (e) {
      e.preventDefault(); clearTimers();
      var open = !item.classList.contains("is-open");
      closeAll(item); setItem(item, open);
    });
    // hover intent: requires real mouse movement over the link row
    item.querySelector(".nav__row").addEventListener("mousemove", function () {
      if (!desktop.matches || !finePointer.matches) return;
      if (Date.now() - lastScroll < 400) return;
      clearTimeout(closeTimer);
      if (item.classList.contains("is-open")) return;
      clearTimeout(openTimer);
      openTimer = setTimeout(function () { closeAll(item); setItem(item, true); }, 180);
    });
    item.addEventListener("mouseleave", function () {
      if (!desktop.matches) return;
      clearTimeout(openTimer);
      closeTimer = setTimeout(function () { setItem(item, false); }, 260);
    });
    item.addEventListener("mouseenter", function () { if (item.classList.contains("is-open")) clearTimeout(closeTimer); });
    // keyboard: leaving the item with Tab closes it
    item.addEventListener("focusout", function (e) {
      if (desktop.matches && !item.contains(e.relatedTarget)) setItem(item, false);
    });
  });
  window.addEventListener("scroll", function () {
    lastScroll = Date.now();
    if (desktop.matches) { clearTimers(); closeAll(); }
  }, { passive: true });
  document.addEventListener("click", function (e) {
    if (desktop.matches && !e.target.closest("[data-menu]")) closeAll();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var open = document.querySelector("[data-menu].is-open");
    if (open && desktop.matches) { setItem(open, false); open.querySelector(".nav__more").focus(); return; }
    if (document.body.classList.contains("nav-open")) { setNav(false); if (toggle) toggle.focus(); }
  });
  // coming back via the browser's back button: start with everything closed
  window.addEventListener("pageshow", function () { clearTimers(); closeAll(); });

  /* ---------- Reveal on scroll ---------- */
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Browsers without cross-document view transitions get a soft fade-in instead
  if (!("onpagereveal" in window)) document.documentElement.classList.add("no-vt");
  // Photos and videos unveil (clip + zoom-out) as they scroll into view
  if (!reduced) {
    document.querySelectorAll(".icard, .why-panel__photo, .pcard__media, .pc__media, .spot__media, .svc-block__visual .slides, .vwall__item, .ind-tile, .mosaic img, .case-media, .viewer__stage").forEach(function (el) {
      if (!el.closest(".reveal-clip")) { el.classList.add("reveal", "reveal-clip"); }
    });
  }
  var reveals = document.querySelectorAll(".reveal");
  // Siblings that appear together are staggered (unless a delay is already set)
  reveals.forEach(function (el) {
    if (el.style.getPropertyValue("--d")) return;
    var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains("reveal"); });
    var i = sibs.indexOf(el);
    if (sibs.length > 1 && i > 0) el.style.setProperty("--d", Math.min(i, 5) * 80 + "ms");
  });
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }
  // Show everything when printing / saving as PDF
  window.addEventListener("beforeprint", function () {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  });

  /* ---------- Scroll progress + gentle parallax (one rAF per frame) ---------- */
  var bar = document.querySelector(".scroll-progress");
  var par = reduced ? [] : Array.prototype.slice.call(document.querySelectorAll(".phero__pic, .badge, .hero__proof .hero__logos"));
  var stackCards = Array.prototype.slice.call(document.querySelectorAll(".scard2"));
  // Services page: per-block progress (--p), current block, floating dock
  var svcSection = document.querySelector("[data-svc-section]");
  var svcBlocks = Array.prototype.slice.call(document.querySelectorAll("[data-svc]"));
  var dock = document.querySelector(".svc-dock");
  function svcFrame() {
    if (!svcSection) return;
    var vh = innerHeight, best = null, bestD = 1e9;
    svcBlocks.forEach(function (b) {
      var r = b.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (vh - r.top) / (vh * .75)));
      b.style.setProperty("--p", p.toFixed(3));
      if (p > .35) b.classList.add("is-in");
      var d = Math.abs(r.top + r.height / 2 - vh / 2);
      if (d < bestD) { bestD = d; best = b; }
    });
    var sr = svcSection.getBoundingClientRect();
    var inView = sr.top < vh * .5 && sr.bottom > vh * .6;
    svcSection.classList.toggle("is-tracking", inView);
    svcBlocks.forEach(function (b) { b.classList.toggle("is-current", b === best); });
    if (dock) {
      dock.classList.toggle("is-visible", inView);
      dock.style.setProperty("--sp", Math.min(1, Math.max(0, -sr.top / (sr.height - vh))).toFixed(3));
      dock.querySelectorAll("a").forEach(function (a) { a.classList.toggle("is-active", !!best && a.getAttribute("data-dock") === best.id); });
    }
  }
  var ticking = false;
  function frame() {
    ticking = false;
    svcFrame();
    // stacking service cards: hide a card's floating icon once the next card slides over it
    stackCards.forEach(function (c, k) {
      var next = stackCards[k + 1];
      c.classList.toggle("is-covered", !!next && next.getBoundingClientRect().top - c.getBoundingClientRect().top < 160);
    });
    var max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.setProperty("--p", max > 0 ? Math.min(1, scrollY / max) : 0);
    par.forEach(function (el, k) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var shift = (r.top + r.height / 2 - innerHeight / 2) * (k % 2 ? -0.05 : 0.06);
      el.style.translate = "0 " + shift.toFixed(1) + "px";
    });
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();

  /* ---------- Back to top ---------- */
  var toTop = document.querySelector(".to-top");
  if (toTop) {
    var toggleTop = function () { toTop.classList.toggle("is-visible", window.scrollY > 600); };
    window.addEventListener("scroll", toggleTop, { passive: true });
    toggleTop();
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      var skip = document.querySelector(".skip-link");
      if (skip) skip.focus({ preventScroll: true });
    });
  }

  /* ---------- Service slideshows (crossfade, pause on hover/focus or when off-screen) ---------- */
  document.querySelectorAll("[data-slideshow]").forEach(function (show) {
    var slides = show.querySelectorAll(".slide");
    var dots = show.querySelectorAll(".slide-dots button");
    var i = 0, timer = null, hovered = false, inView = false;
    if (slides.length < 2) return;
    function go(n) {
      slides[i].classList.remove("is-active"); slides[i].setAttribute("aria-hidden", "true");
      dots[i].removeAttribute("aria-current");
      i = (n + slides.length) % slides.length;
      slides[i].classList.add("is-active"); slides[i].removeAttribute("aria-hidden");
      dots[i].setAttribute("aria-current", "true");
    }
    function sync() {
      clearInterval(timer); timer = null;
      if (!reduced && inView && !hovered) timer = setInterval(function () { go(i + 1); }, 4000);
    }
    dots.forEach(function (d, n) { d.addEventListener("click", function () { go(n); sync(); }); });
    show.addEventListener("mouseenter", function () { hovered = true; sync(); });
    show.addEventListener("mouseleave", function () { hovered = false; sync(); });
    show.addEventListener("focusin", function () { hovered = true; sync(); });
    show.addEventListener("focusout", function () { hovered = false; sync(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; sync(); }, { threshold: 0.3 }).observe(show);
    } else { inView = true; sync(); }
  });

  /* ---------- Autoplay videos: play muted while on screen, pause when not ---------- */
  var autoVids = document.querySelectorAll("video[autoplay]");
  if (reduced) {
    autoVids.forEach(function (v) { v.removeAttribute("autoplay"); v.pause(); v.controls = true; });
  } else if ("IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.2 });
    autoVids.forEach(function (v) { vio.observe(v); });
  }

  /* ---------- Case-study media viewer ---------- */
  document.querySelectorAll("[data-viewer]").forEach(function (viewer) {
    var items = viewer.querySelectorAll(".viewer__item");
    var thumbs = viewer.querySelectorAll(".viewer__thumbs button");
    var i = 0;
    if (items.length < 2) return;
    function show(n) {
      var old = items[i];
      var v = old.querySelector("video"); if (v) v.pause();
      old.classList.remove("is-active"); old.setAttribute("aria-hidden", "true");
      thumbs[i].removeAttribute("aria-current");
      i = (n + items.length) % items.length;
      items[i].classList.add("is-active"); items[i].removeAttribute("aria-hidden");
      thumbs[i].setAttribute("aria-current", "true");
      thumbs[i].scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
      var nv = items[i].querySelector("video");
      if (nv && !reduced) { nv.muted = true; var pr = nv.play(); if (pr && pr.catch) pr.catch(function () {}); }
    }
    thumbs.forEach(function (t, n) { t.addEventListener("click", function () { show(n); }); });
    viewer.querySelector(".viewer__nav--prev").addEventListener("click", function () { show(i - 1); });
    viewer.querySelector(".viewer__nav--next").addEventListener("click", function () { show(i + 1); });
    viewer.addEventListener("keydown", function (e) {
      if (e.target.tagName === "VIDEO") return;
      if (e.key === "ArrowRight") { show(i + 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { show(i - 1); e.preventDefault(); }
    });
  });

  /* ---------- Contact page: live Bangkok clock ---------- */
  var clock = document.querySelector("[data-bkk-clock]");
  if (clock) {
    var tick = function () {
      try { clock.textContent = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }); } catch (e) { /* old browser: keep placeholder */ }
    };
    tick(); setInterval(tick, 30000);
  }

  /* ---------- Home "Our Works": rows drive the media frame ---------- */
  document.querySelectorAll("[data-wlist]").forEach(function (list) {
    var rows = list.querySelectorAll(".wrow");
    var frames = list.querySelectorAll(".wstage");
    var fine = window.matchMedia("(hover: hover)");
    function activate(i) {
      rows.forEach(function (r) { r.classList.toggle("is-active", r.getAttribute("data-i") === String(i)); });
      frames.forEach(function (f) {
        var on = f.getAttribute("data-i") === String(i);
        f.classList.toggle("is-active", on);
        var v = f.querySelector("video");
        if (v) { if (on && !reduced) { v.muted = true; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); }
      });
    }
    rows.forEach(function (r) {
      var i = r.getAttribute("data-i");
      r.addEventListener("mouseenter", function () { if (fine.matches) activate(i); });
      r.addEventListener("focus", function () { activate(i); });
      // touch: first tap previews, second tap opens the portfolio
      r.addEventListener("click", function (e) {
        if (!fine.matches && !r.classList.contains("is-active")) { e.preventDefault(); activate(i); }
      });
    });
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Portfolio filter + "View More" ---------- */
  var grid = document.querySelector("[data-projects]");
  if (grid) {
    var filterBtns = document.querySelectorAll(".filter-btn");
    var cards = grid.querySelectorAll(".pc, .pcard");
    var SPANS = [7, 5, 4, 4, 4, 5, 7];
    var pill = document.querySelector(".filters__pill");
    var movePill = function () {
      var active = document.querySelector(".filter-btn.is-active");
      if (!pill || !active) return;
      pill.parentElement.classList.add("has-pill");
      pill.style.width = active.offsetWidth + "px";
      pill.style.transform = "translateX(" + active.offsetLeft + "px)";
    };
    window.addEventListener("resize", movePill);
    var moreBtn = document.querySelector("[data-more]");
    var empty = document.querySelector(".filter-empty");
    var current = "all";
    var expanded = false;

    var applyFilter = function () {
      var shown = 0;
      cards.forEach(function (c) {
        var match = current === "all" || c.getAttribute("data-category").split(" ").indexOf(current) > -1;
        // Extra projects stay tucked away on "All" until "View More" is pressed
        var tucked = current === "all" && !expanded && c.hasAttribute("data-extra");
        c.hidden = !match || tucked;
        if (!c.hidden) { shown++; c.classList.add("is-visible"); }
      });
      // keep the bento rhythm for whatever is visible; the last card of an unfinished row fills it
      var vis = Array.prototype.filter.call(cards, function (c) { return !c.hidden; });
      var row = 0, last = null;
      vis.forEach(function (c, i) {
        var sp = SPANS[i % SPANS.length];
        if (row + sp > 12) row = 0;
        c.style.setProperty("--span", sp); row += sp; last = c;
        if (row === 12) row = 0;
      });
      if (row && last) last.style.setProperty("--span", Number(last.style.getPropertyValue("--span")) + 12 - row);
      movePill();
      if (moreBtn) moreBtn.parentElement.hidden = expanded || current !== "all";
      if (empty) empty.hidden = shown > 0;
    };
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) {
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");
        current = btn.getAttribute("data-filter");
        applyFilter();
        var gtop = grid.getBoundingClientRect().top;
        if (gtop < 0 || gtop > innerHeight * .6) {
          var bar = document.querySelector(".pbar");
          window.scrollTo({ top: gtop + scrollY - (bar ? bar.offsetHeight : 0) - 110, behavior: reduced ? "auto" : "smooth" });
        }
      });
    });
    if (moreBtn) {
      moreBtn.addEventListener("click", function () { expanded = true; applyFilter(); });
    }
    // portfolio.html?filter=web|social|video|photo (links from the home "Our Works" cards)
    var initial = new URLSearchParams(location.search).get("filter");
    var initialBtn = initial && document.querySelector('.filter-btn[data-filter="' + initial.replace(/[^a-z]/g, "") + '"]');
    if (initialBtn) initialBtn.click(); else applyFilter();
  }

  /* ---------- Contact form ----------
     Pre-selects the service from ?service=web|social|video|photo|strategy,
     validates, then submits to Netlify Forms via AJAX.
     On WordPress this is replaced by the Elementor Pro Form widget. */
  document.querySelectorAll("[data-contact-form]").forEach(function (form) {
    var success = form.querySelector(".form-success");
    var key = new URLSearchParams(location.search).get("service");
    if (key) {
      var opt = form.querySelector('input[data-key="' + key.replace(/[^a-z]/g, "") + '"]');
      if (opt) opt.checked = true;
    }
    // "What can we help with?" needs at least one chip
    var chipSet = form.querySelector("[data-chips-required]");
    function validateChips() {
      if (!chipSet) return true;
      var ok = !!chipSet.querySelector("input:checked");
      chipSet.classList.toggle("has-error", !ok);
      return ok;
    }
    if (chipSet) chipSet.addEventListener("change", function () { if (chipSet.classList.contains("has-error")) validateChips(); });

    function fieldOf(input) { return input.closest(".field"); }
    function validate(input) {
      var ok = input.checkValidity();
      var f = fieldOf(input);
      if (f) f.classList.toggle("has-error", !ok);
      input.setAttribute("aria-invalid", String(!ok));
      return ok;
    }
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (el.type === "radio" || el.type === "checkbox" || el.type === "hidden") return;
      el.addEventListener("blur", function () { if (el.required || el.value) validate(el); });
      el.addEventListener("input", function () {
        var f = fieldOf(el);
        if (f && f.classList.contains("has-error")) validate(el);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      form.querySelectorAll("input, select, textarea").forEach(function (el) {
        if (el.type === "radio" || el.type === "checkbox" || el.type === "hidden" || el.name === "bot-field") return;
        if (!validate(el) && !firstBad) firstBad = el;
      });
      if (!validateChips()) firstBad = chipSet.querySelector("input");
      if (firstBad) { firstBad.focus(); return; }

      var d = new FormData(form);
      var text = [
        "Name: " + d.get("name"),
        "Email: " + d.get("email"),
        d.get("phone") ? "Phone: " + d.get("phone") : "",
        d.get("company") ? "Company: " + d.get("company") : "",
        "Service: " + d.getAll("service").join(", "),
        d.get("budget") ? "Budget: " + d.get("budget") : "",
        "Preferred contact: " + (d.get("method") || "Email"),
        "",
        d.get("details")
      ].filter(function (l, i) { return l !== "" || i === 7; }).join("\n");

      function done() {
        if (success) success.classList.add("is-visible");
        form.reset();
      }
      // Outside Netlify (e.g. opened locally) fall back to email or WhatsApp
      function fallback() {
        if (d.get("method") === "WhatsApp") {
          window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent("Hi OXE Marketing!\n\n" + text), "_blank", "noopener");
        } else {
          window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("New enquiry: " + d.getAll("service").join(", ")) + "&body=" + encodeURIComponent(text);
        }
        done();
      }

      var btn = form.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(d).toString()
      }).then(function (res) { if (res.ok) done(); else fallback(); })
        .catch(fallback)
        .then(function () { if (btn) btn.disabled = false; });
    });
  });
})();
