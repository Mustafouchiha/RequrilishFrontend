import LocIcon from "./LocIcon";
import { C } from "../constants";
import { Image, Calendar, Eye } from "lucide-react";

export default function RentalCard({ r, onClick }) {
  return (
    <div onClick={onClick}
      style={{ background:C.card, borderRadius:18, overflow:"hidden",
               cursor:"pointer", border:`1px solid #D1FAE5`,
               boxShadow:C.shadow, transition:"transform 0.18s, box-shadow 0.18s",
               position:"relative" }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=C.shadowMd;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=C.shadow;}}>

      {/* Arenda badge */}
      <div style={{ position:"absolute", top:8, left:8, zIndex:2,
                    background:"linear-gradient(135deg,#10B981,#059669)",
                    color:"white", fontSize:9, fontWeight:800,
                    padding:"3px 8px", borderRadius:10,
                    display:"flex", alignItems:"center", gap:3 }}>
        <Calendar size={9} /> Arenda
      </div>

      {/* photo */}
      <div style={{ width:"100%", height:120, background:"#D1FAE5", overflow:"hidden",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
        {r.photo
          ? <img src={r.photo} alt={r.name}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
              onError={e => { e.target.style.display="none"; }}
            />
          : <Image size={48} color="#6EE7B7" />
        }
      </div>

      <div style={{ padding:"10px 12px 0" }}>
        <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:4, lineHeight:1.25 }}>{r.name}</div>

        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:6 }}>
          <LocIcon size={11} color={C.textSub} />
          <span style={{ fontSize:11, color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {r.viloyat}{r.tuman ? ` › ${r.tuman}` : ""}
          </span>
        </div>
      </div>

      {/* Narx */}
      <div style={{ margin:"6px 12px 8px", padding:"8px 10px",
                    background:"#F0FDF4", borderRadius:12,
                    display:"flex", justifyContent:"space-between", alignItems:"center",
                    border:"1px solid #BBF7D0" }}>
        <div>
          <div style={{ fontSize:14, fontWeight:900, color:"#059669", lineHeight:1.2 }}>
            {Number(r.pricePerDay).toLocaleString()}
          </div>
          <div style={{ fontSize:9, color:"#6B7280", lineHeight:1.4 }}>so'm / kun</div>
        </div>
        <span style={{ fontSize:9, color:"#6B7280", display:"flex", alignItems:"center", gap:3 }}>
          <Eye size={9} /> {r.viewCount || 0}
        </span>
      </div>
    </div>
  );
}
