import {
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  backgroundTask,
  createDefaultState,
  editor,
  releaseImageUrls,
  sanitizeFileName
} from "./state.js";
import {
  elements,
  setBackgroundProcessing,
  setEditorEnabled,
  showToast,
  syncControls
} from "./ui.js";
import { drawSticker } from "./canvas.js";

export function imageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const nextImage = new Image();
    nextImage.onload = () => resolve({ image: nextImage, objectUrl });
    nextImage.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("A imagem processada não pôde ser aberta."));
    };
    nextImage.src = objectUrl;
  });
}

// Carrega apenas formatos seguros e limita arquivos muito grandes.
export function loadImageFile(file) {
  if (!file) return;

  if (!ALLOWED_TYPES.includes(file.type)) {
    showToast("Formato não aceito. Use JPG, JPEG, PNG ou WEBP.", "error");
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    showToast("A imagem é muito grande. Escolha um arquivo de até 15 MB.", "error");
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const nextImage = new Image();

  nextImage.onload = () => {
    backgroundTask.requestId += 1;
    releaseImageUrls();

    editor.originalObjectUrl = objectUrl;
    editor.originalFile = file;
    editor.originalImage = nextImage;
    editor.processedImage = null;
    editor.image = editor.originalImage;
    editor.imageName = sanitizeFileName(file.name);
    editor.history = [];
    editor.settings = createDefaultState();

    setBackgroundProcessing(false);
    syncControls();
    setEditorEnabled(true);
    drawSticker();
    showToast("Imagem carregada. Agora é só personalizar!");
  };

  nextImage.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    showToast("Não foi possível abrir esta imagem.", "error");
  };

  nextImage.src = objectUrl;
  elements.imageInput.value = "";
}

// Upload por clique, teclado ou arrastar e soltar.
export function initializeUpload() {
  elements.chooseImageButton.addEventListener("click", (event) => {
    event.stopPropagation();
    elements.imageInput.click();
  });

  elements.dropZone.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;
    elements.imageInput.click();
  });

  elements.imageInput.addEventListener("change", () => {
    loadImageFile(elements.imageInput.files[0]);
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropZone.classList.add("is-dragging");
      elements.dropHint.setAttribute("aria-hidden", "false");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      if (eventName === "dragleave" && elements.dropZone.contains(event.relatedTarget)) return;
      elements.dropZone.classList.remove("is-dragging");
      elements.dropHint.setAttribute("aria-hidden", "true");
    });
  });

  elements.dropZone.addEventListener("drop", (event) => {
    const file = [...event.dataTransfer.files].find((item) => item.type.startsWith("image/"));
    loadImageFile(file);
  });
}
