(() => {
  const data = window.POSTERS_PAGE_DATA;
  const page = document.getElementById("posters-page");

  if (!data || !page) {
    return;
  }

  const prefersReducedMotion =
    "matchMedia" in window && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  page.innerHTML = `
    <section class="poster-hero" aria-labelledby="poster-title">
      <div class="poster-hero__copy">
        ${data.intro.eyebrow ? `<p class="poster-hero__eyebrow">${data.intro.eyebrow}</p>` : ""}
        <h1 id="poster-title">${data.intro.title}</h1>
        <p>${data.intro.body}</p>
      </div>
    </section>
    <section class="poster-masonry-wrap" aria-label="海报设计作品">
      <div class="poster-masonry" id="poster-masonry"></div>
    </section>
    <div class="poster-lightbox" id="poster-lightbox" aria-hidden="true">
      <button class="poster-lightbox__close" type="button" aria-label="关闭预览">×</button>
      <div class="poster-lightbox__figure">
        <img class="poster-lightbox__image" alt="">
      </div>
    </div>
  `;

  const masonry = document.getElementById("poster-masonry");
  const lightbox = document.getElementById("poster-lightbox");
  const lightboxFigure = lightbox.querySelector(".poster-lightbox__figure");
  const lightboxImage = lightbox.querySelector(".poster-lightbox__image");
  const lightboxClose = lightbox.querySelector(".poster-lightbox__close");
  const imageSizes = new Map();
  let currentGrid = [];
  let hasMounted = false;
  let imagesReady = false;
  let activeThumb = null;

  const getColumns = () => {
    if (window.matchMedia("(min-width: 1480px)").matches) return 4;
    if (window.matchMedia("(min-width: 1040px)").matches) return 3;
    if (window.matchMedia("(min-width: 620px)").matches) return 2;
    return 1;
  };

  const preloadImages = (items) =>
    Promise.all(
      items.map(
        (item) =>
          new Promise((resolve) => {
            const image = new Image();
            image.onload = () => {
              imageSizes.set(item.id, {
                width: image.naturalWidth || 1,
                height: image.naturalHeight || 1
              });
              resolve();
            };
            image.onerror = () => {
              imageSizes.set(item.id, { width: 4, height: 3 });
              resolve();
            };
            image.src = item.img;
          })
      )
    );

  const renderItems = () => {
    masonry.innerHTML = data.items
      .map(
        (item) => `
          <a class="poster-masonry__item" data-key="${item.id}" data-title="${item.title}" href="${item.img}" aria-label="${item.title}">
            <span class="poster-masonry__image">
              <img src="${item.img}" alt="${item.title}" loading="lazy">
            </span>
          </a>
        `
      )
      .join("");
  };

  const buildGrid = () => {
    const width = masonry.clientWidth;

    if (!width || !imagesReady) {
      return [];
    }

    const columns = getColumns();
    const gap = columns === 1 ? 16 : 18;
    const columnWidth = (width - gap * (columns - 1)) / columns;
    const itemPadding = 14;
    const columnHeights = new Array(columns).fill(0);

    return data.items.map((item) => {
      const imageSize = imageSizes.get(item.id) || { width: 4, height: 3 };
      const column = columnHeights.indexOf(Math.min(...columnHeights));
      const height = Math.max(columnWidth - itemPadding, 1) * (imageSize.height / imageSize.width) + itemPadding;
      const x = (columnWidth + gap) * column;
      const y = columnHeights[column];

      columnHeights[column] += height + gap;

      return {
        ...item,
        x,
        y,
        w: columnWidth,
        h: height,
        totalHeight: Math.max(...columnHeights) - gap
      };
    });
  };

  const getInitialPosition = (item, index) => {
    const directions = ["bottom", "left", "right", "center"];
    const direction = directions[index % directions.length];

    if (direction === "left") {
      return { x: -item.w - 80, y: item.y };
    }

    if (direction === "right") {
      return { x: masonry.clientWidth + 80, y: item.y };
    }

    if (direction === "center") {
      return {
        x: masonry.clientWidth / 2 - item.w / 2,
        y: Math.max(masonry.clientHeight / 2 - item.h / 2, 0)
      };
    }

    return { x: item.x, y: window.innerHeight + 160 };
  };

  const setFallbackLayout = (element, item) => {
    element.style.width = `${item.w}px`;
    element.style.height = `${item.h}px`;
    element.style.transform = `translate3d(${item.x}px, ${item.y}px, 0)`;
    element.style.opacity = "1";
    element.style.filter = "blur(0)";
  };

  const layout = () => {
    currentGrid = buildGrid();

    if (!currentGrid.length) {
      return;
    }

    masonry.style.height = `${Math.ceil(Math.max(...currentGrid.map((item) => item.totalHeight)))}px`;

    currentGrid.forEach((item, index) => {
      const element = masonry.querySelector(`[data-key="${item.id}"]`);

      if (!element) {
        return;
      }

      if (prefersReducedMotion || !window.gsap) {
        setFallbackLayout(element, item);
        return;
      }

      if (!hasMounted) {
        const initial = getInitialPosition(item, index);

        window.gsap.fromTo(
          element,
          {
            opacity: 0,
            x: initial.x,
            y: initial.y,
            width: item.w,
            height: item.h,
            scale: 0.98,
            filter: "blur(10px)"
          },
          {
            opacity: 1,
            x: item.x,
            y: item.y,
            width: item.w,
            height: item.h,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.78,
            ease: "power3.out",
            delay: index * 0.045
          }
        );
      } else {
        window.gsap.to(element, {
          x: item.x,
          y: item.y,
          width: item.w,
          height: item.h,
          duration: 0.58,
          ease: "power3.out",
          overwrite: "auto"
        });
      }
    });

    hasMounted = true;
  };

  const initHover = () => {
    masonry.addEventListener("mouseenter", (event) => {
      const item = event.target.closest(".poster-masonry__item");

      if (!item || prefersReducedMotion) {
        return;
      }

      if (window.gsap) {
        window.gsap.to(item, { scale: 0.96, duration: 0.28, ease: "power2.out" });
      }
    }, true);

    masonry.addEventListener("mouseleave", (event) => {
      const item = event.target.closest(".poster-masonry__item");

      if (!item || prefersReducedMotion) {
        return;
      }

      if (window.gsap) {
        window.gsap.to(item, { scale: 1, duration: 0.28, ease: "power2.out" });
      }
    }, true);
  };

  const getLightboxBounds = (item) => {
    const imageSize = imageSizes.get(item.id) || { width: 4, height: 3 };
    const maxWidth = Math.min(window.innerWidth * 0.9, 1180);
    const maxHeight = window.innerHeight * 0.86;
    const ratio = imageSize.width / imageSize.height;
    let width = maxWidth;
    let height = width / ratio;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }

    return {
      width,
      height,
      x: (window.innerWidth - width) / 2,
      y: (window.innerHeight - height) / 2
    };
  };

  const openLightbox = (item, thumb) => {
    activeThumb = thumb;
    lightboxImage.src = item.img;
    lightboxImage.alt = item.title;
    lightbox.classList.add("is-active");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-lightbox-open");

    if (prefersReducedMotion || !window.gsap) {
      const bounds = getLightboxBounds(item);
      Object.assign(lightboxFigure.style, {
        top: "50%",
        left: "50%",
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
        transform: "translate(-50%, -50%)",
        opacity: "1"
      });
      return;
    }

    const thumbRect = thumb.getBoundingClientRect();
    const bounds = getLightboxBounds(item);

    window.gsap.killTweensOf([lightbox, lightboxFigure]);
    window.gsap.set(lightbox, { opacity: 0 });
    window.gsap.set(lightboxFigure, {
      x: thumbRect.left,
      y: thumbRect.top,
      width: thumbRect.width,
      height: thumbRect.height,
      opacity: 0.72,
      scale: 0.98,
      clearProps: "transform"
    });

    window.gsap.to(lightbox, { opacity: 1, duration: 0.22, ease: "power2.out" });
    window.gsap.to(lightboxFigure, {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      opacity: 1,
      scale: 1,
      duration: 0.52,
      ease: "power3.out"
    });
  };

  const closeLightbox = () => {
    if (!lightbox.classList.contains("is-active")) {
      return;
    }

    const finish = () => {
      lightbox.classList.remove("is-active");
      lightbox.setAttribute("aria-hidden", "true");
      lightboxImage.removeAttribute("src");
      document.body.classList.remove("is-lightbox-open");
      lightboxFigure.removeAttribute("style");
      activeThumb = null;
    };

    if (prefersReducedMotion || !window.gsap || !activeThumb) {
      finish();
      return;
    }

    const thumbRect = activeThumb.getBoundingClientRect();

    window.gsap.killTweensOf([lightbox, lightboxFigure]);
    window.gsap.to(lightbox, { opacity: 0, duration: 0.18, ease: "power2.in" });
    window.gsap.to(lightboxFigure, {
      x: thumbRect.left,
      y: thumbRect.top,
      width: thumbRect.width,
      height: thumbRect.height,
      opacity: 0.55,
      scale: 0.98,
      duration: 0.34,
      ease: "power2.inOut",
      onComplete: finish
    });
  };

  const initLightbox = () => {
    masonry.addEventListener("click", (event) => {
      const thumb = event.target.closest(".poster-masonry__item");

      if (!thumb) {
        return;
      }

      event.preventDefault();
      const item = data.items.find((entry) => entry.id === thumb.dataset.key);

      if (item) {
        openLightbox(item, thumb);
      }
    });

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox || event.target === lightboxFigure) {
        closeLightbox();
      }
    });

    lightboxClose.addEventListener("click", closeLightbox);

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeLightbox();
      }
    });
  };

  renderItems();
  initHover();
  initLightbox();

  preloadImages(data.items).then(() => {
    imagesReady = true;
    layout();
  });

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(layout);
    });
    observer.observe(masonry);
  } else {
    window.addEventListener("resize", layout);
  }
})();
