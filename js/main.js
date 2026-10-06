import {
  backgroundTask,
  createDefaultState,
  editor,
  releaseImageUrls,
  saveHistory,
  selectActiveImage
} from "./state.js";
import {
  elements,
  setBackgroundProcessing,
  setEditorEnabled,
  showToast,
  syncControls,
  updateButtons
} from "./ui.js";
import { clearCanvas, downloadSticker, drawSticker } from "./canvas.js";
import { initializeUpload } from "./upload.js";
import { initializeBackgroundRemoval } from "./background-removal.js";

function applyChange(key, value) {
  if (editor.settings[key] === value) return;
  saveHistory();
  editor.settings[key] = value;
  drawSticker();
  updateButtons();
}

function resetEditor() {
  backgroundTask.requestId += 1;
  releaseImageUrls();

  editor.image = null;
  editor.originalImage = null;
  editor.processedImage = null;
  editor.originalFile = null;
  editor.imageName = "figurinha";
  editor.history = [];
  editor.settings = createDefaultState();

  setBackgroundProcessing(false);
  clearCanvas();
  syncControls();
  setEditorEnabled(false);
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("Editor limpo. Escolha uma nova imagem.");
}

// Restaura apenas os ajustes e mantém a foto atual no editor.
function resetSettings() {
  const initialState = createDefaultState();
  const alreadyDefault = Object.keys(initialState).every(
    (key) => editor.settings[key] === initialState[key]
  );

  if (alreadyDefault) {
    showToast("As configurações já estão no padrão inicial.");
    return;
  }

  saveHistory();
  editor.settings = initialState;
  selectActiveImage();
  syncControls();
  drawSticker();
  updateButtons();
  showToast("Configurações resetadas. Sua foto foi mantida.");
}

function undo() {
  const previousState = editor.history.pop();
  if (!previousState) return;
  editor.settings = previousState;
  selectActiveImage();
  syncControls();
  drawSticker();
  updateButtons();
}

function initializeEditorControls() {
  elements.textInput.addEventListener("input", () => {
    const nextText = elements.textInput.value;
    if (nextText === editor.settings.text) return;
    saveHistory();
    editor.settings.text = nextText;
    elements.charCount.textContent = `${nextText.length}/52`;
    drawSticker();
    updateButtons();
  });

  elements.emojiButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextText = `${editor.settings.text}${button.dataset.emoji}`.slice(0, 52);
      applyChange("text", nextText);
      syncControls();
      elements.textInput.focus();
    });
  });

  elements.positionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyChange("position", button.dataset.position);
      syncControls();
    });
  });

  elements.fontSize.addEventListener("input", () => {
    elements.fontSizeValue.textContent = elements.fontSize.value;
    applyChange("fontSize", Number(elements.fontSize.value));
  });

  elements.fontFamily.addEventListener("change", () => {
    applyChange("fontFamily", elements.fontFamily.value);
  });

  elements.textColor.addEventListener("input", () => {
    elements.textColorValue.textContent = elements.textColor.value.toUpperCase();
    applyChange("textColor", elements.textColor.value);
  });

  elements.outlineToggle.addEventListener("change", () => {
    applyChange("outline", elements.outlineToggle.checked);
    elements.outlineOptions.classList.toggle("is-disabled", !elements.outlineToggle.checked);
  });

  elements.outlineColorButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyChange("outlineColor", button.dataset.outlineColor);
      syncControls();
    });
  });

  elements.outlineWidth.addEventListener("input", () => {
    elements.outlineWidthValue.textContent = elements.outlineWidth.value;
    applyChange("outlineWidth", Number(elements.outlineWidth.value));
  });

  elements.shadowToggle.addEventListener("change", () => {
    applyChange("shadow", elements.shadowToggle.checked);
  });

  elements.addTextButton.addEventListener("click", () => {
    elements.controlsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => elements.textInput.focus(), 350);
  });

  elements.customizeButton.addEventListener("click", () => {
    elements.controlsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  elements.undoButton.addEventListener("click", undo);
  elements.newStickerButton.addEventListener("click", resetEditor);
  elements.resetSettingsButton.addEventListener("click", resetSettings);
  elements.downloadButton.addEventListener("click", downloadSticker);
}

initializeUpload();
initializeBackgroundRemoval();
initializeEditorControls();
syncControls();
setEditorEnabled(false);
