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

  // Keep non-production hosts (e.g. *.vercel.app previews, localhost) out of
  // search indexes so the throwaway preview URL isn't crawled/duplicated before
  // launch. Auto-disables on the live domain, so go-live needs no code change.
  function guardPreviewIndexing() {
    var host = location.hostname;
    if (host === 'businessofconnections.com' || host === 'www.businessofconnections.com') return;
    if (document.querySelector('meta[data-preview-guard]')) return;
    var m = document.createElement('meta');
    m.name = 'robots';
    m.content = 'noindex, nofollow';
    m.setAttribute('data-preview-guard', '');
    (document.head || document.documentElement).appendChild(m);
  }
  guardPreviewIndexing();

  // Collect nav links, deduped by href. Works with [data-boc-nav] (rebuilt pages)
  // or a plain nav fallback.
  function collectLinks() {
    var src = document.querySelector('[data-boc-nav]') ||
              document.querySelector('nav');
    var items = [], seen = {};
    if (src) {
      src.querySelectorAll('a[href]').forEach(function (a) {
        // Skip event links inside the desktop "Our Events" flyout so the mobile
        // menu keeps a single "Our Events" link.
        if (a.closest('.boc-nav-submenu')) return;
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

  // Turn the desktop "Our Events" nav link into a hover/focus dropdown listing
  // the individual events. The label itself stays a working link to #works.
  var EVENT_LINKS = [
    { href: './boca27', text: 'Business of Class Actions 2027' },
    { href: './bocomp27', text: 'Business of Competition 2027' },
    { href: './bocomp26', text: 'Business of Competition 2026' }
  ];

  function enhanceEventsDropdown() {
    var nav = document.querySelector('[data-boc-nav]');
    if (!nav || nav.querySelector('.boc-nav-dropdown')) return;

    // Find the "Our Events" trigger by href, falling back to link text.
    var trigger = nav.querySelector('a[href="./#works"]');
    if (!trigger) {
      nav.querySelectorAll('a[href]').forEach(function (a) {
        if (!trigger && (a.textContent || '').trim().toLowerCase() === 'our events') trigger = a;
      });
    }
    if (!trigger) return;

    var wrap = document.createElement('span');
    wrap.className = 'boc-nav-dropdown';
    trigger.parentNode.insertBefore(wrap, trigger);
    wrap.appendChild(trigger);

    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');

    var menu = document.createElement('div');
    menu.className = 'boc-nav-submenu';
    menu.setAttribute('role', 'menu');
    EVENT_LINKS.forEach(function (l) {
      var a = document.createElement('a');
      a.setAttribute('role', 'menuitem');
      a.href = l.href;
      a.textContent = l.text;
      menu.appendChild(a);
    });
    wrap.appendChild(menu);

    // Keyboard/focus support (mouse hover is handled in CSS).
    function setExpanded(open) { trigger.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    wrap.addEventListener('focusin', function () { setExpanded(true); });
    wrap.addEventListener('focusout', function (e) {
      if (!wrap.contains(e.relatedTarget)) setExpanded(false);
    });
    wrap.addEventListener('mouseenter', function () { setExpanded(true); });
    wrap.addEventListener('mouseleave', function () { setExpanded(false); });
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setExpanded(false); trigger.focus(); }
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
    var SPRING = 'height 0.7s cubic-bezier(0.33, 1, 0.68, 1)';
    var openH = 0, closedH = 0, activeIdx = 0;

    // Measure every card's natural height in BOTH the open and closed states and
    // take the max of each across all cards. The shared open height must fit the
    // tallest card's content (some cards have more body copy than others),
    // otherwise overflow:clip cuts off the button on the longer cards.
    function measure() {
      openH = 0; closedH = 0;
      cards.forEach(function (c) {
        var prevH = c.style.height;
        var prevState = c.getAttribute('data-card-state');
        c.style.height = '';
        // Closed height for this card.
        c.setAttribute('data-card-state', 'closed');
        var hClosed = Math.round(c.getBoundingClientRect().height);
        if (hClosed > closedH) closedH = hClosed;
        // Open height for this card.
        c.setAttribute('data-card-state', 'open');
        var hOpen = Math.round(c.getBoundingClientRect().height);
        if (hOpen > openH) openH = hOpen;
        // Restore.
        c.setAttribute('data-card-state', prevState);
        c.style.height = prevH;
      });
    }

    function apply() {
      cards.forEach(function (c, i) {
        var isOpen = i === activeIdx;
        c.style.height     = (isOpen ? openH : closedH) + 'px';
        c.style.overflow   = 'clip';
        c.style.transition = SPRING;
        c.style.cursor     = 'pointer';
        c.setAttribute('data-card-state', isOpen ? 'open' : 'closed');
        var body = c.querySelector('.home-help-card-body');
        if (body) {
          body.style.opacity       = isOpen ? '1' : '0';
          body.style.transition    = 'opacity 0.3s ease';
          body.style.pointerEvents = isOpen ? '' : 'none';
        }
      });
    }

    function activate(idx) {
      activeIdx = idx;
      apply();
      imgs.forEach(function (img, i) {
        img.style.zIndex     = i === idx ? '2' : '1';
        img.style.opacity    = i === idx ? '1' : '0';
        img.style.transition = 'opacity 0.3s ease';
      });
    }

    measure();
    if (!openH) return;
    activate(0); // sync image stack to default open card

    cards.forEach(function (card, idx) {
      // Desktop: open the card as soon as the pointer moves over it. Bind both
      // mouseenter and mouse-type pointerenter so hover registers reliably even
      // on fast pointer movement / across browser engines.
      card.addEventListener('mouseenter', function () { activate(idx); });
      card.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'mouse') activate(idx);
      });
      // Touch devices never fire hover events, so a tap must also open the card.
      // Without this, only the default-open card is usable on phones.
      card.addEventListener('click', function () { activate(idx); });
    });

    // Web fonts can swap in after this first measurement (font-display: swap),
    // changing line-wrapping and therefore the natural card height. Re-measure
    // once fonts are ready and reapply without disturbing which card is open.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        measure();
        apply();
      });
    }
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
    var MAIL = 'mailto:maria@businessofconnections.com';
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
            '<a class="boc-contact-email" href="' + MAIL + '">maria@businessofconnections.com</a>' +
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

  // ----- Shared form submission (conference forms + contact) -----------------
  // Posts a form to the /api/submit serverless handler as urlencoded data (so
  // Vercel parses req.body automatically). Hidden fields on the form — conference,
  // formType, botcheck (honeypot) — ride along in the FormData. Returns a Promise
  // that resolves on success and rejects on any failure.
  function submitForm(form) {
    var data = new URLSearchParams();
    new FormData(form).forEach(function (value, key) { data.append(key, value); });
    return fetch('/api/submit', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: data
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (json) {
        if (res.ok && json && json.ok) return json;
        throw new Error((json && json.error) || 'Request failed');
      });
    });
  }

  // Show/clear an inline error message inside a form.
  function setFormError(form, msg) {
    var el = form.querySelector('.boc-form-err');
    if (!msg) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('p');
      el.className = 'boc-form-err';
      el.setAttribute('role', 'alert');
      form.appendChild(el);
    }
    el.textContent = msg;
  }

  // Wire the network round-trip for a form: disable the button, POST, then run
  // onSuccess() (the caller's existing "show success panel" code) or surface an
  // error and re-enable the button. Assumes validation already passed.
  function handleSubmit(form, onSuccess) {
    var btn = form.querySelector('button[type="submit"]');
    var original = btn ? btn.textContent : '';
    setFormError(form, '');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    submitForm(form).then(function () {
      onSuccess();
    }).catch(function () {
      setFormError(form, 'Something went wrong — please try again, or email maria@businessofconnections.com.');
      if (btn) { btn.disabled = false; btn.textContent = original; }
    });
  }

  window.bocSubmitForm = submitForm;
  window.bocHandleSubmit = handleSubmit;

  ready(buildMenu);
  ready(enhanceEventsDropdown);
  ready(buildContactBand);
  ready(buildHeroMarquee);
  ready(initHelpCards);
  ready(buildTestimonialMarquee);
  ready(initMobileCarousels);
})();
