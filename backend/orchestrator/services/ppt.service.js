import path from "node:path";
import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

import os from "node:os";

let PptxGenJS = null;
import {
    markdownToPlainText,
    markdownToRuns,
} from "../utils/pptMarkdownParser.js";

// Use /tmp for serverless environments (like Vercel) to avoid read-only filesystem errors
const isServerless = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_VERSION;
const GENERATED_ROOT = isServerless
    ? path.resolve(os.tmpdir(), "generated", "presentations")
    : path.resolve(process.cwd(), "generated", "presentations");
const PPT_WIDTH = 13.333;
const PPT_HEIGHT = 7.5;

function toPlainText(value) {
    return markdownToPlainText(value);
}

function toRichText(value) {
    const runs = markdownToRuns(value);
    return runs.length > 0 ? runs : toPlainText(value);
}

function addMarkdownText(slide, value, options) {
    const plain = toPlainText(value);
    if (!plain) {
        return;
    }

    slide.addText(toRichText(value), options);
}

const SLIDE_TYPES = new Set([
    "title",
    "section",
    "bullets",
    "two_column",
    "cards",
    "comparison",
    "process",
    "timeline",
    "architecture",
    "flowchart",
    "diagram",
    "chart",
    "quote",
    "summary",
    "imageText",
]);

const THEME_MODERN = {
    name: "modern",
    background: "0B0B0F",
    surface: "12121A",
    surfaceAlt: "171722",
    surfaceSoft: "1E1E2B",
    border: "2A2A38",
    primary: "7C3AED",
    secondary: "22D3EE",
    accent: "F59E0B",
    success: "10B981",
    danger: "F87171",
    text: "F8FAFC",
    mutedText: "A1A1AA",
    subtleText: "71717A",
    titleFont: "Aptos Display",
    bodyFont: "Aptos",
    radius: 0.18,
    marginX: 0.68,
    marginTop: 0.52,
    marginBottom: 0.55,
    contentTop: 1.45,
    footerY: 7.0,
};

const THEMES = {
    modern: THEME_MODERN,
};

function slugify(value, fallback = "presentation") {
    const slug = String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return slug || fallback;
}

function cleanText(value) {
    return String(value || "")
        .replace(/\uFEFF/g, "")
        .trim();
}

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

function uniqueList(values) {
    return [...new Set(values.filter(Boolean))];
}

function normalizeTextList(value) {
    return safeArray(value)
        .map((item) => cleanText(item))
        .filter(Boolean);
}

function normalizeCards(value, fallbackBullets = []) {
    const cards = safeArray(value)
        .map((card, index) => {
            if (typeof card === "string") {
                const parts = card.split(/[:\-–—]\s*/);
                const title = cleanText(parts.shift() || `Card ${index + 1}`);
                const description = cleanText(parts.join(": ") || card);
                return {
                    title,
                    description,
                };
            }

            return {
                title: cleanText(card?.title || card?.label || card?.heading || `Card ${index + 1}`),
                description: cleanText(card?.description || card?.text || card?.body || card?.content || ""),
            };
        })
        .filter((card) => card.title || card.description);

    if (cards.length > 0) {
        return cards;
    }

    return normalizeTextList(fallbackBullets).slice(0, 4).map((bullet, index) => ({
        title: `Point ${index + 1}`,
        description: bullet,
    }));
}

function normalizeStats(value, fallbackBullets = []) {
    const stats = safeArray(value)
        .map((stat, index) => ({
            value: cleanText(stat?.value || stat?.number || stat?.metric || stat?.amount || ""),
            label: cleanText(stat?.label || stat?.title || stat?.name || `Metric ${index + 1}`),
            detail: cleanText(stat?.detail || stat?.description || stat?.text || ""),
        }))
        .filter((stat) => stat.value || stat.label || stat.detail);

    if (stats.length > 0) {
        return stats;
    }

    return normalizeTextList(fallbackBullets).slice(0, 4).map((bullet, index) => {
        const [value, ...rest] = bullet.split(/\s+/);
        return {
            value: cleanText(value || `${index + 1}`),
            label: cleanText(rest.join(" ") || `Metric ${index + 1}`),
            detail: "",
        };
    });
}

function normalizeTimelineItems(value, fallbackBullets = []) {
    const items = safeArray(value)
        .map((item, index) => ({
            year: cleanText(item?.year || item?.label || item?.title || item?.step || `Step ${index + 1}`),
            title: cleanText(item?.title || item?.label || item?.heading || ""),
            description: cleanText(item?.description || item?.text || item?.body || ""),
        }))
        .filter((item) => item.year || item.title || item.description);

    if (items.length > 0) {
        return items;
    }

    return normalizeTextList(fallbackBullets).map((bullet, index) => ({
        year: `0${index + 1}`,
        title: bullet,
        description: "",
    }));
}

function detectSlideType(slide, index, presentationTitle) {
    const explicit = cleanText(slide?.type || slide?.layout).toLowerCase();
    const visualType = cleanText(slide?.visualType).toLowerCase();

    if (explicit === "title" || explicit === "hero" || visualType === "hero" || visualType === "title") {
        return "title";
    }
    if (explicit === "conclusion" || explicit === "summary" || visualType === "conclusion" || visualType === "summary") {
        return "summary";
    }
    if (explicit === "statistics" || explicit === "stats" || visualType === "statistics" || visualType === "stats") {
        return "stats";
    }
    if (explicit === "flowchart" || explicit === "architecture" || explicit === "diagram" ||
        visualType === "flowchart" || visualType === "architecture" || visualType === "diagram") {
        if (explicit === "flowchart" || visualType === "flowchart") return "flowchart";
        if (explicit === "architecture" || visualType === "architecture") return "architecture";
        return "diagram";
    }

    if (SLIDE_TYPES.has(explicit)) {
        return explicit;
    }
    if (SLIDE_TYPES.has(visualType)) {
        return visualType;
    }

    if (index === 0) {
        return "title";
    }

    const title = cleanText(slide?.title || slide?.heading || "").toLowerCase();
    const text = normalizeTextList(slide?.bullets || slide?.points || slide?.content || [])
        .join(" ")
        .toLowerCase();
    const combined = `${title} ${text} ${cleanText(presentationTitle).toLowerCase()}`.trim();

    if (/(compare|comparison|versus|\bvs\b)/i.test(combined)) {
        return "comparison";
    }

    if (/(timeline|roadmap|history|journey|phases?|steps?|milestones?)/i.test(combined)) {
        return "timeline";
    }

    if (/(stats?|metrics?|numbers?|adoption|growth|performance|roi|percentage|percent|%)/i.test(combined)) {
        return "stats";
    }

    if (/(cards?|benefits|features|use cases?|examples?|highlights|capabilities)/i.test(combined)) {
        return "cards";
    }

    if (/(image|visual|diagram|architecture|product|mockup|illustration)/i.test(combined)) {
        return "imageText";
    }

    if (/(section|chapter|part \d|overview|agenda|themes?|pillar)/i.test(combined)) {
        return "section";
    }

    return "bullets";
}

function inferSubtitle(slide) {
    return cleanText(slide?.subtitle || slide?.subTitle || slide?.dek || slide?.description || "");
}

function inferBullets(slide) {
    return normalizeTextList(slide?.bullets || slide?.content || slide?.points || slide?.items || slide?.lines || []);
}

function inferHighlights(slide) {
    return normalizeTextList(slide?.highlights || slide?.callouts || slide?.takeaways || []);
}

