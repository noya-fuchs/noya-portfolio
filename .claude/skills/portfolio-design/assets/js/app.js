(function () {
  var CONFIG = window.NOYA_CONFIG || {};

  /* Fill contact details from config. The HTML already holds the same values for visitors without JavaScript. */
  function applyConfig() {
    var setCopy = function (el, value) { var b = el.nextElementSibling; if (b && b.hasAttribute("data-copy")) b.setAttribute("data-copy", value); };
    document.querySelectorAll('[data-config="email"]').forEach(function (a) {
      if (!CONFIG.email) return;
      a.textContent = CONFIG.email; a.setAttribute("href", "mailto:" + CONFIG.email); setCopy(a, CONFIG.email);
    });
    document.querySelectorAll('[data-config="phone"]').forEach(function (a) {
      if (!CONFIG.phone) return;
      a.textContent = CONFIG.phoneDisplay || CONFIG.phone; a.setAttribute("href", "tel:" + CONFIG.phone); setCopy(a, CONFIG.phone);
    });
    document.querySelectorAll('[data-config="instagram"]').forEach(function (a) {
      if (CONFIG.instagram) a.setAttribute("href", CONFIG.instagram);
    });
  }
  applyConfig();

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || /[?&]reduce=1\b/.test(window.location.search);
  var lenis = null;
  /* Always start at the top on load, so the smooth scroller and the browser never disagree about where the page is. */
  if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";

  /* Copy buttons work with or without animation libraries */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      var done = function () { var t = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = t; }, 1400); };
      try { navigator.clipboard.writeText(text).then(done, function () { selectFallback(btn); }); } catch (e) { selectFallback(btn); }
    });
  });
  function selectFallback(btn) {
    var target = btn.previousElementSibling; if (!target) return;
    var r = document.createRange(); r.selectNodeContents(target);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  /* Instagram column: live posts if the feed works, else the fallback posts, else the designed tiles already in the HTML. */
  function initFeed() {
    var box = document.getElementById("feed");
    var note = document.getElementById("feedNote");
    if (!box || !window.NoyaFeed) return;
    window.NoyaFeed.loadFeed({ url: CONFIG.feedUrl, limit: CONFIG.maxPosts || 6, fallback: CONFIG.fallbackPosts || [] })
      .then(function (result) {
        if (!result.posts.length) return;
        window.NoyaFeed.renderTiles(box, result.posts);
        if (note) { note.textContent = "Latest posts from @impact_ru.ec"; note.hidden = false; }
      });
  }
  initFeed();

  /* Navigation: native smooth scrolling, or Lenis when it is running. Set up before the libraries load so the links always work. */
  function initNav() {
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href").slice(1);
        var el = document.getElementById(id); if (!el) return;
        e.preventDefault();
        var startY = window.scrollY;
        var maxY = document.documentElement.scrollHeight - window.innerHeight;
        var targetY = Math.min(id === "home" ? 0 : el.getBoundingClientRect().top + startY - 10, maxY); /* the last section stops at the page end */
        if (lenis) {
          lenis.scrollTo(el, { offset: id === "home" ? 0 : -10, duration: 1.3 });
          /* Safety net: if the smooth scroller does not move the page, or does not arrive (some hosts scroll the frame instead), use native scrolling.
             Any wheel, touch, key or pointer input from the visitor cancels it, so it never fights their own scrolling. */
          var atPageEnd = function () { return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2; }; /* the last section can never reach the top */
          var arrived = function () { return id === "home" ? window.scrollY < 60 : Math.abs(el.getBoundingClientRect().top - 10) < 60 || atPageEnd(); };
          var useNative = function () {
            if (lenis) { lenis.destroy(); lenis = null; }
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          };
          var events = ["wheel", "touchstart", "keydown", "pointerdown"];
          var timers = [];
          var disarm = function () {
            timers.forEach(clearTimeout);
            events.forEach(function (ev) { window.removeEventListener(ev, disarm); });
          };
          events.forEach(function (ev) { window.addEventListener(ev, disarm, { passive: true }); });
          timers.push(setTimeout(function () { if (lenis && Math.abs(targetY - startY) > 40 && Math.abs(window.scrollY - startY) < 2) useNative(); }, 400));
          timers.push(setTimeout(function () { if (lenis && !arrived()) useNative(); disarm(); }, 1900));
        } else {
          el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        }
        /* Keyboard users continue from the section they jumped to, and the address shows it. */
        el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
        try { window.history.replaceState(null, "", "#" + id); } catch (err) { /* e.g. sandboxed frames */ }
      });
    });
  }

  /* Which dock item is active, and when the top bar shows. IntersectionObserver, so it works without the animation libraries. */
  var SECTION_TO_DOCK = { home: "home", statement: "home", work: "work", impact: "impact", yoga: "impact", roots: "about", about: "about", contact: "contact" };
  function initActive() {
    if (!("IntersectionObserver" in window)) return;
    var setActive = function (id) {
      document.querySelectorAll(".dock a").forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + SECTION_TO_DOCK[id]); });
    };
    var sections = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: "-45% 0px -55% 0px" });
    Object.keys(SECTION_TO_DOCK).forEach(function (id) { var el = document.getElementById(id); if (el) sections.observe(el); });

    var hero = document.getElementById("heroCard"), bar = document.getElementById("topbar");
    if (hero && bar) {
      new IntersectionObserver(function (entries) {
        var en = entries[0];
        bar.classList.toggle("is-on", !en.isIntersecting && en.boundingClientRect.top < 0);
      }, { rootMargin: "-90px 0px 0px 0px" }).observe(hero);
    }
  }

  initNav();
  initActive();

  /* Everything below is decoration. Without the libraries, or with reduced motion, the page is fully readable and navigable. */
  if (reduce || !window.gsap || !window.ScrollTrigger) { return; }
  gsap.registerPlugin(ScrollTrigger);

  /* Smooth scrolling */
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { if (lenis) lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* Hero: entrance. "Noya" slides in from the left, "Fuchs" from the right, the portrait rises from the bottom. */
  var nameWords = document.querySelectorAll("#heroName span");
  gsap.set(["#heroName", "#heroPhoto"], { xPercent: -50, x: 0 }); /* keeps the CSS centring while GSAP moves the other axes */
  gsap.from(nameWords[0], { xPercent: -150, opacity: 0, duration: 1.4, ease: "power4.out" });
  gsap.from(nameWords[1], { xPercent: 150, opacity: 0, duration: 1.4, ease: "power4.out" });
  gsap.from("#heroPhoto", { yPercent: 40, opacity: 0, duration: 1.5, ease: "power3.out", delay: 0.25 });
  gsap.from(["#heroTitle", "#heroMeta"], { y: 24, opacity: 0, duration: 0.9, ease: "power3.out", delay: 0.9, stagger: 0.1 });

  var heroST = { trigger: "#heroCard", start: "top top", end: "bottom top", scrub: true };
  gsap.to("#heroName", { yPercent: -16, ease: "none", scrollTrigger: heroST });
  gsap.to("#heroPhoto", { scale: 1.07, y: 24, ease: "none", scrollTrigger: heroST });
  gsap.to(["#heroTitle", "#heroMeta"], { y: -40, opacity: 0, ease: "none",
    scrollTrigger: { trigger: "#heroCard", start: "top top", end: "55% top", scrub: true } });

  /* Statement: words light up as you scroll */
  var line = document.getElementById("statementLine");
  var words = [];
  (function split(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s); words.push(s);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1) { split(n); }
    });
  })(line);
  gsap.fromTo(words, { opacity: 0.14 }, { opacity: 1, ease: "none", stagger: 0.25,
    scrollTrigger: { trigger: "#statement", start: "top 78%", end: "70% 45%", scrub: true } });

  /* Generic reveals */
  gsap.utils.toArray("[data-reveal]").forEach(function (el) {
    gsap.from(el, { y: 38, opacity: 0, duration: 0.9, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true } });
  });
  gsap.utils.toArray("[data-stagger]").forEach(function (el) {
    gsap.from(el.children, { y: 26, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.12,
      scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  var mm = gsap.matchMedia();

  /* Desktop only */
  mm.add("(min-width: 900px) and (min-height: 760px)", function () {
    /* The Instagram column drifts with the section, and can still be scrolled by hand */
    var feed = document.getElementById("feed");
    ScrollTrigger.create({
      trigger: "#impactCard", start: "top 60%", end: "bottom 60%",
      onUpdate: function (self) { feed.scrollTop = self.progress * (feed.scrollHeight - feed.clientHeight); }
    });
  });

  /* Floating panels. Every block (hero, statement, each card, ...) eases in from a little smaller and fainter as it rises into view,
     and eases back, smaller and dimmer, as it leaves, so one block at a time holds the screen. The values are damped every frame,
     so the movement stays smooth and fades instead of snapping with the scroll. Positions come from layout (offsetTop), not from
     the transformed rectangle, so the effect never feeds back into itself. */
  var PANEL_SELECTORS = ["#heroCard", ".statement .inner", ".work .sec-head", ".xcard", "#impactCard", ".yoga__card",
    ".roots .sec-head", ".roots__grid", ".camp-strip", ".about .sec-head", ".about__grid", ".contact__card"];
  var panels = [];
  PANEL_SELECTORS.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) { panels.push({ el: el, top: 0, h: 0, s: null, o: 0, y: 0 }); el.style.transformOrigin = "50% 50%"; });
  });
  function absTop(el) { var t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; }
  function measure() { panels.forEach(function (p) { p.top = absTop(p.el); p.h = p.el.offsetHeight; }); }
  function smooth(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  var lastHeight = 0, frame = 0;
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);
  ScrollTrigger.addEventListener("refresh", measure);
  gsap.ticker.add(function (time, deltaTime) {
    if (++frame % 30 === 0 && document.documentElement.scrollHeight !== lastHeight) { lastHeight = document.documentElement.scrollHeight; measure(); }
    var V = window.innerHeight, sy = window.scrollY, k = 1 - Math.exp(-(deltaTime || 16) / 130);
    panels.forEach(function (p) {
      var top = p.top - sy, bottom = top + p.h;
      var inT = smooth((V * 0.98 - top) / (V * 0.55));      /* 0 when the panel is just below the screen, 1 once it has risen */
      var outT = smooth((V * 0.62 - bottom) / (V * 0.55));  /* 0 while the panel is in view, 1 once it has gone up and away */
      var s = (0.88 + 0.12 * inT) * (1 - 0.07 * outT);
      var o = (0.08 + 0.92 * inT) * (1 - 0.72 * outT);
      var y = 70 * (1 - inT);
      if (p.s === null) { p.s = s; p.o = o; p.y = y; } /* first frame: start where the page is, no intro for what is already on screen */
      else { p.s += (s - p.s) * k; p.o += (o - p.o) * k; p.y += (y - p.y) * k; }
      if (p.s > 0.9995 && p.o > 0.999 && p.y < 0.1) { if (p.el.style.transform) { p.el.style.transform = ""; p.el.style.opacity = ""; } return; }
      p.el.style.transform = "translate3d(0," + p.y.toFixed(2) + "px,0) scale(" + p.s.toFixed(4) + ")";
      p.el.style.opacity = p.o.toFixed(3);
    });
  });

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
