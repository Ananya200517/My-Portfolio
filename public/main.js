// Mobile nav toggle
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");
toggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const id = a.getAttribute("href").slice(1);
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      nav?.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");
    }
  });
});

// Footer year + demo contact handler
document.getElementById("year")?.append(new Date().getFullYear());
document.getElementById("contact-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  document.getElementById("form-status").textContent = "Thanks! This demo doesn’t send yet.";
});

(function() {
      const btn = document.querySelector(".nav__toggle");
      const list = document.getElementById("nav-list");
      btn?.addEventListener("click", () => {
        const exp = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!exp));
        list.classList.toggle("is-open");
      });
      document.getElementById("year").textContent = new Date().getFullYear();
    })();

    /* ========== GLOBAL ENHANCEMENTS ========== */

// 1) Mobile nav toggle (works anywhere the nav exists)
(function navToggle() {
  const btn = document.querySelector(".nav__toggle");
  const list = document.getElementById("nav-list");
  if (!btn || !list) return;
  btn.addEventListener("click", () => {
    const exp = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!exp));
    list.classList.toggle("is-open");
  });
})();

// 2) Dynamic year in footer
(function setYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();

// ===== About page: seamless continuous gallery (no end gap) =====
(function () {
  if (!document.body.classList.contains('page-about')) return;

  const container = document.querySelector('.life-gallery');
  if (!container) return;

  // If we already built the track once, don’t rebuild
  let track = container.querySelector('.life-gallery__track');
  if (!track) {
    // Wrap existing items in a moving track
    const children = Array.from(container.children);
    track = document.createElement('div');
    track.className = 'life-gallery__track';
    children.forEach(el => track.appendChild(el));
    container.appendChild(track);
  }

  // Originals = the first set (ignore any previous clones)
  const originals = Array.from(track.children).filter(el => !el.dataset.clone);

  // Speed control: pixels per second (bigger = faster)
  const PX_PER_SEC = 60;

  function widthOf(items, gapPx) {
    // total width of items + gap between each (no trailing gap)
    return items.reduce((sum, el, i) => sum + el.getBoundingClientRect().width + (i ? gapPx : 0), 0);
  }

  function rebuild() {
    // 1) Remove old clones
    Array.from(track.children).forEach(el => el.dataset.clone && el.remove());

    // 2) Measure one full set width and gap
    const style = getComputedStyle(track);
    const gap = parseFloat(style.gap || '0');
    const oneSetWidth = widthOf(originals, gap);

    // 3) Duplicate until the track is long enough to cover
    //    (viewport + one set), so while set A scrolls out,
    //    set B is already in view = no gap.
    let total = widthOf(Array.from(track.children), gap);
    const needed = container.clientWidth + oneSetWidth;

    while (total < needed) {
      originals.forEach(src => {
        const clone = src.cloneNode(true);
        clone.dataset.clone = '1';
        track.appendChild(clone);
      });
      total = widthOf(Array.from(track.children), gap);
    }

    // 4) Set CSS custom props for distance & duration and restart animation
    const dur = oneSetWidth / PX_PER_SEC; // seconds
    container.style.setProperty('--marquee-width', `${oneSetWidth}px`);
    container.style.setProperty('--marquee-dur', `${dur}s`);

    // restart animation cleanly (toggle the animation class)
    track.style.animation = 'none';
    // force reflow to flush style changes
    void track.offsetHeight; 
    track.style.animation = '';
  }

  rebuild();
  // Recalculate on resize so it stays seamless
  let raf;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(rebuild);
  });
})();


/* ========== CONTACT FORM HANDLER ========== */
/*
  HOW TO USE:
  - Formspree (recommended for static hosting):
      1) In contact.html, set action="https://formspree.io/f/YOUR_ID"
      2) Keep method="POST"
      3) JS below intercepts submit, does validation, sends with fetch (AJAX), and shows a status message.
  - Netlify (no third-party):
      1) In contact.html, change the form to:
           <form name="contact" method="POST" data-netlify="true" data-js="contact-form" netlify-honeypot="bot-field">
             <input type="hidden" name="form-name" value="contact">
             <input type="text" name="bot-field" class="hp-field" />
             ...
           </form>
      2) Replace the fetch() URL with "/" and encode body as FormData (Netlify parses it).
*/

