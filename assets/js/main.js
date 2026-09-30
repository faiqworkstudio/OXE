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
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setNav(!document.body.classList.contains("nav-open"));
    });
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () { setNav(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) { setNav(false); toggle.focus(); }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024) setNav(false);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Portfolio filter + "View More" ---------- */
  var grid = document.querySelector("[data-projects]");
  if (grid) {
    var filterBtns = document.querySelectorAll(".filter-btn");
    var cards = grid.querySelectorAll(".pcard");
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
      var opt = form.querySelector('option[data-key="' + key.replace(/[^a-z]/g, "") + '"]');
      if (opt) opt.selected = true;
    }

    function fieldOf(input) { return input.closest(".field"); }
    function validate(input) {
      var ok = input.checkValidity();
      var f = fieldOf(input);
      if (f) f.classList.toggle("has-error", !ok);
      input.setAttribute("aria-invalid", String(!ok));
      return ok;
    }
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (el.type === "radio" || el.type === "hidden") return;
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
        if (el.type === "radio" || el.type === "hidden" || el.name === "bot-field") return;
        if (!validate(el) && !firstBad) firstBad = el;
      });
      if (firstBad) { firstBad.focus(); return; }

      var d = new FormData(form);
      var text = [
        "Name: " + d.get("name"),
        "Email: " + d.get("email"),
        d.get("phone") ? "Phone: " + d.get("phone") : "",
        d.get("company") ? "Company: " + d.get("company") : "",
        "Service: " + d.get("service"),
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
          window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("New enquiry: " + d.get("service")) + "&body=" + encodeURIComponent(text);
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