function normalizeSlide(slide, index, presentationTitle) {
    const data = {
        ...slide,
        ...(slide?.visualData || {})
    };

    const type = detectSlideType(data, index, presentationTitle);
    const rawTitle = cleanText(data.title || data.heading || data.name || "");
    const bullets = inferBullets(data);
    const subtitle = inferSubtitle(data);

    switch (type) {
        case "title":
            return {
                type: "title",
                title: rawTitle || cleanText(presentationTitle),
                subtitle: subtitle || bullets[0] || cleanText(data.tagline || data.summary || ""),
                highlights: uniqueList([
                    ...inferHighlights(data),
                    ...bullets.slice(0, 3),
                ]).slice(0, 3),
            };

        case "section":
            return {
                type: "section",
                title: rawTitle || cleanText(presentationTitle),
                subtitle: subtitle || bullets[0] || "",
            };

        case "two_column":
            return {
                type: "two_column",
                title: rawTitle || cleanText(presentationTitle),
                subtitle,
                leftTitle: cleanText(data.leftTitle || "Option A"),
                leftBullets: normalizeTextList(data.leftBullets || data.leftPoints || []),
                rightTitle: cleanText(data.rightTitle || "Option B"),
                rightBullets: normalizeTextList(data.rightBullets || data.rightPoints || []),
            };

        case "cards":
            {
                const cards = normalizeCards(data.cards || data.items || data.blocks, bullets);
                if (cards.length === 0) {
                    return {
                        type: "bullets",
                        title: rawTitle || cleanText(presentationTitle),
                        subtitle,
                        bullets,
                    };
                }

                return {
                    type: "cards",
                    title: rawTitle || cleanText(presentationTitle),
                    subtitle,
                    cards,
                };
            }

        case "comparison":
            {
                const leftPoints = normalizeTextList(
                    data.leftPoints || data.left?.points || data.aPoints || bullets.slice(0, Math.max(1, Math.ceil(bullets.length / 2)))
                );
                const rightPoints = normalizeTextList(
                    data.rightPoints || data.right?.points || data.bPoints || bullets.slice(Math.max(1, Math.ceil(bullets.length / 2)))
                );

                return {
                    type: "comparison",
                    title: rawTitle || cleanText(presentationTitle),
                    subtitle,
                    leftTitle: cleanText(data.leftTitle || data.left?.title || data.aTitle || "Option A"),
                    rightTitle: cleanText(data.rightTitle || data.right?.title || data.bTitle || "Option B"),
                    leftPoints,
                    rightPoints,
                    columns: normalizeTextList(data.columns || []),
                    rows: Array.isArray(data.rows) ? data.rows.map(row => normalizeTextList(row)) : [],
                    summary: cleanText(data.summary || data.verdict || data.callout || ""),
                };
            }

        case "process":
            return {
                type: "process",
                title: rawTitle || cleanText(presentationTitle),
                subtitle,
                steps: safeArray(data.steps || data.items).map((step, idx) => ({
                    title: cleanText(step?.title || step?.label || `Step ${idx + 1}`),
                    description: cleanText(step?.description || step?.text || ""),
                })),
            };

        case "stats":
            {
                const stats = normalizeStats(data.stats || data.metrics || data.numbers, bullets);
                if (stats.length === 0) {
                    return {
                        type: "bullets",
                        title: rawTitle || cleanText(presentationTitle),
                        subtitle,
                        bullets,
                    };
                }

                return {
                    type: "stats",
                    title: rawTitle || cleanText(presentationTitle),
                    subtitle,
                    stats,
                };
            }

        case "timeline":
            {
                const items = normalizeTimelineItems(data.timeline || data.items || data.milestones, bullets);
                if (items.length === 0) {
                    return {
                        type: "bullets",
                        title: rawTitle || cleanText(presentationTitle),
                        subtitle,
                        bullets,
                    };
                }

                return {
                    type: "timeline",
                    title: rawTitle || cleanText(presentationTitle),
                    subtitle,
                    items,
                };
            }

        case "architecture":
        case "flowchart":
        case "diagram":
            return {
                type,
                title: rawTitle || cleanText(presentationTitle),
                subtitle,
                components: safeArray(data.components).map((comp, idx) => ({
                    id: cleanText(comp?.id || `comp-${idx}`),
                    label: cleanText(comp?.label || comp?.name || ""),
                    type: cleanText(comp?.type || "box"),
                    x: comp?.x !== undefined ? parseFloat(comp.x) : undefined,
                    y: comp?.y !== undefined ? parseFloat(comp.y) : undefined,
                })),
                connections: safeArray(data.connections).map((conn) => ({
                    from: cleanText(conn?.from || ""),
                    to: cleanText(conn?.to || ""),
                    label: cleanText(conn?.label || ""),
                })),
            };

        case "chart":
            return {
                type: "chart",
                title: rawTitle || cleanText(presentationTitle),
                subtitle,
                chartType: cleanText(data.chartType || "bar"),
                categories: normalizeTextList(data.categories || []),
                data: safeArray(data.data).map(Number),
                metricName: cleanText(data.metricName || "Value"),
            };

        case "quote":
            return {
                type: "quote",
                title: rawTitle || "",
                quote: cleanText(data.quote || data.text || ""),
                author: cleanText(data.author || data.by || "Unknown"),
            };

        case "summary":
            return {
                type: "summary",
                title: rawTitle || "Summary",
                subtitle,
                keyTakeaways: normalizeTextList(data.keyTakeaways || data.takeaways || bullets),
            };

        case "imageText":
            {
                const imageUrl = cleanText(data.imageUrl || data.image || data.imagePath || "");
                const text = cleanText(data.text || data.description || data.summary || bullets[0] || "");
                if (!text && bullets.length === 0 && !imageUrl) {
                    return {
                        type: "bullets",
                        title: rawTitle || cleanText(presentationTitle),
                        subtitle,
                        bullets,
                    };
                }

                return {
                    type: "imageText",
                    title: rawTitle || cleanText(presentationTitle),
                    subtitle,
                    text,
                    bullets,
                    imageUrl,
                    imageAlt: cleanText(data.imageAlt || data.alt || data.imagePrompt || ""),
                };
            }

        case "bullets":
        default:
            return {
                type: "bullets",
                title: rawTitle || cleanText(presentationTitle),
                subtitle,
                bullets,
            };
    }
}

function normalizePresentation(payload, fallbackTitle) {
    const title = cleanText(payload?.title || fallbackTitle || "Presentation");
    const themeName = cleanText(payload?.theme || "modern").toLowerCase();
    const theme = THEMES[themeName] ? themeName : "modern";

    const rawSlides = safeArray(payload?.slides);
    let slides = rawSlides.map((slide, index) => normalizeSlide(slide, index, title));

    if (slides.length === 0) {
        return {
            title,
            theme,
            slides,
        };
    }

    if (!slides.some((slide) => slide.type === "title")) {
        const firstSlide = slides[0];
        slides = [
            {
                type: "title",
                title,
                subtitle: firstSlide?.subtitle || firstSlide?.title || "Modern presentation",
                highlights: uniqueList([
                    firstSlide?.title,
                    firstSlide?.subtitle,
                    ...(firstSlide?.bullets || []).slice(0, 2),
                ]).slice(0, 3),
            },
            ...slides,
        ];
    }

    return {
        title,
        theme,
        slides,
    };
}

function extractJson(text) {
    if (typeof text !== "string") {
        return null;
    }

    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1] || text;
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
        return null;
    }

    try {
        return JSON.parse(candidate.slice(start, end + 1));
    } catch {
        return null;
    }
}

function parseBulletLine(line) {
    return cleanText(line)
        .replace(/^[*-+]\s+/, "")
        .replace(/^\d+[\.\)]\s+/, "")
        .trim();
}

function parseOutlinePresentation(text, fallbackTitle) {
    const lines = String(text || "")
        .replace(/\r\n/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) {
        return null;
    }

    let title = "";
    const slides = [];
    let currentSlide = null;
    let inContent = false;

    const pushSlide = () => {
        if (currentSlide && currentSlide.title) {
            slides.push(currentSlide);
        }
        currentSlide = null;
        inContent = false;
    };

    for (const rawLine of lines) {
        const line = cleanText(rawLine);

        const titleMatch = line.match(/^title:\s*(.+)$/i);
        if (titleMatch && !title) {
            title = cleanText(titleMatch[1]);
            continue;
        }

        const slideMatch = line.match(/^slide\s*\d*\s*:\s*(.*)$/i);
        if (slideMatch) {
            pushSlide();
            currentSlide = {
                title: cleanText(slideMatch[1]),
                content: [],
            };
            continue;
        }

        const slideTitleMatch = line.match(/^slide\s*title:\s*(.+)$/i);
        if (slideTitleMatch && currentSlide) {
            currentSlide.title = cleanText(slideTitleMatch[1]);
            continue;
        }

        if (/^content:$/i.test(line) || /^bullet points?:$/i.test(line)) {
            inContent = true;
            continue;
        }

        if (!title && !currentSlide) {
            title = cleanText(line);
            continue;
        }

        if (currentSlide) {
            const bullet = parseBulletLine(line);
            if (bullet) {
                currentSlide.content.push(bullet);
            }

            if (!currentSlide.title) {
                currentSlide.title = cleanText(line);
            }

            if (inContent && bullet) {
                continue;
            }
        }
    }

    pushSlide();

    if (!title) {
        title = cleanText(fallbackTitle);
    }

    if (slides.length === 0) {
        return null;
    }

    return normalizePresentation({ title, slides }, fallbackTitle);
}

function parsePresentationResponse(text, fallbackTitle) {
    const jsonPayload = extractJson(text);

    if (jsonPayload) {
        const normalized = normalizePresentation(jsonPayload, fallbackTitle);
        if (normalized.slides.length > 0) {
            return normalized;
        }
    }

    const outlinePayload = parseOutlinePresentation(text, fallbackTitle);
    if (outlinePayload) {
        return outlinePayload;
    }

    return null;
}

async function repairPresentationResponse(provider, model, rawText, prompt) {
    const repairMessages = [
        {
            role: "system",
            content:
                "Convert the provided presentation draft into valid JSON using the schema { title, theme, slides }. Slide types must be one of: title, section, bullets, cards, comparison, stats, timeline, imageText. Return JSON only.",
        },
        {
            role: "user",
            content: `User prompt:\n${prompt}\n\nDraft response:\n${rawText}\n\nReturn a valid structured presentation JSON object only.`,
        },
    ];

    return await provider.generate({
        model,
        messages: repairMessages,
    });
}

function summarizeSlideTypes(slides) {
    const types = slides.map((slide) => cleanText(slide?.type || "bullets").toLowerCase());
    const priority = ["title", "section", "comparison", "stats", "timeline", "cards", "imageText", "bullets"];

    return priority.filter((type) => types.includes(type));
}

function buildDeckTheme(themeName) {
    return THEMES[themeName] || THEMES.modern;
}

function configurePresentation(pptx, title, theme) {
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Chaos Engine";
    pptx.company = "Chaos Engine";
    pptx.subject = title;
    pptx.title = title;
    pptx.lang = "en-US";
    pptx.theme = {
        headFontFace: theme.titleFont,
        bodyFontFace: theme.bodyFont,
        lang: "en-US",
    };
}