(function contactForm() {
  const form = document.querySelector('[data-js="contact-form"]');
  if (!form) return;

  const status = document.getElementById("form-status");
  const fields = {
    name: form.querySelector("#name"),
    email: form.querySelector("#email"),
    message: form.querySelector("#message"),
  };

  function setError(input, msg) {
    const err = input?.parentElement?.querySelector(".error");
    if (err) err.textContent = msg || "";
    input?.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function validate() {
    let ok = true;
    // Name
    if (!fields.name.value.trim()) { setError(fields.name, "Please enter your name."); ok = false; } else setError(fields.name);
    // Email
    const email = fields.email.value.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) { setError(fields.email, "Email is required."); ok = false; }
    else if (!re.test(email)) { setError(fields.email, "Please enter a valid email."); ok = false; }
    else setError(fields.email);
    // Message
    if (!fields.message.value.trim()) { setError(fields.message, "Please enter a message."); ok = false; } else setError(fields.message);
    return ok;
  }

  form.addEventListener("submit", async (e) => {
    // Let the browser do native validation messages too, but we’ll enhance:
    e.preventDefault();

    // Quick bot check (honeypot)
    const hp = form.querySelector('input[name="_gotcha"]');
    if (hp && hp.value) return; // silently drop

    if (!validate()) {
      if (status) status.textContent = "Please fix the errors above.";
      return;
    }

    // Build request from form fields
    const formData = new FormData(form);

    // Show sending state
    if (status) status.textContent = "Sending…";

    try {
      // Formspree endpoint from the form's action attribute
      const endpoint = form.getAttribute("action") || "#";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: formData
      });

      if (res.ok) {
        if (status) status.textContent = "Thanks! Your message has been sent.";
        form.reset();
        Object.values(fields).forEach(i => setError(i, "")); // clear errors
      } else {
        // Formspree error details
        const data = await res.json().catch(() => ({}));
        const msg = data?.errors?.[0]?.message || "Something went wrong. Please try again or email me directly.";
        if (status) status.textContent = msg;
      }
    } catch (err) {
      if (status) status.textContent = "Network error. Please try again later.";
    }
  });
})();

// === Accessible mobile nav toggle ===
(function navToggle() {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('is-open');
  });
})();

// === Auto year in footer ===
(function autoYear() {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

// ===== Projects — Case List injection for projects.html =====
(function () {
  const onProjectsPage = document.body.classList.contains('page-projects');
  if (!onProjectsPage) return;

  // Example projects (edit these or replace with your real ones)
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function projectItem(p) {
    const item = el('article', 'project-item');

    const thumb = el('figure', 'project-thumb');
    const img = new Image();
    img.loading = 'lazy';
    img.alt = `${p.title} screenshot`;
    img.src = p.img;
    thumb.appendChild(img);

    const content = el('div', 'project-content');
    content.appendChild(el('h2', null, p.title));
    content.appendChild(el('div', 'project-skills',
      Array.isArray(p.skills) ? p.skills.join(' · ') : (p.skills || '')
    ));
    content.appendChild(el('p', 'project-desc', p.description || ''));
    const btn = el('a', 'btn-github', 'View on GitHub');
    btn.href = (p.links && p.links.github) ? p.links.github : '#';
    btn.target = '_blank';
    btn.rel = 'noopener';
    content.appendChild(btn);

    item.appendChild(thumb);
    item.appendChild(content);
    return item;
  }

  // Insert list right under the hero content (without editing your HTML)
  document.addEventListener('DOMContentLoaded', function () {
    // year in footer if present
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();

    const heroContainer = document.querySelector('.hero .container') || document.body;
    const list = el('section', 'projects-listing');
    PROJECTS.forEach(p => list.appendChild(projectItem(p)));

    // place the list before the footer if footer sits inside hero
    const footer = document.querySelector('.site-footer');
    if (heroContainer.contains(footer)) {
      heroContainer.insertBefore(list, footer);
    } else {
      heroContainer.appendChild(list);
    }
  });
})();
