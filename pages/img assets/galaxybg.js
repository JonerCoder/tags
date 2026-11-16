(() => {
  function startCosmicStarfield() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "0"
    });

    document.body.prepend(canvas);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const STAR_TYPES = [
      { name: "white", rgb: "231,239,255", size: 0.9, weight: 0.58 },
      { name: "gold", rgb: "255,221,160", size: 1.05, weight: 0.12 },
      { name: "red", rgb: "255,151,145", size: 0.92, weight: 0.07 },
      { name: "blue", rgb: "140,190,255", size: 1.2, weight: 0.08 },
      { name: "cyan", rgb: "140,238,255", size: 1.05, weight: 0.05 },
      { name: "giant", rgb: "255,184,128", size: 1.55, weight: 0.04 },
      { name: "pulsar", rgb: "205,225,255", size: 1.15, weight: 0.02 },
      { name: "binary", rgb: "255,218,185", size: 1.1, weight: 0.02 },
      { name: "nova", rgb: "255,190,235", size: 1.35, weight: 0.02 }
    ];

    const NEBULAE = [
      { x: 0.16, y: 0.23, color: "85,75,190", radius: 300, alpha: 0.09, phase: 0.2 },
      { x: 0.78, y: 0.22, color: "35,130,190", radius: 330, alpha: 0.075, phase: 1.7 },
      { x: 0.67, y: 0.82, color: "160,65,135", radius: 360, alpha: 0.065, phase: 3.2 },
      { x: 0.12, y: 0.78, color: "45,100,170", radius: 310, alpha: 0.065, phase: 4.5 }
    ];

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame = 0;
    let stars = [];
    let ripples = [];
    let meteors = [];
    let satellites = [];
    let comets = [];

    const pointer = {
      x: null,
      y: null,
      active: false,
      targetX: 0,
      targetY: 0,
      smoothX: 0,
      smoothY: 0
    };

    function chooseStarType() {
      let roll = Math.random();

      for (const type of STAR_TYPES) {
        roll -= type.weight;
        if (roll <= 0) return type;
      }

      return STAR_TYPES[0];
    }

    function resize() {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const count = Math.max(
        90,
        Math.min(175, Math.floor((width * height) / 9500))
      );

      stars = Array.from({ length: count }, () => {
        const depth = Math.random() * 0.68 + 0.32;
        const type = chooseStarType();
        const isAnchor = Math.random() > 0.89 && depth > 0.65;
        const baseSize = isAnchor
          ? Math.random() * 0.65 + 1.4
          : (Math.random() * 0.9 + 0.35) * (0.7 + depth * 0.45);

        return {
          x: Math.random() * width,
          y: Math.random() * height,
          drawX: 0,
          drawY: 0,
          depth,
          type: type.name,
          rgb: type.rgb,
          radius: baseSize * type.size,
          baseAlpha: isAnchor ? 0.84 : 0.23 + depth * 0.5,
          twinkleSpeed: Math.random() * 0.025 + 0.006,
          phase: Math.random() * Math.PI * 2,
          baseVX: (Math.random() - 0.5) * 0.18 * depth,
          baseVY: (Math.random() - 0.5) * 0.18 * depth,
          vx: 0,
          vy: 0,
          isAnchor,
          orbit: Math.random() * Math.PI * 2,
          orbitSpeed: (Math.random() * 0.018 + 0.008) *
            (Math.random() < 0.5 ? -1 : 1)
        };
      });
    }

    function drawNebulae() {
      for (const nebula of NEBULAE) {
        const drift = reducedMotion
          ? 0
          : Math.sin(frame * 0.0015 + nebula.phase) * 12;
        const x = nebula.x * width + drift - pointer.smoothX * 34;
        const y = nebula.y * height - pointer.smoothY * 34;
        const gradient = ctx.createRadialGradient(
          x, y, 0, x, y, nebula.radius
        );

        gradient.addColorStop(0, `rgba(${nebula.color},${nebula.alpha})`);
        gradient.addColorStop(
          0.52,
          `rgba(${nebula.color},${nebula.alpha * 0.42})`
        );
        gradient.addColorStop(1, `rgba(${nebula.color},0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          x - nebula.radius,
          y - nebula.radius,
          nebula.radius * 2,
          nebula.radius * 2
        );
      }
    }

    function drawStar(star, alpha) {
      const x = star.drawX;
      const y = star.drawY;

      if (star.type === "pulsar") {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(reducedMotion ? star.phase : frame * 0.018 + star.phase);
        ctx.fillStyle = `rgba(${star.rgb},${alpha * 0.12})`;
        ctx.beginPath();
        ctx.ellipse(
          0, 0, star.radius * 7, star.radius * 0.38, 0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      }

      if (star.type === "binary") {
        if (!reducedMotion) star.orbit += star.orbitSpeed;

        const orbitRadius = star.radius * 2.7;
        const companionX = x + Math.cos(star.orbit) * orbitRadius;
        const companionY = y + Math.sin(star.orbit) * orbitRadius * 0.58;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(companionX, companionY);
        ctx.strokeStyle = `rgba(${star.rgb},${alpha * 0.17})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(companionX, companionY, Math.max(0.7, star.radius * 0.38), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,239,220,${alpha})`;
        ctx.fill();
      }

      if (star.type === "giant" || star.type === "blue" || star.type === "nova") {
        const glowRadius = star.radius * (star.type === "nova" ? 5.4 : 3.8);
        const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);

        glow.addColorStop(0, `rgba(${star.rgb},${alpha * 0.28})`);
        glow.addColorStop(1, `rgba(${star.rgb},0)`);

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (star.isAnchor) {
        const flare = star.radius * 4.5;

        ctx.strokeStyle = `rgba(${star.rgb},${alpha * 0.32})`;
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        ctx.moveTo(x - flare, y);
        ctx.lineTo(x + flare, y);
        ctx.moveTo(x, y - flare);
        ctx.lineTo(x, y + flare);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(x, y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${star.rgb},${alpha})`;
      ctx.fill();
    }

    function addRipple(x, y) {
      ripples.push({
        x,
        y,
        radius: 4,
        alpha: 0.36,
        speed: 4.2 + Math.random() * 1.2
      });

      if (ripples.length > 8) ripples.shift();
    }

    function drawRipples() {
      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];

        ripple.radius += ripple.speed;
        ripple.alpha *= 0.955;

        if (ripple.alpha < 0.012) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(205,225,255,${ripple.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(
          ripple.x,
          ripple.y,
          Math.max(0, ripple.radius - 8),
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = `rgba(155,190,255,${ripple.alpha * 0.22})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    function spawnMeteor() {
      const angle = 0.52 + Math.random() * 0.25;
      const speed = 8 + Math.random() * 5;

      meteors.push({
        x: Math.random() * width,
        y: Math.random() * height * 0.45,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 45 + Math.random() * 65,
        life: 1
      });
    }

    function drawMeteors() {
      if (!reducedMotion && Math.random() < 0.0018 && meteors.length < 2) {
        spawnMeteor();
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const meteor = meteors[i];

        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        meteor.life -= 0.018;

        if (
          meteor.life <= 0 ||
          meteor.x > width + 100 ||
          meteor.y > height + 100
        ) {
          meteors.splice(i, 1);
          continue;
        }

        const tailX = meteor.x - meteor.vx * (meteor.length / 10);
        const tailY = meteor.y - meteor.vy * (meteor.length / 10);
        const gradient = ctx.createLinearGradient(
          meteor.x, meteor.y, tailX, tailY
        );

        gradient.addColorStop(0, `rgba(245,248,255,${meteor.life * 0.82})`);
        gradient.addColorStop(0.35, `rgba(180,210,255,${meteor.life * 0.35})`);
        gradient.addColorStop(1, "rgba(180,210,255,0)");

        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
    }

    function spawnCometArc() {
      const direction = Math.random() < 0.5 ? 1 : -1;

      comets.push({
        x: width * (0.25 + Math.random() * 0.5),
        y: height * (0.18 + Math.random() * 0.45),
        radiusX: Math.min(width * 0.42, 300 + Math.random() * 220),
        radiusY: Math.min(height * 0.3, 100 + Math.random() * 110),
        startAngle: direction > 0 ? Math.PI * 1.05 : Math.PI * 1.95,
        sweep: direction * Math.PI * 0.72,
        progress: 0,
        speed: 0.002 + Math.random() * 0.001,
        tailLength: 0.22 + Math.random() * 0.1
      });
    }

    function drawComets() {
      // Rare comet arcs.
      if (!reducedMotion && Math.random() < 0.00006 && comets.length === 0) {
        spawnCometArc();
      }

      for (let i = comets.length - 1; i >= 0; i--) {
        const comet = comets[i];
        comet.progress += comet.speed;

        if (comet.progress > 1) {
          comets.splice(i, 1);
          continue;
        }

        const start = Math.max(0, comet.progress - comet.tailLength);
        const startAngle = comet.startAngle + start * comet.sweep;
        const endAngle = comet.startAngle + comet.progress * comet.sweep;

        const headX = comet.x + Math.cos(endAngle) * comet.radiusX;
        const headY = comet.y + Math.sin(endAngle) * comet.radiusY;
        const tailX = comet.x + Math.cos(startAngle) * comet.radiusX;
        const tailY = comet.y + Math.sin(startAngle) * comet.radiusY;

        ctx.beginPath();
        ctx.ellipse(
          comet.x,
          comet.y,
          comet.radiusX,
          comet.radiusY,
          0,
          startAngle,
          endAngle,
          comet.sweep < 0
        );

        const trail = ctx.createLinearGradient(tailX, tailY, headX, headY);
        trail.addColorStop(0, "rgba(150,190,255,0)");
        trail.addColorStop(0.68, "rgba(175,210,255,0.16)");
        trail.addColorStop(1, "rgba(255,248,225,0.72)");

        ctx.strokeStyle = trail;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        const glow = ctx.createRadialGradient(headX, headY, 0, headX, headY, 16);
        glow.addColorStop(0, "rgba(255,250,230,0.7)");
        glow.addColorStop(0.3, "rgba(200,225,255,0.2)");
        glow.addColorStop(1, "rgba(180,210,255,0)");

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(headX, headY, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function spawnSatellite() {
      const fromLeft = Math.random() < 0.5;

      satellites.push({
        x: fromLeft ? -30 : width + 30,
        y: height * (0.12 + Math.random() * 0.72),
        vx: fromLeft ? 0.65 + Math.random() * 0.55 : -(0.65 + Math.random() * 0.55),
        vy: (Math.random() - 0.5) * 0.12,
        phase: Math.random() * Math.PI * 2,
        blinkSpeed: 0.07 + Math.random() * 0.08,
        life: 1,
        size: 1.5 + Math.random()
      });
    }

    function drawSatellites() {
      if (!reducedMotion && Math.random() < 0.00012 && satellites.length < 2) {
        spawnSatellite();
      }

      for (let i = satellites.length - 1; i >= 0; i--) {
        const satellite = satellites[i];

        satellite.x += satellite.vx;
        satellite.y += satellite.vy;
        satellite.phase += satellite.blinkSpeed;
        satellite.life -= 0.0015;

        if (
          satellite.life <= 0 ||
          satellite.x < -50 ||
          satellite.x > width + 50
        ) {
          satellites.splice(i, 1);
          continue;
        }

        const blink = 0.25 + Math.max(0, Math.sin(satellite.phase)) * 0.75;
        const tailX = satellite.x - satellite.vx * 9;
        const tailY = satellite.y - satellite.vy * 9;

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(satellite.x, satellite.y);
        ctx.strokeStyle = `rgba(170,200,235,${0.18 * blink * satellite.life})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        ctx.save();
        ctx.translate(satellite.x, satellite.y);
        ctx.rotate(Math.atan2(satellite.vy, satellite.vx));

        ctx.fillStyle = `rgba(225,235,255,${0.8 * blink * satellite.life})`;
        ctx.fillRect(-satellite.size * 1.8, -0.5, satellite.size * 3.6, 1);

        ctx.fillStyle = `rgba(170,205,255,${0.5 * blink * satellite.life})`;
        ctx.fillRect(-satellite.size * 3.2, -1.8, satellite.size * 1.2, 3.6);
        ctx.fillRect(satellite.size * 2, -1.8, satellite.size * 1.2, 3.6);

        ctx.restore();

        if (blink > 0.88) {
          ctx.beginPath();
          ctx.arc(satellite.x, satellite.y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${blink * satellite.life})`;
          ctx.fill();
        }
      }
    }

    function drawConstellations() {
      const maxDistance = 150;
      const maxConnections = 2;
      const edges = new Map();

      for (let i = 0; i < stars.length; i++) {
        const first = stars[i];
        const neighbors = [];

        for (let j = 0; j < stars.length; j++) {
          if (i === j) continue;

          const second = stars[j];
          const distance = Math.hypot(
            first.drawX - second.drawX,
            first.drawY - second.drawY
          );

          if (distance < maxDistance) {
            neighbors.push({ index: j, distance });
          }
        }

        neighbors.sort((a, b) => a.distance - b.distance);

        for (const neighbor of neighbors.slice(0, maxConnections)) {
          const low = Math.min(i, neighbor.index);
          const high = Math.max(i, neighbor.index);
          const key = `${low}-${high}`;

          if (!edges.has(key)) {
            edges.set(key, {
              first: stars[low],
              second: stars[high],
              distance: neighbor.distance
            });
          }
        }
      }

      for (const { first, second, distance } of edges.values()) {
        const depth = (first.depth + second.depth) * 0.5;
        const alpha = (1 - distance / maxDistance) * 0.48 * depth;

        ctx.beginPath();
        ctx.moveTo(first.drawX, first.drawY);
        ctx.lineTo(second.drawX, second.drawY);
        ctx.strokeStyle = `rgba(210,228,255,${alpha})`;
        ctx.lineWidth = 0.9 * depth;
        ctx.stroke();
      }

      if (pointer.active && pointer.x !== null) {
        for (const star of stars) {
          const distance = Math.hypot(
            star.drawX - pointer.x,
            star.drawY - pointer.y
          );

          if (distance < 175) {
            ctx.beginPath();
            ctx.moveTo(star.drawX, star.drawY);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.strokeStyle =
              `rgba(200,225,255,${(1 - distance / 175) * 0.38})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      frame++;
      ctx.clearRect(0, 0, width, height);

      pointer.smoothX += (pointer.targetX - pointer.smoothX) * 0.055;
      pointer.smoothY += (pointer.targetY - pointer.smoothY) * 0.055;

      drawNebulae();

      if (pointer.active && pointer.x !== null) {
        const glow = ctx.createRadialGradient(
          pointer.x, pointer.y, 0,
          pointer.x, pointer.y, 190
        );
        glow.addColorStop(0, "rgba(180,210,255,0.045)");
        glow.addColorStop(1, "rgba(180,210,255,0)");

        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
      }

      drawMeteors();
      drawComets();
      drawSatellites();
      drawRipples();

      for (const star of stars) {
        if (pointer.active && pointer.x !== null) {
          const dx = pointer.x - star.drawX;
          const dy = pointer.y - star.drawY;
          const distance = Math.hypot(dx, dy);

          if (distance > 1 && distance < 175) {
            const force = (1 - distance / 175) * 0.008 * star.depth;
            star.vx += (dx / distance) * force;
            star.vy += (dy / distance) * force;
          }
        }

        star.vx += (star.baseVX - star.vx) * 0.035;
        star.vy += (star.baseVY - star.vy) * 0.035;
        star.x += star.vx;
        star.y += star.vy;

        if (star.x < -30) star.x = width + 30;
        if (star.x > width + 30) star.x = -30;
        if (star.y < -30) star.y = height + 30;
        if (star.y > height + 30) star.y = -30;

        // Stronger parallax for nearer stars.
        star.drawX = star.x - pointer.smoothX * 70 * star.depth;
        star.drawY = star.y - pointer.smoothY * 70 * star.depth;

        const twinkle = reducedMotion
          ? 0
          : Math.sin(frame * star.twinkleSpeed + star.phase) * 0.14;
        const novaPulse =
          star.type === "nova" && !reducedMotion
            ? Math.sin(frame * 0.035 + star.phase) * 0.12
            : 0;
        const alpha = Math.max(
          0.12,
          Math.min(0.98, star.baseAlpha + twinkle + novaPulse)
        );

        drawStar(star, alpha);
      }

      drawConstellations();
      requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resize);

    window.addEventListener("pointermove", (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      pointer.targetX = (event.clientX / width - 0.5) * 2;
      pointer.targetY = (event.clientY / height - 0.5) * 2;
    });

    window.addEventListener("pointerleave", () => {
      pointer.active = false;
      pointer.targetX = 0;
      pointer.targetY = 0;
    });

    window.addEventListener("pointerdown", (event) => {
      addRipple(event.clientX, event.clientY);

      for (const star of stars) {
        const dx = star.drawX - event.clientX;
        const dy = star.drawY - event.clientY;
        const distance = Math.hypot(dx, dy);

        if (distance > 1 && distance < 190) {
          const force = (1 - distance / 190) * 1.7 * star.depth;
          star.vx += (dx / distance) * force;
          star.vy += (dy / distance) * force;
        }
      }
    });

    resize();
    animate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startCosmicStarfield, {
      once: true
    });
  } else {
    startCosmicStarfield();
  }
})();