function addBgDecorations(slide, theme, variant = "content") {
    slide.background = { color: theme.background };

    slide.addShape(PptxGenJS.ShapeType.rect, {
        x: 0,
        y: 0,
        w: PPT_WIDTH,
        h: 0.14,
        line: { color: theme.primary, transparency: 100 },
        fill: { color: variant === "title" ? theme.primary : theme.border, transparency: variant === "title" ? 20 : 45 },
    });

    slide.addShape(PptxGenJS.ShapeType.ellipse, {
        x: 10.8,
        y: -1.0,
        w: 3.6,
        h: 3.6,
        line: { color: theme.secondary, transparency: 100 },
        fill: { color: theme.secondary, transparency: 84 },
    });

    slide.addShape(PptxGenJS.ShapeType.ellipse, {
        x: -0.8,
        y: 5.65,
        w: 2.7,
        h: 2.7,
        line: { color: theme.primary, transparency: 100 },
        fill: { color: theme.primary, transparency: 88 },
    });

    slide.addShape(PptxGenJS.ShapeType.line, {
        x: 0.72,
        y: 7.0,
        w: 11.9,
        h: 0,
        line: { color: theme.border, transparency: 40, pt: 1 },
    });
}

function addChip(slide, theme, text, x, y, w = 1.65) {
    slide.addShape(PptxGenJS.ShapeType.roundRect, {
        x,
        y,
        w,
        h: 0.34,
        rectRadius: theme.radius,
        line: { color: theme.border, transparency: 15, pt: 1 },
        fill: { color: theme.surfaceAlt, transparency: 0 },
    });
    slide.addText(text, {
        x,
        y: y + 0.03,
        w,
        h: 0.22,
        fontFace: theme.bodyFont,
        fontSize: 9,
        bold: true,
        color: theme.text,
        align: "center",
        margin: 0,
    });
}

function addSlideHeader(slide, theme, title, subtitle, meta = {}) {
    addBgDecorations(slide, theme, meta.variant || "content");
    addChip(slide, theme, meta.chip || "PPT Workspace", theme.marginX, 0.34, 1.7);

    if (title) {
        addMarkdownText(slide, title, {
            x: theme.marginX,
            y: theme.marginTop,
            w: 8.9,
            h: subtitle ? 0.58 : 0.8,
            fontFace: theme.titleFont,
            fontSize: meta.titleSize || 25,
            bold: true,
            color: theme.text,
            margin: 0,
            fit: "shrink",
        });
    }

    if (subtitle) {
        addMarkdownText(slide, subtitle, {
            x: theme.marginX,
            y: theme.marginTop + 0.7,
            w: 8.7,
            h: 0.45,
            fontFace: theme.bodyFont,
            fontSize: 11.5,
            color: theme.mutedText,
            margin: 0,
            fit: "shrink",
        });
    }
}

function addFooter(slide, theme, index, totalSlides) {
    slide.addText(`${index + 1}`, {
        x: 12.6,
        y: theme.footerY,
        w: 0.28,
        h: 0.18,
        fontFace: theme.bodyFont,
        fontSize: 9,
        color: theme.mutedText,
        align: "right",
        margin: 0,
    });

    slide.addText(`${totalSlides} slides`, {
        x: 11.0,
        y: theme.footerY,
        w: 1.5,
        h: 0.18,
        fontFace: theme.bodyFont,
        fontSize: 8.5,
        color: theme.subtleText,
        align: "right",
        margin: 0,
    });
}

function addSurface(slide, theme, x, y, w, h, options = {}) {
    slide.addShape(PptxGenJS.ShapeType.roundRect, {
        x,
        y,
        w,
        h,
        rectRadius: theme.radius,
        line: {
            color: options.borderColor || theme.border,
            transparency: options.borderTransparency ?? 0,
            pt: options.borderPt || 1,
        },
        fill: {
            color: options.fillColor || theme.surface,
            transparency: options.fillTransparency ?? 0,
        },
    });
}

function renderTitleSlide(slide, theme, presentation, slideIndex, totalSlides) {
    addBgDecorations(slide, theme, "title");

    slide.addShape(PptxGenJS.ShapeType.roundRect, {
        x: 0.78,
        y: 0.84,
        w: 2.0,
        h: 0.46,
        rectRadius: theme.radius,
        line: { color: theme.primary, transparency: 30, pt: 1 },
        fill: { color: theme.surfaceAlt, transparency: 0 },
    });
    slide.addText("PRESENTATION", {
        x: 0.78,
        y: 0.89,
        w: 2.0,
        h: 0.18,
        fontFace: theme.bodyFont,
        fontSize: 9,
        bold: true,
        color: theme.secondary,
        align: "center",
        margin: 0,
    });

    addMarkdownText(slide, presentation.title, {
        x: 0.78,
        y: 1.52,
        w: 8.95,
        h: 1.35,
        fontFace: theme.titleFont,
        fontSize: 31,
        bold: true,
        color: theme.text,
        margin: 0,
        fit: "shrink",
    });

    const subtitle = toPlainText(presentation.subtitle || "Modern, structured slides generated automatically.");
    addMarkdownText(slide, subtitle, {
        x: 0.82,
        y: 2.95,
        w: 7.75,
        h: 0.7,
        fontFace: theme.bodyFont,
        fontSize: 14,
        color: theme.mutedText,
        margin: 0,
        fit: "shrink",
    });

    slide.addShape(PptxGenJS.ShapeType.line, {
        x: 0.82,
        y: 3.78,
        w: 2.2,
        h: 0,
        line: { color: theme.primary, transparency: 0, pt: 2.4 },
    });

    slide.addText(`Generated by Chaos Engine • ${totalSlides} slides`, {
        x: 0.82,
        y: 3.97,
        w: 4.25,
        h: 0.22,
        fontFace: theme.bodyFont,
        fontSize: 10,
        color: theme.subtleText,
        margin: 0,
    });

    const highlights = uniqueList([
        ...(presentation.highlights || []),
        ...(presentation.slides || [])
            .filter((item) => item.type !== "title")
            .slice(0, 3)
            .map((item) => item.title || item.subtitle || item.type),
    ]).slice(0, 3);

    const cards = highlights.length > 0
        ? highlights
        : [
            "Polished visual hierarchy",
            "Reusable themed layouts",
            "Safe fallback rendering",
        ];

    cards.forEach((text, index) => {
        const x = 0.82 + index * 2.75;
        addSurface(slide, theme, x, 4.55, 2.45, 1.2, {
            fillColor: index === 0 ? theme.surfaceAlt : theme.surfaceSoft,
            borderTransparency: 20,
        });
        slide.addShape(PptxGenJS.ShapeType.rect, {
            x,
            y: 4.55,
            w: 2.45,
            h: 0.08,
            line: { color: [theme.primary, theme.secondary, theme.accent][index % 3], transparency: 100 },
            fill: { color: [theme.primary, theme.secondary, theme.accent][index % 3], transparency: 0 },
        });
        addMarkdownText(slide, text, {
            x: x + 0.15,
            y: 4.82,
            w: 2.1,
            h: 0.58,
            fontFace: theme.bodyFont,
            fontSize: 11,
            color: theme.text,
            bold: true,
            margin: 0,
            fit: "shrink",
        });
    });

    slide.addText("PowerPoint output", {
        x: 10.18,
        y: 0.58,
        w: 2.2,
        h: 0.25,
        fontFace: theme.bodyFont,
        fontSize: 9,
        bold: true,
        color: theme.secondary,
        align: "right",
        margin: 0,
    });

    slide.addShape(PptxGenJS.ShapeType.ellipse, {
        x: 9.75,
        y: 1.45,
        w: 2.55,
        h: 2.55,
        line: { color: theme.primary, transparency: 100 },
        fill: { color: theme.surfaceAlt, transparency: 0 },
    });
    slide.addShape(PptxGenJS.ShapeType.ellipse, {
        x: 10.35,
        y: 2.05,
        w: 1.35,
        h: 1.35,
        line: { color: theme.secondary, transparency: 100 },
        fill: { color: theme.secondary, transparency: 30 },
    });
    slide.addShape(PptxGenJS.ShapeType.line, {
        x: 10.0,
        y: 4.2,
        w: 2.2,
        h: 0,
        line: { color: theme.border, transparency: 10, pt: 1.3 },
    });
    slide.addText("Professional layout engine", {
        x: 9.7,
        y: 4.35,
        w: 2.75,
        h: 0.22,
        fontFace: theme.bodyFont,
        fontSize: 10,
        color: theme.text,
        align: "center",
        bold: true,
        margin: 0,
    });

    addFooter(slide, theme, slideIndex, totalSlides);
}

