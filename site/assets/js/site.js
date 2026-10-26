(function () {
  const cfg = window.GZ || { lang: "it", base: "", assetBase: "", page: "home" };
  const base = cfg.base || "";
  const assetBase = cfg.assetBase != null ? cfg.assetBase : base;
  const isEn = cfg.lang === "en";

  const navIt = [
    { id: "home", href: "index.html", label: "Gianluca Zanello" },
    { id: "about", href: "about.html", label: "Chi sono" },
    { id: "media", href: "media.html", label: "Media" },
    { id: "spartiti", href: "spartiti.html", label: "Spartiti" },
    { id: "momo", href: "momo-orchestra.html", label: "Mòmo Orchestra" },
    { id: "extra", href: "extra.html", label: "Extra" },
    { id: "contacts", href: "contacts.html", label: "Contatti" },
  ];

  const navEn = [
    { id: "home", href: "index.html", label: "Gianluca Zanello" },
    { id: "about", href: "who-am-i.html", label: "Who am I" },
    { id: "media", href: "media.html", label: "Media" },
    { id: "spartiti", href: "sheet-music.html", label: "Sheet Music" },
    { id: "momo", href: "momo-orchestra.html", label: "Mòmo Orchestra" },
    { id: "extra", href: "extra.html", label: "Extra" },
    { id: "contacts", href: "contacts.html", label: "Contacts" },
  ];

  const nav = isEn ? navEn : navIt;
  const langPair = {
    home: ["index.html", "en/index.html"],
    about: ["about.html", "en/who-am-i.html"],
    media: ["media.html", "en/media.html"],
    spartiti: ["spartiti.html", "en/sheet-music.html"],
    momo: ["momo-orchestra.html", "en/momo-orchestra.html"],
    extra: ["extra.html", "en/extra.html"],
    contacts: ["contacts.html", "en/contacts.html"],
  };

  function injectChrome() {
    const header = document.getElementById("site-header");
    const footer = document.getElementById("site-footer");
    if (!header) return;

    const pair = langPair[cfg.page] || langPair.home;
    const itHref = isEn ? "../" + pair[0] : pair[0];
    const enHref = isEn ? pair[1].replace(/^en\//, "") : pair[1];

    const links = nav
      .map((item) => {
        const current = item.id === cfg.page ? ' aria-current="page"' : "";
        return `<li><a href="${base}${item.href}"${current}>${item.label}</a></li>`;
      })
      .join("");

    header.innerHTML = `
      <div class="container header-inner">
        <a class="logo" href="${base}index.html">
          <img src="${assetBase}assets/img/Logo_gian_giallo.png" alt="Gianluca Zanello" width="42" height="42">
          <span class="logo-text">Gianluca Zanello</span>
        </a>
        <nav class="nav-desktop" aria-label="Primary">
          <ul class="nav-desktop">${links}</ul>
          <div class="lang-switch">
            <a href="${itHref}" class="${isEn ? "" : "is-active"}">IT</a>
            <a href="${enHref}" class="${isEn ? "is-active" : ""}">EN</a>
          </div>
        </nav>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="nav-backdrop" id="nav-backdrop"></div>
      <nav class="nav-mobile" id="mobile-nav" aria-label="Mobile">
        <ul>${links}
          <li class="lang-switch" style="margin-top:1rem">
            <a href="${itHref}" class="${isEn ? "" : "is-active"}">IT</a>
            <a href="${enHref}" class="${isEn ? "is-active" : ""}">EN</a>
          </li>
        </ul>
      </nav>
    `;

    if (footer) {
      footer.innerHTML = `<div class="container"><p>Copyright © ${new Date().getFullYear()} - Gianluca Zanello</p></div>`;
    }

    const toggle = header.querySelector(".menu-toggle");
    const mobile = header.querySelector("#mobile-nav");
    const backdrop = header.querySelector("#nav-backdrop");
    let lastY = window.scrollY;
    let menuOpen = false;

    function closeMenu() {
      menuOpen = false;
      toggle.setAttribute("aria-expanded", "false");
      mobile.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      header.classList.remove("is-menu-open");
      document.body.classList.remove("is-nav-open");
    }

    function openMenu() {
      menuOpen = true;
      toggle.setAttribute("aria-expanded", "true");
      mobile.classList.add("is-open");
      backdrop.classList.add("is-open");
      header.classList.add("is-menu-open");
      header.classList.remove("is-hidden");
      document.body.classList.add("is-nav-open");
    }

    toggle.addEventListener("click", () => {
      if (menuOpen) closeMenu();
      else openMenu();
    });
    backdrop.addEventListener("click", closeMenu);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuOpen) closeMenu();
    });

    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY;
        header.classList.toggle("is-scrolled", y > 8);
        if (menuOpen) {
          lastY = y;
          return;
        }
        // Hide header when scrolling down, show when scrolling up
        if (y > lastY + 6 && y > 80) header.classList.add("is-hidden");
        else if (y < lastY - 4) header.classList.remove("is-hidden");
        if (y < 24) header.classList.remove("is-hidden");
        lastY = y;
      },
      { passive: true }
    );
  }

  function initPageMotion() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      document.documentElement.classList.add("is-ready");
    });
    if (reduced) return;

    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = a.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      let url;
      try {
        url = new URL(a.href, window.location.href);
      } catch (_) {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      e.preventDefault();
      document.documentElement.classList.add("is-leaving");
      window.setTimeout(() => {
        window.location.href = url.href;
      }, 220);
    });
  }

  function initMuteButtons() {
    const iconMuted =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.3 3.3 3 4.6l4.2 4.2H3v6h4l5 4V12.8l5.7 5.7 1.3-1.3L4.3 3.3zM14 3.5v5.7l2.8 2.8c.1-.3.2-.7.2-1V8l-3-4.5z"/></svg>';
    const iconUnmuted =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3c0-1.8-1-3.3-2.5-4v8c1.5-.7 2.5-2.2 2.5-4zM14 3.2v2.1c2.9.9 5 3.5 5 6.7s-2.1 5.9-5 6.7v2.1c4-.9 7-4.5 7-8.8s-3-7.9-7-8.8z"/></svg>';

    const cards = [...document.querySelectorAll(".musician-grid .video-card")];
    const otherCards = [...document.querySelectorAll(".video-card")].filter(
      (c) => !c.closest(".musician-grid")
    );

    function setMuted(card, muted) {
      const video = card.querySelector("video");
      const btn = card.querySelector(".mute-btn");
      if (!video || !btn) return;
      video.muted = muted;
      btn.innerHTML = muted ? iconMuted : iconUnmuted;
      btn.setAttribute("aria-label", muted ? "Attiva audio" : "Disattiva audio");
      card.classList.toggle("is-playing", !muted);
    }

    document.querySelectorAll(".mute-btn").forEach((btn) => {
      if (!btn.querySelector("svg")) btn.innerHTML = iconMuted;
    });

    function wireCard(card, soloWithin) {
      const video = card.querySelector("video");
      const btn = card.querySelector(".mute-btn");
      if (!video || !btn) return;

      const toggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const willUnmute = video.muted;
        if (willUnmute && soloWithin) {
          soloWithin.forEach((other) => {
            if (other !== card) setMuted(other, true);
          });
        }
        setMuted(card, !willUnmute);
        if (willUnmute) {
          video.play().catch(() => {});
        }
      };

      btn.addEventListener("click", toggle);
      // Click on card (not only the button) toggles audio for musician grid
      if (soloWithin) {
        card.addEventListener("click", (e) => {
          if (e.target.closest(".mute-btn")) return;
          toggle(e);
        });
      }
    }

    cards.forEach((card) => wireCard(card, cards));
    otherCards.forEach((card) => wireCard(card, null));
  }

  function positions() {
    return [
      "0% 0%",
      "50% 0%",
      "100% 0%",
      "0% 50%",
      "50% 50%",
      "100% 50%",
      "0% 100%",
      "50% 100%",
      "100% 100%",
    ];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (a.every((v, i) => v === i)) return shuffle(arr);
    return a;
  }

  function initPuzzles() {
    const pos = positions();
    document.querySelectorAll(".puzzle[data-image]").forEach((board) => {
      const image = board.dataset.image;
      const link = board.dataset.link;
      const order = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      board.innerHTML = "";
      let dragIndex = null;

      order.forEach((correctIndex, slot) => {
        const piece = document.createElement("div");
        piece.className = "piece";
        piece.draggable = true;
        piece.dataset.correct = String(correctIndex);
        piece.dataset.slot = String(slot);
        piece.style.backgroundImage = `url("${image}")`;
        piece.style.backgroundPosition = pos[correctIndex];
        board.appendChild(piece);
      });

      const linkEl = board.parentElement.querySelector(".puzzle-link");
      if (linkEl && link) linkEl.href = link;

      function checkSolved() {
        const pieces = [...board.querySelectorAll(".piece")];
        const solved = pieces.every((p, i) => Number(p.dataset.correct) === i);
        if (solved) {
          board.classList.add("is-solved");
          if (linkEl) linkEl.classList.add("is-visible");
          board.querySelectorAll(".piece").forEach((p) => (p.draggable = false));
        }
      }

      board.addEventListener("dragstart", (e) => {
        const piece = e.target.closest(".piece");
        if (!piece || board.classList.contains("is-solved")) return;
        dragIndex = [...board.children].indexOf(piece);
        e.dataTransfer.effectAllowed = "move";
      });

      board.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      board.addEventListener("drop", (e) => {
        e.preventDefault();
        const target = e.target.closest(".piece");
        if (!target || dragIndex === null) return;
        const children = [...board.children];
        const a = children[dragIndex];
        const dropIndex = children.indexOf(target);
        if (dropIndex === dragIndex) return;
        const placeholder = document.createElement("div");
        board.replaceChild(placeholder, a);
        board.replaceChild(a, target);
        board.replaceChild(target, placeholder);
        dragIndex = null;
        checkSolved();
      });

      // Touch-friendly tap-to-swap
      let selected = null;
      board.addEventListener("click", (e) => {
        if (board.classList.contains("is-solved")) {
          if (link) window.open(link, "_blank", "noopener");
          return;
        }
        const piece = e.target.closest(".piece");
        if (!piece) return;
        if (!selected) {
          selected = piece;
          piece.style.outline = "2px solid #ffcd05";
          return;
        }
        if (selected === piece) {
          selected.style.outline = "";
          selected = null;
          return;
        }
        selected.style.outline = "";
        const placeholder = document.createElement("div");
        board.replaceChild(placeholder, selected);
        board.replaceChild(selected, piece);
        board.replaceChild(piece, placeholder);
        selected = null;
        checkSolved();
      });
    });
  }

  function initScores() {
    const cards = document.querySelectorAll(".score-card");
    const drawer = document.getElementById("scoreDrawer");
    const tracklist = document.getElementById("scoreTracklist");
    const drawerTitle = document.getElementById("drawerTitle");
    const trackTitle = document.getElementById("scoreTrackTitle");
    const pdfFrame = document.getElementById("scorePdfFrame");
    const pdfScroll = document.getElementById("scorePdfScroll");
    const pdfPages = document.getElementById("scorePdfPages");
    const audioEl = document.getElementById("scoreAudio");
    const audioDock = document.getElementById("scoreAudioDock");
    const openPdf = document.getElementById("scoreOpenPdf");
    if (!drawer || !tracklist || !cards.length) return;

    const listenLabel = isEn ? "Listen" : "Ascolta";
    const scoreLabel = isEn ? "Score" : "Spartito";
    const loadingLabel = isEn ? "Loading score…" : "Caricamento spartito…";
    const errorLabel = isEn ? "Could not load this PDF." : "Impossibile caricare questo PDF.";
    const mobileMq = window.matchMedia("(max-width: 999.98px)");
    let renderToken = 0;
    let pdfjsReady = null;

    function useCanvasViewer() {
      return mobileMq.matches;
    }

    function pdfSrc(url) {
      if (!url) return "";
      const bare = url.split("#")[0];
      return `${bare}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
    }

    function loadPdfJs() {
      if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
      if (pdfjsReady) return pdfjsReady;
      const pdfSrcLocal = `${assetBase}assets/js/vendor/pdf.min.js`;
      const workerSrcLocal = `${assetBase}assets/js/vendor/pdf.worker.min.js`;
      pdfjsReady = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = pdfSrcLocal;
        script.onload = () => {
          if (!window.pdfjsLib) {
            reject(new Error("pdf.js missing"));
            return;
          }
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrcLocal;
          resolve(window.pdfjsLib);
        };
        script.onerror = () => reject(new Error("pdf.js failed"));
        document.head.appendChild(script);
      });
      return pdfjsReady;
    }

    function clearCanvasViewer() {
      if (pdfPages) pdfPages.innerHTML = "";
      if (pdfScroll) {
        pdfScroll.hidden = true;
        pdfScroll.scrollTop = 0;
      }
    }

    async function renderPdfToCanvas(url) {
      if (!pdfScroll || !pdfPages || !url) return;
      const token = ++renderToken;
      pdfScroll.hidden = false;
      pdfPages.innerHTML = `<p class="score-pdf-loading">${loadingLabel}</p>`;
      void pdfScroll.offsetWidth;

      try {
        const pdfjsLib = await loadPdfJs();
        if (token !== renderToken) return;

        const absolute = new URL(url.split("#")[0], window.location.href).href;
        const res = await fetch(absolute);
        if (!res.ok) throw new Error("PDF HTTP " + res.status);
        const data = await res.arrayBuffer();
        if (token !== renderToken) return;

        // Full buffer avoids Range-request bugs on PHP / some hosts / iOS
        const pdf = await pdfjsLib.getDocument({
          data,
          disableRange: true,
          disableStream: true,
          useSystemFonts: true,
        }).promise;
        if (token !== renderToken) return;

        pdfPages.innerHTML = "";
        const cssWidth = Math.max(280, pdfScroll.clientWidth - 24);

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (token !== renderToken) return;
          const page = await pdf.getPage(pageNum);
          const unscaled = page.getViewport({ scale: 1 });
          const scale = (cssWidth / unscaled.width) * (window.devicePixelRatio || 1);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", { alpha: false });
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = `${cssWidth}px`;
          canvas.style.height = `${Math.floor((cssWidth / unscaled.width) * unscaled.height)}px`;
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (token !== renderToken) return;
          pdfPages.appendChild(canvas);
        }
      } catch (err) {
        console.error("[scores] PDF render failed", err);
        if (token !== renderToken) return;
        pdfPages.innerHTML = `<p class="score-pdf-error">${errorLabel}</p>`;
      }
    }

    function stopAudio() {
      if (!audioEl) return;
      audioEl.pause();
      audioEl.removeAttribute("src");
      audioEl.load();
      if (audioDock) audioDock.hidden = true;
    }

    function closeDrawer() {
      drawer.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      stopAudio();
      renderToken += 1;
      if (pdfFrame) pdfFrame.removeAttribute("src");
      clearCanvasViewer();
    }

    let activePdf = "";

    function openTrack(item, btn) {
      tracklist.querySelectorAll(".score-track").forEach((el) => el.classList.remove("is-active"));
      if (btn) {
        btn.classList.add("is-active");
        btn.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }

      const title = item.dataset.title || "";
      const pdf = item.dataset.pdf || "";
      const audio = item.dataset.audio || "";
      activePdf = pdf;

      if (trackTitle) trackTitle.textContent = title;
      if (openPdf) openPdf.href = pdf;

      if (useCanvasViewer()) {
        if (pdfFrame) pdfFrame.removeAttribute("src");
        renderPdfToCanvas(pdf);
      } else {
        clearCanvasViewer();
        if (pdfFrame) pdfFrame.src = pdfSrc(pdf);
      }

      if (audio && audioEl && audioDock) {
        audioDock.hidden = false;
        audioEl.src = audio;
      } else {
        stopAudio();
      }
    }

    function openDrawer(card) {
      const items = [...card.querySelectorAll(".score-item-data")];
      if (!items.length) return;

      drawerTitle.textContent = card.dataset.title || "";
      tracklist.innerHTML = "";
      tracklist.classList.toggle("is-single", items.length === 1);

      const trackButtons = [];
      items.forEach((item) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "score-track";
        const hasAudio = Boolean(item.dataset.audio);
        btn.innerHTML = `
          <span class="score-track-name">${item.dataset.title || ""}</span>
          <span class="score-track-meta">${hasAudio ? listenLabel : scoreLabel}</span>`;
        btn.addEventListener("click", () => openTrack(item, btn));
        tracklist.appendChild(btn);
        trackButtons.push({ item, btn });
      });

      // Open first so mobile canvas can measure real width
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      requestAnimationFrame(() => {
        if (trackButtons[0]) openTrack(trackButtons[0].item, trackButtons[0].btn);
      });
    }

    cards.forEach((card) => {
      card.addEventListener("click", () => openDrawer(card));
    });

    drawer.querySelectorAll("[data-close-drawer]").forEach((el) => {
      el.addEventListener("click", closeDrawer);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) closeDrawer();
    });

    let resizeTimer;
    window.addEventListener("resize", () => {
      if (!drawer.classList.contains("is-open") || !useCanvasViewer() || !activePdf) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => renderPdfToCanvas(activePdf), 250);
    });
  }

  function initContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;
    const status = document.getElementById("form-status");
    const btn = form.querySelector('button[type="submit"]');
    const endpoint = form.getAttribute("action") || `${assetBase}send-mail.php`;
    const msgs = isEn
      ? {
          sending: "Sending…",
          ok: "Message sent. Thank you!",
          err: "Could not send the message. Please try again or write to info@gianlucazanello.it",
        }
      : {
          sending: "Invio in corso…",
          ok: "Messaggio inviato. Grazie!",
          err: "Invio non riuscito. Riprova oppure scrivi a info@gianlucazanello.it",
        };

    function setStatus(text, isError) {
      if (!status) return;
      status.hidden = !text;
      status.textContent = text || "";
      status.classList.toggle("is-error", Boolean(isError));
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;

      setStatus(msgs.sending, false);
      if (btn) btn.disabled = true;

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        const data = await res.json().catch(() => ({ ok: false }));
        if (!res.ok || !data.ok) throw new Error("send");
        form.reset();
        setStatus(msgs.ok, false);
      } catch (err) {
        setStatus(msgs.err, true);
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  function initReveal() {
    const nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    nodes.forEach((el) => io.observe(el));
  }

  function initMediaCards() {
    const cards = [...document.querySelectorAll(".gz-card")];
    if (!cards.length) return;

    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    cards.forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        if (canHover) return;

        const wasOpen = card.classList.contains("is-open");
        cards.forEach((c) => c.classList.remove("is-open"));
        if (!wasOpen) card.classList.add("is-open");
      });
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest(".gz-card")) return;
      cards.forEach((c) => c.classList.remove("is-open"));
    });
  }

  // Cascade juggling — same arc pattern as kilopertino home balls
  function initExtraJuggle() {
    const stage = document.getElementById("extraJuggle");
    if (!stage) return;

    const nodes = [...stage.querySelectorAll(".extra-ball")];
    if (nodes.length < 3) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const balls = nodes.map((el, index) => ({
      el,
      phase: Number(el.dataset.phase) || index,
      x: 0,
      y: 0,
    }));

    let beat = 0;
    let last = performance.now();
    let raf = 0;
    let visible = true;

    function arcPoint(u, fromLeft) {
      let x = fromLeft ? -1 + 2 * u : 1 - 2 * u;
      const y = 4 * u * (1 - u);
      const sep = 0.4 * Math.sin(Math.PI * u);
      x += fromLeft ? -sep : sep;
      return { x, y };
    }

    function orbitPoint(ball, layout) {
      const t = beat;
      const b = ball.phase;
      const s = b + 3 * Math.floor((t - b) / 3);
      const u = (t - s) / 3;
      const fromLeft = (((s % 2) + 2) % 2) === 0;
      const arc = arcPoint(u, fromLeft);
      return {
        x: layout.cx + arc.x * layout.rx * 0.92,
        y: layout.cy + (0.72 - arc.y * 1.55) * layout.ry * 0.92,
      };
    }

    function layoutNow() {
      const w = stage.clientWidth || 280;
      const h = stage.clientHeight || 240;
      return {
        cx: w * 0.5,
        cy: h * 0.66,
        rx: w * 0.36,
        ry: h * 0.3,
      };
    }

    function place(ball) {
      ball.el.style.transform = `translate(${ball.x}px, ${ball.y}px)`;
    }

    function settle() {
      const layout = layoutNow();
      balls.forEach((ball) => {
        const p = orbitPoint(ball, layout);
        ball.x = p.x;
        ball.y = p.y;
        place(ball);
      });
    }

    function tick(now) {
      if (!visible) {
        raf = 0;
        return;
      }
      const dt = Math.min(2.5, (now - last) / 16.67);
      last = now;
      if (!reduced) beat += 0.038 * dt;
      const layout = layoutNow();
      balls.forEach((ball) => {
        const p = orbitPoint(ball, layout);
        const ease = reduced ? 1 : 0.22;
        ball.x += (p.x - ball.x) * ease;
        ball.y += (p.y - ball.y) * ease;
        place(ball);
      });
      raf = requestAnimationFrame(tick);
    }

    function start() {
      if (raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }

    settle();
    if (!reduced) start();

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible && !reduced) start();
      },
      { threshold: 0.05 }
    );
    io.observe(stage);

    window.addEventListener("resize", settle);
  }

  document.addEventListener("DOMContentLoaded", () => {
    injectChrome();
    initPageMotion();
    initMuteButtons();
    initPuzzles();
    initScores();
    initContactForm();
    initReveal();
    initMediaCards();
    initExtraJuggle();
  });
})();
