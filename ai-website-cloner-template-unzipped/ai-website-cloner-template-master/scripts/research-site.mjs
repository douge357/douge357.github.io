import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const targetUrl = process.argv[2];

if (!targetUrl) {
  console.error("Usage: npm run research:site -- <url>");
  process.exit(1);
}

const url = new URL(targetUrl);
const hostname = url.hostname.replace(/[^a-z0-9.-]/gi, "-");
const slug = `${hostname}${url.pathname.replace(/\/+/g, "-").replace(/^-|-$/g, "") ? `-${url.pathname.replace(/\/+/g, "-").replace(/^-|-$/g, "")}` : ""}`.replace(/[^a-z0-9.-]/gi, "-");
const cwd = process.cwd();
const designDir = path.join(cwd, "docs", "design-references", slug);
const researchDir = path.join(cwd, "docs", "research", slug);

await fs.mkdir(designDir, { recursive: true });
await fs.mkdir(researchDir, { recursive: true });

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});

async function collectForViewport(page, name, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 90000 });
  await page.screenshot({
    path: path.join(designDir, `${name}-full.png`),
    fullPage: true,
  });

  return await page.evaluate(({ viewportName }) => {
    const toText = (value) => (typeof value === "string" ? value.trim() : "");
    const compactText = (value) => toText(value).replace(/\s+/g, " ");
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
      .map((node) => ({
        tag: node.tagName.toLowerCase(),
        text: compactText(node.textContent),
      }))
      .filter((item) => item.text)
      .slice(0, 40);

    const navigation = Array.from(document.querySelectorAll("body a[href]"))
      .map((node) => ({
        text: compactText(node.textContent),
        href: node.href,
      }))
      .filter((item) => item.href && ["Hey", "Projects", "Work Experience", "Contact"].includes(item.text))
      .slice(0, 20);

    const links = Array.from(document.querySelectorAll("a[href]"))
      .map((node) => ({
        text: compactText(node.textContent),
        href: node.href,
      }))
      .filter((item) => item.href)
      .slice(0, 60);

    const images = Array.from(document.images)
      .map((img) => ({
        src: img.currentSrc || img.src,
        alt: img.alt || "",
        width: img.naturalWidth,
        height: img.naturalHeight,
      }))
      .filter((item) => item.src)
      .slice(0, 30);

    const fontSamples = Array.from(document.querySelectorAll("body, h1, h2, h3, p, a, button"))
      .map((node) => getComputedStyle(node).fontFamily)
      .filter(Boolean);
    const fonts = [...new Set(fontSamples)].slice(0, 12);

    const colorSamples = Array.from(document.querySelectorAll("body, nav, section, h1, h2, h3, p, a, button, div"))
      .flatMap((node) => {
        const style = getComputedStyle(node);
        return [style.color, style.backgroundColor, style.borderColor];
      })
      .filter((value) => value && value !== "rgba(0, 0, 0, 0)" && value !== "transparent");
    const colors = [...new Set(colorSamples)].slice(0, 24);

    const sections = Array.from(document.querySelectorAll("body section, body nav, body header, body footer, body [data-framer-name]"))
      .map((node, index) => {
        const text = compactText(node.textContent);
        return {
          index,
          tag: node.tagName.toLowerCase(),
          id: node.id || "",
          className: typeof node.className === "string" ? node.className : "",
          textPreview: text.slice(0, 200),
        };
      })
      .slice(0, 30);

    const projectMap = new Map();
    let currentYearGroup = "";
    const flowNodes = Array.from(document.querySelectorAll("body h1, body a[href]"));
    for (const node of flowNodes) {
      if (node.tagName.toLowerCase() === "h1") {
        const text = compactText(node.textContent);
        if (/^(20\d{2}|20\d{2}\s*-\s*20\d{2})/.test(text)) {
          currentYearGroup = text;
        }
        continue;
      }

      const href = node.href;
      if (!href) continue;

      const pathname = (() => {
        try {
          return new URL(href).pathname;
        } catch {
          return "";
        }
      })();

      const isProjectLike =
        /\/new-projects\//.test(pathname) ||
        /\/gallery$/.test(pathname) ||
        (href.includes("uldesign.framer.website") && pathname === "/");

      if (!isProjectLike) continue;

      if (!projectMap.has(href)) {
        projectMap.set(href, {
          href,
          yearGroup: currentYearGroup,
          title: "",
          labels: [],
          image: null,
          style: {
            display: "",
            gap: "",
            borderRadius: "",
            backgroundColor: "",
            titleFontFamily: "",
            titleFontSize: "",
            titleFontWeight: "",
            titleColor: "",
          },
        });
      }

      const entry = projectMap.get(href);
      const text = compactText(node.textContent);
      const style = getComputedStyle(node);
      const imageNode = node.querySelector("img");

      if (!entry.yearGroup && currentYearGroup) {
        entry.yearGroup = currentYearGroup;
      }

      if (text) {
        if (!entry.title) {
          entry.title = text;
          entry.style.titleFontFamily = style.fontFamily;
          entry.style.titleFontSize = style.fontSize;
          entry.style.titleFontWeight = style.fontWeight;
          entry.style.titleColor = style.color;
        } else if (text !== entry.title && !entry.labels.includes(text)) {
          entry.labels.push(text);
        }
      }

      if (!entry.style.display) {
        entry.style.display = style.display;
        entry.style.gap = style.gap;
        entry.style.borderRadius = style.borderRadius;
        entry.style.backgroundColor = style.backgroundColor;
      }

      if (imageNode && !entry.image) {
        entry.image = {
          src: imageNode.currentSrc || imageNode.src,
          width: imageNode.naturalWidth,
          height: imageNode.naturalHeight,
        };
      }
    }

    const projectCards = Array.from(projectMap.values())
      .filter((item) => item.title || item.image)
      .slice(0, 30);

    const mediaSummary = {
      totalImages: document.images.length,
      uniqueImageHosts: [...new Set(Array.from(document.images).map((img) => {
        try {
          return new URL(img.currentSrc || img.src).hostname;
        } catch {
          return "";
        }
      }).filter(Boolean))],
      videos: Array.from(document.querySelectorAll("video")).map((video) => ({
        src: video.currentSrc || video.src || video.querySelector("source")?.src || "",
        poster: video.poster || "",
      })),
    };

    return {
      viewportName,
      pageTitle: document.title,
      metaDescription,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      headings,
      links,
      navigation,
      images,
      fonts,
      colors,
      sections,
      projectCards,
      mediaSummary,
    };
  }, { viewportName: name });
}

