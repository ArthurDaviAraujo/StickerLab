import { backgroundTask, editor } from "./state.js";

// Referências aos elementos visuais usadas pelos outros módulos.
export const elements = {
  dropZone: document.querySelector("#dropZone"),
  dropHint: document.querySelector("#dropHint"),
  imageInput: document.querySelector("#imageInput"),
  uploadState: document.querySelector("#uploadState"),
  chooseImageButton: document.querySelector("#chooseImageButton"),
  controlContent: document.querySelector("#controlContent"),
  emptyControls: document.querySelector("#emptyControls"),
  controlsPanel: document.querySelector("#controlsPanel"),
  toast: document.querySelector("#toast"),
  addTextButton: document.querySelector("#addTextButton"),
  customizeButton: document.querySelector("#customizeButton"),
  undoButton: document.querySelector("#undoButton"),
  newStickerButton: document.querySelector("#newStickerButton"),
  resetSettingsButton: document.querySelector("#resetSettingsButton"),
  downloadButton: document.querySelector("#downloadButton"),
  textInput: document.querySelector("#textInput"),
  charCount: document.querySelector("#charCount"),
  fontSize: document.querySelector("#fontSize"),
  fontSizeValue: document.querySelector("#fontSizeValue"),
  fontFamily: document.querySelector("#fontFamily"),
  textColor: document.querySelector("#textColor"),
  textColorValue: document.querySelector("#textColorValue"),
  outlineToggle: document.querySelector("#outlineToggle"),
  outlineOptions: document.querySelector("#outlineOptions"),
  outlineWidth: document.querySelector("#outlineWidth"),
  outlineWidthValue: document.querySelector("#outlineWidthValue"),
  shadowToggle: document.querySelector("#shadowToggle"),
  removeBackgroundToggle: document.querySelector("#removeBackgroundToggle"),
  backgroundMessage: document.querySelector("#backgroundMessage"),
  backgroundFeature: document.querySelector("#backgroundFeature"),
  emojiButtons: [...document.querySelectorAll("[data-emoji]")],
  positionButtons: [...document.querySelectorAll("[data-position]")],
  outlineColorButtons: [...document.querySelectorAll("[data-outline-color]")]
};

let toastTimer = null;

export function showToast(message, type = "success") {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", type === "error");
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 3300);
}

export function updateButtons() {
  const hasImage = Boolean(editor.image);
  const disabled = !hasImage || backgroundTask.processing;

  [
    elements.addTextButton,
    elements.customizeButton,
    elements.newStickerButton,
    elements.resetSettingsButton
  ].forEach((button) => {
    button.disabled = disabled;
  });

  elements.undoButton.disabled = disabled || editor.history.length === 0;
  elements.downloadButton.disabled = disabled;
}

export function setBackgroundMessage(message, type = "processing") {
  elements.backgroundMessage.textContent = message;
  elements.backgroundMessage.hidden = false;
  elements.backgroundMessage.classList.toggle("is-success", type === "success");
  elements.backgroundMessage.classList.toggle("is-error", type === "error");
}

export function setBackgroundProcessing(processing) {
  backgroundTask.processing = processing;
  elements.removeBackgroundToggle.disabled = processing;
  elements.backgroundFeature.classList.toggle("is-processing", processing);
  elements.backgroundFeature.setAttribute("aria-busy", String(processing));
  updateButtons();
}

export function setEditorEnabled(enabled) {
  elements.uploadState.hidden = enabled;
  elements.controlContent.hidden = !enabled;
  elements.emptyControls.hidden = enabled;
  elements.dropZone.setAttribute(
    "aria-label",
    enabled ? "Prévia da figurinha. Clique para trocar a imagem." : "Enviar imagem"
  );
  updateButtons();
}

export function syncControls() {
  const state = editor.settings;
  elements.textInput.value = state.text;
  elements.charCount.textContent = `${state.text.length}/52`;
  elements.fontSize.value = state.fontSize;
  elements.fontSizeValue.textContent = state.fontSize;
  elements.fontFamily.value = state.fontFamily;
  elements.textColor.value = state.textColor;
  elements.textColorValue.textContent = state.textColor.toUpperCase();
  elements.outlineToggle.checked = state.outline;
  elements.outlineOptions.classList.toggle("is-disabled", !state.outline);
  elements.outlineWidth.value = state.outlineWidth;
  elements.outlineWidthValue.textContent = state.outlineWidth;
  elements.shadowToggle.checked = state.shadow;
  elements.removeBackgroundToggle.checked = state.removeBackground;
  elements.backgroundMessage.hidden = !state.removeBackground;

  if (state.removeBackground && editor.processedImage && !backgroundTask.processing) {
    setBackgroundMessage("Fundo removido. A foto original continua preservada.", "success");
  }

  elements.positionButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.position === state.position);
  });

  elements.outlineColorButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.outlineColor === state.outlineColor);
  });
}
