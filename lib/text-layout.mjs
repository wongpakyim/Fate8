/**
 * 纯文本盘面排版工具。
 *
 * 领域模块只提供每个宫位的文字行；本模块统一处理 CJK 宽度、换行、补白、
 * 九宫格与十二宫环式布局，不包含任何术数规则。
 */

function isWideCharacter(codePoint) {
  return codePoint >= 0x1100 && (
    codePoint <= 0x115f || codePoint === 0x2329 || codePoint === 0x232a ||
    (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x1f300 && codePoint <= 0x1faff) ||
    (codePoint >= 0x20000 && codePoint <= 0x3fffd)
  );
}

export function textDisplayWidth(value) {
  return [...String(value ?? "")].reduce((width, character) => width + (isWideCharacter(character.codePointAt(0) || 0) ? 2 : 1), 0);
}

export function padText(value, width, align = "left") {
  const text = String(value ?? "");
  const remaining = Math.max(0, width - textDisplayWidth(text));
  if (align === "right") return `${" ".repeat(remaining)}${text}`;
  if (align === "center") {
    const left = Math.floor(remaining / 2);
    return `${" ".repeat(left)}${text}${" ".repeat(remaining - left)}`;
  }
  return `${text}${" ".repeat(remaining)}`;
}

export function wrapText(value, width) {
  const sourceLines = String(value ?? "").split("\n");
  return sourceLines.flatMap((source) => {
    if (!source) return [""];
    const lines = [];
    let line = "";
    let lineWidth = 0;
    for (const character of [...source]) {
      const characterWidth = isWideCharacter(character.codePointAt(0) || 0) ? 2 : 1;
      if (line && lineWidth + characterWidth > width) {
        lines.push(line);
        line = "";
        lineWidth = 0;
      }
      line += character;
      lineWidth += characterWidth;
    }
    lines.push(line);
    return lines;
  });
}

function cellLines(value, width) {
  const source = Array.isArray(value) ? value : String(value ?? "").split("\n");
  return source.flatMap((line) => wrapText(line, width));
}

function normalizedCell(value, width, height, align = "left") {
  const lines = cellLines(value, width);
  return Array.from({ length: height }, (_, index) => padText(lines[index] ?? "", width, align));
}

export function renderTextGrid(rows, options = {}) {
  const cellWidth = options.cellWidth ?? 28;
  const columnCount = Math.max(...rows.map((row) => row.length));
  const horizontal = "─".repeat(cellWidth);
  const border = (left, joint, right) => `${left}${Array.from({ length: columnCount }, () => horizontal).join(joint)}${right}`;
  const lines = [border("┌", "┬", "┐")];

  rows.forEach((row, rowIndex) => {
    const cells = Array.from({ length: columnCount }, (_, index) => cellLines(row[index] ?? "", cellWidth));
    const height = Math.max(1, ...cells.map((cell) => cell.length));
    const normalized = cells.map((cell) => normalizedCell(cell, cellWidth, height, options.align));
    for (let lineIndex = 0; lineIndex < height; lineIndex += 1) {
      lines.push(`│${normalized.map((cell) => cell[lineIndex]).join("│")}│`);
    }
    lines.push(rowIndex === rows.length - 1 ? border("└", "┴", "┘") : border("├", "┼", "┤"));
  });
  return lines.join("\n");
}

export function renderTextRing({ top, left, right, bottom, center = [] }, options = {}) {
  if (top.length !== 4 || bottom.length !== 4 || left.length !== 2 || right.length !== 2) {
    throw new TypeError("十二宫环式布局需要上四、左二、右二、下四共十二个宫位");
  }
  const cellWidth = options.cellWidth ?? 24;
  const allCells = [...top, ...left, ...right, ...bottom].map((cell) => cellLines(cell, cellWidth));
  const cellHeight = Math.max(1, ...allCells.map((cell) => cell.length));
  let cursor = 0;
  const normalizeNext = () => normalizedCell(allCells[cursor++], cellWidth, cellHeight);
  const topCells = top.map(normalizeNext);
  const leftCells = left.map(normalizeNext);
  const rightCells = right.map(normalizeNext);
  const bottomCells = bottom.map(normalizeNext);
  const horizontal = "─".repeat(cellWidth);
  const centerWidth = cellWidth * 2 + 1;
  const centerHeight = cellHeight * 2 + 1;
  const centerSource = center.flatMap((line) => wrapText(line, centerWidth));
  const centerTopPadding = Math.max(0, Math.floor((centerHeight - centerSource.length) / 2));
  const centerLines = Array.from({ length: centerHeight }, (_, index) => {
    const sourceIndex = index - centerTopPadding;
    return padText(centerSource[sourceIndex] ?? "", centerWidth, "center");
  });
  const lines = [`┌${[horizontal, horizontal, horizontal, horizontal].join("┬")}┐`];

  for (let index = 0; index < cellHeight; index += 1) lines.push(`│${topCells.map((cell) => cell[index]).join("│")}│`);
  lines.push(`├${horizontal}┤${" ".repeat(centerWidth)}├${horizontal}┤`);

  let centerIndex = 0;
  for (let sideRow = 0; sideRow < 2; sideRow += 1) {
    for (let index = 0; index < cellHeight; index += 1) {
      lines.push(`│${leftCells[sideRow][index]}│${centerLines[centerIndex++]}│${rightCells[sideRow][index]}│`);
    }
    if (sideRow === 0) {
      lines.push(`├${horizontal}┤${centerLines[centerIndex++]}├${horizontal}┤`);
    }
  }

  lines.push(`├${[horizontal, horizontal, horizontal, horizontal].join("┬")}┤`);
  for (let index = 0; index < cellHeight; index += 1) lines.push(`│${bottomCells.map((cell) => cell[index]).join("│")}│`);
  lines.push(`└${[horizontal, horizontal, horizontal, horizontal].join("┴")}┘`);
  return lines.join("\n");
}
