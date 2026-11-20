/* Instagram feed logic for the Impact column.
   Classic script: sets window.NoyaFeed in the browser, module.exports under Node (for the tests).
   Expects the shape of Behold's JSON feed: https://behold.so/docs/json-feeds */
(function (root, factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NoyaFeed = api;
})(typeof window !== "undefined" ? window : this, function () {
  var DEFAULT_ALT = "Impact post";
  var MAX_ALT = 120;
  var SIZE_ORDER = ["medium", "large", "small", "full"];
  var TILE_GRADIENT = "linear-gradient(150deg,#1B4F9C,#5FA3E3 60%,#BFE0F7)";

  function isHttps(url) { return typeof url === "string" && /^https:\/\//i.test(url); }

  function pickImage(post) {
    var sizes = post.sizes;
    if (sizes && typeof sizes === "object") {
      for (var i = 0; i < SIZE_ORDER.length; i++) {
        var s = sizes[SIZE_ORDER[i]];
        if (s && isHttps(s.mediaUrl)) return s.mediaUrl;
      }
    }
    if (isHttps(post.thumbnailUrl)) return post.thumbnailUrl;
    /* For a video, mediaUrl is the video file, so it is never used as an image. */
    if (post.mediaType !== "VIDEO" && isHttps(post.mediaUrl)) return post.mediaUrl;
    return "";
  }

  function pickAlt(post) {
    var text = [post.altText, post.prunedCaption].filter(function (t) { return typeof t === "string" && t.trim(); })[0];
    return (text || DEFAULT_ALT).trim().slice(0, MAX_ALT);
  }

  /* Feed JSON -> at most `limit` tiles, in feed order. Unusable posts are skipped. */
  function normalizePosts(json, limit) {
    var posts = json && typeof json === "object" && Array.isArray(json.posts) ? json.posts : [];
    var out = [];
    for (var i = 0; i < posts.length && out.length < limit; i++) {
      var p = posts[i];
      if (!p || typeof p !== "object" || !isHttps(p.permalink)) continue;
      var image = pickImage(p);
      if (!image) continue;
      out.push({ href: p.permalink, image: image, alt: pickAlt(p) });
    }
    return out;
  }

  /* Never rejects. Resolves { source: "live" | "fallback", posts }. */
  function loadFeed(opts) {
    var fallback = { source: "fallback", posts: opts.fallback || [] };
    if (!opts.url) return Promise.resolve(fallback);
    var doFetch = opts.fetchFn || (typeof fetch === "function" ? fetch : null);
    if (!doFetch) return Promise.resolve(fallback);
    return Promise.resolve()
      .then(function () { return doFetch(opts.url); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error("feed request failed");
        return res.json();
      })
      .then(function (json) {
        var posts = normalizePosts(json, opts.limit);
        return posts.length ? { source: "live", posts: posts } : fallback;
      })
      .catch(function () { return fallback; });
  }

  /* Browser only: replaces the column's children with one tile per post. */
  function renderTiles(container, posts) {
    container.textContent = "";
    posts.forEach(function (p) {
      var a = document.createElement("a");
      a.className = "tile";
      a.href = p.href;
      a.target = "_blank";
      a.rel = "noopener";
      a.style.setProperty("--g", TILE_GRADIENT);
      var img = document.createElement("img");
      img.src = p.image;
      img.alt = p.alt;
      img.loading = "lazy";
      a.appendChild(img);
      container.appendChild(a);
    });
  }

  return { normalizePosts: normalizePosts, loadFeed: loadFeed, renderTiles: renderTiles };
});
