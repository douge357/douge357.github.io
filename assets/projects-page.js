(() => {
  const data = window.PROJECTS_PAGE_DATA;

  if (!data) {
    return;
  }

  const projectsPage = document.getElementById("projects-page");
  const footerIntro = document.getElementById("footer-intro");
  const footerColumns = document.getElementById("footer-columns");

  projectsPage.innerHTML = `
    <aside class="projects-sidebar">
      <div class="profile-spotlight" data-animate>
        <h1 class="profile-spotlight__title">${data.profileSpotlight.title}</h1>
        <p class="profile-spotlight__role">${data.profileSpotlight.role}</p>
        <p class="profile-spotlight__body">${data.profileSpotlight.body}</p>
      </div>
    </aside>
    <div class="projects-content">
      ${data.groups
        .map(
          (group) => `
            <section class="year-group">
              <div class="project-grid">
                ${group.items
                  .map(
                    (project) => `
                      <article class="project-card" data-animate>
                        <a class="project-card__media" href="${project.href}">
                          <img src="${project.image}" alt="${project.title}" loading="lazy">
                        </a>
                        <div class="project-card__body">
                          <h2 class="project-card__title">
                            <a href="${project.href}">${project.title}</a>
                          </h2>
                        </div>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
        )
        .join("")}
    </div>
  `;

  if (footerIntro) {
    footerIntro.innerHTML = `
      <p class="footer-intro__label">\u72ec\u7acb\u8bbe\u8ba1\u5e08</p>
      <h2 class="footer-intro__name">${data.profile.name}</h2>
      <p class="footer-intro__bio">${data.profile.bio}</p>
      <div class="footer-intro__meta">
        <span>${data.profile.location}</span>
      </div>
    `;
  }

  if (footerColumns) {
    footerColumns.innerHTML = `
      <div class="footer-column" data-animate>
        <h3>\u8054\u7cfb\u65b9\u5f0f</h3>
        <ul>
          <li><span>\u90ae\u7bb1</span><a href="mailto:${data.profile.email}">${data.profile.email}</a></li>
          <li><span>\u5fae\u4fe1</span><strong>${data.profile.wechat}</strong></li>
        </ul>
      </div>
      <div class="footer-column" data-animate>
        <h3>\u793e\u4ea4\u8d26\u53f7</h3>
        <ul>
          ${data.profile.socials
            .map((item) => `<li><a href="${item.href}" target="_blank" rel="noopener">${item.label}</a></li>`)
            .join("")}
        </ul>
      </div>
    `;
  }

  const initSplitReveal = () => {
    const title = document.querySelector(".profile-spotlight__title");
    const role = document.querySelector(".profile-spotlight__role");
    const body = document.querySelector(".profile-spotlight__body");

    if (title) {
      const titleText = title.textContent || "";
      const fragment = document.createDocumentFragment();

      title.classList.add("split-title");
      title.textContent = "";

      Array.from(titleText).forEach((char) => {
        const span = document.createElement("span");
        span.className = "split-title__char";
        span.textContent = char;
        fragment.appendChild(span);
      });

      title.appendChild(fragment);
    }

    if (role) {
      role.classList.add("split-block");
    }

    if (body) {
      const bodyText = body.textContent || "";
      const fragment = document.createDocumentFragment();

      body.classList.add("split-body");
      body.textContent = "";

      Array.from(bodyText).forEach((char) => {
        if (char === "\n") {
          fragment.appendChild(document.createElement("br"));
          return;
        }

        if (char === " ") {
          fragment.appendChild(document.createTextNode(" "));
          return;
        }

        const span = document.createElement("span");
        span.className = "split-body__char";
        span.textContent = char;
        fragment.appendChild(span);
      });

      body.appendChild(fragment);
    }

    const playReveal = () => {
      let longest = 0;

      if (title) {
        const chars = Array.from(title.querySelectorAll(".split-title__char"));
        chars.forEach((char, index) => {
          char.style.transitionDelay = `${index * 42}ms`;
        });
        title.classList.add("is-visible");
        longest = Math.max(longest, Math.max(chars.length - 1, 0) * 42 + 760);
      }

      if (role) {
        role.style.transitionDelay = `${Math.max(longest - 280, 160)}ms`;
        role.classList.add("is-visible");
        longest = Math.max(longest, Math.max(longest - 280, 160) + 760);
      }

      if (body) {
        const bodyDelayBase = Math.max(longest - 320, 220);
        const bodyChars = Array.from(body.querySelectorAll(".split-body__char"));

        bodyChars.forEach((char, index) => {
          char.style.transitionDelay = `${bodyDelayBase + index * 20}ms`;
        });

        body.classList.add("is-visible");
        longest = Math.max(longest, bodyDelayBase + Math.max(bodyChars.length - 1, 0) * 20 + 1280);
      }

      return longest;
    };

    if (!("IntersectionObserver" in window)) {
      return Promise.resolve(playReveal());
    }

    return new Promise((resolve) => {
      const trigger = title || role || body;

      if (!trigger) {
        resolve(0);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            const total = playReveal();
            observer.disconnect();
            resolve(total);
          });
        },
        {
          threshold: 0.3,
          rootMargin: "0px 0px -10% 0px"
        }
      );

      observer.observe(trigger);
    });
  };

  const initRoleShuffle = (startDelay = 0) => {
    const role = document.querySelector(".profile-spotlight__role");

    if (!role) {
      return;
    }

    const originalText = role.textContent || "";
    const prefersReducedMotion =
      "matchMedia" in window && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!originalText.trim() || prefersReducedMotion) {
      role.classList.add("is-shuffle-ready");
      return;
    }

    const scrambleCharset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const shuffleTimes = 3;
    const duration = 340;
    const stagger = 30;
    const evenOddOffset = 110;
    const loopDelay = 1700;
    const startColor = "rgba(142, 137, 141, 0.52)";
    const endColor = "";
    let hasPlayed = false;
    let rafId = 0;
    let timeoutIds = [];
    let loopTimer = 0;

    role.classList.add("shuffle-role");
    role.setAttribute("aria-label", originalText);

    const randomChar = () => scrambleCharset[Math.floor(Math.random() * scrambleCharset.length)];

    const clearTimers = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }

      if (loopTimer) {
        window.clearTimeout(loopTimer);
        loopTimer = 0;
      }

      timeoutIds.forEach((id) => window.clearTimeout(id));
      timeoutIds = [];
    };

    const build = () => {
      role.innerHTML = "";

      Array.from(originalText).forEach((char) => {
        if (char === " ") {
          role.appendChild(document.createTextNode(" "));
          return;
        }

        const wrap = document.createElement("span");
        const strip = document.createElement("span");
        const finalChar = document.createElement("span");
        const tempChars = [];

        wrap.className = "shuffle-role__char-wrap";
        strip.className = "shuffle-role__char-strip";
        finalChar.className = "shuffle-role__char";
        finalChar.textContent = char;

        const charMeasure = document.createElement("span");
        charMeasure.className = "shuffle-role__char";
        charMeasure.textContent = char;
        charMeasure.style.visibility = "hidden";
        charMeasure.style.position = "absolute";
        role.appendChild(charMeasure);

        const charWidth = Math.ceil(charMeasure.getBoundingClientRect().width);
        charMeasure.remove();

        wrap.style.width = `${Math.max(charWidth, 6)}px`;

        for (let index = 0; index < shuffleTimes; index += 1) {
          const tempChar = document.createElement("span");
          tempChar.className = "shuffle-role__char";
          tempChar.textContent = randomChar();
          tempChars.push(tempChar);
        }

        strip.append(finalChar, ...tempChars, finalChar.cloneNode(true));
        strip.style.color = startColor;
        wrap.appendChild(strip);
        role.appendChild(wrap);

        strip.dataset.distance = String(Math.max(charWidth, 6) * (shuffleTimes + 1));
      });

      role.classList.add("is-shuffle-ready");
    };

    const animateStrip = (strip, delay) => {
      const updateScramble = () => {
        Array.from(strip.children).forEach((node, childIndex, children) => {
          if (childIndex > 0 && childIndex < children.length - 1) {
            node.textContent = randomChar();
          }
        });
      };

      strip.style.transition = "none";
      strip.style.transform = `translate3d(-${strip.dataset.distance || 0}px, 0, 0)`;
      strip.style.color = startColor;

      timeoutIds.push(
        window.setTimeout(() => {
          updateScramble();
        }, delay + 26)
      );

      timeoutIds.push(
        window.setTimeout(() => {
          updateScramble();
        }, delay + 118)
      );

      timeoutIds.push(
        window.setTimeout(() => {
          strip.style.transition = `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), color ${duration}ms ease`;
          strip.style.transform = "translate3d(0, 0, 0)";
          strip.style.color = endColor;
        }, delay)
      );
    };

    const animate = () => {
      clearTimers();
      build();

      const strips = Array.from(role.querySelectorAll(".shuffle-role__char-strip"));
      const odd = strips.filter((_, index) => index % 2 === 1);
      const even = strips.filter((_, index) => index % 2 === 0);

      rafId = window.requestAnimationFrame(() => {
        odd.forEach((strip, index) => {
          animateStrip(strip, index * stagger);
        });

        even.forEach((strip, index) => {
          animateStrip(strip, evenOddOffset + index * stagger);
        });
      });

      loopTimer = window.setTimeout(animate, duration + evenOddOffset + strips.length * stagger + loopDelay);
    };

    const start = () => {
      timeoutIds.push(window.setTimeout(() => {
        if (!hasPlayed) {
          hasPlayed = true;
        }
        animate();
      }, startDelay));
    };

    if (!("IntersectionObserver" in window)) {
      start();
      role.addEventListener("mouseenter", animate);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || hasPlayed) {
            return;
          }

          start();
          observer.disconnect();
        });
      },
      {
        threshold: 0.35
      }
    );

    observer.observe(role);
    role.addEventListener("mouseenter", animate);
  };

  initSplitReveal().then((delay) => {
    initRoleShuffle(Math.max(delay - 260, 260));
  });

  const nodes = document.querySelectorAll("[data-animate]");

  if (!("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  nodes.forEach((node, index) => {
    node.style.transitionDelay = `${Math.min(index * 60, 240)}ms`;
    observer.observe(node);
  });
})();