function renderSectionSlide(slide, theme, slideData, slideIndex, totalSlides) {
    addBgDecorations(slide, theme, "section");

    slide.addShape(PptxGenJS.ShapeType.roundRect, {
        x: 0.78,
        y: 1.1,
        w: 5.0,
        h: 0.38,
        rectRadius: theme.radius,
        line: { color: theme.primary, transparency: 40, pt: 1 },
        fill: { color: theme.surfaceAlt, transparency: 0 },
    });
    slide.addText("SECTION", {
        x: 0.78,
        y: 1.16,
        w: 5.0,
        h: 0.16,
        fontFace: theme.bodyFont,
        fontSize: 9,
        bold: true,
        color: theme.secondary,
        align: "center",
        margin: 0,
    });

    addMarkdownText(slide, slideData.title, {
        x: 0.78,
        y: 1.8,
        w: 7.9,
        h: 1.3,
        fontFace: theme.titleFont,
        fontSize: 30,
        bold: true,
        color: theme.text,
        margin: 0,
        fit: "shrink",
    });

    if (slideData.subtitle) {
        addMarkdownText(slide, slideData.subtitle, {
            x: 0.8,
            y: 3.08,
            w: 7.2,
            h: 0.55,
            fontFace: theme.bodyFont,
            fontSize: 13,
            color: theme.mutedText,
            margin: 0,
            fit: "shrink",
        });
    }

    slide.addShape(PptxGenJS.ShapeType.line, {
        x: 0.82,
        y: 4.0,
        w: 2.6,
        h: 0,
        line: { color: theme.primary, transparency: 0, pt: 2 },
    });

    slide.addText("Transition slide", {
        x: 0.82,
        y: 4.18,
        w: 2.4,
        h: 0.18,
        fontFace: theme.bodyFont,
        fontSize: 10,
        color: theme.subtleText,
        margin: 0,
    });

    slide.addShape(PptxGenJS.ShapeType.roundRect, {
        x: 9.38,
        y: 1.0,
        w: 2.8,
        h: 4.45,
        rectRadius: theme.radius,
        line: { color: theme.border, transparency: 10, pt: 1 },
        fill: { color: theme.surface, transparency: 0 },
    });
    slide.addText(String(totalSlides).padStart(2, "0"), {
        x: 9.72,
        y: 1.55,
        w: 2.1,
        h: 1.0,
        fontFace: theme.titleFont,
        fontSize: 34,
        bold: true,
        color: theme.secondary,
        align: "center",
        margin: 0,
    });
    slide.addText("slides", {
        x: 9.7,
        y: 2.55,
        w: 2.15,
        h: 0.18,
        fontFace: theme.bodyFont,
        fontSize: 10,
        color: theme.mutedText,
        align: "center",
        margin: 0,
    });
    slide.addText("A clean starting point for the next section.", {
        x: 9.48,
        y: 3.1,
        w: 2.55,
        h: 0.72,
        fontFace: theme.bodyFont,
        fontSize: 11,
        color: theme.text,
        align: "center",
        fit: "shrink",
        margin: 0,
    });

    addFooter(slide, theme, slideIndex, totalSlides);
}

function renderBulletsSlide(slide, theme, slideData, slideIndex, totalSlides) {
    addSlideHeader(slide, theme, slideData.title, slideData.subtitle, { chip: "Bullets" });

    const bullets = normalizeTextList(slideData.bullets);
    const items = bullets.length > 0
        ? bullets
        : [
            "The model did not return bullet content for this slide.",
        ];
    const contentX = 0.82;
    const contentY = 1.62;
    const contentW = 11.65;
    const contentH = 4.72;

    addSurface(slide, theme, contentX, contentY, contentW, contentH, {
        fillColor: theme.surface,
        borderTransparency: 15,
    });

    const rowHeight = bullets.length > 5 ? 0.7 : 0.85;
    const maxRows = Math.max(1, Math.floor((contentH - 0.6) / rowHeight));
    const displayedBullets = items.slice(0, maxRows);

    displayedBullets.forEach((bullet, index) => {
        const y = contentY + 0.35 + (index * rowHeight);
        slide.addShape(PptxGenJS.ShapeType.ellipse, {
            x: contentX + 0.28,
            y: y + 0.07,
            w: 0.14,
            h: 0.14,
            line: { color: theme.primary, transparency: 100 },
            fill: { color: index % 2 === 0 ? theme.primary : theme.secondary, transparency: 0 },
        });
        addMarkdownText(slide, bullet, {
            x: contentX + 0.5,
            y,
            w: contentW - 0.82,
            h: rowHeight - 0.06,
            fontFace: theme.bodyFont,
            fontSize: bullets.length > 5 ? 13 : 14,
            color: theme.text,
            margin: 0,
            fit: "shrink",
            valign: "mid",
        });
    });

    if (bullets.length > displayedBullets.length) {
        slide.addText(`+ ${bullets.length - displayedBullets.length} more points`, {
            x: contentX + 0.34,
            y: contentY + contentH - 0.42,
            w: 3.5,
            h: 0.2,
            fontFace: theme.bodyFont,
            fontSize: 9.5,
            color: theme.mutedText,
            italic: true,
            margin: 0,
        });
    }

    addFooter(slide, theme, slideIndex, totalSlides);
}

function renderCardsSlide(slide, theme, slideData, slideIndex, totalSlides) {
    addSlideHeader(slide, theme, slideData.title, slideData.subtitle, { chip: "Cards" });

    const cards = safeArray(slideData.cards);
    const items = cards.length > 0 ? cards : normalizeCards([], slideData.bullets || []);
    const cardCount = Math.min(items.length, 4);
    const columns = cardCount <= 2 ? 2 : 2;
    const rows = Math.ceil(cardCount / columns);
    const cardW = columns === 2 ? 5.72 : 3.6;
    const cardH = rows === 1 ? 2.1 : 1.95;
    const gapX = 0.32;
    const gapY = 0.28;
    const startX = 0.82;
    const startY = 1.62;

    for (let i = 0; i < cardCount; i += 1) {
        const item = items[i];
        const col = i % columns;
        const row = Math.floor(i / columns);
        const x = startX + (col * (cardW + gapX));
        const y = startY + (row * (cardH + gapY));
        const accent = [theme.primary, theme.secondary, theme.accent, theme.success][i % 4];

        addSurface(slide, theme, x, y, cardW, cardH, {
            fillColor: theme.surface,
            borderTransparency: 15,
        });
        slide.addShape(PptxGenJS.ShapeType.rect, {
            x,
            y,
            w: cardW,
            h: 0.1,
            line: { color: accent, transparency: 100 },
            fill: { color: accent, transparency: 0 },
        });
        addMarkdownText(slide, item.title || `Card ${i + 1}`, {
            x: x + 0.18,
            y: y + 0.26,
            w: cardW - 0.36,
            h: 0.38,
            fontFace: theme.titleFont,
            fontSize: 15.5,
            bold: true,
            color: theme.text,
            margin: 0,
            fit: "shrink",
        });
        addMarkdownText(slide, item.description || "", {
            x: x + 0.18,
            y: y + 0.74,
            w: cardW - 0.36,
            h: cardH - 0.92,
            fontFace: theme.bodyFont,
            fontSize: 11.2,
            color: theme.mutedText,
            margin: 0,
            fit: "shrink",
            valign: "top",
        });
    }

    addFooter(slide, theme, slideIndex, totalSlides);
}

function renderComparisonTable(slide, theme, slideData, startY) {
    const columns = slideData.columns || [];
    const rows = slideData.rows || [];
    const C = columns.length;
    const R = Math.min(rows.length, 5); // protect overflow
    const totalW = 11.65;
    const colW = totalW / C;
    const startX = 0.82;
    const headerH = 0.5;
    const rowH = 0.6;

    // Header row
    columns.forEach((col, index) => {
        const x = startX + (index * colW);
        addSurface(slide, theme, x, startY, colW - 0.1, headerH, {
            fillColor: theme.surfaceAlt,
            borderColor: theme.primary,
            borderPt: 1
        });
        addMarkdownText(slide, col, {
            x: x + 0.1,
            y: startY + 0.1,
            w: colW - 0.3,
            h: headerH - 0.2,
            fontFace: theme.titleFont,
            fontSize: 12,
            bold: true,
            color: theme.secondary,
            align: "center",
            valign: "mid"
        });
    });

    // Rows
    for (let r = 0; r < R; r++) {
        const rowY = startY + headerH + 0.15 + (r * (rowH + 0.1));
        const rowData = rows[r] || [];
        for (let c = 0; c < C; c++) {
            const x = startX + (c * colW);
            const text = rowData[c] || "";
            addSurface(slide, theme, x, rowY, colW - 0.1, rowH, {
                fillColor: theme.surface,
                borderColor: theme.border,
                borderPt: 1
            });
            addMarkdownText(slide, text, {
                x: x + 0.1,
                y: rowY + 0.08,
                w: colW - 0.3,
                h: rowH - 0.16,
                fontFace: theme.bodyFont,
                fontSize: 10.5,
                color: theme.text,
                align: c === 0 ? "left" : "center",
                valign: "mid",
                fit: "shrink"
            });
        }
    }
}

