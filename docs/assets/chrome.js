// PixisEditor Manual — shared page chrome behavior.
// Injects the sticky site header (visible at every width) + the mobile
// drawer backdrop, wires the hamburger/drawer toggle, and plays the
// animated brand-mark "paint burst" on any .brand-mark.v-paint element
// found on the page. Single source of truth linked by every
// docs/manual/*.html page. Pairs with assets/chrome.css.
window.ManualChrome = (function () {
  "use strict";

  function injectHeader(homeHref) {
    var html =
      '<div class="nav-backdrop" id="navBackdrop" hidden></div>' +
      '<header class="mobile-header">' +
        '<a class="brand" href="' + homeHref + '">' +
          '<span class="brand-mark v-paint" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>' +
          '<b>PixisEditor</b>' +
        '</a>' +
        '<div class="mobile-right">' +
          '<div class="mobile-cta">' +
            '<a class="btn btn-ghost" href="https://github.com/sponsors/anurbis-dev" target="_blank" rel="noopener" aria-label="Sponsor on GitHub"><span class="heart" aria-hidden="true">♥</span><span class="cta-text">Sponsor</span></a>' +
            '<a class="btn btn-primary" href="/app/">Try Pixis</a>' +
          '</div>' +
          '<button type="button" class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="docsSidebar" aria-label="Open menu">' +
            '<span class="nav-toggle-bars" aria-hidden="true"><span></span><span></span><span></span></span>' +
          '</button>' +
        '</div>' +
      '</header>';
    document.body.insertAdjacentHTML("afterbegin", html);
  }

  function wireDrawer() {
    var navToggle = document.getElementById("navToggle");
    var navPanel = document.getElementById("docsSidebar");
    var navBackdrop = document.getElementById("navBackdrop");
    if (!navToggle || !navPanel) return;
    function setNavOpen(open) {
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      navPanel.classList.toggle("open", open);
      document.body.classList.toggle("nav-open", open);
      if (navBackdrop) {
        navBackdrop.classList.toggle("open", open);
        if (open) navBackdrop.removeAttribute("hidden");
        else navBackdrop.setAttribute("hidden", "");
      }
    }
    function closeNav() { setNavOpen(false); }
    navToggle.addEventListener("click", function () {
      setNavOpen(navToggle.getAttribute("aria-expanded") !== "true");
    });
    if (navBackdrop) navBackdrop.addEventListener("click", closeNav);
    navPanel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
    window.addEventListener("resize", function () {
      if (window.matchMedia("(min-width:901px)").matches) closeNav();
    });
  }

  function initPaintMarks() {
    var marks = document.querySelectorAll(".brand-mark.v-paint");
    var MODES = ["in", "out-in", "blink"];
    function rand(a, b) { return a + Math.random() * (b - a); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }
    function clearCells(cells) {
      cells.forEach(function (c) {
        c.classList.remove("bm-on");
        c.style.removeProperty("--bm-name");
        c.style.removeProperty("--bm-dur");
        c.style.removeProperty("--bm-delay");
        c.style.animation = "none";
      });
    }
    marks.forEach(function (mark) {
      var burstTimer, idleTimer;
      function playBurst() {
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        var cells = Array.prototype.slice.call(mark.querySelectorAll("i"));
        if (!cells.length) return;
        clearTimeout(burstTimer);
        mark.classList.remove("is-playing");
        clearCells(cells);
        void mark.offsetWidth;
        var mode = pick(MODES);
        var order = shuffle(cells.map(function (_, i) { return i; }));
        var step = rand(32, 70);
        var baseDur = rand(440, 700);
        var animName = mode === "in" ? "bm-paint-in" : mode === "out-in" ? "bm-paint-out-in" : "bm-paint-blink";
        var maxEnd = 0;
        order.forEach(function (idx, rank) {
          var cell = cells[idx];
          var delay = rank * step + rand(0, 24);
          var dur = baseDur + rand(-40, 70);
          cell.style.removeProperty("animation");
          cell.style.setProperty("--bm-name", animName);
          cell.style.setProperty("--bm-dur", dur + "ms");
          cell.style.setProperty("--bm-delay", delay + "ms");
          cell.classList.add("bm-on");
          maxEnd = Math.max(maxEnd, delay + dur);
        });
        mark.classList.add("is-playing");
        burstTimer = setTimeout(function () {
          mark.classList.remove("is-playing");
          clearCells(cells);
        }, maxEnd + 40);
      }
      function scheduleNext() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(function () { playBurst(); scheduleNext(); }, rand(5000, 13000));
      }
      setTimeout(function () { playBurst(); scheduleNext(); }, rand(1200, 2800));
    });
  }

  function init(opts) {
    opts = opts || {};
    // Inject the header synchronously, before the rest of the body is
    // parsed/painted (this script tag sits right after <body>), so the
    // header never "pops in" late and shoves the page content down.
    injectHeader(opts.home ? "https://pixis.ink/" : "index.html");
    // wireDrawer/initPaintMarks need #docsSidebar (part of .layout, parsed
    // after this script tag) — defer them until the rest of the DOM exists.
    function ready() {
      wireDrawer();
      initPaintMarks();
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", ready);
    } else {
      ready();
    }
  }

  return { init: init };
})();
