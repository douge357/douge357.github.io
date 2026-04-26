(() => {
  const random = (x) => (Math.sin(x * 12.9898) * 43758.5453) % 1;

  const noise2D = (x, y) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    const a = random(i + j * 57);
    const b = random(i + 1 + j * 57);
    const c = random(i + (j + 1) * 57);
    const d = random(i + 1 + (j + 1) * 57);
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);

    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
  };

  const octavedNoise = (x, octaves, lacunarity, gain, baseAmplitude, baseFrequency, time, seed) => {
    let y = 0;
    let amplitude = baseAmplitude;
    let frequency = baseFrequency;

    for (let index = 0; index < octaves; index += 1) {
      y += amplitude * noise2D(frequency * x + seed * 100, time * frequency * 0.3);
      frequency *= lacunarity;
      amplitude *= gain;
    }

    return y;
  };

  const getCornerPoint = (centerX, centerY, radius, startAngle, arcLength, progress) => {
    const angle = startAngle + progress * arcLength;

    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  const getRoundedRectPoint = (t, left, top, width, height, radius) => {
    const straightWidth = width - 2 * radius;
    const straightHeight = height - 2 * radius;
    const cornerArc = (Math.PI * radius) / 2;
    const totalPerimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArc;
    const distance = t * totalPerimeter;
    let accumulated = 0;

    if (distance <= accumulated + straightWidth) {
      const progress = (distance - accumulated) / straightWidth;
      return { x: left + radius + progress * straightWidth, y: top };
    }

    accumulated += straightWidth;

    if (distance <= accumulated + cornerArc) {
      const progress = (distance - accumulated) / cornerArc;
      return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, progress);
    }

    accumulated += cornerArc;

    if (distance <= accumulated + straightHeight) {
      const progress = (distance - accumulated) / straightHeight;
      return { x: left + width, y: top + radius + progress * straightHeight };
    }

    accumulated += straightHeight;

    if (distance <= accumulated + cornerArc) {
      const progress = (distance - accumulated) / cornerArc;
      return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, progress);
    }

    accumulated += cornerArc;

    if (distance <= accumulated + straightWidth) {
      const progress = (distance - accumulated) / straightWidth;
      return { x: left + width - radius - progress * straightWidth, y: top + height };
    }

    accumulated += straightWidth;

    if (distance <= accumulated + cornerArc) {
      const progress = (distance - accumulated) / cornerArc;
      return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, progress);
    }

    accumulated += cornerArc;

    if (distance <= accumulated + straightHeight) {
      const progress = (distance - accumulated) / straightHeight;
      return { x: left, y: top + height - radius - progress * straightHeight };
    }

    const progress = (distance - accumulated) / cornerArc;
    return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, progress);
  };

  const initElectricBorder = (container) => {
    const canvas = container.querySelector(".eb-canvas");

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const prefersReducedMotion =
      "matchMedia" in window && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const color = container.dataset.electricColor || "#5227ff";
    const speed = Number(container.dataset.electricSpeed || 1);
    const chaos = Number(container.dataset.electricChaos || 0.12);
    const thickness = Number(container.dataset.electricThickness || 2);
    const borderRadius = Number(container.dataset.electricRadius || 24);
    const borderOffset = 60;
    const displacement = 60;
    let time = 0;
    let lastFrameTime = 0;
    let animationFrame = 0;
    let width = 0;
    let height = 0;

    container.style.setProperty("--electric-border-color", color);
    container.style.setProperty("--electric-border-radius", `${borderRadius}px`);
    container.style.setProperty("--electric-border-thickness", `${thickness}px`);

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width + borderOffset * 2;
      height = rect.height + borderOffset * 2;
      canvas.width = Math.max(width * dpr, 1);
      canvas.height = Math.max(height * dpr, 1);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (currentTime) => {
      const deltaTime = lastFrameTime ? (currentTime - lastFrameTime) / 1000 : 0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      lastFrameTime = currentTime;
      time += deltaTime * speed;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = thickness * 4;

      const left = borderOffset;
      const top = borderOffset;
      const borderWidth = width - 2 * borderOffset;
      const borderHeight = height - 2 * borderOffset;
      const maxRadius = Math.min(borderWidth, borderHeight) / 2;
      const radius = Math.min(borderRadius, maxRadius);
      const approximatePerimeter = 2 * (borderWidth + borderHeight) + 2 * Math.PI * radius;
      const sampleCount = Math.max(Math.floor(approximatePerimeter / 2), 2);

      ctx.beginPath();

      for (let index = 0; index <= sampleCount; index += 1) {
        const progress = index / sampleCount;
        const point = getRoundedRectPoint(progress, left, top, borderWidth, borderHeight, radius);
        const xNoise = octavedNoise(progress * 8, 10, 1.6, 0.7, chaos, 10, time, 0);
        const yNoise = octavedNoise(progress * 8, 10, 1.6, 0.7, chaos, 10, time, 1);
        const displacedX = point.x + xNoise * displacement;
        const displacedY = point.y + yNoise * displacement;

        if (index === 0) {
          ctx.moveTo(displacedX, displacedY);
        } else {
          ctx.lineTo(displacedX, displacedY);
        }
      }

      ctx.closePath();
      ctx.stroke();

      if (!prefersReducedMotion) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
      if (prefersReducedMotion) {
        draw(performance.now());
      }
    });

    updateSize();
    resizeObserver.observe(container);
    animationFrame = window.requestAnimationFrame(draw);

    window.addEventListener("beforeunload", () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      resizeObserver.disconnect();
    });
  };

  document.querySelectorAll("[data-electric-border]").forEach(initElectricBorder);
})();