function renderComparisonSlide(slide, theme, slideData, slideIndex, totalSlides) {
    addSlideHeader(slide, theme, slideData.title, slideData.subtitle, { chip: "Compare" });

    const leftTitle = slideData.leftTitle || "Left";
    const rightTitle = slideData.rightTitle || "Right";
    const leftPoints = normalizeTextList(slideData.leftPoints);
    const rightPoints = normalizeTextList(slideData.rightPoints);

    if (Array.isArray(slideData.columns) && slideData.columns.length > 0 && Array.isArray(slideData.rows) && slideData.rows.length > 0) {
        renderComparisonTable(slide, theme, slideData, 1.8);
    } else {
        addSurface(slide, theme, 0.82, 1.65, 5.95, 4.85, {
            fillColor: theme.surface,
            borderTransparency: 15,
        });
        addSurface(slide, theme, 6.58, 1.65, 5.95, 4.85, {
            fillColor: theme.surfaceAlt,
            borderTransparency: 15,
        });

        slide.addShape(PptxGenJS.ShapeType.rect, {
            x: 0.82,
            y: 1.65,
            w: 5.95,
            h: 0.1,
            line: { color: theme.primary, transparency: 100 },
            fill: { color: theme.primary, transparency: 0 },
        });
        slide.addShape(PptxGenJS.ShapeType.rect, {
            x: 6.58,
            y: 1.65,
            w: 5.95,
            h: 0.1,
            line: { color: theme.secondary, transparency: 100 },
            fill: { color: theme.secondary, transparency: 0 },
        });

        addMarkdownText(slide, leftTitle, {
            x: 1.08,
            y: 1.93,
            w: 3.0,
            h: 0.28,
            fontFace: theme.titleFont,
            fontSize: 16,
            bold: true,
            color: theme.text,
            margin: 0,
        });
        addMarkdownText(slide, rightTitle, {
            x: 6.84,
            y: 1.93,
            w: 3.0,
            h: 0.28,
            fontFace: theme.titleFont,
            fontSize: 16,
            bold: true,
            color: theme.text,
            margin: 0,
        });

        const renderPoints = (points, x, themeColor) => {
            points.slice(0, 5).forEach((point, index) => {
                const y = 2.38 + (index * 0.74);
                slide.addShape(PptxGenJS.ShapeType.ellipse, {
                    x,
                    y: y + 0.08,
                    w: 0.13,
                    h: 0.13,
                    line: { color: themeColor, transparency: 100 },
                    fill: { color: themeColor, transparency: 0 },
                });
                addMarkdownText(slide, point, {
                    x: x + 0.22,
                    y,
                    w: 4.95,
                    h: 0.42,
                    fontFace: theme.bodyFont,
                    fontSize: 11.4,
                    color: theme.text,
                    margin: 0,
                    fit: "shrink",
                });
            });
        };

        renderPoints(leftPoints, 1.08, theme.primary);
        renderPoints(rightPoints, 6.84, theme.secondary);
    }

    if (slideData.summary) {
        slide.addShape(PptxGenJS.ShapeType.roundRect, {
            x: 0.96,
            y: 6.12,
            w: 11.4,
            h: 0.52,
            rectRadius: theme.radius,
            line: { color: theme.border, transparency: 10, pt: 1 },
            fill: { color: theme.surfaceSoft, transparency: 0 },
        });
        addMarkdownText(slide, slideData.summary, {
            x: 1.18,
            y: 6.25,
            w: 10.95,
            h: 0.22,
            fontFace: theme.bodyFont,
            fontSize: 10.5,
            color: theme.mutedText,
            align: "center",
            margin: 0,
            fit: "shrink",
        });
    }

    addFooter(slide, theme, slideIndex, totalSlides);
}

function renderStatsSlide(slide, theme, slideData, slideIndex, totalSlides) {
    addSlideHeader(slide, theme, slideData.title, slideData.subtitle, { chip: "Stats" });

    const stats = normalizeStats(slideData.stats);
    const items = stats.slice(0, 4);
    const cardW = items.length <= 2 ? 5.75 : 2.72;
    const cardH = items.length <= 2 ? 1.95 : 2.1;
    const columns = items.length <= 2 ? 2 : 2;
    const startX = 0.82;
    const startY = 1.7;
    const gapX = 0.34;
    const gapY = 0.3;

    items.forEach((stat, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const x = startX + (col * (cardW + gapX));
        const y = startY + (row * (cardH + gapY));
        const accent = [theme.primary, theme.secondary, theme.accent, theme.success][index % 4];

        addSurface(slide, theme, x, y, cardW, cardH, {
            fillColor: theme.surface,
            borderTransparency: 15,
        });
        slide.addShape(PptxGenJS.ShapeType.rect, {
            x,
            y,
            w: cardW,
            h: 0.1,
            line: { color: accent, transparency: 100 },
            fill: { color: accent, transparency: 0 },
        });
        addMarkdownText(slide, stat.value || "0", {
            x: x + 0.18,
            y: y + 0.34,
            w: cardW - 0.36,
            h: 0.48,
            fontFace: theme.titleFont,
            fontSize: items.length <= 2 ? 24 : 22,
            bold: true,
            color: theme.text,
            margin: 0,
            fit: "shrink",
        });
        addMarkdownText(slide, stat.label || `Metric ${index + 1}`, {
            x: x + 0.18,
            y: y + 0.9,
            w: cardW - 0.36,
            h: 0.22,
            fontFace: theme.bodyFont,
            fontSize: 11,
            bold: true,
            color: theme.secondary,
            margin: 0,
            fit: "shrink",
        });
        if (stat.detail) {
            addMarkdownText(slide, stat.detail, {
                x: x + 0.18,
                y: y + 1.18,
                w: cardW - 0.36,
                h: 0.42,
                fontFace: theme.bodyFont,
                fontSize: 9.8,
                color: theme.mutedText,
                margin: 0,
                fit: "shrink",
            });
        }
    });

    if (items.length > 0) {
        slide.addShape(PptxGenJS.ShapeType.line, {
            x: 0.92,
            y: 6.0,
            w: 11.1,
            h: 0,
            line: { color: theme.border, transparency: 20, pt: 1 },
        });
        slide.addText("Highlighted metrics", {
            x: 0.92,
            y: 6.12,
            w: 2.0,
            h: 0.2,
            fontFace: theme.bodyFont,
            fontSize: 9.5,
            color: theme.subtleText,
            margin: 0,
        });
    }

    addFooter(slide, theme, slideIndex, totalSlides);
}

function renderTimelineSlide(slide, theme, slideData, slideIndex, totalSlides) {
    addSlideHeader(slide, theme, slideData.title, slideData.subtitle, { chip: "Timeline" });

    const items = safeArray(slideData.items).slice(0, 5);
    if (items.length === 0) {
        renderBulletsSlide(slide, theme, {
            ...slideData,
            bullets: slideData.bullets || [],
        }, slideIndex, totalSlides);
        return;
    }

    const startX = 1.0;
    const endX = 12.0;
    const lineY = 3.2;
    const width = endX - startX;

    slide.addShape(PptxGenJS.ShapeType.line, {
        x: startX,
        y: lineY,
        w: width,
        h: 0,
        line: { color: theme.border, transparency: 0, pt: 2.2 },
    });

    items.forEach((item, index) => {
        const x = startX + (index * (width / Math.max(items.length - 1, 1)));
        const accent = [theme.primary, theme.secondary, theme.accent, theme.success, theme.danger][index % 5];
        slide.addShape(PptxGenJS.ShapeType.ellipse, {
            x: x - 0.13,
            y: lineY - 0.13,
            w: 0.26,
            h: 0.26,
            line: { color: accent, transparency: 100 },
            fill: { color: accent, transparency: 0 },
        });

        const cardY = index % 2 === 0 ? 3.48 : 1.55;
        addSurface(slide, theme, x - 1.05, cardY, 2.1, 1.3, {
            fillColor: theme.surface,
            borderTransparency: 15,
        });
        addMarkdownText(slide, item.year || `Step ${index + 1}`, {
            x: x - 0.9,
            y: cardY + 0.15,
            w: 1.8,
            h: 0.2,
            fontFace: theme.bodyFont,
            fontSize: 9.5,
            bold: true,
            color: accent,
            align: "center",
            margin: 0,
            fit: "shrink",
        });
        addMarkdownText(slide, item.title || item.description || "", {
            x: x - 0.95,
            y: cardY + 0.42,
            w: 1.9,
            h: 0.36,
            fontFace: theme.bodyFont,
            fontSize: 10.5,
            color: theme.text,
            align: "center",
            margin: 0,
            fit: "shrink",
        });
        if (item.description) {
            addMarkdownText(slide, item.description, {
                x: x - 0.95,
                y: cardY + 0.8,
                w: 1.9,
                h: 0.26,
                fontFace: theme.bodyFont,
                fontSize: 8.5,
                color: theme.mutedText,
                align: "center",
                margin: 0,
                fit: "shrink",
            });
        }
    });

    addFooter(slide, theme, slideIndex, totalSlides);
}

