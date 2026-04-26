(() => {
  const scene = document.getElementById("skills-scene");

  if (!scene) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const items = Array.from(scene.querySelectorAll(".skill-node"));
  const configMap = new Map([
    ["skill-node--sketch", { baseRotation: 0, radius: 62, delay: 0, startX: -24, startY: -260, settle: 0.034 }],
    ["skill-node--handdrawn", { baseRotation: 22, radius: 94, delay: 80, startX: -42, startY: -420, settle: 0.03 }],
    ["skill-node--blender", { baseRotation: -16, radius: 112, delay: 170, startX: 38, startY: -390, settle: 0.028 }],
    ["skill-node--photoshop", { baseRotation: 0, radius: 88, delay: 250, startX: -18, startY: -340, settle: 0.03 }],
    ["skill-node--ue5", { baseRotation: 0, radius: 70, delay: 330, startX: 30, startY: -360, settle: 0.032 }],
    ["skill-node--figma", { baseRotation: 0, radius: 78, delay: 420, startX: 16, startY: -380, settle: 0.031 }],
    ["skill-node--illustrator", { baseRotation: 0, radius: 86, delay: 520, startX: 48, startY: -460, settle: 0.029 }]
  ]);

  const bodies = items.map((item, index) => {
    const key = Array.from(configMap.keys()).find((name) => item.classList.contains(name));
    const config = key
      ? configMap.get(key)
      : { baseRotation: 0, radius: 80, delay: index * 90, startX: 0, startY: -360, settle: 0.03 };
    const jitterX = (Math.random() - 0.5) * 26;
    const jitterY = Math.random() * 80;
    const spin = (Math.random() - 0.5) * 24;

    return {
      item,
      radius: config.radius,
      baseRotation: config.baseRotation,
      tx: config.startX + jitterX,
      ty: config.startY - jitterY,
      vx: (Math.random() - 0.5) * 1.4,
      vy: 0,
      angle: config.baseRotation + spin,
      angularVelocity: spin * 0.045,
      settle: config.settle,
      released: false,
      releaseAt: performance.now() + config.delay + Math.random() * 110,
      phase: index * 0.8
    };
  });

  if (prefersReducedMotion) {
    bodies.forEach((body) => {
      body.item.style.opacity = "1";
      body.item.style.transform = `translate3d(0px, 0px, 0px) rotate(${body.baseRotation}deg)`;
    });
    return;
  }

  const pointer = {
    active: false,
    x: 0,
    y: 0
  };

  let frameId = 0;
  let lastTime = performance.now();

  const getCenter = (item, tx, ty) => {
    const left = item.offsetLeft + item.offsetWidth / 2 + tx;
    const top = item.offsetTop + item.offsetHeight / 2 + ty;
    return { left, top };
  };

  const tick = (now) => {
    const delta = Math.min((now - lastTime) / 16.6667, 2.4);
    lastTime = now;

    for (const body of bodies) {
      if (now >= body.releaseAt) {
        body.released = true;
        body.item.style.opacity = "1";
      }
    }

    for (const body of bodies) {
      if (!body.released) {
        continue;
      }

      body.vy += 0.72 * delta;
      body.vx += (-body.tx * body.settle) * delta;
      body.vy += (-body.ty * body.settle) * delta;
      body.vx *= Math.pow(0.9, delta);
      body.vy *= Math.pow(0.9, delta);

      const angularPull = (body.baseRotation - body.angle) * 0.02;
      body.angularVelocity += angularPull * delta;
      body.angularVelocity *= Math.pow(0.88, delta);

      body.tx += body.vx * delta;
      body.ty += body.vy * delta;
      body.angle += body.angularVelocity * delta;
    }

    for (let i = 0; i < bodies.length; i += 1) {
      const a = bodies[i];

      if (!a.released) {
        continue;
      }

      for (let j = i + 1; j < bodies.length; j += 1) {
        const b = bodies[j];

        if (!b.released) {
          continue;
        }

        const ac = getCenter(a.item, a.tx, a.ty);
        const bc = getCenter(b.item, b.tx, b.ty);
        const dx = bc.left - ac.left;
        const dy = bc.top - ac.top;
        const distance = Math.hypot(dx, dy) || 0.001;
        const minDistance = a.radius + b.radius;

        if (distance >= minDistance) {
          continue;
        }

        const overlap = minDistance - distance;
        const nx = dx / distance;
        const ny = dy / distance;
        const push = overlap * 0.018;

        a.vx -= nx * push;
        a.vy -= ny * push;
        b.vx += nx * push;
        b.vy += ny * push;

        a.angularVelocity -= nx * 0.02;
        b.angularVelocity += nx * 0.02;
      }
    }

    if (pointer.active) {
      for (const body of bodies) {
        if (!body.released) {
          continue;
        }

        const center = getCenter(body.item, body.tx, body.ty);
        const dx = center.left - pointer.x;
        const dy = center.top - pointer.y;
        const distance = Math.hypot(dx, dy) || 0.001;
        const influence = body.radius + 120;

        if (distance >= influence) {
          continue;
        }

        const force = (1 - distance / influence) * 1.6;
        body.vx += (dx / distance) * force;
        body.vy += (dy / distance) * force;
        body.angularVelocity += (dx / distance) * 0.08;
      }
    }

    for (const body of bodies) {
      if (!body.released) {
        continue;
      }

      const ambientX = Math.sin(now / 1400 + body.phase) * 1.6;
      const ambientY = Math.sin(now / 900 + body.phase) * 2.1;
      const ambientAngle = Math.sin(now / 1200 + body.phase) * 1.2;

      body.item.style.transform = `translate3d(${body.tx + ambientX}px, ${body.ty + ambientY}px, 0) rotate(${body.angle + ambientAngle}deg)`;
    }

    frameId = window.requestAnimationFrame(tick);
  };

  const updatePointer = (event) => {
    const rect = scene.getBoundingClientRect();
    pointer.active = true;
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  };

  scene.addEventListener("pointermove", updatePointer);
  scene.addEventListener("pointerdown", updatePointer);
  scene.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  frameId = window.requestAnimationFrame(tick);

  window.addEventListener("beforeunload", () => {
    window.cancelAnimationFrame(frameId);
  });
})();
