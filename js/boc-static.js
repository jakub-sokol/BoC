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
    // Only runs on the homepage — bocomp26/27 have their own gallery/carousel.
    var path = location.pathname;
    if (path !== '/' && !/(^|\/)index\.html$/.test(path)) return;
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

    // Rebuild each card's CTA as the shared style-guide primary button (.boc-btn).
    // The Framer markup ships an <a data-framer-name="Small"> wrapping duplicated
    // desktop/mobile Text spans with inline background/radius — replace that with a
    // single clean label and our button class so all cards match the style guide.
    // Card 0 → "Explore conferences"; cards 2 & 3 → "Contact us".
    var ctaLabels = ['Explore conferences', 'Contact us', 'Contact us'];
    var ctaHrefs  = [null, './contact-us', './contact-us'];
    cards.forEach(function(card, idx) {
      var a = card.querySelector('a[data-framer-name="Small"]');
      if (!a) return;
      a.className = 'boc-btn boc-btn--pine';
      a.removeAttribute('style');
      a.innerHTML = '<span>' + (ctaLabels[idx] || 'Learn more') + '</span>';
      if (ctaHrefs[idx]) a.href = ctaHrefs[idx];
    });

    // Measure natural heights once from current SSR state (card[0]=Open, rest=Closed).
    var openH  = Math.round(cards[0].getBoundingClientRect().height);  // ~225
    var closedH = Math.round(cards[1].getBoundingClientRect().height); // ~91

    // Lock in explicit heights + add the spring-equivalent CSS transition.
    // (height: min-content can't CSS-interpolate, so we own the value from here.)
    // Spring params from Framer bundle: { type:"spring", duration:0.8, bounce:0 }
    // The spring reaches ~95% at ≈0.35s (duration:0.8 is full settle, not half-life).
    // cubic-bezier(0.33,1,0.68,1) = strong ease-out matching critically-damped spring.
    var SPRING = 'height 0.7s cubic-bezier(0.33, 1, 0.68, 1)'; // bg-color handled by CSS
    cards.forEach(function(c, i) {
      c.style.height     = (i === 0 ? openH : closedH) + 'px';
      c.style.overflow   = 'clip';
      c.style.transition = SPRING;
      c.style.cursor     = 'pointer';
    });

    function activate(idx) {
      cards.forEach(function(c, i) {
        var isOpen = (i === idx);
        c.style.height = (isOpen ? openH : closedH) + 'px';
        // background-color is driven by CSS targeting [data-framer-name] (see
        // boc-static.css) — no inline override needed here.
        c.classList.remove(OPEN_CLS, CLOSE_CLS);
        c.classList.add(isOpen ? OPEN_CLS : CLOSE_CLS);
        c.setAttribute('data-framer-name', isOpen ? 'Open' : 'Closed');
        // Hide the description+button on closed cards. The clip height is fixed,
        // but single-line titles sit higher than two-line ones, so without this
        // their content peeks below the title (e.g. "Support at any stage").
        var content = c.querySelector('[data-framer-name="Content"]');
        if (content) {
          content.style.opacity = isOpen ? '1' : '0';
          content.style.transition = 'opacity 0.3s ease';
          content.style.pointerEvents = isOpen ? '' : 'none';
        }
      });
      imgSlots.forEach(function(slot, i) {
        if (!slot) return;
        slot.style.zIndex     = i === idx ? '2' : '1';
        slot.style.opacity    = i === idx ? '1' : '0';
        slot.style.transition = 'opacity 0.3s ease';
      });
    }

    activate(0); // sync image stack and colours to default open card
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

  // Real BoC 2026 testimonials. Mirrors the set rendered on bocomp26.html so the
  // home page and the event page stay in sync (same people, text and style).
  // Cards without a photo render an initials avatar (see .boc-testi-initials).
  var TESTIMONIALS = [
    { quote: 'It was really a great event with excellent panels! I hope we will have the chance to work again together next year.', name: 'Alexandre Lercher', title: 'IVO Capital', avatar: 'testimonials/optimized/alexandre-lercher.jpg' },
    { quote: 'Thank you for the hospitality and perfect organisation of this memorable event. I so much appreciate meeting old friends and making new ones. I hope this Conference is the first one in a row of the next to come. I am already looking forward to enrolling.', name: 'Jaroslaw Sroczyński', title: 'Markiewicz Sroczyński Mioduszewski GP', avatar: 'testimonials/optimized/jaroslaw-sroczynski.jpg' },
    { quote: 'It was such a nice conference and you have organised everything with so much passion! Congrats', name: 'Lars Maritzen', title: 'Schalast', avatar: 'testimonials/optimized/lars-maritzen.jpg' },
    { quote: 'I was really impressed by everything you put together. Everything, from the topics to the speakers, the venue and the boat trip was so well organised. It was also a real pleasure working with you.', name: 'Helene Andersson', title: 'Delphi', avatar: 'testimonials/optimized/helene-andersson.jpg' },
    { quote: 'I would like to congratulate you on a wonderful event, which was both highly insightful and a great opportunity to connect with fellow professionals.', name: 'Ivana Halamova-Dobiskova', title: 'A&O Shearman', avatar: 'testimonials/optimized/ivana-halamova-dobiskova.jpg' },
    { quote: 'Thank you for a fantastic conference and all your efforts in organising it — it really showed. I thoroughly enjoyed the event and found the discussions very valuable.', name: 'Lukas Cavada', title: 'Austrian Federal Competition Authority', avatar: 'testimonials/optimized/lukas-cavada.jpg' }
  ];

  function testiInitials(name) {
    var parts = (name || '').split(/[\s-]+/).filter(Boolean);
    if (!parts.length) return '';
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (parts[0].charAt(0) + last).toUpperCase();
  }

  // Make the testimonial cards scroll (the original was a Framer Ticker that
  // collapses without the runtime). Hides the Framer placeholder ticker and
  // rebuilds the section as the shared CSS marquee from TESTIMONIALS above.
  function buildTestimonialMarquee() {
    var heads = [].slice.call(document.querySelectorAll('#main h2, h2'));
    var h = heads.filter(function (x) { return /partners have to say/i.test(x.textContent); })[0];
    if (!h) return;
    var sec = h.closest('section');
    if (!sec || sec.querySelector('.boc-testi-marquee')) return;

    // Hide the original Framer ticker (and any "Connect to Content" placeholder).
    var ul = sec.querySelector('ul');
    var ticker = ul ? (ul.closest('[data-framer-name="Ticker Stack"]') || ul.parentElement) : null;
    if (ticker) ticker.style.display = 'none';
    [].slice.call(sec.querySelectorAll('section')).forEach(function (s) {
      if (/Connect to Content/i.test(s.textContent)) s.style.display = 'none';
    });

    function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    var marquee = document.createElement('div');
    marquee.className = 'boc-testi-marquee';
    var track = document.createElement('div');
    track.className = 'boc-testi-track';
    TESTIMONIALS.concat(TESTIMONIALS).forEach(function (d) {
      var card = document.createElement('div');
      card.className = 'boc-testi-card';
      var avatar = d.avatar
        ? '<img src="' + d.avatar + '" alt="" loading="lazy">'
        : '<span class="boc-testi-initials" aria-hidden="true">' + esc(testiInitials(d.name)) + '</span>';
      card.innerHTML =
        '<p class="boc-testi-quote">&ldquo;' + esc(d.quote) + '&rdquo;</p>' +
        '<div class="boc-testi-author">' + avatar +
          '<div><div class="boc-testi-name">' + esc(d.name) + '</div>' +
          '<div class="boc-testi-title">' + esc(d.title) + '</div></div>' +
        '</div>';
      track.appendChild(card);
    });
    marquee.appendChild(track);
    sec.appendChild(marquee);
  }

  // Inject the shared "Contact us" column into the footer on every page. It sits
  // in the empty space between the brand block and the link columns. Stacked
  // vertically: "Contact us" headline, then Maria's portrait + name + email,
  // then the round mail / LinkedIn buttons. On the home page the Framer footer
  // ships three responsive twins (Desktop/Tablet/Phone), so inject into each
  // content row; the rebuilt static pages have a single .boc-footer.
  function buildContactBand() {
    var MAIL = 'mailto:maria@businessofcompetition.com';
    var mailIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';
    var liIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';

    function makeCol() {
      var col = document.createElement('div');
      col.className = 'boc-contact-col';
      col.setAttribute('aria-label', 'Contact us');
      col.innerHTML =
        '<span class="boc-contact-label">Contact us</span>' +
        '<div class="boc-contact-person">' +
          '<img class="boc-contact-photo" src="images/maria-babenkova.jpg" alt="Maria Babenkova" loading="lazy">' +
          '<div>' +
            '<div class="boc-contact-name">Maria Babenkova</div>' +
            '<a class="boc-contact-email" href="' + MAIL + '">maria@businessofcompetition.com</a>' +
          '</div>' +
        '</div>' +
        '<div class="boc-contact-actions">' +
          '<a class="boc-contact-btn" href="' + MAIL + '" aria-label="Email Maria Babenkova">' + mailIcon + '</a>' +
          '<a class="boc-contact-btn" href="' + LINKEDIN + '" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">' + liIcon + '</a>' +
        '</div>';
      return col;
    }

    // Home page: Framer footer content rows (one per responsive twin).
    var contents = document.querySelectorAll('footer .framer-xi07ez');
    if (contents.length) {
      contents.forEach(function (content) {
        if (content.querySelector('.boc-contact-col')) return;
        var nav = content.querySelector('.framer-13o9k3r'); // link-columns group
        content.insertBefore(makeCol(), nav || null);
      });
      return;
    }

    // Rebuilt static pages: insert between the brand block and the page nav.
    var footer = document.querySelector('.boc-footer');
    if (footer && !footer.querySelector('.boc-contact-col')) {
      var brand = footer.querySelector('.boc-foot-brand');
      footer.insertBefore(makeCol(), brand ? brand.nextSibling : footer.firstChild);
    }
  }

  ready(buildMenu);
  ready(buildContactBand);
  ready(revealAppear);
  ready(buildHeroMarquee);
  ready(initHelpCards);
  ready(addCardHovers);
  ready(buildTestimonialMarquee);
})();
