import { useState, useEffect } from "react";
import { C, COND } from "./constants";
import { productsAPI } from "./services/api";
import LocIcon from "./components/LocIcon";
import { ArrowLeft, Image, Loader2, AlertCircle } from "lucide-react";

export default function OperatorPostView({ postId, onClose }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    productsAPI.getById(postId)
      .then(setProduct)
      .catch(() => setError("Mahsulot topilmadi"))
      .finally(() => setLoading(false));
  }, [postId]);

  const photos = product?.photos?.length ? product.photos : (product?.photo ? [product.photo] : []);

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif", background: C.bg,
                  minHeight: "100vh", maxWidth: 430, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px", background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.border}`,
                    position: "sticky", top: 0, zIndex: 20 }}>
        <button onClick={onClose}
          style={{ background: C.primaryLight, border: "none", borderRadius: 12,
                   padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={18} color={C.primaryDark} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 16, color: C.text }}>Mahsulot</span>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Loader2 size={36} color={C.primary} style={{ animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {error && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                      gap: 12, padding: 60, color: C.textSub }}>
          <AlertCircle size={40} color={C.danger} />
          <span style={{ fontSize: 15, fontWeight: 700 }}>{error}</span>
          <button onClick={onClose}
            style={{ background: C.primaryLight, border: "none", borderRadius: 12,
                     padding: "10px 20px", color: C.primaryDark, fontWeight: 700,
                     cursor: "pointer", marginTop: 8 }}>
            Orqaga
          </button>
        </div>
      )}

      {product && (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Photos */}
          <div style={{ borderRadius: 18, overflow: "hidden", background: C.primaryLight,
                        height: 240, position: "relative", display: "flex",
                        alignItems: "center", justifyContent: "center" }}>
            {photos.length > 0
              ? <img src={photos[photoIdx]} alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <Image size={64} color={C.primaryBorder} />
            }
            {photos.length > 1 && (
              <div style={{ position: "absolute", bottom: 10, display: "flex", gap: 6 }}>
                {photos.map((_, i) => (
                  <div key={i} onClick={() => setPhotoIdx(i)}
                    style={{ width: i === photoIdx ? 18 : 8, height: 8, borderRadius: 4,
                             background: i === photoIdx ? C.primaryDark : "rgba(255,255,255,0.7)",
                             cursor: "pointer", transition: "all 0.2s" }} />
                ))}
              </div>
            )}
          </div>

          {/* Info card */}
          <div style={{ background: C.card, borderRadius: 18, padding: 18,
                        boxShadow: C.shadow, display: "flex", flexDirection: "column", gap: 12 }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: C.text, flex: 1 }}>{product.name}</span>
              {product.condition && COND[product.condition] && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10,
                               background: COND[product.condition].bg, color: COND[product.condition].text,
                               whiteSpace: "nowrap", marginLeft: 8 }}>
                  ● {product.condition}
                </span>
              )}
            </div>

            <div style={{ fontSize: 22, fontWeight: 900,
                          background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {Number(product.price || 0).toLocaleString("uz-UZ")} so'm
            </div>

            {(product.viloyat || product.tuman) && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.textSub }}>
                <LocIcon size={14} color={C.textSub} />
                <span style={{ fontSize: 13 }}>
                  {product.viloyat}{product.tuman ? ` › ${product.tuman}` : ""}
                  {product.mahalla ? ` › ${product.mahalla}` : ""}
                </span>
              </div>
            )}

            {product.qty && (
              <div style={{ fontSize: 13, color: C.textSub }}>
                Miqdor: <strong style={{ color: C.text }}>{product.qty} dona</strong>
              </div>
            )}

            {product.category && (
              <div style={{ fontSize: 13, color: C.textSub }}>
                Kategoriya: <strong style={{ color: C.text }}>{product.category}</strong>
              </div>
            )}

            {product.description && (
              <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6,
                            paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                {product.description}
              </div>
            )}
          </div>

          <button onClick={onClose}
            style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                     border: "none", borderRadius: 14, padding: "14px",
                     color: "white", fontWeight: 800, fontSize: 15,
                     cursor: "pointer", boxShadow: `0 4px 16px rgba(244,137,74,0.35)` }}>
            Orqaga
          </button>
        </div>
      )}
    </div>
  );
}
