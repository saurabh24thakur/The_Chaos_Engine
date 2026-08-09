import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const ROOT_DIR = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../../"
);

function resolveWithinRoot(targetPath = ".") {
    if (typeof targetPath !== "string") {
        throw new Error("Invalid file path.");
    }

    const trimmed = targetPath.trim() || ".";

    if (trimmed.includes("\0")) {
        throw new Error("Invalid file path.");
    }

    if (path.isAbsolute(trimmed)) {
        throw new Error("Absolute paths are not allowed.");
    }

    const resolvedPath = path.resolve(ROOT_DIR, trimmed);
    const relativePath = path.relative(ROOT_DIR, resolvedPath);

    if (
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error("Path escapes the allowed workspace.");
    }

    return resolvedPath;
}

function toRelativePath(absolutePath) {
    const relativePath = path.relative(ROOT_DIR, absolutePath);
    return relativePath || ".";
}

export async function readFile(filePath) {
    const resolvedPath = resolveWithinRoot(filePath);

    let stats;
    try {
        stats = await fs.stat(resolvedPath);
    } catch {
        throw new Error("File not found.");
    }

    if (!stats.isFile()) {
        throw new Error("Path is not a file.");
    }

    const content = await fs.readFile(resolvedPath, "utf8");

    return {
        success: true,
        path: toRelativePath(resolvedPath),
        content,
    };
}

export async function writeFile(filePath, content) {
    if (content === undefined || content === null) {
        throw new Error("File content is required.");
    }

    const resolvedPath = resolveWithinRoot(filePath);
    const directory = path.dirname(resolvedPath);

    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(resolvedPath, String(content), "utf8");

    return {
        success: true,
        path: toRelativePath(resolvedPath),
    };
}

export async function listFiles(targetPath = ".") {
    const resolvedPath = resolveWithinRoot(targetPath);

    let stats;
    try {
        stats = await fs.stat(resolvedPath);
    } catch {
        throw new Error("Directory not found.");
    }

    if (!stats.isDirectory()) {
        throw new Error("Path is not a directory.");
    }

    const entries = await fs.readdir(resolvedPath, {
        withFileTypes: true,
    });

    return {
        success: true,
        path: toRelativePath(resolvedPath),
        items: entries.map((entry) => ({
            name: entry.name,
            type: entry.isDirectory() ? "directory" : "file",
            path: toRelativePath(path.join(resolvedPath, entry.name)),
        })),
    };
}

const codingTool = {
    readFile,
    writeFile,
    listFiles,
};

export default codingTool;
