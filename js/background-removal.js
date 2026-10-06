import {
  backgroundTask,
  editor,
  saveHistory,
  selectActiveImage
} from "./state.js";
import {
  elements,
  setBackgroundMessage,
  setBackgroundProcessing,
  showToast,
  updateButtons
} from "./ui.js";
import { drawSticker } from "./canvas.js";
import { imageFromBlob } from "./upload.js";

async function removeBackgroundWithAI() {
  if (!editor.originalFile || !editor.originalObjectUrl) return;

  const requestId = ++backgroundTask.requestId;
  setBackgroundProcessing(true);
  setBackgroundMessage("Carregando a inteligência artificial…");

  try {
    // A biblioteca é carregada pela CDN apenas quando o usuário ativa o recurso.
    const { pipeline } = await import(
      "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1"
    );

    if (!backgroundTask.pipelinePromise) {
      backgroundTask.pipelinePromise = pipeline(
        "background-removal",
        "onnx-community/ormbg-ONNX",
        {
          dtype: "q8",
          progress_callback: (progress) => {
            if (
              requestId !== backgroundTask.requestId ||
              typeof progress?.progress !== "number"
            ) return;

            const percent = Math.round(
              progress.progress <= 1 ? progress.progress * 100 : progress.progress
            );
            setBackgroundMessage(`Baixando o modelo de IA… ${Math.min(100, percent)}%`);
          }
        }
      );
    }

    const remover = await backgroundTask.pipelinePromise;
    if (requestId !== backgroundTask.requestId) return;

    setBackgroundMessage("Identificando a pessoa ou objeto principal…");
    const result = await remover(editor.originalObjectUrl);
    const resultBlob = await result[0].toBlob();
    const loadedResult = await imageFromBlob(resultBlob);

    if (requestId !== backgroundTask.requestId) {
      URL.revokeObjectURL(loadedResult.objectUrl);
      return;
    }

    if (editor.processedObjectUrl) URL.revokeObjectURL(editor.processedObjectUrl);
    editor.processedObjectUrl = loadedResult.objectUrl;
    editor.processedImage = loadedResult.image;
    selectActiveImage();
    drawSticker();
    setBackgroundMessage("Fundo removido. A foto original continua preservada.", "success");
    showToast("Fundo removido com inteligência artificial!");
  } catch (error) {
    console.error("Falha ao remover o fundo:", error);
    backgroundTask.pipelinePromise = null;
    if (requestId !== backgroundTask.requestId) return;

    editor.settings.removeBackground = false;
    elements.removeBackgroundToggle.checked = false;
    selectActiveImage();
    drawSticker();
    setBackgroundMessage(
      "Não foi possível carregar a IA. Confira a internet e tente novamente.",
      "error"
    );
    showToast("Não foi possível remover o fundo.", "error");
  } finally {
    if (requestId === backgroundTask.requestId) setBackgroundProcessing(false);
  }
}

export function initializeBackgroundRemoval() {
  elements.removeBackgroundToggle.addEventListener("change", async () => {
    saveHistory();
    editor.settings.removeBackground = elements.removeBackgroundToggle.checked;
    updateButtons();

    if (!editor.settings.removeBackground) {
      backgroundTask.requestId += 1;
      selectActiveImage();
      elements.backgroundMessage.hidden = true;
      drawSticker();
      updateButtons();
      return;
    }

    if (editor.processedImage) {
      selectActiveImage();
      drawSticker();
      setBackgroundMessage("Fundo removido. A foto original continua preservada.", "success");
      return;
    }

    await removeBackgroundWithAI();
  });
}
