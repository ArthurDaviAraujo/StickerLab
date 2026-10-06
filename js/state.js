// Estado central do editor. Este arquivo não acessa a interface diretamente.
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_SIZE = 15 * 1024 * 1024;
export const CANVAS_SIZE = 1080;
export const HISTORY_LIMIT = 40;

export function createDefaultState() {
  return {
    text: "",
    position: "top",
    fontSize: 84,
    fontFamily: "Impact, Haettenschweiler, sans-serif",
    textColor: "#ffffff",
    outline: true,
    outlineColor: "#000000",
    outlineWidth: 12,
    shadow: false,
    removeBackground: false
  };
}

export const editor = {
  settings: createDefaultState(),
  image: null,
  originalImage: null,
  processedImage: null,
  originalFile: null,
  originalObjectUrl: null,
  processedObjectUrl: null,
  imageName: "figurinha",
  history: []
};

export const backgroundTask = {
  pipelinePromise: null,
  requestId: 0,
  processing: false
};

export function saveHistory() {
  editor.history.push({ ...editor.settings });
  if (editor.history.length > HISTORY_LIMIT) editor.history.shift();
}

export function selectActiveImage() {
  editor.image = editor.settings.removeBackground && editor.processedImage
    ? editor.processedImage
    : editor.originalImage;
}

export function releaseImageUrls() {
  if (editor.originalObjectUrl) URL.revokeObjectURL(editor.originalObjectUrl);
  if (editor.processedObjectUrl) URL.revokeObjectURL(editor.processedObjectUrl);
  editor.originalObjectUrl = null;
  editor.processedObjectUrl = null;
}

export function sanitizeFileName(name) {
  return name
    .replace(/\.[^/.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "figurinha";
}
