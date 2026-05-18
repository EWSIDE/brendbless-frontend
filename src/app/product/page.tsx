import { Suspense } from "react";
import ProductClient from "./product-client";

export default function ProductPage() {
  return (
    <Suspense fallback={
      <div className="pdp-shell">
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <div style={{ width: 28, height: 28, border: "3px solid #fce7f3", borderTopColor: "#f1a7c8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        </div>
      </div>
    }>
      <ProductClient />
    </Suspense>
  );
}
