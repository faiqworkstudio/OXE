/* OXE Marketing — site interactions (no dependencies) */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  var CONTACT_EMAIL = "Sales@oxemarketingth.com";
  var WHATSAPP_NUMBER = "66824480050"; // 082-448-0050 in international format

  /* ---------- Header: shadow on scroll + mobile menu ---------- */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");

  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
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
    window.addEventListener("resize", function () {
      if (window.innerWidth > 920) setNav(false);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Portfolio filter + "View more" ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var projects = document.querySelectorAll(".project");
  var moreBtn = document.querySelector("[data-more]");
  var current = "all";
  var expanded = false;

  function applyFilter() {
    projects.forEach(function (p) {
      var cats = p.getAttribute("data-category").split(" ");
      var match = current === "all" || cats.indexOf(current) > -1;
      // Extra projects stay tucked away on "All" until "View More" is pressed
      var extraHidden = current === "all" && !expanded && p.hasAttribute("data-extra");
      p.hidden = !match || extraHidden;
    });
    if (moreBtn) moreBtn.parentElement.hidden = expanded || current !== "all";
  }
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
    moreBtn.addEventListener("click", function () {
      expanded = true;
      applyFilter();
    });
  }
  if (projects.length) applyFilter();

  /* ---------- Project modal ---------- */
  var modal = document.getElementById("project-modal");
  var lastFocus = null;
  function openModal(project) {
    var tpl = project.querySelector("template");
    if (!modal || !tpl) return;
    var body = modal.querySelector("[data-modal-body]");
    body.innerHTML = "";
    body.appendChild(tpl.content.cloneNode(true));
    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    document.body.classList.add("modal-open");
    modal.querySelector(".modal__close").focus();
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    modal.querySelector("[data-modal-body]").innerHTML = ""; // stops any playing video
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll("[data-open-project]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      openModal(btn.closest(".project"));
    });
  });
  if (modal) {
    modal.querySelectorAll("[data-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
  }

  /* ---------- Contact form ----------
     Front-end validation, then an AJAX submit to Netlify Forms
     (submissions appear in the Netlify dashboard and can be emailed).
     On WordPress this is replaced by the Elementor Pro Form widget. */
  document.querySelectorAll("[data-contact-form]").forEach(function (form) {
    var success = form.querySelector(".form-success");

    function fieldOf(input) { return input.closest(".field"); }
    function validate(input) {
      var ok = input.checkValidity();
      var f = fieldOf(input);
      if (f) f.classList.toggle("has-error", !ok);
      return ok;
    }
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
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
        if (el.type === "radio") return;
        if (!validate(el) && !firstBad) firstBad = el;
      });
      if (firstBad) { firstBad.focus(); return; }

      var d = new FormData(form);
      var lines = [
        "Name: " + d.get("name"),
        "Email: " + d.get("email"),
        d.get("phone") ? "Phone: " + d.get("phone") : "",
        d.get("company") ? "Company: " + d.get("company") : "",
        "Service: " + d.get("service"),
        d.get("budget") ? "Budget: " + d.get("budget") : "",
        "Preferred contact: " + (d.get("method") || "Email"),
        "",
        d.get("details")
      ].filter(function (l, i) { return l !== "" || i === 7; });
      var text = lines.join("\n");

      function done() {
        if (success) success.classList.add("is-visible");
        form.reset();
      }
      // If the site isn't on Netlify (e.g. opened locally), fall back to the
      // visitor's email app or WhatsApp so the enquiry is never lost.
      function fallback() {
        if (d.get("method") === "WhatsApp") {
          window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent("Hi OXE Marketing!\n\n" + text), "_blank", "noopener");
        } else {
          window.location.href = "mailto:" + CONTACT_EMAIL +
            "?subject=" + encodeURIComponent("New enquiry — " + d.get("service")) +
            "&body=" + encodeURIComponent(text);
        }
        done();
      }

      var btn = form.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(d).toString()
      }).then(function (res) {
        if (res.ok) done(); else fallback();
      }).catch(fallback).then(function () {
        if (btn) btn.disabled = false;
      });
    });
  });
})();
