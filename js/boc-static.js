/* Business of Connections — static-site enhancements (no Framer runtime).
   Provides the mobile navigation menu that the Framer React runtime used to
   render dynamically. Reads the real nav links from the page so it stays
   correct per-page. Pure vanilla JS, no dependencies. */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Collect nav links, deduped by href. Works with the Framer desktop nav
  // variant (main pages) or a plain [data-boc-nav] (rebuilt static pages).
  function collectLinks() {
    var src = document.querySelector('nav[data-framer-name="Desktop"]') ||
              document.querySelector('[data-boc-nav]') ||
              document.querySelector('nav');
    var items = [], seen = {};
    if (src) {
      src.querySelectorAll('a[href]').forEach(function (a) {
        var href = a.getAttribute('href');
        var text = (a.textContent || '').trim();
        if (!href || !text || seen[href]) return;
        seen[href] = true;
        items.push({ href: href, text: text });
      });
    }
    // Ensure a Home entry (on rebuilt pages the home link lives on the logo).
    if (!items.some(function (l) { return l.href === './' || l.href === '/' || l.href === 'index.html'; })) {
      items.unshift({ href: './', text: 'Home' });
    }
    return items;
  }

  var LINKEDIN = 'https://www.linkedin.com/company/business-of-competition/posts/?feedView=all';

  function buildMenu() {
    var hamburgers = document.querySelectorAll('nav [data-framer-name="Open"], [data-boc-menu-toggle]');
    if (!hamburgers.length || document.querySelector('.boc-mm')) return;

    var links = collectLinks();
    var overlay = document.createElement('div');
    overlay.className = 'boc-mm';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Menu');

    var html = '<button class="boc-mm-close" type="button" aria-label="Close menu">×</button><nav class="boc-mm-nav">';
    links.forEach(function (l) {
      html += '<a href="' + l.href + '">' + l.text + '</a>';
    });
    html += '<a class="boc-mm-social" href="' + LINKEDIN + '" target="_blank" rel="noopener noreferrer">LinkedIn</a>';
    html += '</nav>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    function open() {
      overlay.classList.add('open');
      document.documentElement.style.overflow = 'hidden';
      hamburgers.forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    }
    function close() {
      overlay.classList.remove('open');
      document.documentElement.style.overflow = '';
      hamburgers.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    }

    hamburgers.forEach(function (b) {
      b.style.cursor = 'pointer';
      b.setAttribute('role', 'button');
      b.setAttribute('aria-label', 'Open menu');
      b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
    overlay.querySelector('.boc-mm-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
  }

  // Reveal Framer "appear" content that the old runtime used to fade in.
  // Without the runtime these elements keep their initial opacity:0 and stay
  // invisible. Reveal any inline-opacity:0 element that has real rendered area,
  // except the old (unused) Framer mobile nav panel.
  function revealAppear() {
    document.querySelectorAll('[style*="opacity:0"], [style*="opacity: 0"]').forEach(function (el) {
      if (el.getAttribute('data-framer-name') === 'Links + Search') return;
      var op = el.style && el.style.opacity;
      if (op === '' || parseFloat(op) >= 0.05) return;
      var r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        el.style.opacity = '1';
        el.style.filter = 'none';
        el.style.webkitFilter = 'none';
      }
    });
  }

  // Rebuild the hero "rolling photos" band as a CSS marquee. The original was a
  // Framer Ticker (runtime-driven) that collapses to 0px without the runtime;
  // its source images live in a now-hidden container (.framer-12ow6ey).
  // Real Business of Competition event photos (the originals were CMS-injected
  // into a Framer Ticker that collapses to 0px without the runtime).
  var HERO_PHOTOS = [
    'images/ubtbkgzm0utstuodfmwgjuidsi.jpg',
    'gallery/bocomp26/businessofcompetitionP1557315.jpg',
    'images/zab4stflzjhbegtje9nqtqgt6cs.jpg',
    'gallery/bocomp26/businessofcompetitionP1557510.jpg',
    'gallery/bocomp26/businessofcompetitionP1557639.jpg',
    'images/lmagbqmhle5bt8oeiqt2jnqvz8.jpg',
    'gallery/bocomp26/businessofcompetitionP1568206.jpg',
    'gallery/bocomp26/businessofcompetitionP1557549.jpg'
  ];

  function buildHeroMarquee() {
    var hero = document.getElementById('hero');
    if (!hero || document.querySelector('.boc-photo-marquee')) return;
    var marquee = document.createElement('div');
    marquee.className = 'boc-photo-marquee';
    var track = document.createElement('div');
    track.className = 'boc-photo-track';
    // duplicate the set for a seamless loop
    HERO_PHOTOS.concat(HERO_PHOTOS).forEach(function (u) {
      var im = document.createElement('img');
      im.src = u; im.alt = 'Business of Competition event'; im.loading = 'lazy';
      track.appendChild(im);
    });
    marquee.appendChild(track);
    // full-bleed band right below the hero (under the CTAs, before "How can I help")
    if (hero.parentNode) hero.parentNode.insertBefore(marquee, hero.nextSibling);
  }

  // Re-add the hover lift on conference project cards (was a Framer hover variant).
  function addCardHovers() {
    document.querySelectorAll('[data-framer-name^="Project Card"]').forEach(function (card) {
      card.classList.add('boc-hover-lift');
    });
  }

  ready(buildMenu);
  ready(revealAppear);
  ready(buildHeroMarquee);
  ready(addCardHovers);
})();
