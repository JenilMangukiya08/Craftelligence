import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

const API_BASE = "http://127.0.0.1:8000";

const getProductImageSrc = (url) => {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
};

function AIRecommendation() {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [suggestion, setSuggestion] = useState("");
  const [imageAnalysis, setImageAnalysis] = useState("");
  const [productPos, setProductPos] = useState({ x: 0.72, y: 0.68 });
  const [productScale, setProductScale] = useState(1);
  const [processedProductImage, setProcessedProductImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef(null);
  const productRectRef = useRef(null);
  const draggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const canvasSizeRef = useRef({ width: 860, height: 540 });

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  useEffect(() => {
    if (!canvasRef.current || !photoPreview || !processedProductImage) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const background = new Image();
    const productImage = processedProductImage;
    let backgroundLoaded = false;
    let productLoaded = true;

    const drawCanvas = () => {
      if (!backgroundLoaded || !productLoaded) return;
      const width = canvasSizeRef.current.width;
      const height = canvasSizeRef.current.height;
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#f7efe8";
      ctx.fillRect(0, 0, width, height);
      const bgRatio = background.width / background.height;
      const canvasRatio = width / height;
      let bw = width;
      let bh = height;
      if (bgRatio > canvasRatio) {
        bh = height;
        bw = height * bgRatio;
      } else {
        bw = width;
        bh = width / bgRatio;
      }
      ctx.drawImage(background, (width - bw) / 2, (height - bh) / 2, bw, bh);
      const productMaxWidth = width * 0.28;
      const productMaxHeight = height * 0.28;
      const productRatio = productImage.width / productImage.height;
      let pw = productMaxWidth * productScale;
      let ph = pw / productRatio;
      if (ph > productMaxHeight * productScale) {
        ph = productMaxHeight * productScale;
        pw = ph * productRatio;
      }
      if (pw > width - 32) {
        pw = width - 32;
        ph = pw / productRatio;
      }
      if (ph > height - 32) {
        ph = height - 32;
        pw = ph * productRatio;
      }
      const px = Math.max(16, Math.min(width - pw - 16, Math.round(width * productPos.x)));
      const py = Math.max(16, Math.min(height - ph - 16, Math.round(height * productPos.y)));
      productRectRef.current = { x: px, y: py, w: pw, h: ph };
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.drawImage(productImage, px, py, pw, ph);
      ctx.restore();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 3;
      ctx.strokeRect(px - 2, py - 2, pw + 4, ph + 4);
      ctx.fillStyle = "rgba(10, 10, 10, 0.78)";
      ctx.font = "18px 'DM Sans', sans-serif";
      ctx.fillText("Preview: product in your room", 26, 34);
    };

    background.onload = () => {
      backgroundLoaded = true;
      drawCanvas();
    };

    background.src = photoPreview;
  }, [photoPreview, processedProductImage, productPos, productScale]);

  useEffect(() => {
    if (!selectedProduct?.image) {
      setProcessedProductImage(null);
      return;
    }

    const original = new Image();
    original.crossOrigin = "anonymous";
    original.onload = () => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = original.width;
      tempCanvas.height = original.height;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.drawImage(original, 0, 0);

      try {
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const alpha = data[i + 3];
          const lightness = Math.max(r, g, b) - Math.min(r, g, b);
          if (alpha > 16 && r >= 230 && g >= 230 && b >= 230 && lightness < 30) {
            data[i + 3] = 0;
          }
        }
        tempCtx.putImageData(imageData, 0, 0);
      } catch (error) {
        console.warn("Product background cleanup failed.", error);
      }

      const cleaned = new Image();
      cleaned.onload = () => {
        setProcessedProductImage(cleaned);
      };
      cleaned.src = tempCanvas.toDataURL("image/png");
    };
    original.src = getProductImageSrc(selectedProduct.image);
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct) {
      setProductPos({ x: 0.72, y: 0.68 });
      setProductScale(1);
    }
  }, [selectedProduct]);

  const getCanvasMousePos = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSizeRef.current.width / rect.width;
    const scaleY = canvasSizeRef.current.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseDown = (event) => {
    const rect = productRectRef.current;
    if (!rect) return;
    const pos = getCanvasMousePos(event);
    if (pos.x >= rect.x && pos.x <= rect.x + rect.w && pos.y >= rect.y && pos.y <= rect.y + rect.h) {
      draggingRef.current = true;
      setIsDragging(true);
      dragOffsetRef.current = { x: pos.x - rect.x, y: pos.y - rect.y };
      event.preventDefault();
    }
  };

  const handleCanvasMouseMove = (event) => {
    if (!draggingRef.current) return;
    const pos = getCanvasMousePos(event);
    const newX = Math.min(Math.max((pos.x - dragOffsetRef.current.x) / canvasSizeRef.current.width, 0), 1);
    const newY = Math.min(Math.max((pos.y - dragOffsetRef.current.y) / canvasSizeRef.current.height, 0), 1);
    setProductPos({ x: newX, y: newY });
  };

  const handleCanvasMouseUp = () => {
    draggingRef.current = false;
    setIsDragging(false);
  };

  const handleCanvasMouseLeave = () => {
    if (draggingRef.current) {
      draggingRef.current = false;
      setIsDragging(false);
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSearch = async () => {
    setError("");
    if (!photoFile && !prompt.trim()) {
      setError("Please upload a photo or describe the room/wall where you want to place a product.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      if (photoFile) {
        formData.append('image', photoFile);
      }
      if (prompt.trim()) {
        formData.append('query', prompt.trim());
      }

      const response = await axios.post(`${API_BASE}/api/ai-design/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.error) {
        setError(response.data.error);
        setProducts([]);
        setSuggestion("");
        setImageAnalysis("");
        setSelectedProduct(null);
        setProcessedProductImage(null);
      } else {
        setImageAnalysis(response.data.image_analysis || "");
        setSuggestion(response.data.suggestion || "We found matching artisanal products for your space.");
        const found = response.data.products || [];
        setProducts(found);
        setSelectedProduct(found[0] || null);
        setProductScale(1);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load AI recommendations. Please try again.");
      setProducts([]);
      setSuggestion("");
      setImageAnalysis("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-page">
      <div className="ai-header">
        <div>
          <h1>{t("ai_design_title")}</h1>
          <p>
            {t("ai_design_desc")}
          </p>
        </div>
        <div className="ai-actions">
          <label className="ai-file-label">
            {t("ai_upload_btn")}
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
          </label>
          <button onClick={handleSearch} disabled={loading} className="ai-button">
            {loading ? t("ai_thinking") : t("ai_get_rec")}
          </button>
        </div>
      </div>

      <div className="ai-form-row">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("ai_prompt")}
          rows={4}
        />
      </div>

      {error && <div className="ai-error">{error}</div>}

      <div className="ai-content-grid">
        <section className="ai-preview-card">
          <div className="ai-card-title">{t("ai_preview_title")}</div>
          {photoPreview ? (
            <div className="ai-image-preview">
              <img src={photoPreview} alt="Room preview" />
            </div>
          ) : (
            <div className="ai-placeholder">{t("ai_placeholder")}</div>
          )}
          <canvas
            ref={canvasRef}
            className={`ai-canvas ${isDragging ? "dragging" : ""}`}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseLeave}
          />
          <div className="ai-preview-hint">Drag the selected product over the preview to place it anywhere in your room.</div>
          <div className="ai-size-control">
            <label htmlFor="product-scale">Resize product</label>
            <div className="ai-size-control-row">
              <input
                id="product-scale"
                type="range"
                min="0.5"
                max="1.8"
                step="0.05"
                value={productScale}
                onChange={(e) => setProductScale(Number(e.target.value))}
              />
              <span>{Math.round(productScale * 100)}%</span>
            </div>
          </div>
        </section>

        <section className="ai-suggestions-card">
          <div className="ai-card-title">{t("ai_rec_title")}</div>
          {imageAnalysis && (
            <div className="ai-analysis-section">
              <h4>{t("ai_analysis")}</h4>
              <p className="ai-analysis-text">
                {imageAnalysis.includes("quota exceeded") || imageAnalysis.includes("API quota") ? (
                  <span style={{ color: '#ff6b6b' }}>{imageAnalysis}</span>
                ) : (
                  imageAnalysis
                )}
              </p>
            </div>
          )}
          <div className="ai-suggestion-section">
            <h4>{t("ai_suggestion")}</h4>
            <p className="ai-suggestion-text">{suggestion || "Enter your room details and click Get recommendation."}</p>
          </div>
          <div className="ai-products-list">
            {products.length === 0 && (
              <div className="ai-placeholder">Search results will appear here after you submit a prompt.</div>
            )}
            {products.map((product) => (
              <div key={product.product_id} className={`ai-product-item ${selectedProduct?.product_id === product.product_id ? "selected" : ""}`}>
                {product.image ? (
                  <img src={getProductImageSrc(product.image)} alt={product.name} />
                ) : (
                  <div className="ai-product-image-fallback">No image</div>
                )}
                <div className="ai-product-info">
                  <strong>{product.name}</strong>
                  <span>{product.category || "Craft"}</span>
                  <span>₹{product.price}</span>
                </div>
                <button onClick={() => setSelectedProduct(product)}>
                  {t("ai_use_product")}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AIRecommendation;
