"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getCookie, setCookie, ACCESS_TOKEN_COOKIE } from "@/lib/cookies";
import {
  Package,
  Plus,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Star,
  Pencil,
  Trash2,
  Check,
  Circle,
  Camera,
  X,
  GripVertical,
  Loader2,
  ImageIcon,
  Infinity,
  ImagePlus,
  Layers,
  Upload,
  Save,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Ruler,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  images: string;
  description: string | null;
  sortOrder: number;
  tags: string;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);

  // Drag & drop for product cards
  const [draggingProductId, setDraggingProductId] = useState<string | null>(null);
  const [dragOverProductId, setDragOverProductId] = useState<string | null>(null);

  // Product form
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
  const [draftRestored, setDraftRestored] = useState(false);

  // Drag & drop for photos inside modal
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const DRAFT_COOKIE = "brand_product_draft";

  // Load draft from cookie on mount
  useEffect(() => {
    loadProducts();
    const draft = getCookie(DRAFT_COOKIE);
    if (draft) {
      try {
        const d = JSON.parse(draft);
        if (d.name !== undefined) setProductName(d.name);
        if (d.slug !== undefined) setProductSlug(d.slug);
        if (d.price !== undefined) setProductPrice(d.price);
        if (d.comparePrice !== undefined) setProductComparePrice(d.comparePrice);
        if (d.stock !== undefined) setProductStock(d.stock);
        if (d.stockUnlimited !== undefined) setProductStockUnlimited(d.stockUnlimited);
        if (d.desc !== undefined) setProductDesc(d.desc);
        if (d.images !== undefined) setProductImages(d.images);
        if (d.isActive !== undefined) setProductIsActive(d.isActive);
        if (d.isFeatured !== undefined) setProductIsFeatured(d.isFeatured);
        if (d.isPublished !== undefined) setProductIsPublished(d.isPublished);
        if (d.sizes !== undefined) setProductSizes(d.sizes);
      } catch { /* ignore */ }
    }
  }, []);

  // Save draft to cookie whenever form changes (only when creating new product, not editing)
  const saveDraftToCookie = useCallback(() => {
    if (editingProduct) return; // Don't save draft when editing existing product
    const draft = {
      name: productName,
      slug: productSlug,
      price: productPrice,
      comparePrice: productComparePrice,
      stock: productStock,
      stockUnlimited: productStockUnlimited,
      desc: productDesc,
      images: productImages,
      isActive: productIsActive,
      isFeatured: productIsFeatured,
      isPublished: productIsPublished,
      sizes: productSizes,
    };
    setCookie(DRAFT_COOKIE, JSON.stringify(draft), 60 * 60 * 24 * 7);
  }, [editingProduct, productName, productSlug, productPrice, productComparePrice, productStock, productStockUnlimited, productDesc, productImages, productIsActive, productIsFeatured, productIsPublished, productSizes]);

  useEffect(() => {
    saveDraftToCookie();
  }, [saveDraftToCookie]);

  const getToken = () => getCookie(ACCESS_TOKEN_COOKIE) || "";

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products?limit=100&sortBy=sortOrder&sortOrder=asc`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || data.data?.products || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveProductOrder = async (reorderedProducts: Product[]) => {
    setSavingOrder(true);
    const token = getToken();
    try {
      const items = reorderedProducts.map((p, idx) => ({ id: p.id, sortOrder: idx }));
      await fetch(`${API_URL}/api/products/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });
    } catch (e) {
      console.error(e);
    }
    setSavingOrder(false);
  };

  // Product card drag & drop
  const handleProductDragStart = (productId: string) => {
    setDraggingProductId(productId);
  };

  const handleProductDragOver = useCallback(
    (e: React.DragEvent, productId: string) => {
      e.preventDefault();
      if (draggingProductId === null || draggingProductId === productId) return;
      setDragOverProductId(productId);
    },
    [draggingProductId]
  );

  const handleProductDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (draggingProductId === null || draggingProductId === targetId) {
        setDraggingProductId(null);
        setDragOverProductId(null);
        return;
      }

      setProducts((prev) => {
        const fromIndex = prev.findIndex((p) => p.id === draggingProductId);
        const toIndex = prev.findIndex((p) => p.id === targetId);
        if (fromIndex === -1 || toIndex === -1) return prev;

        const newProducts = [...prev];
        const [dragged] = newProducts.splice(fromIndex, 1);
        newProducts.splice(toIndex, 0, dragged);

        saveProductOrder(newProducts);
        return newProducts;
      });

      setDraggingProductId(null);
      setDragOverProductId(null);
    },
    [draggingProductId]
  );

  // Move product up/down by one position
  const moveProduct = useCallback(
    (productId: string, direction: "up" | "down") => {
      setProducts((prev) => {
        const index = prev.findIndex((p) => p.id === productId);
        if (index === -1) return prev;

        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= prev.length) return prev;

        const newProducts = [...prev];
        const [moved] = newProducts.splice(index, 1);
        newProducts.splice(newIndex, 0, moved);

        saveProductOrder(newProducts);
        return newProducts;
      });
    },
    []
  );

  const handleProductDragEnd = () => {
    setDraggingProductId(null);
    setDragOverProductId(null);
  };

  const handleUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const token = getToken();
    setUploadingCount(files.length);

    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.data?.url) {
          newUrls.push(data.data.url);
          // show image as soon as it uploads
          setProductImages((prev) => [...prev, data.data.url]);
        }
      } catch (e) {
        console.error("Upload failed:", e);
      }
    }

    setUploadingCount(0);
  };

  const removeImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const setMainImage = (index: number) => {
    setProductImages((prev) => {
      const newImages = [...prev];
      const [main] = newImages.splice(index, 1);
      newImages.unshift(main);
      return newImages;
    });
  };

  // Photo drag & drop handlers
  const handleDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggingIndex === null || draggingIndex === index) return;
      setDragOverIndex(index);
    },
    [draggingIndex]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggingIndex === null || draggingIndex === index) {
        setDraggingIndex(null);
        setDragOverIndex(null);
        return;
      }

      setProductImages((prev) => {
        const newImages = [...prev];
        const [dragged] = newImages.splice(draggingIndex, 1);
        newImages.splice(index, 0, dragged);
        return newImages;
      });

      setDraggingIndex(null);
      setDragOverIndex(null);
    },
    [draggingIndex]
  );

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();

    // Client-side validation
    if (!productName || productName.trim().length < 2) {
      alert("название товара должно содержать минимум 2 символа");
      return;
    }
    const priceVal = parseFloat(productPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      alert("укажите корректную цену");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
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
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCookie(DRAFT_COOKIE, "", 0); // Clear draft on successful create
        await loadProducts();
        closeProductModal();
      } else {
        const errMsg = data.errors?.map((e: { field: string; message: string }) => `${e.field}: ${e.message}`).join("\n") || data.error || "ошибка создания товара";
        alert(errMsg);
      }
    } catch (e) {
      console.error(e);
      alert("не удалось создать товар — проверьте подключение к серверу");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const token = getToken();

    // Client-side validation
    if (!productName || productName.trim().length < 2) {
      alert("название товара должно содержать минимум 2 символа");
      return;
    }
    const priceVal = parseFloat(productPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      alert("укажите корректную цену");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: productName,
          slug: productSlug,
          price: priceVal,
          compareAtPrice: productComparePrice ? parseFloat(productComparePrice) : null,
          stockQuantity: productStockUnlimited ? 999999 : parseInt(productStock) || 0,
          description: productDesc || null,
          images: JSON.stringify(productImages),
          tags: productSizes,
          isActive: productIsActive,
          isFeatured: productIsFeatured,
          isPublished: productIsPublished,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await loadProducts();
        closeProductModal();
      } else {
        const errMsg = data.errors?.map((e: { field: string; message: string }) => `${e.field}: ${e.message}`).join("\n") || data.error || "ошибка обновления товара";
        alert(errMsg);
      }
    } catch (e) {
      console.error(e);
      alert("не удалось обновить товар — проверьте подключение к серверу");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("удалить товар?")) return;
    const token = getToken();

    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await loadProducts();
      } else {
        const data = await res.json();
        alert("ошибка удаления: " + (data.error || res.statusText));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleActive = async (product: Product) => {
    const token = getToken();
    try {
      await fetch(`${API_URL}/api/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      await loadProducts();
    } catch (e) {
      console.error(e);
    }
  };

  const openProductModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setProductName(prod.name);
      setProductSlug(prod.slug);
      setProductPrice(prod.price.toString());
      setProductComparePrice(prod.compareAtPrice?.toString() || "");
      // detect unlimited stock
      const isUnlimited = prod.stockQuantity >= 999999;
      setProductStockUnlimited(isUnlimited);
      setProductStock(isUnlimited ? "" : prod.stockQuantity.toString());
      setProductDesc(prod.description || "");
      setProductImages(parseImages(prod.images));
      setProductIsActive(prod.isActive);
      setProductIsFeatured(prod.isFeatured);
      setProductIsPublished(prod.isPublished);
      // Load sizes from tags
      setProductSizes(parseTags(prod.tags));
    } else {
      setEditingProduct(null);
      setProductName("");
      setProductSlug("");
      setProductPrice("");
      setProductComparePrice("");
      setProductStock("");
      setProductStockUnlimited(false);
      setProductDesc("");
      setProductImages([]);
      setProductIsActive(true);
      setProductIsFeatured(false);
      setProductIsPublished(true);
    }
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setDraggingIndex(null);
    setDragOverIndex(null);
    setUploadingCount(0);
  };

  const filteredProducts = products.filter((p) => {
    if (filter === "active" && !p.isActive) return false;
    if (filter === "inactive" && p.isActive) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getDiscount = (p: Product) => {
    if (!p.compareAtPrice || p.compareAtPrice <= p.price) return null;
    return Math.round((1 - p.price / p.compareAtPrice) * 100);
  };

  const stockDisplay = (qty: number) => {
    if (qty >= 999999) return { text: "∞ безлимит", color: "#f1a7c8" };
    if (qty === 0) return { text: "нет в наличии", color: "#ef4444" };
    if (qty <= 5) return { text: `${qty} — мало`, color: "#f59e0b" };
    return { text: `${qty} в наличии`, color: "#22c55e" };
  };

  return (
    <div className="admin-page-wrap" style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* ======= Header ======= */}
      <div className="admin-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 700,
              margin: 0,
              color: "#1a1a1a",
              letterSpacing: "-0.5px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Layers size={28} color="#f1a7c8" strokeWidth={2.5} />
            товары
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#8e8e8e" }}>
            {products.length} {products.length === 1 ? "товар" : products.length < 5 ? "товара" : "товаров"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {savingOrder && (
            <span
              style={{
                fontSize: "13px",
                color: "#8e8e8e",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#fff",
                padding: "8px 16px",
                borderRadius: "40px",
                border: "1px solid #fce7f3",
              }}
            >
              <Loader2 size={14} className="spin-icon" />
              сохранение порядка...
            </span>
          )}
          <button
            onClick={() => openProductModal()}
            className="admin-add-btn"
            style={{
              background: "#f1a7c8",
              color: "#fff",
              border: "none",
              padding: "14px 28px",
              borderRadius: "40px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "background 0.2s",
              boxShadow: "none",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e095b5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f1a7c8";
            }}
          >
            <Plus size={18} />
            добавить товар
          </button>
        </div>
      </div>

      {/* ======= Filters ======= */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
        <div className="admin-filter-btns" style={{ display: "flex", gap: "6px" }}>
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 16px",
                border: "1.5px solid",
                borderColor: filter === f ? "#f1a7c8" : "#f3e8ee",
                background: filter === f ? "#f1a7c8" : "#fff",
                color: filter === f ? "#fff" : "#f1a7c8",
                borderRadius: "40px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              {f === "all" ? "все" : f === "active" ? "активные" : "неактивные"}
            </button>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#f1a7c8",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="поиск по названию..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 20px 14px 44px",
              border: "1.5px solid #f3e8ee",
              borderRadius: "40px",
              fontSize: "14px",
              background: "#fff",
              boxSizing: "border-box",
              outline: "none",
              transition: "border-color 0.2s",
              color: "#1a1a1a",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#f1a7c8")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#f3e8ee")}
          />
        </div>
      </div>

      {/* ======= Drag hint ======= */}
      <p
        style={{
          fontSize: "13px",
          color: "#9ca3af",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <ArrowUpDown size={14} />
        перетащите карточки товаров, чтобы изменить порядок отображения в каталоге
      </p>

      {/* ======= Products Grid ======= */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {filteredProducts.map((p) => {
          const discount = getDiscount(p);
          const images = parseImages(p.images);
          const isDragging = draggingProductId === p.id;
          const isDragOver = dragOverProductId === p.id;
          const st = stockDisplay(p.stockQuantity);

          return (
            <div
              key={p.id}
              draggable
              onDragStart={() => handleProductDragStart(p.id)}
              onDragOver={(e) => handleProductDragOver(e, p.id)}
              onDrop={(e) => handleProductDrop(e, p.id)}
              onDragEnd={handleProductDragEnd}
              style={{
                background: "#fff",
                borderRadius: "24px",
                padding: "20px",
                border: isDragOver
                  ? "2px dashed #f1a7c8"
                  : p.isActive
                    ? "1px solid #f3e8ee"
                    : "1px solid #fee2e2",
                opacity: isDragging ? 0.4 : p.isActive ? 1 : 0.55,
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "grab",
                boxShadow: "none",
                transform: isDragOver ? "scale(1.03)" : isDragging ? "rotate(1deg)" : "translateY(0)",
                position: "relative",
              }}
              className="admin-product-card"
            >
              {/* Drag handle */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "12px",
                  padding: "4px 0",
                  cursor: "grab",
                }}
              >
                <MoreHorizontal size={20} color="#e5e7eb" />
              </div>

              {/* ======= Image ======= */}
              <div
                style={{
                  height: "180px",
                  background: "#fafafa",
                  borderRadius: "16px",
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  position: "relative",
                  border: "1px solid #f3f3f3",
                }}
              >
                {images[0] ? (
                  <img
                    src={images[0]}
                    alt={p.name}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                    loading="lazy"
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      color: "#ddd",
                    }}
                  >
                    <ImagePlus size={36} />
                    <span style={{ fontSize: "12px" }}>нет фото</span>
                  </div>
                )}
                {images.length > 1 && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: "10px",
                      right: "10px",
                      background: "rgba(0,0,0,0.55)",
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontWeight: 500,
                    }}
                  >
                    <ImageIcon size={10} />
                    {images.length}
                  </span>
                )}
              </div>

              {/* ======= Badges row ======= */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap", minHeight: "24px" }}>
                {discount && (
                  <span
                    style={{
                      background: "#fef2f2",
                      color: "#dc2626",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    -{discount}%
                  </span>
                )}
                {p.isFeatured && (
                  <span
                    style={{
                      background: "#fefce8",
                      color: "#ca8a04",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontWeight: 600,
                    }}
                  >
                    <Star size={10} fill="#ca8a04" />
                    топ
                  </span>
                )}
                {!p.isPublished && (
                  <span
                    style={{
                      background: "#f3f4f6",
                      color: "#6b7280",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: 500,
                    }}
                  >
                    черновик
                  </span>
                )}
              </div>

              {/* ======= Name ======= */}
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  lineHeight: 1.3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {p.name}
              </h3>

              {/* ======= Price ======= */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "10px" }}>
                <span style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a1a" }}>{p.price} ₽</span>
                {p.compareAtPrice && p.compareAtPrice > p.price && (
                  <span style={{ fontSize: "13px", color: "#9ca3af", textDecoration: "line-through" }}>
                    {p.compareAtPrice} ₽
                  </span>
                )}
              </div>

              {/* ======= Stock & Actions row ======= */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "12px",
                  borderTop: "1px solid #f3f3f3",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: st.color,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {p.stockQuantity >= 999999 ? <Infinity size={12} /> : <Package size={12} />}
                  {st.text}
                </span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => handleToggleActive(p)}
                    title={p.isActive ? "деактивировать" : "активировать"}
                    style={{
                      padding: "7px",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      background: p.isActive ? "#fce7f3" : "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    <Check size={14} color={p.isActive ? "#f1a7c8" : "#9ca3af"} strokeWidth={3} />
                  </button>
                  <button
                    onClick={() => openProductModal(p)}
                    title="редактировать"
                    style={{
                      padding: "7px",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      background: "#fce7f3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f1a7c8";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fce7f3";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <Pencil size={14} color="#f1a7c8" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    title="удалить"
                    style={{
                      padding: "7px",
                      border: "none",
                      borderRadius: "10px",
                      cursor: "pointer",
                      background: "#fce7f3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f1a7c8";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fce7f3";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <Trash2 size={14} color="#f1a7c8" />
                  </button>
                </div>
              </div>

              {/* ======= Move controls ======= */}
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => moveProduct(p.id, "up")}
                  disabled={filteredProducts.findIndex((fp) => fp.id === p.id) === 0}
                  title="вверх"
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "1px solid #f3e8ee",
                    borderRadius: "10px",
                    cursor: filteredProducts.findIndex((fp) => fp.id === p.id) === 0 ? "not-allowed" : "pointer",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#f1a7c8",
                    opacity: filteredProducts.findIndex((fp) => fp.id === p.id) === 0 ? 0.4 : 1,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (filteredProducts.findIndex((fp) => fp.id === p.id) !== 0) {
                      e.currentTarget.style.background = "#fdf2f8";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fff";
                  }}
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  onClick={() => moveProduct(p.id, "down")}
                  disabled={filteredProducts.findIndex((fp) => fp.id === p.id) === filteredProducts.length - 1}
                  title="вниз"
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "1px solid #f3e8ee",
                    borderRadius: "10px",
                    cursor:
                      filteredProducts.findIndex((fp) => fp.id === p.id) === filteredProducts.length - 1
                        ? "not-allowed"
                        : "pointer",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#f1a7c8",
                    opacity:
                      filteredProducts.findIndex((fp) => fp.id === p.id) === filteredProducts.length - 1 ? 0.4 : 1,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (filteredProducts.findIndex((fp) => fp.id === p.id) !== filteredProducts.length - 1) {
                      e.currentTarget.style.background = "#fdf2f8";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fff";
                  }}
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======= Empty state ======= */}
      {filteredProducts.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            color: "#9ca3af",
            background: "#fafafa",
            borderRadius: "24px",
            border: "1px dashed #e5e7eb",
          }}
        >
          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "20px",
                background: "#fdf2f8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={32} color="#f1a7c8" />
            </div>
          </div>
          <p style={{ fontSize: "18px", fontWeight: 600, color: "#4b5563", margin: "0 0 6px" }}>нет товаров</p>
          <p style={{ fontSize: "14px", margin: 0 }}>добавьте первый товар, чтобы начать</p>
        </div>
      )}

      {/* ======= Product Modal ======= */}
      {showProductModal && (
        <div style={overlayStyle}>
          <div
            className="admin-modal-inner"
            style={{
              ...modalStyle,
              borderRadius: "32px",
              padding: "40px",
              maxWidth: "640px",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "28px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    letterSpacing: "-0.3px",
                  }}
                >
                  {editingProduct ? "редактировать товар" : "новый товар"}
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#9ca3af" }}>
                  {editingProduct ? "измените параметры товара" : "заполните информацию о товаре"}
                </p>
              </div>
              <button
                onClick={closeProductModal}
                style={{
                  padding: "8px",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#e5e7eb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#f3f4f6")}
              >
                <X size={18} color="#6b7280" />
              </button>
            </div>

            <form onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}>
              {/* Section: Basic info */}
              <div style={{ marginBottom: "16px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 600, color: "#c4b5c0" }}>основное</p>

                <div style={{ marginBottom: "10px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", color: "#6b7280" }}>название</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    style={{ ...inputStyle }}
                    required
                    placeholder="например, футболка no silicone"
                  />
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", color: "#6b7280" }}>цена, ₽</label>
                    <input
                      type="number"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      style={{ ...inputStyle }}
                      required
                      placeholder="0"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", color: "#6b7280" }}>
                      старая цена, ₽ <span style={{ color: "#f1a7c8", fontSize: "11px" }}>скидка</span>
                    </label>
                    <input
                      type="number"
                      value={productComparePrice}
                      onChange={(e) => setProductComparePrice(e.target.value)}
                      style={{ ...inputStyle }}
                      placeholder="необязательно"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Stock */}
              <div style={{ marginBottom: "16px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 600, color: "#c4b5c0" }}>наличие</p>
                <p style={{ margin: "0 0 10px", fontSize: "11px", color: "#c4b5c0" }}>клиенты не видят точное количество в каталоге</p>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="number"
                    value={productStock}
                    onChange={(e) => {
                      setProductStock(e.target.value);
                      if (e.target.value) setProductStockUnlimited(false);
                    }}
                    disabled={productStockUnlimited}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      opacity: productStockUnlimited ? 0.4 : 1,
                      cursor: productStockUnlimited ? "not-allowed" : "text",
                    }}
                    placeholder={productStockUnlimited ? "∞" : "количество"}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProductStockUnlimited(!productStockUnlimited);
                      if (!productStockUnlimited) setProductStock("");
                    }}
                    style={{
                      padding: "10px 16px",
                      borderWidth: "1.5px",
                      borderStyle: "solid",
                      borderColor: productStockUnlimited ? "#f1a7c8" : "#e5e7eb",
                      borderRadius: "12px",
                      cursor: "pointer",
                      background: productStockUnlimited ? "#fce7f3" : "#fff",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: productStockUnlimited ? "#f1a7c8" : "#9ca3af",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}
                  >
                    <Infinity size={14} />
                    безлимит
                  </button>
                </div>
              </div>

              {/* Section: Sizes */}
              <div style={{ marginBottom: "16px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 600, color: "#c4b5c0", display: "flex", alignItems: "center", gap: "6px" }}>
                  размеры
                  {productSizes.length > 0 && (
                    <span style={{ background: "#f1a7c8", color: "#fff", padding: "1px 7px", borderRadius: "10px", fontSize: "11px" }}>
                      {productSizes.length}
                    </span>
                  )}
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = sizeInput.trim();
                        if (val && !productSizes.includes(val)) {
                          setProductSizes((prev) => [...prev, val]);
                        }
                        setSizeInput("");
                      }
                    }}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="S, M, L, XL, 42..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = sizeInput.trim();
                      if (val && !productSizes.includes(val)) {
                        setProductSizes((prev) => [...prev, val]);
                      }
                      setSizeInput("");
                    }}
                    style={{
                      padding: "10px 16px",
                      border: "1.5px solid #f1a7c8",
                      borderRadius: "12px",
                      cursor: "pointer",
                      background: "#fce7f3",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#f1a7c8",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#f1a7c8"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fce7f3"; e.currentTarget.style.color = "#f1a7c8"; }}
                  >
                    <Plus size={14} />
                    добавить
                  </button>
                </div>
                {productSizes.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                    {productSizes.map((size, idx) => (
                      <span
                        key={`${size}-${idx}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          background: "#fff",
                          border: "1px solid #f3e8ee",
                          borderRadius: "20px",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#374151",
                        }}
                      >
                        {size}
                        <button
                          type="button"
                          onClick={() => setProductSizes((prev) => prev.filter((_, i) => i !== idx))}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "0",
                            display: "flex",
                            alignItems: "center",
                            color: "#9ca3af",
                            transition: "color 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#dc2626")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "10px" }}>
                  нажмите enter или кнопку «добавить», чтобы добавить размер
                </p>
              </div>

              {/* Section: Description */}
              <div
                style={{
                  background: "#fafafa",
                  borderRadius: "20px",
                  padding: "20px",
                  marginBottom: "20px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  описание
                </h3>
                <textarea
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  style={{ ...inputStyle, minHeight: "100px", background: "#fff", resize: "vertical" }}
                  placeholder="опишите товар, материалы, размеры..."
                />
              </div>

              {/* Section: Images with skeleton loading */}
              <div
                style={{
                  background: "#fafafa",
                  borderRadius: "20px",
                  padding: "20px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#9ca3af",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Camera size={14} />
                    изображения
                    {productImages.length > 0 && (
                      <span
                        style={{
                          background: "#f1a7c8",
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          fontSize: "11px",
                        }}
                      >
                        {productImages.length}
                      </span>
                    )}
                  </h3>
                </div>

                {/* Image previews with drag & drop + skeletons */}
                {(productImages.length > 0 || uploadingCount > 0) && (
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                      marginBottom: "16px",
                      padding: "14px",
                      background: "#fff",
                      borderRadius: "16px",
                      border: "1px dashed #f3e8ee",
                      minHeight: "110px",
                    }}
                  >
                    {/* Skeletons for uploading images */}
                    {uploadingCount > 0 && Array.from({ length: uploadingCount }).map((_, i) => (
                      <div
                        key={`skeleton-${i}`}
                        style={{
                          width: "100px",
                          height: "100px",
                          borderRadius: "12px",
                          background: "#fdf2f8",
                          position: "relative",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                            backgroundSize: "200% 100%",
                            animation: "shimmer 1.5s infinite",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            color: "#f1a7c8",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "11px",
                          }}
                        >
                          <Loader2 size={14} className="spin-icon" />
                          <span>загрузка</span>
                        </div>
                      </div>
                    ))}

                    {productImages.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className="img-thumb-wrap"
                        style={{
                          position: "relative",
                          width: "100px",
                          height: "100px",
                          borderRadius: "12px",
                          overflow: "hidden",
                          cursor: "move",
                          border:
                            dragOverIndex === index
                              ? "2px solid #f1a7c8"
                              : index === 0
                                ? "2px solid #f1a7c8"
                                : "2px solid #f3f3f3",
                          boxShadow: "none",
                          opacity: draggingIndex === index ? 0.5 : 1,
                          transition: "all 0.2s",
                          flexShrink: 0,
                        }}
                      >
                        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {/* Main image badge */}
                        {index === 0 && (
                          <span
                            style={{
                              position: "absolute",
                              top: "6px",
                              left: "6px",
                              background: "#f1a7c8",
                              color: "#fff",
                              padding: "3px 8px",
                              borderRadius: "8px",
                              fontSize: "10px",
                              fontWeight: 700,
                            }}
                          >
                            главное
                          </span>
                        )}
                        {/* Hover overlay with controls */}
                        <div className="img-thumb-overlay" style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0,0,0,0.45)",
                          opacity: 0,
                          transition: "opacity 0.15s",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px",
                        }}>
                          {/* Top row: make main + remove */}
                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                            {index !== 0 ? (
                              <button
                                type="button"
                                onClick={() => setMainImage(index)}
                                style={{
                                  background: "rgba(255,255,255,0.95)",
                                  color: "#f1a7c8",
                                  padding: "3px 6px",
                                  borderRadius: "6px",
                                  fontSize: "9px",
                                  border: "none",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  boxShadow: "none",
                                  lineHeight: 1.2,
                                }}
                              >
                                главным
                              </button>
                            ) : <span />}
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="img-remove-btn"
                              style={{
                                width: "22px",
                                height: "22px",
                                borderRadius: "6px",
                                background: "rgba(239,68,68,0.9)",
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "none",
                                flexShrink: 0,
                                padding: "0",
                              }}
                            >
                              <X size={12} strokeWidth={3} />
                            </button>
                          </div>
                          {/* Bottom: drag hint */}
                          <div style={{
                            color: "#fff",
                            fontSize: "10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}>
                            <GripVertical size={10} />
                            перетащить
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleUploadImages(e.target.files)}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingCount > 0}
                    style={{
                      padding: "14px 24px",
                      background: "#fff",
                      border: "2px dashed #f1a7c8",
                      borderRadius: "16px",
                      cursor: uploadingCount > 0 ? "wait" : "pointer",
                      fontSize: "14px",
                      color: "#f1a7c8",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s",
                      flex: 1,
                      justifyContent: "center",
                    }}
                    onMouseEnter={(e) => {
                      if (uploadingCount === 0) {
                        e.currentTarget.style.background = "#fdf2f8";
                        e.currentTarget.style.borderStyle = "solid";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.borderStyle = "dashed";
                    }}
                  >
                    {uploadingCount > 0 ? (
                      <>
                        <Loader2 size={16} className="spin-icon" />
                        загрузка {uploadingCount} фото...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        выбрать файлы
                      </>
                    )}
                  </button>
                </div>
                <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "10px" }}>
                  первое фото будет главным в каталоге. перетащите фото, чтобы изменить порядок.
                </p>
              </div>

              {/* Section: Toggles */}
              <div
                style={{
                  background: "#fafafa",
                  borderRadius: "20px",
                  padding: "20px",
                  marginBottom: "24px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  настройки
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { checked: productIsActive, onChange: setProductIsActive, label: "активен", desc: "товар виден в каталоге" },
                    { checked: productIsFeatured, onChange: setProductIsFeatured, label: "топ", desc: "показывать в разделе «топ»" },
                    { checked: productIsPublished, onChange: setProductIsPublished, label: "опубликован", desc: "показывать на сайте" },
                  ].map(({ checked, onChange, label, desc }) => (
                    <label
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background: "#fff",
                        border: "1px solid #f3e8ee",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a" }}>{label}</div>
                        <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>{desc}</div>
                      </div>
                      <div
                        style={{
                          width: "44px",
                          height: "24px",
                          borderRadius: "12px",
                          background: checked ? "#f1a7c8" : "#e5e7eb",
                          position: "relative",
                          transition: "background 0.2s",
                          flexShrink: 0,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => onChange(e.target.checked)}
                          style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "3px",
                            left: checked ? "23px" : "3px",
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            background: "#fff",
                            transition: "left 0.2s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                          }}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Footer actions */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-start" }}>
                <button
                  type="submit"
                  style={{
                    ...btnStyle,
                    background: "#f1a7c8",
                    color: "#fff",
                    borderRadius: "16px",
                    padding: "14px 28px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s",
                    boxShadow: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e095b5";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f1a7c8";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <Save size={16} />
                  {editingProduct ? "сохранить изменения" : "создать товар"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!editingProduct) {
                      setCookie(DRAFT_COOKIE, "", 0);
                    }
                    closeProductModal();
                  }}
                  style={{
                    ...btnStyle,
                    background: "#f3f4f6",
                    color: "#4b5563",
                    borderRadius: "16px",
                    padding: "14px 28px",
                    fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e5e7eb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f3f4f6";
                  }}
                >
                  отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .spin-icon {
          animation: spin 0.8s linear infinite;
        }
        .admin-product-card:hover {
          box-shadow: none;
          transform: translateY(-2px);
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .img-thumb-wrap:hover .img-thumb-overlay {
          opacity: 1 !important;
        }
        /* Mobile admin styles */
        @media (max-width: 640px) {
          /* Уменьшить padding страницы */
          .admin-page-wrap {
            padding: 16px !important;
          }
          /* Header: заголовок и кнопка в столбик */
          .admin-header-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .admin-header-row > div:last-child {
            width: 100% !important;
          }
          .admin-add-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 16px !important;
          }
          /* Фильтры: поиск на всю ширину, кнопки прокручиваются */
          .admin-filters-row {
            flex-direction: column !important;
            gap: 10px !important;
          }
          .admin-filter-btns {
            display: flex !important;
            overflow-x: auto !important;
            gap: 8px !important;
            padding-bottom: 4px !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none !important;
          }
          .admin-filter-btns::-webkit-scrollbar {
            display: none !important;
          }
          .admin-filter-btns button {
            flex-shrink: 0 !important;
            white-space: nowrap !important;
            padding: 10px 18px !important;
          }
          /* Модальное окно на весь экран */
          .admin-modal-inner {
            border-radius: 24px 24px 0 0 !important;
            padding: 24px 16px !important;
            max-height: 95vh !important;
            margin-top: auto !important;
          }
          /* Превью фото — крупнее для удобного тапа */
          .img-thumb-wrap {
            width: 90px !important;
            height: 90px !important;
          }
          /* На мобильном оверлей всегда виден */
          .img-thumb-wrap .img-thumb-overlay {
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}

// ===== Toggle Component =====
function Toggle({
  checked,
  onChange,
  icon,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        cursor: "pointer",
        flex: 1,
        minWidth: "140px",
        padding: "12px",
        borderRadius: "12px",
        background: checked ? "#fff" : "transparent",
        border: checked ? "1.5px solid #f1a7c8" : "1.5px solid transparent",
        transition: "all 0.2s",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: "20px", height: "20px", accentColor: "#f1a7c8", marginTop: "2px", flexShrink: 0 }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: "6px" }}>
          {icon}
          {label}
        </span>
        <span style={{ fontSize: "11px", color: "#9ca3af" }}>{description}</span>
      </div>
    </label>
  );
}

function parseImages(raw: string | string[]): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return raw ? [raw] : [];
    } catch {
      return raw ? [raw] : [];
    }
  }
  return [];
}

function parseTags(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String);
      return raw ? [raw] : [];
    } catch {
      return raw ? [raw] : [];
    }
  }
  return [];
}

const btnStyle: React.CSSProperties = {
  padding: "12px 24px",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #f3e8ee",
  borderRadius: "12px",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.2s",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "24px",
  padding: "32px",
  width: "100%",
  maxWidth: "600px",
  maxHeight: "92vh",
  overflowY: "auto",
boxShadow: "none",
};
