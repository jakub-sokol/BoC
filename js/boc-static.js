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

  // "How can I help" section: full hover interaction (was a Framer variant swap).
  // Each card has Open (225px, description+button visible) and Closed (91px, clipped)
  // states baked into the SSR via framer-v-* classes. Switching those classes and
  // bringing the matching image to front replicates the original behaviour.
  function initHelpCards() {
    var sec = document.getElementById('services-1');
    if (!sec) return;
    var OPEN_CLS  = 'framer-v-164cwfm';
    var CLOSE_CLS = 'framer-v-akikko';
    var cards = [].slice.call(sec.querySelectorAll(
      '[data-framer-name="Open"], [data-framer-name="Closed"]'
    ));
    if (!cards.length) return;
    var imgSlots = ['Image 1','Image 2','Image 3','Image 4'].map(function(n){
      return sec.querySelector('[data-framer-name="' + n + '"]');
    });

    // Fix button labels for cards 2 & 3 ("Contact us" not "Explore conferences").
    // Each button has two [data-framer-name="Text"] spans (desktop + mobile variants).
    [1, 2].forEach(function(cardIdx) {
      if (!cards[cardIdx]) return;
      cards[cardIdx].querySelectorAll('[data-framer-name="Small"] [data-framer-name="Text"]').forEach(function(el) {
        el.textContent = 'Contact us';
      });
      // Also update the href to contact page
      cards[cardIdx].querySelectorAll('[data-framer-name="Small"] a, a[data-framer-name="Small"]').forEach(function(a) {
        a.href = './contact-us';
      });
    });

    // Measure natural heights once from current SSR state (card[0]=Open, rest=Closed).
    var openH  = Math.round(cards[0].getBoundingClientRect().height);  // ~225
    var closedH = Math.round(cards[1].getBoundingClientRect().height); // ~91

    // Lock in explicit heights + add the spring-equivalent CSS transition.
    // (height: min-content can't CSS-interpolate, so we own the value from here.)
    // Spring params from Framer bundle: { type:"spring", duration:0.8, bounce:0 }
    // The spring reaches ~95% at ≈0.35s (duration:0.8 is full settle, not half-life).
    // cubic-bezier(0.33,1,0.68,1) = strong ease-out matching critically-damped spring.
    var SPRING = 'height 0.35s cubic-bezier(0.33, 1, 0.68, 1), background-color 0.25s ease';
    cards.forEach(function(c, i) {
      c.style.height     = (i === 0 ? openH : closedH) + 'px';
      c.style.overflow   = 'clip';
      c.style.transition = SPRING;
      c.style.cursor     = 'pointer';
    });

    function activate(idx) {
      cards.forEach(function(c, i) {
        c.style.height = (i === idx ? openH : closedH) + 'px';
        c.classList.remove(OPEN_CLS, CLOSE_CLS);
        c.classList.add(i === idx ? OPEN_CLS : CLOSE_CLS);
        c.setAttribute('data-framer-name', i === idx ? 'Open' : 'Closed');
      });
      imgSlots.forEach(function(slot, i) {
        if (!slot) return;
        slot.style.zIndex     = i === idx ? '2' : '1';
        slot.style.opacity    = i === idx ? '1' : '0';
        slot.style.transition = 'opacity 0.3s ease';
      });
    }

    activate(0); // sync image stack to default open card
    cards.forEach(function(card, idx) {
      card.addEventListener('mouseenter', function() { activate(idx); });
    });
  }

  // Re-add the hover lift on conference project cards (was a Framer hover variant).
  function addCardHovers() {
    document.querySelectorAll('[data-framer-name^="Project Card"]').forEach(function (card) {
      card.classList.add('boc-hover-lift');
    });
  }

  // Make the testimonial cards scroll (the original was a Framer Ticker that
  // collapses without the runtime). Rebuilds the existing placeholder cards into
  // a CSS marquee; when real testimonials replace the content this still works.
  function buildTestimonialMarquee() {
    var heads = [].slice.call(document.querySelectorAll('#main h2, h2'));
    var h = heads.filter(function (x) { return /partners have to say/i.test(x.textContent); })[0];
    if (!h) return;
    var sec = h.closest('section');
    if (!sec || sec.querySelector('.boc-testi-marquee')) return;
    var quotes = [].slice.call(sec.querySelectorAll('p')).filter(function (p) {
      return /["“”]/.test(p.textContent) && p.textContent.trim().length > 25;
    });
    if (quotes.length < 2) return;

    var data = quotes.map(function (q) {
      var card = q;
      for (var i = 0; i < 6 && card; i++) { if (card.querySelector && card.querySelector('img')) break; card = card.parentElement; }
      var img = card ? card.querySelector('img') : null;
      var authors = card ? [].slice.call(card.querySelectorAll('p')).filter(function (p) {
        var t = p.textContent.trim(); return p !== q && t.length > 1 && t.length < 60;
      }).map(function (p) { return p.textContent.trim(); }) : [];
      // hide the original (collapsed) card
      if (card) card.style.display = 'none';
      return { quote: q.textContent.trim(), avatar: img ? img.getAttribute('src') : '', name: authors[0] || '', title: authors[1] || '' };
    });

    function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    var marquee = document.createElement('div');
    marquee.className = 'boc-testi-marquee';
    var track = document.createElement('div');
    track.className = 'boc-testi-track';
    data.concat(data).forEach(function (d) {
      var card = document.createElement('div');
      card.className = 'boc-testi-card';
      card.innerHTML =
        '<p class="boc-testi-quote">' + esc(d.quote) + '</p>' +
        '<div class="boc-testi-author">' +
          (d.avatar ? '<img src="' + d.avatar + '" alt="" loading="lazy">' : '') +
          '<div><div class="boc-testi-name">' + esc(d.name) + '</div>' +
          '<div class="boc-testi-title">' + esc(d.title) + '</div></div>' +
        '</div>';
      track.appendChild(card);
    });
    marquee.appendChild(track);
    sec.appendChild(marquee);
  }

  ready(buildMenu);
  ready(revealAppear);
  ready(buildHeroMarquee);
  ready(initHelpCards);
  ready(addCardHovers);
  ready(buildTestimonialMarquee);
})();
