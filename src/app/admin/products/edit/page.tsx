"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCookie, setCookie, ACCESS_TOKEN_COOKIE } from "@/lib/cookies";
import {
  ArrowLeft, Save, Upload, X, Plus, Infinity, Camera, GripVertical, Loader2, ImageIcon, ImagePlus,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const DRAFT_COOKIE = "brand_product_draft";

function parseImages(raw: string | string[]): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); if (Array.isArray(p)) return p; return raw ? [raw] : []; } catch { return raw ? [raw] : []; }
  }
  return [];
}

function parseTags(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); if (Array.isArray(p)) return p.map(String); return raw ? [raw] : []; } catch { return raw ? [raw] : []; }
  }
  return [];
}

function EditProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const isEditing = !!productId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Form state
  const [productName, setProductName] = useState("");
  const [productSlug, setProductSlug] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productComparePrice, setProductComparePrice] = useState("");
  const [productStock, setProductStock] = useState("");
  const [productStockUnlimited, setProductStockUnlimited] = useState(false);
  const [productDesc, setProductDesc] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productIsActive, setProductIsActive] = useState(true);
  const [productIsFeatured, setProductIsFeatured] = useState(false);
  const [productIsPublished, setProductIsPublished] = useState(true);
  const [productSizes, setProductSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");

  // Drag & drop for photos
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const getToken = () => getCookie(ACCESS_TOKEN_COOKIE) || "";

  useEffect(() => {
    if (isEditing) {
      loadProduct();
    }
  }, [productId]);

  async function loadProduct() {
    try {
      const res = await fetch(`${API_URL}/api/products/${productId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const p = data.data;
        setProductName(p.name);
        setProductSlug(p.slug);
        setProductPrice(p.price.toString());
        setProductComparePrice(p.compareAtPrice?.toString() || "");
        const isUnlimited = p.stockQuantity >= 999999;
        setProductStockUnlimited(isUnlimited);
        setProductStock(isUnlimited ? "" : p.stockQuantity.toString());
        setProductDesc(p.description || "");
        setProductImages(parseImages(p.images));
        setProductIsActive(p.isActive);
        setProductIsFeatured(p.isFeatured);
        setProductIsPublished(p.isPublished);
        setProductSizes(parseTags(p.tags));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const handleUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const token = getToken();
    setUploadingCount(files.length);
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("file", files[i]);
      try {
        const res = await fetch(`${API_URL}/api/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
        const data = await res.json();
        if (data.success && data.data?.url) {
          setProductImages((prev) => [...prev, data.data.url]);
        }
      } catch (e) { console.error(e); }
    }
    setUploadingCount(0);
  };

  const removeImage = (index: number) => setProductImages((prev) => prev.filter((_, i) => i !== index));
  const setMainImage = (index: number) => {
    setProductImages((prev) => { const n = [...prev]; const [m] = n.splice(index, 1); n.unshift(m); return n; });
  };

  const handleDragStart = (index: number) => setDraggingIndex(index);
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => { e.preventDefault(); if (draggingIndex !== null && draggingIndex !== index) setDragOverIndex(index); }, [draggingIndex]);
  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === index) { setDraggingIndex(null); setDragOverIndex(null); return; }
    setProductImages((prev) => { const n = [...prev]; const [d] = n.splice(draggingIndex, 1); n.splice(index, 0, d); return n; });
    setDraggingIndex(null); setDragOverIndex(null);
  }, [draggingIndex]);
  const handleDragEnd = () => { setDraggingIndex(null); setDragOverIndex(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || productName.trim().length < 2) { alert("название товара должно содержать минимум 2 символа"); return; }
    const priceVal = parseFloat(productPrice);
    if (isNaN(priceVal) || priceVal < 0) { alert("укажите корректную цену"); return; }

    setSaving(true);
    const token = getToken();
    const body = {
      name: productName,
      slug: productSlug || productName.toLowerCase().replace(/\s+/g, "-"),
      price: priceVal,
      compareAtPrice: productComparePrice ? parseFloat(productComparePrice) : null,
      stockQuantity: productStockUnlimited ? 999999 : parseInt(productStock) || 0,
      description: productDesc || null,
      images: JSON.stringify(productImages),
      tags: productSizes,
      isActive: productIsActive,
      isFeatured: productIsFeatured,
      isPublished: productIsPublished,
    };

    try {
      const url = isEditing ? `${API_URL}/api/products/${productId}` : `${API_URL}/api/products`;
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        if (!isEditing) setCookie(DRAFT_COOKIE, "", 0);
        router.push("/admin/products");
      } else {
        const errMsg = data.errors?.map((e: any) => `${e.field}: ${e.message}`).join("\n") || data.error || "ошибка";
        alert(errMsg);
      }
    } catch (e) { console.error(e); alert("ошибка соединения"); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #fce7f3", borderTopColor: "#f1a7c8", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 16px 60px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
        <button onClick={() => router.push("/admin/products")} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", display: "flex", borderRadius: "10px" }}>
          <ArrowLeft size={22} color="#f1a7c8" />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.3px" }}>
            {isEditing ? "редактировать товар" : "новый товар"}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#9ca3af" }}>
            {isEditing ? "измените параметры товара" : "заполните информацию о товаре"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Basic info */}
        <section style={{ background: "#fff", border: "1px solid #fdf2f8", borderRadius: "20px", padding: "24px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>основное</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <span style={{ fontSize: "13px", color: "#6b7280" }}>название</span>
              <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} required placeholder="например, футболка no silicone" style={inputStyle} />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>цена, ₽</span>
                <input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} required placeholder="0" style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>старая цена, ₽ <span style={{ color: "#f1a7c8", fontSize: "11px" }}>скидка</span></span>
                <input type="number" value={productComparePrice} onChange={(e) => setProductComparePrice(e.target.value)} placeholder="необязательно" style={inputStyle} />
              </label>
            </div>
          </div>
        </section>

        {/* Stock */}
        <section style={{ background: "#fff", border: "1px solid #fdf2f8", borderRadius: "20px", padding: "24px" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>наличие</h2>
          <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#9ca3af" }}>клиенты не видят точное количество</p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input type="number" value={productStock} onChange={(e) => { setProductStock(e.target.value); if (e.target.value) setProductStockUnlimited(false); }} disabled={productStockUnlimited} style={{ ...inputStyle, flex: 1, opacity: productStockUnlimited ? 0.4 : 1 }} placeholder={productStockUnlimited ? "∞" : "количество"} />
            <button type="button" onClick={() => { setProductStockUnlimited(!productStockUnlimited); if (!productStockUnlimited) setProductStock(""); }} style={{ padding: "10px 16px", border: productStockUnlimited ? "1.5px solid #f1a7c8" : "1.5px solid #e5e7eb", borderRadius: "12px", cursor: "pointer", background: productStockUnlimited ? "#fce7f3" : "#fff", fontSize: "13px", fontWeight: 500, color: productStockUnlimited ? "#f1a7c8" : "#9ca3af", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
              <Infinity size={14} /> безлимит
            </button>
          </div>
        </section>

        {/* Sizes */}
        <section style={{ background: "#fff", border: "1px solid #fdf2f8", borderRadius: "20px", padding: "24px" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px" }}>
            размеры {productSizes.length > 0 && <span style={{ background: "#f1a7c8", color: "#fff", padding: "1px 7px", borderRadius: "10px", fontSize: "11px" }}>{productSizes.length}</span>}
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            <input type="text" value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = sizeInput.trim(); if (v && !productSizes.includes(v)) setProductSizes((p) => [...p, v]); setSizeInput(""); } }} style={{ ...inputStyle, flex: 1 }} placeholder="S, M, L, XL, 42..." />
            <button type="button" onClick={() => { const v = sizeInput.trim(); if (v && !productSizes.includes(v)) setProductSizes((p) => [...p, v]); setSizeInput(""); }} style={{ padding: "10px 16px", border: "1.5px solid #f1a7c8", borderRadius: "12px", cursor: "pointer", background: "#fce7f3", fontSize: "13px", fontWeight: 500, color: "#f1a7c8", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
              <Plus size={14} /> добавить
            </button>
          </div>
          {productSizes.length > 0 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
              {productSizes.map((size, idx) => (
                <span key={`${size}-${idx}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "#fff", border: "1px solid #f3e8ee", borderRadius: "20px", fontSize: "13px", fontWeight: 500, color: "#374151" }}>
                  {size}
                  <button type="button" onClick={() => setProductSizes((p) => p.filter((_, i) => i !== idx))} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "#9ca3af" }}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Description */}
        <section style={{ background: "#fff", border: "1px solid #fdf2f8", borderRadius: "20px", padding: "24px" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>описание</h2>
          <textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }} placeholder="опишите товар, материалы, размеры..." />
        </section>

        {/* Images */}
        <section style={{ background: "#fff", border: "1px solid #fdf2f8", borderRadius: "20px", padding: "24px" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Camera size={14} /> изображения {productImages.length > 0 && <span style={{ background: "#f1a7c8", color: "#fff", padding: "2px 8px", borderRadius: "10px", fontSize: "11px" }}>{productImages.length}</span>}
          </h2>

          {(productImages.length > 0 || uploadingCount > 0) && (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", padding: "14px", background: "#fafafa", borderRadius: "16px", border: "1px dashed #f3e8ee" }}>
              {uploadingCount > 0 && Array.from({ length: uploadingCount }).map((_, i) => (
                <div key={`sk-${i}`} style={{ width: "100px", height: "100px", borderRadius: "12px", background: "#fdf2f8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Loader2 size={16} color="#f1a7c8" className="spin-icon" />
                </div>
              ))}
              {productImages.map((url, index) => (
                <div key={`${url}-${index}`} draggable onDragStart={() => handleDragStart(index)} onDragOver={(e) => handleDragOver(e, index)} onDrop={(e) => handleDrop(e, index)} onDragEnd={handleDragEnd} style={{ position: "relative", width: "100px", height: "100px", borderRadius: "12px", overflow: "hidden", cursor: "move", border: dragOverIndex === index ? "2px solid #f1a7c8" : index === 0 ? "2px solid #f1a7c8" : "2px solid #f3f3f3", opacity: draggingIndex === index ? 0.5 : 1, flexShrink: 0 }}>
                  <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {index === 0 && <span style={{ position: "absolute", top: "6px", left: "6px", background: "#f1a7c8", color: "#fff", padding: "2px 6px", borderRadius: "6px", fontSize: "9px", fontWeight: 700 }}>главное</span>}
                  <div style={{ position: "absolute", top: "4px", right: "4px", display: "flex", gap: "3px" }}>
                    {index !== 0 && <button type="button" onClick={() => setMainImage(index)} style={{ width: "22px", height: "22px", borderRadius: "6px", background: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: "#f1a7c8", fontWeight: 700 }}>★</button>}
                    <button type="button" onClick={() => removeImage(index)} style={{ width: "22px", height: "22px", borderRadius: "6px", background: "rgba(239,68,68,0.9)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={10} strokeWidth={3} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => handleUploadImages(e.target.files)} style={{ display: "none" }} />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingCount > 0} style={{ width: "100%", padding: "14px 24px", background: "#fff", border: "2px dashed #f1a7c8", borderRadius: "16px", cursor: uploadingCount > 0 ? "wait" : "pointer", fontSize: "14px", color: "#f1a7c8", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
            {uploadingCount > 0 ? <><Loader2 size={16} className="spin-icon" /> загрузка...</> : <><Upload size={18} /> выбрать файлы</>}
          </button>
          <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "10px" }}>первое фото — главное. перетащите для изменения порядка.</p>
        </section>

        {/* Toggles */}
        <section style={{ background: "#fff", border: "1px solid #fdf2f8", borderRadius: "20px", padding: "24px" }}>
          <h2 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>настройки</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { checked: productIsActive, onChange: setProductIsActive, label: "активен", desc: "товар виден в каталоге" },
              { checked: productIsFeatured, onChange: setProductIsFeatured, label: "топ", desc: "показывать в разделе «топ»" },
              { checked: productIsPublished, onChange: setProductIsPublished, label: "опубликован", desc: "показывать на сайте" },
            ].map(({ checked, onChange, label, desc }) => (
              <label key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "12px 16px", borderRadius: "14px", background: "#fafafa", border: "1px solid #f3e8ee" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a" }}>{label}</div>
                  <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>{desc}</div>
                </div>
                <div style={{ width: "44px", height: "24px", borderRadius: "12px", background: checked ? "#f1a7c8" : "#e5e7eb", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                  <div style={{ position: "absolute", top: "3px", left: checked ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" disabled={saving} style={{ flex: 1, background: "#f1a7c8", color: "#fff", border: "none", borderRadius: "16px", padding: "16px 28px", fontWeight: 600, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: saving ? 0.6 : 1 }}>
            <Save size={16} /> {saving ? "сохранение..." : isEditing ? "сохранить" : "создать товар"}
          </button>
          <button type="button" onClick={() => router.push("/admin/products")} style={{ background: "#f3f4f6", color: "#4b5563", border: "none", borderRadius: "16px", padding: "16px 28px", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}>
            отмена
          </button>
        </div>
      </form>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #f3e8ee",
  borderRadius: "12px",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.2s",
  background: "#fff",
};

export default function EditProductPage() {
  return (
    <Suspense fallback={<div style={{ padding: "60px", textAlign: "center" }}><div style={{ width: 32, height: 32, border: "3px solid #fce7f3", borderTopColor: "#f1a7c8", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} /><style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>}>
      <EditProductContent />
    </Suspense>
  );
}