const page = await browser.newPage();
const desktop = await collectForViewport(page, "desktop", { width: 1440, height: 1600 });
const mobile = await collectForViewport(page, "mobile", { width: 390, height: 1200 });

const summary = {
  targetUrl,
  capturedAt: new Date().toISOString(),
  desktop,
  mobile,
};

await fs.writeFile(
  path.join(researchDir, "page-summary.json"),
  JSON.stringify(summary, null, 2),
  "utf8",
);

const markdown = `# Site Research Summary

- Target: ${targetUrl}
- Captured at: ${summary.capturedAt}
- Desktop screenshot: \`docs/design-references/${slug}/desktop-full.png\`
- Mobile screenshot: \`docs/design-references/${slug}/mobile-full.png\`

## Page Identity

- Title: ${desktop.pageTitle}
- Meta description: ${desktop.metaDescription || "N/A"}

## Fonts

${desktop.fonts.map((font) => `- ${font}`).join("\n")}

## Colors

${desktop.colors.map((color) => `- ${color}`).join("\n")}

## Headings

${desktop.headings.map((item) => `- ${item.tag}: ${item.text}`).join("\n")}

## Navigation

${desktop.navigation.map((item) => `- ${item.text || "(no text)"} → ${item.href}`).join("\n")}

## Top Sections

${desktop.sections.map((section) => `- [${section.index}] ${section.tag}${section.id ? `#${section.id}` : ""} ${section.className ? `.${section.className}` : ""}\n  - ${section.textPreview || "No text preview"}`).join("\n")}

## Project Cards

${desktop.projectCards.map((card, index) => `- [${index + 1}] ${card.title}\n  - Link: ${card.href}\n  - Year group: ${card.yearGroup || "N/A"}\n  - Image: ${card.image?.src || "N/A"}\n  - Labels: ${card.labels.length ? card.labels.join(" | ") : "N/A"}\n  - Title style: ${card.style.titleFontFamily} / ${card.style.titleFontSize} / ${card.style.titleFontWeight} / ${card.style.titleColor}`).join("\n")}

## Media Summary

- Total images: ${desktop.mediaSummary.totalImages}
- Image hosts: ${desktop.mediaSummary.uniqueImageHosts.join(", ") || "N/A"}
- Videos: ${desktop.mediaSummary.videos.length}
`;

await fs.writeFile(path.join(researchDir, "page-summary.md"), markdown, "utf8");

console.log(`Research saved to ${researchDir}`);
console.log(`Screenshots saved to ${designDir}`);

await browser.close();