function renderImageTextSlide(slide, theme, slideData, slideIndex, totalSlides) {
    addSlideHeader(slide, theme, slideData.title, slideData.subtitle, { chip: "Visual" });

    addSurface(slide, theme, 0.82, 1.72, 5.0, 4.55, {
        fillColor: theme.surface,
        borderTransparency: 15,
    });
    addSurface(slide, theme, 6.12, 1.72, 6.0, 4.55, {
        fillColor: theme.surfaceAlt,
        borderTransparency: 15,
    });

    if (slideData.imageUrl) {
        try {
            slide.addImage({
                path: slideData.imageUrl,
                x: 1.0,
                y: 1.95,
                w: 4.55,
                h: 4.1,
            });
        } catch {
            slide.addShape(PptxGenJS.ShapeType.ellipse, {
                x: 1.55,
                y: 2.1,
                w: 3.4,
                h: 3.4,
                line: { color: theme.secondary, transparency: 100 },
                fill: { color: theme.secondary, transparency: 85 },
            });
        }
    } else {
        slide.addShape(PptxGenJS.ShapeType.ellipse, {
            x: 1.55,
            y: 2.05,
            w: 3.5,
            h: 3.5,
            line: { color: theme.secondary, transparency: 100 },
            fill: { color: theme.secondary, transparency: 86 },
        });
        slide.addShape(PptxGenJS.ShapeType.ellipse, {
            x: 2.25,
            y: 2.7,
            w: 2.1,
            h: 2.1,
            line: { color: theme.primary, transparency: 100 },
            fill: { color: theme.primary, transparency: 68 },
        });
        slide.addShape(PptxGenJS.ShapeType.line, {
            x: 1.8,
            y: 5.55,
            w: 2.9,
            h: -1.85,
            line: { color: theme.accent, transparency: 10, pt: 2.2 },
        });
        slide.addText("Image / visual panel", {
            x: 1.32,
            y: 5.18,
            w: 3.85,
            h: 0.22,
            fontFace: theme.bodyFont,
            fontSize: 10,
            bold: true,
            color: theme.text,
            align: "center",
            margin: 0,
        });
    }

    const textBlock = slideData.text || slideData.description || slideData.summary || "";
    if (textBlock) {
        addMarkdownText(slide, textBlock, {
            x: 6.42,
            y: 2.02,
            w: 5.35,
            h: 0.72,
            fontFace: theme.bodyFont,
            fontSize: 13,
            color: theme.text,
            fit: "shrink",
            margin: 0,
        });
    }

    const bullets = normalizeTextList(slideData.bullets);
    bullets.slice(0, 5).forEach((bullet, index) => {
        const y = 2.95 + (index * 0.58);
        slide.addShape(PptxGenJS.ShapeType.ellipse, {
            x: 6.44,
            y: y + 0.08,
            w: 0.11,
            h: 0.11,
            line: { color: theme.primary, transparency: 100 },
            fill: { color: [theme.primary, theme.secondary, theme.accent][index % 3], transparency: 0 },
        });
        addMarkdownText(slide, bullet, {
            x: 6.64,
            y,
            w: 4.95,
            h: 0.35,
            fontFace: theme.bodyFont,
            fontSize: 10.8,
            color: theme.mutedText,
            margin: 0,
            fit: "shrink",
        });
    });

    if (slideData.imageAlt) {
        addMarkdownText(slide, slideData.imageAlt, {
            x: 6.42,
            y: 5.75,
            w: 5.2,
            h: 0.22,
            fontFace: theme.bodyFont,
            fontSize: 8.8,
            color: theme.subtleText,
            italic: true,
            margin: 0,
            fit: "shrink",
        });
    }

    addFooter(slide, theme, slideIndex, totalSlides);
}

function drawConnector(slide, theme, x1, y1, x2, y2, endArrow = true) {
    const midX = x2;
    if (Math.abs(midX - x1) > 0.05) {
        slide.addShape(PptxGenJS.ShapeType.line, {
            x: Math.min(x1, midX),
            y: y1,
            w: Math.abs(midX - x1),
            h: 0,
            line: { color: theme.mutedText, pt: 1.5, transparency: 30 }
        });
    }
    if (Math.abs(y2 - y1) > 0.05) {
        slide.addShape(PptxGenJS.ShapeType.line, {
            x: midX,
            y: Math.min(y1, y2),
            w: 0,
            h: Math.abs(y2 - y1),
            line: {
                color: theme.mutedText,
                pt: 1.5,
                transparency: 30,
                endArrowType: endArrow ? "triangle" : "none"
            }
        });
    }
}

function getShapeType(type) {
    const t = String(type || "").toLowerCase();
    if (["database", "db", "storage", "postgres", "mongodb", "mysql", "redis"].includes(t)) {
        return PptxGenJS.ShapeType.cylinder || PptxGenJS.ShapeType.rect;
    }
    if (["cloud", "internet", "network", "api", "gateway"].includes(t)) {
        return PptxGenJS.ShapeType.ellipse;
    }
    if (["actor", "user", "client", "browser", "mobile", "app"].includes(t)) {
        return PptxGenJS.ShapeType.roundRect;
    }
    return PptxGenJS.ShapeType.roundRect;
}

function renderTwoColumnSlide(slide, theme, slideData, slideIndex, totalSlides) {
    addSlideHeader(slide, theme, slideData.title, slideData.subtitle, { chip: "Overview" });

    const leftTitle = slideData.leftTitle || "Column A";
    const rightTitle = slideData.rightTitle || "Column B";
    const leftBullets = normalizeTextList(slideData.leftBullets || slideData.leftPoints || []);
    const rightBullets = normalizeTextList(slideData.rightBullets || slideData.rightPoints || []);

    const contentY = 1.65;
    const contentH = 4.85;
    const colW = 5.72;

    addSurface(slide, theme, 0.82, contentY, colW, contentH, {
        fillColor: theme.surface,
        borderTransparency: 15,
    });
    addSurface(slide, theme, 6.78, contentY, colW, contentH, {
        fillColor: theme.surfaceAlt,
        borderTransparency: 15,
    });

    slide.addShape(PptxGenJS.ShapeType.rect, {
        x: 0.82,
        y: contentY,
        w: colW,
        h: 0.08,
        line: { color: theme.primary, transparency: 100 },
        fill: { color: theme.primary, transparency: 0 },
    });
    slide.addShape(PptxGenJS.ShapeType.rect, {
        x: 6.78,
        y: contentY,
        w: colW,
        h: 0.08,
        line: { color: theme.secondary, transparency: 100 },
        fill: { color: theme.secondary, transparency: 0 },
    });

    addMarkdownText(slide, leftTitle, {
        x: 1.08,
        y: contentY + 0.28,
        w: colW - 0.5,
        h: 0.35,
        fontFace: theme.titleFont,
        fontSize: 15.5,
        bold: true,
        color: theme.text,
        margin: 0,
    });
    addMarkdownText(slide, rightTitle, {
        x: 7.04,
        y: contentY + 0.28,
        w: colW - 0.5,
        h: 0.35,
        fontFace: theme.titleFont,
        fontSize: 15.5,
        bold: true,
        color: theme.text,
        margin: 0,
    });

    const renderColumnPoints = (bullets, startX) => {
        bullets.slice(0, 5).forEach((bullet, index) => {
            const y = contentY + 0.85 + (index * 0.74);
            slide.addShape(PptxGenJS.ShapeType.ellipse, {
                x: startX,
                y: y + 0.08,
                w: 0.12,
                h: 0.12,
                line: { color: theme.primary, transparency: 100 },
                fill: { color: theme.primary, transparency: 0 },
            });
            addMarkdownText(slide, bullet, {
                x: startX + 0.22,
                y,
                w: colW - 0.72,
                h: 0.42,
                fontFace: theme.bodyFont,
                fontSize: 11,
                color: theme.text,
                margin: 0,
                fit: "shrink",
            });
        });
    };

    renderColumnPoints(leftBullets, 1.08);
    renderColumnPoints(rightBullets, 7.04);

    addFooter(slide, theme, slideIndex, totalSlides);
}

function renderProcessSlide(slide, theme, slideData, slideIndex, totalSlides) {
    addSlideHeader(slide, theme, slideData.title, slideData.subtitle, { chip: "Process" });

    const steps = safeArray(slideData.steps || slideData.items).slice(0, 5);
    const N = steps.length;
    if (N === 0) {
        renderBulletsSlide(slide, theme, slideData, slideIndex, totalSlides);
        return;
    }

    const totalW = 11.65;
    const gapX = N > 4 ? 0.25 : 0.35;
    const cardW = (totalW - (N - 1) * gapX) / N;
    const cardH = 3.6;
    const startX = 0.82;
    const startY = 2.0;

    steps.forEach((step, index) => {
        const x = startX + index * (cardW + gapX);
        const y = startY;

        addSurface(slide, theme, x, y, cardW, cardH, {
            fillColor: theme.surface,
            borderColor: theme.border,
            borderPt: 1
        });

        const accent = [theme.primary, theme.secondary, theme.accent, theme.success, theme.danger][index % 5];
        slide.addShape(PptxGenJS.ShapeType.rect, {
            x,
            y,
            w: cardW,
            h: 0.08,
            line: { color: accent, transparency: 100 },
            fill: { color: accent, transparency: 0 },
        });

        slide.addText(String(index + 1).padStart(2, "0"), {
            x: x + 0.15,
            y: y + 0.2,
            w: cardW - 0.3,
            h: 0.3,
            fontFace: theme.titleFont,
            fontSize: 16,
            bold: true,
            color: accent,
            margin: 0
        });

        addMarkdownText(slide, step.title || `Step ${index + 1}`, {
            x: x + 0.15,
            y: y + 0.6,
            w: cardW - 0.3,
            h: 0.6,
            fontFace: theme.titleFont,
            fontSize: 13,
            bold: true,
            color: theme.text,
            margin: 0,
            fit: "shrink"
        });

        addMarkdownText(slide, step.description || "", {
            x: x + 0.15,
            y: y + 1.35,
            w: cardW - 0.3,
            h: cardH - 1.5,
            fontFace: theme.bodyFont,
            fontSize: 10.5,
            color: theme.mutedText,
            margin: 0,
            fit: "shrink",
            valign: "top"
        });

        if (index < N - 1) {
            const arrowX = x + cardW;
            const arrowY = y + cardH / 2;
            const arrowW = gapX;
            slide.addShape(PptxGenJS.ShapeType.line, {
                x: arrowX,
                y: arrowY,
                w: arrowW,
                h: 0,
                line: {
                    color: theme.secondary,
                    pt: 2.2,
                    endArrowType: "triangle"
                }
            });
        }
    });

    addFooter(slide, theme, slideIndex, totalSlides);
}

