(function () {
  var root = document.documentElement;
  var storageKey = 'theme';

  root.classList.remove('no-js');

  function readTheme() {
    try { return localStorage.getItem(storageKey); } catch (e) { return null; }
  }

  function saveTheme(value) {
    try { localStorage.setItem(storageKey, value); } catch (e) {}
  }

  var saved = readTheme();
  if (saved === 'dark' || saved === 'light') {
    root.setAttribute('data-theme', saved);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.setAttribute('data-theme', 'dark');
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    var themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        saveTheme(next);
      });
    }

    var menu = document.querySelector('.menu');
    var menuBtn = document.querySelector('.menu-toggle');
    if (menu && menuBtn) {
      menuBtn.addEventListener('click', function () {
        var open = menu.classList.toggle('open');
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      menu.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
          menu.classList.remove('open');
          menuBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    var reveals = document.querySelectorAll('.reveal');
    reveals.forEach(function (el) {
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
        return c.classList.contains('reveal');
      });
      var index = siblings.indexOf(el);
      if (index > 0 && el.parentElement.matches('.cards, .skills, .personal, .facts')) {
        el.style.transitionDelay = (index * 90) + 'ms';
      }
    });

    function countUp(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (reduceMotion || isNaN(target)) { el.textContent = target; return; }
      var start = null;
      var duration = 900;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target);
        if (p < 1) requestAnimationFrame(step);
      }
      el.textContent = '0';
      requestAnimationFrame(step);
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          e.target.querySelectorAll('[data-count]').forEach(countUp);
          io.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('in'); });
    }

    var links = document.querySelectorAll('.menu a[href^="#"]');
    var sections = [];
    links.forEach(function (a) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) sections.push({ link: a, el: target });
    });

    var progress = document.querySelector('.progress');
    var toTop = document.querySelector('.to-top');
    var timeline = document.querySelector('.timeline');
    var ticking = false;

    function onScroll() {
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
      if (toTop) toTop.classList.toggle('show', y > 600);

      var current = null;
      sections.forEach(function (s) {
        if (s.el.getBoundingClientRect().top <= 120) current = s;
      });
      if (window.innerHeight + y >= document.documentElement.scrollHeight - 4 && sections.length) {
        current = sections[sections.length - 1];
      }
      links.forEach(function (a) { a.classList.toggle('active', current !== null && a === current.link); });

      if (timeline) {
        var r = timeline.getBoundingClientRect();
        var seen = window.innerHeight * 0.6 - r.top;
        var h = Math.max(0, Math.min(seen, r.height - 16));
        timeline.style.setProperty('--fill', h + 'px');
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }

    if (finePointer) {
      document.querySelectorAll('.card').forEach(function (card) {
        card.addEventListener('pointermove', function (e) {
          var r = card.getBoundingClientRect();
          card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
          card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
      });
    }

    var photo = document.querySelector('.photo');
    var inner = photo ? photo.querySelector('.photo-inner') : null;
    if (photo && inner && finePointer && !reduceMotion) {
      photo.addEventListener('pointermove', function (e) {
        var r = photo.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = 'rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg)';
      });
      photo.addEventListener('pointerleave', function () {
        inner.style.transform = '';
      });
    }

    var toast = document.querySelector('.toast');
    var toastTimer;
    function showToast(text) {
      if (!toast) return;
      toast.textContent = text;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
    }

    document.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var value = btn.getAttribute('data-copy');
        function fallback() {
          var ta = document.createElement('textarea');
          ta.value = value;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          var ok = false;
          try { ok = document.execCommand('copy'); } catch (e) {}
          document.body.removeChild(ta);
          showToast(ok ? 'E-Mail-Adresse kopiert' : value);
        }
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(value).then(function () {
            showToast('E-Mail-Adresse kopiert');
          }, fallback);
        } else {
          fallback();
        }
      });
    });

    var year = document.querySelector('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
  });
})();
