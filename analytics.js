/**
 * Loads Umami + optional Clarity from window.PIXIS_ANALYTICS (analytics-config.js).
 * Auto-tracks clicks on [data-pixis-event="event_name"].
 * Manual: window.pixisTrack("event_name", { key: "value" })
 *
 * Note: do not use data-track — landing carousels already use that attribute.
 */
(function () {
  var cfg = window.PIXIS_ANALYTICS || {};
  var umamiId = String(cfg.umamiWebsiteId || "").trim();
  var clarityId = String(cfg.clarityId || "").trim();

  function track(name, data) {
    if (!name) return;
    try {
      if (window.umami && typeof window.umami.track === "function") {
        if (data && typeof data === "object") window.umami.track(name, data);
        else window.umami.track(name);
      }
    } catch (_) {}
  }

  window.pixisTrack = track;

  if (umamiId) {
    var s = document.createElement("script");
    s.defer = true;
    s.src = cfg.umamiSrc || "https://cloud.umami.is/script.js";
    s.setAttribute("data-website-id", umamiId);
    if (cfg.umamiDomains) s.setAttribute("data-domains", cfg.umamiDomains);
    document.head.appendChild(s);
  }

  if (clarityId) {
    (function (c, l, a, r, i, t, y) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", clarityId);
  }

  document.addEventListener(
    "click",
    function (e) {
      var el = e.target && e.target.closest && e.target.closest("[data-pixis-event]");
      if (!el) return;
      var name = el.getAttribute("data-pixis-event");
      if (!name) return;
      var payload = {};
      var loc = el.getAttribute("data-pixis-location");
      if (loc) payload.location = loc;
      var href = el.getAttribute("href");
      if (href) payload.href = href;
      track(name, payload);
    },
    true,
  );
})();
