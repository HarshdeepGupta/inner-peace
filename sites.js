/* Shared site helpers used by the calm page, the background worker, and unit
   tests. Turns free-form input into a bare host and validates it. */
(function (root) {
  function normalizeSite(input) {
    if (!input) return "";
    var s = String(input).trim().toLowerCase();
    s = s.replace(/^[a-z]+:\/\//, "");   // scheme
    s = s.replace(/\/.*$/, "");          // path
    s = s.replace(/:\d+$/, "");          // port
    s = s.replace(/^www\./, "");         // leading www
    return s;
  }

  function isValidSite(s) {
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s);
  }

  var api = { normalizeSite: normalizeSite, isValidSite: isValidSite };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.SiteUtils = api;
})(typeof self !== "undefined" ? self : (typeof window !== "undefined" ? window : null));
