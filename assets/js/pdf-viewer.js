const PDF_WORKER_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const createFallbackLink = (url) => {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Open PDF in a new tab";
  return link;
};

const initializeViewer = (root) => {
  const statusEl = root.querySelector("[data-role='status']");
  const pageEl = root.querySelector("[data-role='page-indicator']");
  const zoomEl = root.querySelector("[data-role='zoom-indicator']");
  const canvas = root.querySelector("[data-role='canvas']");
  const ctx = canvas?.getContext("2d");
  const src = root.dataset.pdfSrc;

  if (!statusEl || !pageEl || !zoomEl || !canvas || !ctx || !src || !window.pdfjsLib) {
    return;
  }

  let pageNum = Math.max(1, Number.parseInt(root.dataset.startPage || "1", 10) || 1);
  let pageCount = 1;
  let zoom = Number.parseFloat(root.dataset.initialZoom || "1");
  let pdfDoc = null;
  let activeRenderTask = null;
  let renderVersion = 0;

  if (!Number.isFinite(zoom)) zoom = 1;
  zoom = Math.min(2.5, Math.max(0.5, zoom));

  const showFallback = (message) => {
    statusEl.hidden = false;
    statusEl.textContent = `${message} `;
    statusEl.appendChild(createFallbackLink(src));
  };

  const clampPage = (page) => Math.min(Math.max(1, page), pageCount);
  const updateMeta = () => {
    pageEl.textContent = `Page ${pageNum} / ${pageCount}`;
    zoomEl.textContent = `${Math.round(zoom * 100)}%`;
  };

  const cancelActiveRender = async () => {
    const renderTask = activeRenderTask;
    if (!renderTask) return;

    renderTask.cancel();
    try {
      await renderTask.promise;
    } catch (error) {
      if (error?.name !== "RenderingCancelledException") throw error;
    }

    if (activeRenderTask === renderTask) activeRenderTask = null;
  };

  const renderPage = async (targetPage) => {
    if (!pdfDoc) return;
    const safePage = clampPage(targetPage);
    const currentRenderVersion = ++renderVersion;
    pageNum = safePage;
    updateMeta();

    try {
      const page = await pdfDoc.getPage(safePage);
      if (currentRenderVersion !== renderVersion) return;

      const unscaled = page.getViewport({ scale: 1 });
      const wrap = root.querySelector(".pdf-viewer-canvas-wrap");
      if (!wrap) return;

      const wrapWidth = Math.max(1, wrap.clientWidth - 2);
      const wrapHeight = Math.max(1, wrap.clientHeight - 2);
      const fitWidthScale = wrapWidth / unscaled.width;
      const fitHeightScale = wrapHeight / unscaled.height;
      const fitMode = (root.dataset.fitMode || "page").toLowerCase();
      const baseScale = fitMode === "width" ? fitWidthScale : Math.min(fitWidthScale, fitHeightScale);
      const viewport = page.getViewport({ scale: Math.max(0.1, baseScale * zoom) });

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      await cancelActiveRender();
      if (currentRenderVersion !== renderVersion) return;

      const renderTask = page.render({ canvasContext: ctx, viewport });
      activeRenderTask = renderTask;
      await renderTask.promise;
    } catch (error) {
      if (error?.name === "RenderingCancelledException") return;
      showFallback("Could not render PDF page.");
      console.error(error);
    } finally {
      if (currentRenderVersion === renderVersion) activeRenderTask = null;
    }
  };

  root.querySelector("[data-action='prev']")?.addEventListener("click", () => {
    renderPage(pageNum - 1);
  });

  root.querySelector("[data-action='next']")?.addEventListener("click", () => {
    renderPage(pageNum + 1);
  });

  root.querySelector("[data-action='zoom-in']")?.addEventListener("click", () => {
    zoom = Math.min(2.5, zoom + 0.1);
    updateMeta();
    renderPage(pageNum);
  });

  root.querySelector("[data-action='zoom-out']")?.addEventListener("click", () => {
    zoom = Math.max(0.5, zoom - 0.1);
    updateMeta();
    renderPage(pageNum);
  });

  window.addEventListener("resize", () => {
    renderPage(pageNum);
  });

  updateMeta();
  window.pdfjsLib.getDocument(src).promise
    .then((document) => {
      pdfDoc = document;
      pageCount = document.numPages;
      pageNum = clampPage(pageNum);
      updateMeta();
      return renderPage(pageNum);
    })
    .catch((error) => {
      showFallback("Could not load PDF.");
      console.error(error);
    });
};

if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
  document.querySelectorAll(".pdf-viewer[data-pdf-src]").forEach(initializeViewer);
}