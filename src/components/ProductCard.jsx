import LocIcon from "./LocIcon";
import { C, COND } from "../constants";
import { Image, Pencil, Heart } from "lucide-react";

// ─── PRODUCT CARD ─────────────────────────────────────────────────
export default function PCard({ p, onClick, isOwn, onLike, loggedIn }) {
  const cc = COND[p.condition] || COND["Yaxshi"];

  const handleLike = (e) => {
    e.stopPropagation();
    if (!loggedIn || !onLike) return;
    onLike(p.id);
  };

  return (
    <div onClick={onClick}
      style={{ background:C.card, borderRadius:18, overflow:"hidden",
               cursor:"pointer", border:`1px solid ${isOwn ? C.primaryBorder : C.border}`,
               boxShadow:C.shadow, transition:"transform 0.18s, box-shadow 0.18s",
               position:"relative" }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=C.shadowMd;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=C.shadow;}}>

      {/* "Sizniki" badge */}
      {isOwn && (
        <div style={{ position:"absolute", top:8, left:8, zIndex:2,
                      background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                      color:"white", fontSize:9, fontWeight:800,
                      padding:"3px 8px", borderRadius:10,
                      boxShadow:"0 2px 8px rgba(255,179,128,0.5)",
                      display:"flex", alignItems:"center", gap:4 }}>
          <Pencil size={9} /> Sizniki
        </div>
      )}

      {/* Like button — top right of photo */}
      {!isOwn && (
        <div onClick={handleLike}
          style={{ position:"absolute", top:8, right:8, zIndex:3,
                   width:28, height:28, borderRadius:"50%",
                   background:"rgba(255,255,255,0.90)",
                   display:"flex", alignItems:"center", justifyContent:"center",
                   boxShadow:"0 1px 6px rgba(0,0,0,0.18)",
                   cursor: loggedIn ? "pointer" : "default",
                   transition:"transform 0.15s" }}>
          <Heart size={14}
            color={p.isLiked ? "#EF4444" : "#9CA3AF"}
            fill={p.isLiked ? "#EF4444" : "none"}
          />
        </div>
      )}

      {/* photo */}
      <div style={{ width:"100%", height:120, background:C.primaryLight, overflow:"hidden",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    position:"relative" }}>
        {p.photo
          ? <img src={p.photo} alt={p.name}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
              onError={e => { e.target.style.display="none"; }}
            />
          : <Image size={48} color={C.primaryBorder} />
        }
      </div>

      <div style={{ padding:"10px 12px 0", display:"flex", flexDirection:"column", flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
          <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:8,
                         background:cc.bg, color:cc.text }}>● {p.condition}</span>
          <span style={{ fontSize:9, color:C.textMuted }}>#{p.id.slice(0,8)}</span>
        </div>

        <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:6, lineHeight:1.25 }}>{p.name}</div>

        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <LocIcon size={11} color={C.textSub} />
          <span style={{ fontSize:11, color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {p.viloyat}{p.tuman ? ` › ${p.tuman}` : ""}
          </span>
        </div>
      </div>

      {/* Narx + miqdor */}
      <div style={{ margin:"8px 12px 10px", padding:"8px 10px",
                    background:C.bg, borderRadius:12,
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                    flexWrap:"wrap", gap:6,
                    borderTop:`1px solid ${C.border}` }}>
        <div style={{ textAlign:"center", flex:"1 1 auto" }}>
          <div style={{ fontSize:14, fontWeight:900, color:C.primaryDark, lineHeight:1.2 }}>
            {p.price.toLocaleString()}
          </div>
          <div style={{ fontSize:9, color:C.textMuted, lineHeight:1.4 }}>
            so'm / {p.unit}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {/* Like count */}
          {(p.likeCount > 0 || p.isLiked) && (
            <span style={{ fontSize:9, display:"flex", alignItems:"center", gap:2,
                           color: p.isLiked ? "#EF4444" : C.textMuted }}>
              <Heart size={9}
                color={p.isLiked ? "#EF4444" : C.textMuted}
                fill={p.isLiked ? "#EF4444" : "none"} />
              {p.likeCount || 0}
            </span>
          )}
          <div style={{ textAlign:"center", background:C.card,
                        padding:"3px 10px", borderRadius:8,
                        border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.textSub, lineHeight:1.2 }}>{p.qty}</div>
            <div style={{ fontSize:8, color:C.textMuted, lineHeight:1.4 }}>{p.unit}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