function renderArchitectureSlide(slide, theme, slideData, slideIndex, totalSlides) {
    addSlideHeader(slide, theme, slideData.title, slideData.subtitle, { chip: "Diagram" });

    const components = safeArray(slideData.components).slice(0, 10);
    const connections = safeArray(slideData.connections).slice(0, 15);

    if (components.length === 0) {
        renderBulletsSlide(slide, theme, slideData, slideIndex, totalSlides);
        return;
    }

    const levels = {};
    components.forEach((comp) => {
        levels[comp.id] = 0;
    });

    for (let i = 0; i < components.length; i++) {
        connections.forEach((conn) => {
            if (levels[conn.from] !== undefined && levels[conn.to] !== undefined) {
                levels[conn.to] = Math.max(levels[conn.to], levels[conn.from] + 1);
            }
        });
    }

    const maxLevel = Math.max(...Object.values(levels), 0);
    const levelGroups = {};
    components.forEach((comp) => {
        const lvl = levels[comp.id];
        if (!levelGroups[lvl]) levelGroups[lvl] = [];
        levelGroups[lvl].push(comp);
    });

    const cardW = 1.7;
    const cardH = 0.75;
    const positions = {};

    Object.keys(levelGroups).forEach((lvlStr) => {
        const lvl = parseInt(lvlStr);
        const group = levelGroups[lvl];
        const K = group.length;
        const y = 1.8 + (lvl / (maxLevel + 1 || 1)) * 3.8;

        group.forEach((comp, idx) => {
            let x;
            if (comp.x !== undefined) {
                x = 0.82 + (parseFloat(comp.x) / 10) * 10.5;
            } else {
                x = 0.82 + ((idx + 0.5) / K) * 11.65 - cardW / 2;
            }

            let finalY = y;
            if (comp.y !== undefined) {
                finalY = 1.8 + (parseFloat(comp.y) / 10) * 3.8;
            }

            positions[comp.id] = { x, y: finalY, w: cardW, h: cardH };
        });
    });

    components.forEach((comp, index) => {
        const pos = positions[comp.id] || { x: 2, y: 2, w: cardW, h: cardH };
        const accent = [theme.primary, theme.secondary, theme.accent, theme.success][index % 4];

        const shape = getShapeType(comp.type);
        slide.addShape(shape, {
            x: pos.x,
            y: pos.y,
            w: pos.w,
            h: pos.h,
            rectRadius: theme.radius,
            line: { color: accent, pt: 1.5 },
            fill: { color: theme.surface, transparency: 0 },
        });

        addMarkdownText(slide, comp.label || comp.id, {
            x: pos.x + 0.05,
            y: pos.y + 0.15,
            w: pos.w - 0.1,
            h: pos.h - 0.3,
            fontFace: theme.bodyFont,
            fontSize: 10,
            bold: true,
            color: theme.text,
            align: "center",
            valign: "mid",
            fit: "shrink"
        });
    });

    connections.forEach((conn) => {
        const fromPos = positions[conn.from];
        const toPos = positions[conn.to];
        if (!fromPos || !toPos) return;

        let x1, y1, x2, y2;
        const fromCenter = fromPos.x + fromPos.w / 2;
        const toCenter = toPos.x + toPos.w / 2;

        if (Math.abs(fromPos.y - toPos.y) < 0.2) {
            if (fromPos.x < toPos.x) {
                x1 = fromPos.x + fromPos.w;
                y1 = fromPos.y + fromPos.h / 2;
                x2 = toPos.x;
                y2 = toPos.y + toPos.h / 2;
            } else {
                x1 = fromPos.x;
                y1 = fromPos.y + fromPos.h / 2;
                x2 = toPos.x + toPos.w;
                y2 = toPos.y + toPos.h / 2;
            }
        } else {
            if (fromPos.y < toPos.y) {
                x1 = fromCenter;
                y1 = fromPos.y + fromPos.h;
                x2 = toCenter;
                y2 = toPos.y;
            } else {
                x1 = fromCenter;
                y1 = fromPos.y;
                x2 = toCenter;
                y2 = toPos.y + toPos.h;
            }
        }

        drawConnector(slide, theme, x1, y1, x2, y2, true);

        if (conn.label) {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            slide.addText(conn.label, {
                x: midX - 0.8,
                y: midY - 0.15,
                w: 1.6,
                h: 0.3,
                fontFace: theme.bodyFont,
                fontSize: 8.5,
                color: theme.mutedText,
                align: "center",
                margin: 0
            });
        }
    });

    addFooter(slide, theme, slideIndex, totalSlides);
}

function renderChartSlide(slide, theme, slideData, slideIndex, totalSlides) {
    addSlideHeader(slide, theme, slideData.title, slideData.subtitle, { chip: "Data Visualization" });

    const categories = safeArray(slideData.categories);
    const values = safeArray(slideData.data).map(Number);

    if (categories.length === 0 || values.length === 0) {
        renderBulletsSlide(slide, theme, slideData, slideIndex, totalSlides);
        return;
    }

    const chartType = String(slideData.chartType || "bar").toLowerCase();
    const data = [
        {
            name: slideData.metricName || "Value",
            labels: categories,
            values: values
        }
    ];

    const chartX = 1.5;
    const chartY = 1.8;
    const chartW = 10.33;
    const chartH = 4.4;

    try {
        const chartTypes = {
            bar: slide.parent?.ChartType?.bar || "bar",
            line: slide.parent?.ChartType?.line || "line",
            pie: slide.parent?.ChartType?.pie || "pie"
        };

        const selectedType = chartTypes[chartType] || chartTypes.bar;

        slide.addChart(selectedType, data, {
            x: chartX,
            y: chartY,
            w: chartW,
            h: chartH,
            showTitle: false,
            showLegend: chartType === "pie",
            legendPos: "b",
            chartColors: [theme.primary, theme.secondary, theme.accent, theme.success, theme.danger],
            titleFontSize: 11,
            titleColor: theme.text,
            valAxisLabelColor: theme.mutedText,
            catAxisLabelColor: theme.mutedText,
            valGridLine: { color: theme.border, style: "dash" }
        });
    } catch (err) {
        console.error("Failed to render native pptxgenjs chart:", err);
        renderStatsSlide(slide, theme, {
            title: slideData.title,
            subtitle: slideData.subtitle,
            stats: categories.map((cat, idx) => ({
                label: cat,
                value: String(values[idx] || 0)
            }))
        }, slideIndex, totalSlides);
    }

    addFooter(slide, theme, slideIndex, totalSlides);
}

function renderQuoteSlide(slide, theme, slideData, slideIndex, totalSlides) {
    addSlideHeader(slide, theme, slideData.title, "", { chip: "Quote" });

    const quoteText = slideData.quote || "No quote text provided.";
    const author = slideData.author || "Unknown";

    const contentX = 1.5;
    const contentY = 2.0;
    const contentW = 10.33;
    const contentH = 4.0;

    addSurface(slide, theme, contentX, contentY, contentW, contentH, {
        fillColor: theme.surface,
        borderTransparency: 15,
        borderColor: theme.primary,
        borderPt: 1.5
    });

    slide.addText("“", {
        x: contentX + 0.5,
        y: contentY + 0.2,
        w: 1.5,
        h: 1.5,
        fontFace: theme.titleFont,
        fontSize: 84,
        bold: true,
        color: theme.secondary,
        margin: 0,
        transparency: 60
    });

    addMarkdownText(slide, quoteText, {
        x: contentX + 1.0,
        y: contentY + 1.2,
        w: contentW - 2.0,
        h: 1.5,
        fontFace: theme.bodyFont,
        fontSize: 16,
        color: theme.text,
        italic: true,
        align: "center",
        fit: "shrink",
        margin: 0
    });

    addMarkdownText(slide, `— ${author}`, {
        x: contentX + 1.0,
        y: contentY + 3.0,
        w: contentW - 2.0,
        h: 0.4,
        fontFace: theme.titleFont,
        fontSize: 12,
        bold: true,
        color: theme.secondary,
        align: "center",
        fit: "shrink",
        margin: 0
    });

    addFooter(slide, theme, slideIndex, totalSlides);
}

