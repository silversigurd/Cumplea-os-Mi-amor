/**
 * ============================================================
 *  CUMPLEAÑOS — VIAJE DIGITAL ❤️
 *  main.js — Lógica principal
 * ============================================================
 *
 *  ÍNDICE DE SECCIONES:
 *  1.  CONFIGURACIÓN — personaliza aquí tus datos
 *  2.  PARTÍCULAS & ESTRELLAS (fondo Hero)
 *  3.  ANIMACIONES DE ENTRADA (Hero GSAP timeline)
 *  4.  INICIALIZACIÓN DEL MAPA LEAFLET
 *  5.  DIBUJO DE MARCADORES Y ARCO ANIMADO
 *  6.  GSAP SCROLLTRIGGER — narrativa del viaje
 *  7.  TARJETA DE MEMORIA (popup personalizado)
 *  8.  SECCIÓN FINAL — confeti + video
 *  9.  CONTROL DE MÚSICA
 * ============================================================
 */

/* ----------------------------------------------------------
   HELPER: espera a que todos los scripts diferidos estén listos
---------------------------------------------------------- */
window.addEventListener('DOMContentLoaded', () => {
  // Los CDNs están cargados con `defer`, así que este orden es seguro
  init();
});

function init() {
  /* ==========================================================
     1. ✏️  CONFIGURACIÓN — PERSONALIZA AQUÍ
  ========================================================== */
  const CONFIG = {

    /* ── Tu ubicación (Punto A) ──────────────────────────── */
    locationA: {
      lat: -34.9205,         // La Plata, Argentina
      lng: -57.9543,
      label: 'La Plata, Argentina',
      emoji: 'AR',
    },

    /* ── Ubicación de ella (Punto B) ─────────────────────── */
    locationB: {
      lat: 1.8079,           // Tumaco, Colombia
      lng: -78.7554,
      label: 'Tumaco, Colombia',
      emoji: 'COL',
    },

    /* ── Hitos de memoria ────────────────────────────────── */
    /*
     * Agrega entre 1 y 5 hitos.
     * Cada hito tiene:
     *  - lat / lng: coordenadas del marcador en el mapa
     *  - zoom:      nivel de zoom al llegar (8 = continental, 12 = ciudad)
     *  - photo:     ruta a tu foto (ej: 'fotos/recuerdo1.jpg')
     *              o URL pública de imágen
     *  - date:      texto libre para la fecha del recuerdo
     *  - message:   tu texto / mensaje del recuerdo
     *  - mapLabel:  pequeño texto que aparece en el mapa
     */
    milestones: [
      {
        // Hito 1 — La Plata (primera cita)
        lat: -34.9243,
        lng: -57.9590,
        zoom: 10,
        // ✏️ CAMBIA por 'fotos/recuerdo1.jpg' con tu foto real
        photo: 'fotos/PrimeraCita.jpeg',
        date: '25 • Febrero • 2024',
        type: 'image',
        message: 'Aquí fue nuestra primera cita, nunca voy a olvidar lo nerviosa que estabas mi amor. ❤️',
        mapLabel: 'Primera cita ✨',
      },
      {
        // Hito 2 — Bogotá, Colombia (punto intermedio del viaje)
        // ✏️ CAMBIA por las coordenadas de un lugar especial para ustedes
        lat: -34.5945093,
        lng: -58.4505761,
        zoom: 5,
        // ✏️ CAMBIA por 'fotos/recuerdo2.jpg'
        photo: 'fotos/PrimerConcierto.jpeg',
        date: '20 • Agosto • 2024',
        type: 'image',
        message: 'El día que fuimos a nuestro primer concierto juntos.🎶❤️',
        mapLabel: 'Primer concierto 🎙️',
      },
      {
        // Hito 3 — Tumaco, llegada
        lat: 1.8175109,
        lng: -78.7613406,
        zoom: 10,
        // ✏️ CAMBIA por 'fotos/recuerdo3.jpg'
        photo: 'fotos/AñoNuevo.mp4',
        date: '31 • Diciembre • 2024',
        type: 'video',
        message: 'Año nuevo juntos, tuve la bendicion de pasarlo junto a el amor de mi vida y junto a mis papás.😍',
        mapLabel: 'Año nuevo 🎉',
      },
    ],

    /* ── Zoom del mapa al inicio (vista global) ──────────── */
    initialZoom: 2,

    /* ── Duración (ms) de la animación pan/zoom del mapa ─── */
    mapAnimDuration: 1.8,

    /* ── Colores del arco (línea que conecta A con B) ─────── */
    arcColor: '#e06b8b',
    arcColorMid: '#f0c27f',
  };

  /* ==========================================================
     2. PARTÍCULAS & ESTRELLAS — Hero background
  ========================================================== */
  (function setupStars() {
    const container = document.getElementById('stars-bg');
    if (!container) return;
    const count = window.innerWidth < 600 ? 60 : 120;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const size = Math.random() * 2.5 + 0.5;
      s.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random() * 100}%;
        top:${Math.random() * 100}%;
        --dur:${(Math.random() * 3 + 2).toFixed(1)}s;
        --delay:${(Math.random() * 4).toFixed(1)}s;
        opacity:${Math.random() * 0.5 + 0.1};
      `;
      container.appendChild(s);
    }
  })();

  /* ==========================================================
     3. ANIMACIONES HERO con GSAP
  ========================================================== */
  gsap.registerPlugin(ScrollTrigger);

  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTl
    .to('.hero-tag', { opacity: 1, y: 0, duration: 0.7, delay: 0.3 })
    .to('.hero-title', { opacity: 1, y: 0, duration: 0.9 }, '-=0.3')
    .to('.hero-subtitle', { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
    .to('.cta-button', { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
    .to('.hero-hint', { opacity: 1, duration: 0.5 }, '-=0.2');

  /* Botón CTA → scroll suave al mapa + inicio de música */
  document.getElementById('cta-btn').addEventListener('click', () => {
    document.getElementById('map-section').scrollIntoView({ behavior: 'smooth' });
    startMusic();
  });

  /* ==========================================================
     4. INICIALIZACIÓN DEL MAPA LEAFLET
  ========================================================== */
  // Centro inicial entre los dos puntos
  const centerLat = (CONFIG.locationA.lat + CONFIG.locationB.lat) / 2;
  const centerLng = (CONFIG.locationA.lng + CONFIG.locationB.lng) / 2;

  const map = L.map('map', {
    center: [centerLat, centerLng],
    zoom: CONFIG.initialZoom,
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: false, // el scroll lo controla GSAP, no Leaflet
    dragging: false,        // mismo motivo
    doubleClickZoom: false,
  });

  /* Tiles CartoDB Positron (minimalista, perfecto para este proyecto) */
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map);

  /* ==========================================================
     5. MARCADORES PERSONALIZADOS + ARCO ANIMADO
  ========================================================== */

  /* ── Función para crear íconos HTML personalizados ──────── */
  function createIcon(extraClass, innerChar) {
    return L.divIcon({
      className: '',
      html: `<div class="custom-marker ${extraClass}"><div class="inner">${innerChar}</div></div>`,
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });
  }

  /* ── Marcador A — Tu ubicación ──────────────────────────── */
  const markerA = L.marker([CONFIG.locationA.lat, CONFIG.locationA.lng], {
    icon: createIcon('marker-a', CONFIG.locationA.emoji),
    zIndexOffset: 10,
  }).addTo(map);
  markerA.bindTooltip(CONFIG.locationA.label, {
    permanent: false, className: 'map-label', direction: 'top',
  });

  /* ── Marcador B — Ubicación de ella ─────────────────────── */
  const markerB = L.marker([CONFIG.locationB.lat, CONFIG.locationB.lng], {
    icon: createIcon('marker-b', CONFIG.locationB.emoji),
    zIndexOffset: 10,
  }).addTo(map);
  markerB.bindTooltip(CONFIG.locationB.label, {
    permanent: false, className: 'map-label', direction: 'top',
  });

  /* ── Marcadores de hitos (ocultos al inicio) ────────────── */
  const milestoneMarkers = CONFIG.milestones.map((m, i) => {
    const mk = L.marker([m.lat, m.lng], {
      icon: createIcon('marker-milestone', '★'),
      opacity: 0,
    }).addTo(map);
    mk.bindTooltip(m.mapLabel, {
      permanent: false, className: 'map-label', direction: 'top',
    });
    return mk;
  });

  /* ── Arco geodésico animado ─────────────────────────────── */
  /*
   * Leaflet no dibuja arcos curvos nativamente.
   * Interpolamos puntos manualmente siguiendo una curva cuadrática de Bézier
   * sobre coordenadas lat/lng para simular un arco «de avión».
   */
  function buildArcPoints(latA, lngA, latB, lngB, numPts = 120) {
    const pts = [];
    // Control point: punto medio elevado hacia el ecuador para curvar "hacia arriba"
    const midLat = (latA + latB) / 2 + Math.abs(latA - latB) * 0.3;
    const midLng = (lngA + lngB) / 2;
    for (let i = 0; i <= numPts; i++) {
      const t = i / numPts;
      const lat = (1 - t) * (1 - t) * latA + 2 * (1 - t) * t * midLat + t * t * latB;
      const lng = (1 - t) * (1 - t) * lngA + 2 * (1 - t) * t * midLng + t * t * lngB;
      pts.push([lat, lng]);
    }
    return pts;
  }

  const allArcPoints = buildArcPoints(
    CONFIG.locationA.lat, CONFIG.locationA.lng,
    CONFIG.locationB.lat, CONFIG.locationB.lng
  );

  /* Empezamos con 0 puntos; iremos "dibujando" el arco con el scroll */
  const arcLine = L.polyline([], {
    color: CONFIG.arcColor,
    weight: 2,
    opacity: 0.85,
    dashArray: '6 4',
    lineCap: 'round',
  }).addTo(map);

  /* Objeto proxy para GSAP — anima la propiedad `progress` (0 → 1) */
  const arcProxy = { progress: 0 };

  function updateArc(progress) {
    const endIdx = Math.floor(progress * allArcPoints.length);
    arcLine.setLatLngs(allArcPoints.slice(0, endIdx));
  }

  /* ==========================================================
     6. DETECCIÓN DE MÓVIL + NAVEGACIÓN POR PASOS
  ========================================================== */
  /*
   * En móvil (pantalla < 768px o dispositivo táctil):
   *   - La sección del mapa se reduce a 100vh (no hay 500vh que scrollear)
   *   - La navegación es EXCLUSIVAMENTE por botones Anterior / Siguiente
   *   - El arco se dibuja completo al inicio (sin animación de scroll)
   *
   * En desktop:
   *   - Se mantiene 500vh + GSAP ScrollTrigger para el arco
   *   - Los botones también funcionan (complementario)
   */
  const isMobile = window.innerWidth < 768 || ('ontouchstart' in window);

  if (isMobile) {
    // Reducir la sección del mapa — no hay scroll narrativo
    document.getElementById('map-section').style.height = '100vh';
    // Dibujar el arco completo de entrada
    updateArc(1);
  }

  /* ── Estado de navegación ─────────────────────────────── */
  // navStep: -1 = vista global, 0..N-1 = hitos, N = final
  let navStep = -1;
  const NAV_TOTAL = CONFIG.milestones.length; // ej. 3
  let currentMilestoneIdx = -1;

  /* ── Generar puntos indicadores ───────────────────────── */
  const dotsContainer = document.getElementById('step-dots');
  // Puntos: [vista global, hito0, hito1, hito2, final]
  const dotCount = NAV_TOTAL + 2; // global + N hitos + final
  for (let i = 0; i < dotCount; i++) {
    const dot = document.createElement('button');
    dot.className = 'step-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Paso ${i + 1}`);
    dot.addEventListener('click', () => goToNavStep(i - 1)); // -1 = global
    dotsContainer.appendChild(dot);
  }

  /* ── Función central de navegación ───────────────────── */
  function goToNavStep(step) {
    navStep = Math.max(-1, Math.min(step, NAV_TOTAL));

    if (navStep === -1) {
      /* Vista global: muestra ambos marcadores y arco completo */
      hideMemoryCard();
      currentMilestoneIdx = -1;
      map.flyTo([centerLat, centerLng], CONFIG.initialZoom, {
        animate: true, duration: 1.4, easeLinearity: 0.5,
      });
      updateArc(1);
      updateProgress(0, '✈️ Iniciando viaje...');

    } else if (navStep < NAV_TOTAL) {
      /* Hito de memoria */
      activateMilestone(navStep);
      currentMilestoneIdx = navStep;
      const pct = Math.round(((navStep + 1) / (NAV_TOTAL + 1)) * 100);
      updateProgress(pct, '💭 Recordando momentos especiales...');

    } else {
      /* Paso final — confeti + revelar sección */
      hideMemoryCard();
      currentMilestoneIdx = NAV_TOTAL;
      map.flyTo([CONFIG.locationB.lat, CONFIG.locationB.lng], 8, {
        animate: true, duration: 1.4, easeLinearity: 0.5,
      });
      updateProgress(100, '🎉 ¡Llegamos!');
      triggerConfetti();
      // Revelar sección final y hacer scroll hacia ella
      gsap.to('#final-section', { opacity: 1, duration: 1, delay: 0.3 });
      setTimeout(() => {
        document.getElementById('final-section').scrollIntoView({ behavior: 'smooth' });
      }, 600);
    }

    refreshNavUI();
  }

  /* ── Sincroniza botones y dots con el estado actual ─── */
  function refreshNavUI() {
    const prevBtn = document.getElementById('nav-prev');
    const nextBtn = document.getElementById('nav-next');
    const nextLabel = nextBtn.querySelector('.nav-next-label');
    const dots = document.querySelectorAll('.step-dot');

    prevBtn.disabled = navStep <= -1;
    nextBtn.disabled = navStep >= NAV_TOTAL;

    // Cambiar texto del botón "Siguiente" en el último hito
    if (nextLabel) {
      nextLabel.textContent = navStep === NAV_TOTAL - 1 ? '¡Llegar!' : 'Siguiente';
    }

    // Actualizar dots — el dot 0 = vista global, dot i+1 = hito i, dot last = final
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === navStep + 1);
    });
  }

  /* ── Helpers de progreso ─────────────────────────────── */
  function updateProgress(pct, label) {
    document.getElementById('journey-progress').style.width = pct + '%';
    const el = document.getElementById('progress-label');
    if (el) el.textContent = label;
  }

  /* ── Botones prev / next ─────────────────────────────── */
  document.getElementById('nav-prev').addEventListener('click', () => {
    goToNavStep(navStep - 1);
  });
  document.getElementById('nav-next').addEventListener('click', () => {
    goToNavStep(navStep + 1);
  });

  /* ==========================================================
     6b. SCROLLTRIGGER (solo desktop — complementa los botones)
  ========================================================== */
  if (!isMobile) {
    ScrollTrigger.create({
      trigger: '#map-section',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;

        /* Arco: se dibuja entre el 0% y 50% del scroll */
        updateArc(Math.min(p / 0.5, 1));

        /* Hitos: se activan en la segunda mitad del scroll */
        if (p > 0.5) {
          const range = p - 0.5;
          const perStep = 0.4 / (NAV_TOTAL + 1);
          const idx = Math.min(Math.floor(range / perStep), NAV_TOTAL - 1);
          if (idx !== currentMilestoneIdx) {
            currentMilestoneIdx = idx;
            navStep = idx;
            activateMilestone(idx);
            refreshNavUI();
            const pct = Math.round(((idx + 1) / (NAV_TOTAL + 1)) * 100);
            updateProgress(pct, '💭 Recordando momentos especiales...');
          }
        } else if (p < 0.45 && currentMilestoneIdx !== -1) {
          currentMilestoneIdx = -1;
          navStep = -1;
          hideMemoryCard();
          refreshNavUI();
          updateProgress(Math.round(p * 50), '🌍 Cruzando el mundo...');
        }

        /* Fade de la sección final */
        if (p > 0.92) {
          gsap.to('#final-section', { opacity: (p - 0.92) / 0.08, duration: 0 });
        } else {
          gsap.to('#final-section', { opacity: 0, duration: 0 });
        }
      },
      onLeave: () => { triggerConfetti(); },
    });
  }

  /* ── Función: mover el mapa a un hito ───────────────────── */
  function activateMilestone(idx) {
    const m = CONFIG.milestones[idx];
    milestoneMarkers[idx].setOpacity(1);
    map.flyTo([m.lat, m.lng], m.zoom, {
      animate: true,
      duration: CONFIG.mapAnimDuration,
      easeLinearity: 0.5,
    });
    showMemoryCard(m);
  }


  /* ==========================================================
     7. TARJETA DE MEMORIA
  ========================================================== */
  function showMemoryCard(milestone) {
    const card = document.getElementById('memory-card');
    const photo = document.getElementById('memory-photo');
    const video = document.getElementById('memory-video');
    const date = document.getElementById('memory-date');
    const msg = document.getElementById('memory-msg');
    const mediaContainer = document.getElementById('memory-media-container');

    // Resetear visibilidad
    photo.style.display = 'none';
    video.style.display = 'none';
    video.pause();

    if (milestone.type === 'video') {
      video.src = milestone.photo;
      video.style.display = 'block';
      video.play().catch(() => { });
    } else {
      photo.src = milestone.photo;
      photo.style.display = 'block';
    }

    photo.alt = milestone.mapLabel;
    date.textContent = milestone.date;
    msg.textContent = milestone.message;

    card.setAttribute('aria-hidden', 'false');
    card.classList.add('is-visible');

    // Click en el contenedor abre el lightbox
    mediaContainer.onclick = () => openLightbox(milestone.photo, milestone.type);

    gsap.killTweensOf(card);
    gsap.to(card, {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: 'back.out(1.4)',
    });
  }

  function hideMemoryCard() {
    const card = document.getElementById('memory-card');
    const video = document.getElementById('memory-video');
    video.pause();

    gsap.to(card, {
      opacity: 0,
      scale: 0.85,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        card.setAttribute('aria-hidden', 'true');
        card.classList.remove('is-visible');
      },
    });
  }

  /* ==========================================================
     7b. LIGHTBOX (Visor de Media)
  ========================================================== */
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbVid = document.getElementById('lightbox-video');

  function openLightbox(src, type) {
    lbImg.style.display = 'none';
    lbVid.style.display = 'none';
    lbVid.pause();

    if (type === 'video') {
      lbVid.src = src;
      lbVid.style.display = 'block';
      lbVid.play().catch(() => { });
      // Bajar volumen de música al abrir video
      gsap.to(audio, { volume: 0.05, duration: 1 });
    } else {
      lbImg.src = src;
      lbImg.style.display = 'block';
    }

    lightbox.classList.add('is-visible');
    lightbox.setAttribute('aria-hidden', 'false');
  }

  function closeLightbox() {
    lightbox.classList.remove('is-visible');
    lightbox.setAttribute('aria-hidden', 'true');
    lbVid.pause();
    // Subir volumen de música al cerrar video
    gsap.to(audio, { volume: 0.35, duration: 1 });
  }

  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  /* Botón de cierre de la tarjeta */
  document.getElementById('memory-close').addEventListener('click', () => {
    hideMemoryCard();
  });

  /* ==========================================================
     8. SECCIÓN FINAL — CONFETI + VIDEO
  ========================================================== */
  let confettiFired = false;

  function triggerConfetti() {
    if (confettiFired) return;
    confettiFired = true;

    const duration = 4000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#e06b8b', '#f0c27f', '#c0445f', '#fff'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#5b8cff', '#e06b8b', '#f0c27f', '#fff'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  /*
   * Botón de play manual (por si el navegador bloquea autoplay)
   * Al hacer clic:
   *   - Para YouTube: rellena el src del iframe con ?autoplay=1
   *   - Para MP4 local: llama a video.play()
   */
  const playOverlay = document.getElementById('play-overlay');
  if (playOverlay) {
    playOverlay.addEventListener('click', () => {
      /* ── YouTube ── */
      const iframe = document.getElementById('yt-video');
      if (iframe) {
        // ✏️ CAMBIA el ID del video de YouTube aquí también, igual que en el HTML
        const ytId = 'dQw4w9WgXcQ'; // ← reemplaza con tu ID real
        iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
      }

      /* ── Video local ── */
      const localVid = document.getElementById('local-video');
      if (localVid) localVid.play();

      playOverlay.classList.add('hidden');
      triggerConfetti(); // segunda ráfaga al pulsar play
    });
  }

  /* ==========================================================
     9. CONTROL DE MÚSICA
  ========================================================== */
  const audio = document.getElementById('bg-music');
  const musicToggle = document.getElementById('music-toggle');
  let musicStarted = false;

  function startMusic() {
    if (musicStarted) return;
    /*
     * Intentamos pre-cargar y arrancar
     */
    audio.volume = 0;
    audio.play().then(() => {
      musicStarted = true;
      musicToggle.classList.add('playing');
      gsap.to(audio, { volume: 0.35, duration: 2 });
    }).catch((e) => {
      console.log("Esperando interacción para música...");
    });
  }

  // Intentar arrancar al primer scroll o toque si el botón no fue pulsado
  window.addEventListener('scroll', startMusic, { once: true });
  window.addEventListener('touchstart', startMusic, { once: true });
  window.addEventListener('mousedown', startMusic, { once: true });

  /* Controladores para el video final (local) */
  const finalVideo = document.getElementById('local-video');
  if (finalVideo) {
    finalVideo.addEventListener('play', () => {
      gsap.to(audio, { volume: 0.05, duration: 1 });
    });
    finalVideo.addEventListener('pause', () => {
      gsap.to(audio, { volume: 0.35, duration: 1 });
    });
    finalVideo.addEventListener('ended', () => {
      gsap.to(audio, { volume: 0.35, duration: 1 });
    });
  }

  musicToggle.addEventListener('click', () => {
    if (!musicStarted) {
      startMusic();
      return;
    }
    if (audio.paused) {
      audio.play();
      musicToggle.classList.add('playing');
      musicToggle.classList.remove('muted');
    } else {
      audio.pause();
      musicToggle.classList.remove('playing');
      musicToggle.classList.add('muted');
    }
  });

  /* ── Invalidar ScrollTrigger al redimensionar ────────────── */
  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });

  /* ── Invalidar instancias de Leaflet al redimensionar ─────── */
  window.addEventListener('resize', () => {
    setTimeout(() => map.invalidateSize(), 200);
  });

} /* fin init() */
