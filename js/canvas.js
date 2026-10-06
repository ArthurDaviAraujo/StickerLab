import { CANVAS_SIZE, editor } from "./state.js";
import { showToast } from "./ui.js";

const canvas = document.querySelector("#stickerCanvas");
const context = canvas.getContext("2d");

// Divide frases longas em linhas que cabem na figurinha.
function wrapText(text, maxWidth) {
  const paragraphs = text.split("\n");
  const lines = [];

  paragraphs.forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return;
    let line = words[0];

    words.slice(1).forEach((word) => {
      const testLine = `${line} ${word}`;
      if (context.measureText(testLine).width <= maxWidth) {
        line = testLine;
      } else {
        lines.push(line);
        line = word;
      }
    });
    lines.push(line);
  });

  return lines.slice(0, 4);
}

function drawText() {
  const state = editor.settings;
  const value = state.text.trim();
  if (!value) return;

  context.save();
  context.font = `900 ${state.fontSize}px ${state.fontFamily}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineJoin = "round";
  context.miterLimit = 2;

  const lines = wrapText(value, CANVAS_SIZE - 120);
  const lineHeight = state.fontSize * 1.04;
  const blockHeight = lines.length * lineHeight;
  const margin = 76;
  const startY = state.position === "top"
    ? margin + lineHeight / 2
    : CANVAS_SIZE - margin - blockHeight + lineHeight / 2;

  if (state.shadow) {
    context.shadowColor = "rgba(0, 0, 0, 0.48)";
    context.shadowBlur = 22;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 12;
  }

  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;
    if (state.outline) {
      context.strokeStyle = state.outlineColor;
      context.lineWidth = state.outlineWidth;
      context.strokeText(line, CANVAS_SIZE / 2, y);
    }
    context.fillStyle = state.textColor;
    context.fillText(line, CANVAS_SIZE / 2, y);
  });

  context.restore();
}

// Ajusta a foto dentro do quadrado sem esticar nem cortar.
export function drawSticker() {
  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  if (!editor.image) return;

  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const padding = 28;
  const availableSize = CANVAS_SIZE - padding * 2;
  const scale = Math.min(
    availableSize / editor.image.naturalWidth,
    availableSize / editor.image.naturalHeight
  );
  const width = editor.image.naturalWidth * scale;
  const height = editor.image.naturalHeight * scale;
  const x = (CANVAS_SIZE - width) / 2;
  const y = (CANVAS_SIZE - height) / 2;
  context.drawImage(editor.image, x, y, width, height);
  context.restore();

  drawText();
}

export function clearCanvas() {
  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

export function downloadSticker() {
  if (!editor.image) {
    showToast("Escolha uma imagem antes de baixar.", "error");
    return;
  }

  const format = document.querySelector('input[name="format"]:checked').value;
  const mimeType = format === "webp" ? "image/webp" : "image/png";
  const quality = format === "webp" ? 0.94 : undefined;

  canvas.toBlob((blob) => {
    if (!blob) {
      showToast("Seu navegador não conseguiu gerar esse formato. Tente PNG.", "error");
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stickerlab-${editor.imageName}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Figurinha ${format.toUpperCase()} baixada com sucesso!`);
  }, mimeType, quality);
}