function renderSummarySlide(slide, theme, slideData, slideIndex, totalSlides) {
    addSlideHeader(slide, theme, slideData.title, slideData.subtitle, { chip: "Summary" });

    const keyTakeaways = normalizeTextList(slideData.keyTakeaways || slideData.takeaways || []);
    const items = keyTakeaways.length > 0 ? keyTakeaways : ["No summary key takeaways provided."];

    const contentX = 0.82;
    const contentY = 1.62;
    const contentW = 11.65;
    const contentH = 4.72;

    addSurface(slide, theme, contentX, contentY, contentW, contentH, {
        fillColor: theme.surfaceAlt,
        borderTransparency: 15,
    });

    slide.addShape(PptxGenJS.ShapeType.rect, {
        x: contentX,
        y: contentY,
        w: contentW,
        h: 0.1,
        line: { color: theme.success, transparency: 100 },
        fill: { color: theme.success, transparency: 0 },
    });

    const N = items.length;
    const rowHeight = N > 4 ? 0.7 : 0.9;
    const displayedItems = items.slice(0, 4);

    displayedItems.forEach((item, index) => {
        const y = contentY + 0.45 + (index * rowHeight);
        const checkX = contentX + 0.35;
        const checkY = y + 0.08;
        slide.addShape(PptxGenJS.ShapeType.ellipse, {
            x: checkX,
            y: checkY,
            w: 0.2,
            h: 0.2,
            line: { color: theme.success, pt: 1.5 },
            fill: { color: theme.surface }
        });
        slide.addText("✓", {
            x: checkX,
            y: checkY - 0.03,
            w: 0.2,
            h: 0.2,
            fontFace: theme.bodyFont,
            fontSize: 9.5,
            bold: true,
            color: theme.success,
            align: "center",
            margin: 0
        });

        addMarkdownText(slide, item, {
            x: contentX + 0.75,
            y,
            w: contentW - 1.1,
            h: rowHeight - 0.1,
            fontFace: theme.bodyFont,
            fontSize: 13.5,
            color: theme.text,
            margin: 0,
            fit: "shrink",
            valign: "mid"
        });
    });

    addFooter(slide, theme, slideIndex, totalSlides);
}

function renderFallbackSlide(slide, theme, slideData, slideIndex, totalSlides) {
    renderBulletsSlide(slide, theme, {
        ...slideData,
        bullets: slideData.bullets || slideData.content || [],
    }, slideIndex, totalSlides);
}

function renderSlide(slide, theme, slideData, slideIndex, totalSlides, presentation) {
    switch (slideData.type) {
        case "title":
            renderTitleSlide(slide, theme, presentation, slideIndex, totalSlides);
            break;
        case "section":
            renderSectionSlide(slide, theme, slideData, slideIndex, totalSlides);
            break;
        case "bullets":
            renderBulletsSlide(slide, theme, slideData, slideIndex, totalSlides);
            break;
        case "two_column":
            renderTwoColumnSlide(slide, theme, slideData, slideIndex, totalSlides);
            break;
        case "cards":
            renderCardsSlide(slide, theme, slideData, slideIndex, totalSlides);
            break;
        case "comparison":
            renderComparisonSlide(slide, theme, slideData, slideIndex, totalSlides);
            break;
        case "process":
            renderProcessSlide(slide, theme, slideData, slideIndex, totalSlides);
            break;
        case "timeline":
            renderTimelineSlide(slide, theme, slideData, slideIndex, totalSlides);
            break;
        case "architecture":
        case "flowchart":
        case "diagram":
            renderArchitectureSlide(slide, theme, slideData, slideIndex, totalSlides);
            break;
        case "chart":
            renderChartSlide(slide, theme, slideData, slideIndex, totalSlides);
            break;
        case "quote":
            renderQuoteSlide(slide, theme, slideData, slideIndex, totalSlides);
            break;
        case "summary":
            renderSummarySlide(slide, theme, slideData, slideIndex, totalSlides);
            break;
        case "imageText":
            renderImageTextSlide(slide, theme, slideData, slideIndex, totalSlides);
            break;
        default:
            renderFallbackSlide(slide, theme, slideData, slideIndex, totalSlides);
            break;
    }
}

export function createTitleSlide(slide, theme, presentation, slideIndex, totalSlides) {
    renderTitleSlide(slide, theme, presentation, slideIndex, totalSlides);
}

export function createBulletSlide(slide, theme, slideData, slideIndex, totalSlides) {
    renderBulletsSlide(slide, theme, slideData, slideIndex, totalSlides);
}

export function createArchitectureSlide(slide, theme, slideData, slideIndex, totalSlides) {
    renderArchitectureSlide(slide, theme, slideData, slideIndex, totalSlides);
}

export function createProcessSlide(slide, theme, slideData, slideIndex, totalSlides) {
    renderProcessSlide(slide, theme, slideData, slideIndex, totalSlides);
}

export function createComparisonSlide(slide, theme, slideData, slideIndex, totalSlides) {
    renderComparisonSlide(slide, theme, slideData, slideIndex, totalSlides);
}

export function createCardsSlide(slide, theme, slideData, slideIndex, totalSlides) {
    renderCardsSlide(slide, theme, slideData, slideIndex, totalSlides);
}

export function createChartSlide(slide, theme, slideData, slideIndex, totalSlides) {
    renderChartSlide(slide, theme, slideData, slideIndex, totalSlides);
}

export function createSummarySlide(slide, theme, slideData, slideIndex, totalSlides) {
    renderSummarySlide(slide, theme, slideData, slideIndex, totalSlides);
}

function renderOverviewSlide(slide, theme, presentation, totalSlides) {
    slide.addShape(PptxGenJS.ShapeType.roundRect, {
        x: 0.92,
        y: 5.95,
        w: 11.45,
        h: 0.6,
        rectRadius: theme.radius,
        line: { color: theme.border, transparency: 15, pt: 1 },
        fill: { color: theme.surface, transparency: 0 },
    });

    const types = summarizeSlideTypes(presentation.slides).slice(0, 4);
    if (types.length > 0) {
        slide.addText(`Layouts used: ${types.join(" • ")}`, {
            x: 1.1,
            y: 6.15,
            w: 10.8,
            h: 0.18,
            fontFace: theme.bodyFont,
            fontSize: 9,
            color: theme.subtleText,
            align: "center",
            margin: 0,
        });
    } else {
        slide.addText(`Built with ${totalSlides} slides`, {
            x: 1.1,
            y: 6.15,
            w: 10.8,
            h: 0.18,
            fontFace: theme.bodyFont,
            fontSize: 9,
            color: theme.subtleText,
            align: "center",
            margin: 0,
        });
    }
}

function normalizePresentationForRender(presentation) {
    const title = cleanText(presentation?.title || "Presentation");
    const theme = buildDeckTheme(cleanText(presentation?.theme || "modern").toLowerCase());
    const slides = safeArray(presentation?.slides)
        .map((slide, index) => normalizeSlide(slide, index, title))
        .filter(Boolean);

    const output = {
        title,
        theme: presentation?.theme && THEMES[cleanText(presentation.theme).toLowerCase()]
            ? cleanText(presentation.theme).toLowerCase()
            : "modern",
        slides,
    };

    if (output.slides.length === 0) {
        output.slides = [
            {
                type: "title",
                title,
                subtitle: "A presentation structure could not be derived automatically.",
                highlights: ["Fallback rendering", "Safe output", "Download-ready file"],
            },
            {
                type: "bullets",
                title: "Summary",
                bullets: ["The model did not return structured slide content."],
            },
        ];
    }

    if (!output.slides.some((slide) => slide.type === "title")) {
        output.slides = [
            {
                type: "title",
                title,
                subtitle: output.slides[0]?.title || output.slides[0]?.subtitle || "Modern presentation",
                highlights: uniqueList([
                    output.slides[0]?.title,
                    output.slides[1]?.title,
                    ...(output.slides[0]?.bullets || []).slice(0, 2),
                ]).slice(0, 3),
            },
            ...output.slides,
        ];
    }

    return {
        ...output,
        theme: output.theme,
        themeConfig: theme,
    };
}

export function resolvePresentationPath(fileName) {
    const safeName = path.basename(String(fileName || ""));
    const resolved = path.resolve(GENERATED_ROOT, safeName);

    if (!resolved.startsWith(GENERATED_ROOT)) {
        throw new Error("Invalid presentation file path.");
    }

    return resolved;
}

export async function createPresentationArtifact(presentation) {
    if (!PptxGenJS) {
        const require = createRequire(import.meta.url);
        PptxGenJS = require("pptxgenjs");
        PptxGenJS.ShapeType = new PptxGenJS().ShapeType;
    }
    const normalized = normalizePresentationForRender(presentation);
    const { title, slides, themeConfig } = normalized;

    if (!title) {
        throw new Error("Presentation title is required.");
    }

    if (!Array.isArray(slides) || slides.length === 0) {
        throw new Error("Presentation requires at least one slide.");
    }

    await mkdir(GENERATED_ROOT, { recursive: true });

    const fileName = `${slugify(title)}-${randomUUID().slice(0, 8)}.pptx`;
    const filePath = resolvePresentationPath(fileName);

    const pptx = new PptxGenJS();
    configurePresentation(pptx, title, themeConfig);

    let lastSlide = null;
    slides.forEach((slideData, index) => {
        const slide = pptx.addSlide();
        renderSlide(slide, themeConfig, slideData, index, slides.length, normalized);
        lastSlide = slide;
    });

    if (slides.length > 1 && lastSlide) {
        renderOverviewSlide(lastSlide, themeConfig, normalized, slides.length);
    }

    await pptx.writeFile({ fileName: filePath });

    return {
        title,
        fileName,
        filePath,
        slideCount: slides.length,
        downloadUrl: `/api/orchestrator/ppt/download/${encodeURIComponent(fileName)}`,
    };
}
