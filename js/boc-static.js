/* Business of Connections — static-site enhancements (no Framer runtime).
   Provides the mobile navigation menu and page-specific interactions.
   Reads real nav links from the page so it stays correct per-page.
   Pure vanilla JS, no dependencies. */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Collect nav links, deduped by href. Works with [data-boc-nav] (rebuilt pages)
  // or a plain nav fallback.
  function collectLinks() {
    var src = document.querySelector('[data-boc-nav]') ||
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
    // Ensure a Home entry (the home link lives on the logo on rebuilt pages).
    if (!items.some(function (l) { return l.href === './' || l.href === '/' || l.href === 'index.html'; })) {
      items.unshift({ href: './', text: 'Home' });
    }
    return items;
  }

  var LINKEDIN = 'https://www.linkedin.com/company/business-of-competition/posts/?feedView=all';

  function buildMenu() {
    var hamburgers = document.querySelectorAll('[data-boc-menu-toggle]');
    if (!hamburgers.length || document.querySelector('.boc-mm')) return;

    var links = collectLinks();
    var overlay = document.createElement('div');
    overlay.className = 'boc-mm';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Menu');

    var html = '<button class="boc-mm-close" type="button" aria-label="Close menu">\xd7</button><nav class="boc-mm-nav">';
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

  // Rebuild the hero "rolling photos" band as a CSS marquee.
  var HERO_PHOTOS = [
    'hero-photos/hero-1.webp',
    'hero-photos/hero-2.webp',
    'hero-photos/hero-3.webp',
    'hero-photos/hero-4.webp',
    'hero-photos/hero-5.webp',
    'hero-photos/hero-6.webp'
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
    // full-bleed band right below the hero (under the CTAs, before Services)
    if (hero.parentNode) hero.parentNode.insertBefore(marquee, hero.nextSibling);
  }

  // "Our services" section: hover interaction — cards expand/collapse and the
  // matching image comes to front. Targets the rebuilt clean HTML selectors.
  function initHelpCards() {
    var sec = document.getElementById('services-1');
    if (!sec) return;
    var cards = [].slice.call(sec.querySelectorAll('.home-help-card'));
    if (!cards.length) return;
    var imgs = [].slice.call(sec.querySelectorAll('.home-help-card-img'));

    // Measure natural heights from the initial HTML state (card[0] open, rest closed).
    var openH   = Math.round(cards[0].getBoundingClientRect().height);
    var closedH = cards[1] ? Math.round(cards[1].getBoundingClientRect().height) : openH;
    if (!openH) return;

    // Lock heights and add spring-equivalent CSS transition.
    var SPRING = 'height 0.7s cubic-bezier(0.33, 1, 0.68, 1)';
    cards.forEach(function (c) {
      var isOpen = c.getAttribute('data-card-state') === 'open';
      c.style.height     = (isOpen ? openH : closedH) + 'px';
      c.style.overflow   = 'clip';
      c.style.transition = SPRING;
      c.style.cursor     = 'pointer';
      var body = c.querySelector('.home-help-card-body');
      if (body) {
        body.style.opacity      = isOpen ? '1' : '0';
        body.style.transition   = 'opacity 0.3s ease';
        body.style.pointerEvents = isOpen ? '' : 'none';
      }
    });

    function activate(idx) {
      cards.forEach(function (c, i) {
        var isOpen = (i === idx);
        c.style.height = (isOpen ? openH : closedH) + 'px';
        c.setAttribute('data-card-state', isOpen ? 'open' : 'closed');
        var body = c.querySelector('.home-help-card-body');
        if (body) {
          body.style.opacity       = isOpen ? '1' : '0';
          body.style.pointerEvents = isOpen ? '' : 'none';
        }
      });
      imgs.forEach(function (img, i) {
        img.style.zIndex     = i === idx ? '2' : '1';
        img.style.opacity    = i === idx ? '1' : '0';
        img.style.transition = 'opacity 0.3s ease';
      });
    }

    activate(0); // sync image stack to default open card
    cards.forEach(function (card, idx) {
      card.addEventListener('mouseenter', function () { activate(idx); });
    });
  }

  // Real BoC 2026 testimonials. Mirrors the set rendered on bocomp26.html so the
  // home page and the event page stay in sync (same people, text and style).
  // Cards without a photo render an initials avatar (see .boc-testi-initials).
  var TESTIMONIALS = [
    { quote: 'It was really a great event with excellent panels! I hope we will have the chance to work again together next year.', name: 'Alexandre Lercher', title: 'IVO Capital', avatar: 'testimonials/optimized/alexandre-lercher.webp' },
    { quote: 'Thank you for the hospitality and perfect organisation of this memorable event. I so much appreciate meeting old friends and making new ones. I hope this Conference is the first one in a row of the next to come. I am already looking forward to enrolling.', name: 'Jaroslaw Sroczyński', title: 'Markiewicz Sroczyński Mioduszewski GP', avatar: 'testimonials/optimized/jaroslaw-sroczynski.webp' },
    { quote: 'It was such a nice conference and you have organised everything with so much passion! Congrats', name: 'Lars Maritzen', title: 'Schalast', avatar: 'testimonials/optimized/lars-maritzen.webp' },
    { quote: 'I was really impressed by everything you put together. Everything, from the topics to the speakers, the venue and the boat trip was so well organised. It was also a real pleasure working with you.', name: 'Helene Andersson', title: 'Delphi', avatar: 'testimonials/optimized/helene-andersson.webp' },
    { quote: 'I would like to congratulate you on a wonderful event, which was both highly insightful and a great opportunity to connect with fellow professionals.', name: 'Ivana Halamova-Dobiskova', title: 'A&O Shearman', avatar: 'testimonials/optimized/ivana-halamova-dobiskova.webp' },
    { quote: 'Thank you for a fantastic conference and all your efforts in organising it — it really showed. I thoroughly enjoyed the event and found the discussions very valuable.', name: 'Lukas Cavada', title: 'Austrian Federal Competition Authority', avatar: 'testimonials/optimized/lukas-cavada.webp' }
  ];

  function testiInitials(name) {
    var parts = (name || '').split(/[\s-]+/).filter(Boolean);
    if (!parts.length) return '';
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (parts[0].charAt(0) + last).toUpperCase();
  }

  // Build the testimonial marquee. Finds the section by its h2 text so it works
  // on any page that uses the "partners have to say" heading.
  function buildTestimonialMarquee() {
    var heads = [].slice.call(document.querySelectorAll('h2'));
    var h = heads.filter(function (x) { return /partners have to say/i.test(x.textContent); })[0];
    if (!h) return;
    var sec = h.closest('section');
    if (!sec || sec.querySelector('.boc-testi-marquee')) return;

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
  // between the brand block and the link columns.
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
          '<img class="boc-contact-photo" src="images/maria-babenkova.webp" alt="Maria Babenkova" loading="lazy">' +
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

    var footer = document.querySelector('.boc-footer');
    if (footer && !footer.querySelector('.boc-contact-col')) {
      var brand = footer.querySelector('.boc-foot-brand');
      footer.insertBefore(makeCol(), brand ? brand.nextSibling : footer.firstChild);
    }
  }

  function initMobileCarousels() {
    if (window.innerWidth > 809) return;

    var leftSVG  = '<svg viewBox="0 0 18 18" fill="none"><path d="M11 4L6 9L11 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var rightSVG = '<svg viewBox="0 0 18 18" fill="none"><path d="M7 4L12 9L7 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    function makeNav(onPrev, onNext) {
      var nav = document.createElement('div');
      nav.className = 'boc-carousel-nav';
      ['prev', 'next'].forEach(function (dir) {
        var btn = document.createElement('button');
        btn.className = 'boc-carousel-arrow';
        btn.setAttribute('aria-label', dir === 'prev' ? 'Previous' : 'Next');
        btn.innerHTML = dir === 'prev' ? leftSVG : rightSVG;
        btn.addEventListener('click', dir === 'prev' ? onPrev : onNext);
        nav.appendChild(btn);
      });
      return nav;
    }

    // Examples: 1 card per page
    // Nav sits inside the card's linen background, bottom-right corner.
    // Section has padding 3.5rem (56px) bottom and 1.5rem (24px) right; card inner padding 12px.
    var exSec = document.getElementById('examples');
    var exGrid = exSec && exSec.querySelector('.home-examples-grid');
    if (exGrid) {
      var exCards = [].slice.call(exGrid.querySelectorAll('.home-examples-card'));
      var exPages = exCards.length;
      var exIdx = 0;
      function exSetPage(idx) {
        exIdx = (idx + exPages) % exPages;
        var cW  = exCards[0].getBoundingClientRect().width;
        var gap = parseFloat(getComputedStyle(exGrid).columnGap) || 16;
        exGrid.style.transform = 'translateX(-' + (exIdx * (cW + gap)) + 'px)';
      }
      exSec.style.position = 'relative';
      var exNav = makeNav(function () { exSetPage(exIdx - 1); }, function () { exSetPage(exIdx + 1); });
      exNav.style.right  = '36px';   // 24px section padding + 12px card padding
      exNav.style.bottom = '68px';   // 56px section padding + 12px card padding
      exSec.appendChild(exNav);
    }

    // Testimonials: 1 card per page (track already built by buildTestimonialMarquee)
    // Nav sits inside the marquee at bottom-right — marquee width == card width on mobile.
    var testiMarquee = document.querySelector('.boc-testi-marquee');
    var testiTrack = testiMarquee && testiMarquee.querySelector('.boc-testi-track');
    if (testiTrack) {
      testiTrack.style.transform = 'translateX(0)'; // reset animation offset before measuring
      var testiSlideW = testiMarquee.offsetWidth;
      var testiGap = 16;
      var TESTI_COUNT = 6;
      var testiIdx = 0;
      // Size each visible card to exactly fill the marquee (border-box so padding is included)
      [].slice.call(testiTrack.querySelectorAll('.boc-testi-card')).slice(0, TESTI_COUNT).forEach(function (c) {
        c.style.boxSizing = 'border-box';
        c.style.width     = testiSlideW + 'px';
        c.style.flex      = '0 0 ' + testiSlideW + 'px';
      });
      function testiSetPage(idx) {
        testiIdx = (idx + TESTI_COUNT) % TESTI_COUNT;
        testiTrack.style.transform = 'translateX(-' + (testiIdx * (testiSlideW + testiGap)) + 'px)';
      }
      testiMarquee.style.position = 'relative';
      var testiNav = makeNav(function () { testiSetPage(testiIdx - 1); }, function () { testiSetPage(testiIdx + 1); });
      testiNav.style.right  = '20px';
      testiNav.style.bottom = '20px';
      testiMarquee.appendChild(testiNav);
    }
  }

  ready(buildMenu);
  ready(buildContactBand);
  ready(buildHeroMarquee);
  ready(initHelpCards);
  ready(buildTestimonialMarquee);
  ready(initMobileCarousels);
})();
