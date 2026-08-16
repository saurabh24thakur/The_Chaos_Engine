const PRESENTATION_LABELS = new Set([
    "title",
    "slide",
    "slide title",
    "bullet points",
    "bullet point",
    "bullets",
    "content",
    "key features",
    "features",
    "overview",
    "summary",
    "details",
]);

function normalizeInput(value) {
    return String(value ?? "")
        .replace(/\uFEFF/g, "")
        .replace(/\r\n/g, "\n")
        .trim();
}

function stripPresentationArtifacts(text) {
    const lines = normalizeInput(text)
        .split("\n")
        .map((line) => line.trim());

    const cleaned = [];

    for (const line of lines) {
        if (!line) {
            cleaned.push("");
            continue;
        }

        const headingMatch = line.match(/^#{1,6}\s*(.+)$/);
        if (headingMatch) {
            cleaned.push(headingMatch[1].trim());
            continue;
        }

        const labelMatch = line.match(/^(title|slide\s*\d+|slide\s*title|bullet points?|bullet point|bullets|content|key features|features|overview|summary|details)\s*:\s*(.*)$/i);
        if (labelMatch) {
            const label = labelMatch[1].toLowerCase();
            const trailing = labelMatch[2].trim();
            if (trailing) {
                if (label === "title" || label === "slide title" || label.startsWith("slide ")) {
                    cleaned.push(`# ${trailing}`);
                } else {
                    cleaned.push(trailing);
                }
            }
            continue;
        }

        cleaned.push(line);
    }

    return cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function stripListMarker(text) {
    return normalizeInput(text)
        .replace(/^\s*[-*+]\s+/, "")
        .replace(/^\s*\d+[\.\)]\s+/, "")
        .trim();
}

function markdownInlineToRuns(text) {
    const source = stripPresentationArtifacts(text);
    const runs = [];
    const regex = /(\*\*\*[\s\S]+?\*\*\*|\*\*[\s\S]+?\*\*|\*[\s\S]+?\*|`[\s\S]+?`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(source)) !== null) {
        if (match.index > lastIndex) {
            runs.push({ text: source.slice(lastIndex, match.index) });
        }

        const token = match[0];
        if (token.startsWith("***") && token.endsWith("***")) {
            runs.push({
                text: token.slice(3, -3),
                options: { bold: true, italic: true },
            });
        } else if (token.startsWith("**") && token.endsWith("**")) {
            runs.push({
                text: token.slice(2, -2),
                options: { bold: true },
            });
        } else if (token.startsWith("*") && token.endsWith("*")) {
            runs.push({
                text: token.slice(1, -1),
                options: { italic: true },
            });
        } else if (token.startsWith("`") && token.endsWith("`")) {
            runs.push({
                text: token.slice(1, -1),
                options: {
                    fontFace: "Consolas",
                },
            });
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < source.length) {
        runs.push({ text: source.slice(lastIndex) });
    }

    return runs.filter((run) => run.text !== "");
}

function markdownToRuns(text) {
    const normalized = stripListMarker(stripPresentationArtifacts(text));
    const lines = normalized.split("\n");
    const runs = [];

    lines.forEach((line, index) => {
        const lineRuns = markdownInlineToRuns(line.trim());
        if (lineRuns.length === 0) {
            if (index < lines.length - 1) {
                runs.push({
                    text: "",
                    options: { breakLine: true },
                });
            }
            return;
        }

        if (index < lines.length - 1 && lineRuns.length > 0) {
            const lastRun = lineRuns[lineRuns.length - 1];
            lastRun.options = {
                ...(lastRun.options || {}),
                breakLine: true,
            };
        }

        runs.push(...lineRuns);
    });

    return runs;
}

function markdownToPlainText(text) {
    return stripListMarker(stripPresentationArtifacts(text))
        .split("\n")
        .map((line) => line.replace(/^#{1,6}\s+/, "").trim())
        .filter(Boolean)
        .join("\n")
        .replace(/\*\*\*/g, "")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/`/g, "")
        .trim();
}

function isPresentationLabel(text) {
    const value = normalizeInput(text).toLowerCase().replace(/:$/, "");
    return PRESENTATION_LABELS.has(value);
}

function parseMarkdownBlocks(text) {
    const source = normalizeInput(text);
    if (!source) {
        return [];
    }

    const lines = source.split("\n");
    const blocks = [];
    let buffer = [];

    const flushParagraph = () => {
        if (buffer.length === 0) {
            return;
        }

        const paragraph = buffer.join(" ").trim();
        if (paragraph) {
            blocks.push({
                type: "paragraph",
                level: 0,
                text: paragraph,
                runs: markdownToRuns(paragraph),
            });
        }
        buffer = [];
    };

    for (const rawLine of lines) {
        const line = rawLine.trimEnd();
        if (!line.trim()) {
            flushParagraph();
            continue;
        }

        const labelMatch = line.match(/^(title|slide\s*\d+|slide\s*title|bullet points?|bullet point|bullets|content|key features|features|overview|summary|details)\s*:\s*(.*)$/i);
        if (labelMatch) {
            flushParagraph();
            const label = labelMatch[1].toLowerCase();
            const trailing = labelMatch[2].trim();
            if (!trailing) {
                continue;
            }

            if (label === "title" || label === "slide title" || label.startsWith("slide ")) {
                blocks.push({
                    type: "heading",
                    level: 1,
                    text: markdownToPlainText(trailing),
                    runs: markdownInlineToRuns(markdownToPlainText(trailing)),
                });
            } else {
                buffer.push(trailing);
            }

            continue;
        }

        const headingMatch = line.match(/^\s*(#{1,6})\s*(.+)$/);
        if (headingMatch) {
            flushParagraph();
            blocks.push({
                type: "heading",
                level: headingMatch[1].length,
                text: markdownToPlainText(headingMatch[2].trim()),
                runs: markdownInlineToRuns(markdownToPlainText(headingMatch[2].trim())),
            });
            continue;
        }

        const bulletMatch = line.match(/^(\s*)([-*+])\s+(.+)$/);
        if (bulletMatch) {
            flushParagraph();
            const indentSpaces = bulletMatch[1].replace(/\t/g, "    ").length;
            const level = Math.max(0, Math.floor(indentSpaces / 2));
            const content = bulletMatch[3].trim();
            blocks.push({
                type: "bullet",
                level,
                text: content,
                runs: markdownInlineToRuns(stripListMarker(content)),
            });
            continue;
        }

        const numberMatch = line.match(/^(\s*)(\d+)[\.\)]\s+(.+)$/);
        if (numberMatch) {
            flushParagraph();
            const indentSpaces = numberMatch[1].replace(/\t/g, "    ").length;
            const level = Math.max(0, Math.floor(indentSpaces / 2));
            const content = numberMatch[3].trim();
            blocks.push({
                type: "numbered",
                level,
                number: Number(numberMatch[2]),
                text: content,
                runs: markdownInlineToRuns(stripListMarker(content)),
            });
            continue;
        }

        if (isPresentationLabel(line)) {
            flushParagraph();
            continue;
        }

        buffer.push(line.trim());
    }

    flushParagraph();
    return blocks;
}

export {
    parseMarkdownBlocks,
    markdownToPlainText,
    markdownToRuns,
    stripListMarker,
    stripPresentationArtifacts,
};
