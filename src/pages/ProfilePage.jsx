import { useState, useEffect } from "react";
import { Lbl, TInput, BtnPrimary, BtnGhost } from "../components/UI";
import AvatarUpload from "../components/AvatarUpload";
import PaymentPage from "./PaymentPage";
import { C, COND, OPERATOR } from "../constants";
import { authAPI, rentalsAPI } from "../services/api";
import {
  Package, Calendar, Inbox, Trash2,
  Pencil, Check, LogOut, Lock, CreditCard,
  User, Send, MapPin, Wallet, Clock, AlertCircle, CheckCircle, XCircle, Eye,
  Home, BookOpen, X,
} from "lucide-react";

function StatusBadge({ status, rejectReason }) {
  const map = {
    active:           { bg:"#E8F8F0", color:"#28A869", icon:<CheckCircle size={9}/>, label:"Faol" },
    pending_approval: { bg:"#FFFBEB", color:"#D97706", icon:<Clock size={9}/>,       label:"Tekshiruvda" },
    pending_payment:  { bg:"#EFF6FF", color:"#2563EB", icon:<AlertCircle size={9}/>, label:"To'lov kutmoqda" },
    hidden:           { bg:"#F3F4F6", color:"#6B7280", icon:<XCircle size={9}/>,     label:"Yashirilgan" },
    deleted:          { bg:"#FFF1F0", color:"#FF4D4F", icon:<XCircle size={9}/>,     label:"O'chirilgan" },
  };
  const s = map[status] || map.pending_approval;
  return (
    <div>
      <span style={{ fontSize:9, padding:"2px 7px", borderRadius:8,
                     background:s.bg, color:s.color, fontWeight:700,
                     display:"inline-flex", alignItems:"center", gap:3 }}>
        {s.icon} {s.label}
      </span>
      {rejectReason && status === "deleted" && (
        <div style={{ fontSize:9, color:"#FF4D4F", marginTop:2, fontStyle:"italic" }}>
          Sabab: {rejectReason}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage({ user, setUser, myProducts, offers = [],
  myRentals = [], setMyRentals, myBookings = [], setMyBookings,
  onDelete, onLogout, isOperator, onOpenOperator }) {
  const [editMode,    setEditMode]    = useState(false);
  const [draft,       setDraft]       = useState({ name: user.name, avatar: user.avatar });
  const [saving,      setSaving]      = useState(false);
  const [activeTab,   setActiveTab]   = useState("profile");
  const [cancellingId, setCancellingId] = useState(null);

  // Polling orqali user yangilansa, editMode bo'lmasa draft sinxronlansin
  useEffect(() => {
    if (!editMode) {
      setDraft({ name: user.name, avatar: user.avatar });
    }
  }, [user]);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await authAPI.updateMe({ name: draft.name, avatar: draft.avatar });
      setUser(updated);
    } catch { /* silent */ }
    setSaving(false);
    setEditMode(false);
  };

  // Avatar o'zgarganda darhol serverga saqlansin
  const handleAvatarChange = async (newAvatar) => {
    setDraft(d => ({ ...d, avatar: newAvatar }));
    try {
      const updated = await authAPI.updateMe({ avatar: newAvatar });
      setUser(updated);
    } catch { /* silent */ }
  };

  const cancel = () => { setDraft({ name: user.name, avatar: user.avatar }); setEditMode(false); };

  const handleCancelBooking = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      await rentalsAPI.cancelBooking(bookingId);
      if (setMyBookings) setMyBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch { /* silent */ }
    setCancellingId(null);
  };

  const pendingCount  = myProducts.filter(p => p.status === "pending_approval" || p.status === "pending_payment").length;
  const rejectedCount = myProducts.filter(p => p.status === "deleted" && p.rejectedReason).length;

  return (
    <div style={{ padding:"20px 16px 10px", overflowY:"auto", fontFamily:"'Nunito','Segoe UI',sans-serif",
                  background:C.bg, minHeight:"100vh",
                  paddingBottom:"calc(84px + env(safe-area-inset-bottom, 0px))",
                  maxWidth:430, margin:"0 auto", position:"relative" }}>

      {/* Tab bar */}
      <div style={{ display:"flex", background:C.card, borderRadius:16, padding:4,
                    marginBottom:18, gap:4, border:`1px solid ${C.border}` }}>
        {[
          ["profile", <User size={14}/>, "Profil"],
          ["rentals", <Home size={14}/>, "Arenda"],
          ["payment", <CreditCard size={14}/>, "To'lovlar"],
        ].map(([tab, icon, lbl]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex:1, padding:"9px 0", borderRadius:12, border:"none",
            cursor:"pointer", fontFamily:"inherit", fontSize:11, fontWeight:700, transition:"all .2s",
            background: activeTab===tab ? C.primaryDark : "transparent",
            color: activeTab===tab ? "white" : C.textMuted,
            display:"flex", alignItems:"center", justifyContent:"center", gap:5,
          }}>{icon} {lbl}</button>
        ))}
      </div>

      {activeTab === "payment" && <PaymentPage user={user} embedded />}

      {/* ─── ARENDA TAB ────────────────────────────────────── */}
      {activeTab === "rentals" && (
        <div>
          {/* My rental listings */}
          <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:14,
                        fontWeight:800, color:C.text, marginBottom:12 }}>
            <Home size={16} color="#059669" /> Mening arenda e'lonlarim
          </div>

          {myRentals.filter(r => r.status !== "deleted").length === 0 ? (
            <div style={{ textAlign:"center", padding:"24px 16px", color:C.textMuted,
                          background:C.card, borderRadius:16, border:`1px solid #D1FAE5`,
                          marginBottom:20 }}>
              <div style={{ fontSize:28, marginBottom:6 }}>🏠</div>
              <div style={{ fontSize:13, fontWeight:700 }}>Arenda e'lonlar yo'q</div>
              <div style={{ fontSize:11, marginTop:3 }}>Bosh sahifada "Arenda" tabida e'lon qo'shing</div>
            </div>
          ) : (
            <div style={{ marginBottom:20 }}>
              {myRentals.filter(r => r.status !== "deleted").map(r => {
                const statusColor = r.status === "active" ? "#059669" : r.status === "pending_approval" ? "#D97706" : "#6B7280";
                const statusBg    = r.status === "active" ? "#D1FAE5" : r.status === "pending_approval" ? "#FEF3C7" : "#F3F4F6";
                const statusLabel = r.status === "active" ? "Faol" : r.status === "pending_approval" ? "Tekshiruvda" : "Yashirilgan";
                return (
                  <div key={r.id} style={{ background:C.card, borderRadius:14, marginBottom:10,
                                            border:"1px solid #D1FAE5", boxShadow:C.shadow,
                                            display:"flex", overflow:"hidden", alignItems:"stretch" }}>
                    <div style={{ width:76, flexShrink:0, background:"#D1FAE5",
                                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {r.photo
                        ? <img src={r.photo} alt={r.name} style={{ width:76, height:"100%", objectFit:"cover" }} />
                        : <Home size={24} color="#6EE7B7" />
                      }
                    </div>
                    <div style={{ flex:1, padding:"10px 12px", minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:800, color:C.text, overflow:"hidden",
                                    textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:2 }}>{r.name}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:"#059669", marginBottom:4 }}>
                        {Number(r.pricePerDay).toLocaleString()} so'm/kun
                      </div>
                      <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                        <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:7,
                                       background:statusBg, color:statusColor }}>● {statusLabel}</span>
                        <span style={{ fontSize:9, color:C.textMuted }}>
                          <MapPin size={9} style={{ verticalAlign:"middle" }} /> {r.tuman||r.viloyat}
                        </span>
                        <span style={{ fontSize:9, color:C.textMuted, display:"flex", alignItems:"center", gap:2 }}>
                          <Eye size={9} /> {r.viewCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* My bookings as renter */}
          <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:14,
                        fontWeight:800, color:C.text, marginBottom:12 }}>
            <BookOpen size={16} color={C.primaryDark} /> Mening bronlarim
          </div>

          {myBookings.length === 0 ? (
            <div style={{ textAlign:"center", padding:"24px 16px", color:C.textMuted,
                          background:C.card, borderRadius:16, border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:28, marginBottom:6 }}>📅</div>
              <div style={{ fontSize:13, fontWeight:700 }}>Hali bronlar yo'q</div>
              <div style={{ fontSize:11, marginTop:3 }}>Arenda buyumlarini kalandarda bronlang</div>
            </div>
          ) : (
            myBookings.map(b => {
              const isFuture = b.startDate > new Date().toISOString().slice(0,10);
              return (
                <div key={b.id} style={{ background:C.card, borderRadius:14, marginBottom:10,
                                          border:"1px solid #D1FAE5", boxShadow:C.shadow,
                                          padding:"12px 14px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.text, flex:1 }}>{b.rentalName}</div>
                    <span style={{ fontSize:9, padding:"2px 7px", borderRadius:7, fontWeight:700,
                                   background: b.status === "confirmed" ? "#D1FAE5" : "#FEF2F2",
                                   color: b.status === "confirmed" ? "#059669" : "#EF4444" }}>
                      {b.status === "confirmed" ? "✓ Tasdiqlangan" : "Bekor"}
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:10, fontSize:11, color:C.textSub, marginBottom:6, flexWrap:"wrap" }}>
                    <span>📅 {b.startDate} → {b.endDate}</span>
                    <span>📆 {b.totalDays} kun</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:900, color:"#059669" }}>
                        {Number(b.totalPrice).toLocaleString()} so'm
                      </div>
                      <div style={{ fontSize:9, color:C.textMuted }}>
                        Xizmat haqi (5%): {Number(b.fee).toLocaleString()} so'm
                      </div>
                    </div>
                    {isFuture && b.status === "confirmed" && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        disabled={cancellingId === b.id}
                        style={{ padding:"6px 12px", borderRadius:8, border:"none",
                                 background:"#FEF2F2", color:"#EF4444",
                                 fontSize:11, fontWeight:700, cursor:"pointer",
                                 display:"flex", alignItems:"center", gap:4 }}>
                        {cancellingId === b.id ? "..." : <><X size={11}/> Bekor</>}
                      </button>
                    )}
                  </div>
                  {b.ownerName && (
                    <div style={{ fontSize:10, color:C.textMuted, marginTop:6, borderTop:"1px solid #F0FDF4",
                                  paddingTop:6 }}>
                      Egasi: {b.ownerName} {b.ownerPhone ? `· +998 ${b.ownerPhone}` : ""}
                      {b.ownerTelegram ? ` · ${b.ownerTelegram}` : ""}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div style={{ height:16 }} />
        </div>
      )}

      {activeTab === "profile" && <>

        {/* Profile card */}
        <div style={{ background:C.card, borderRadius:22, padding:"24px 18px 20px",
                      border:`1px solid ${C.border}`, boxShadow:C.shadow,
                      marginBottom:16, textAlign:"center" }}>
          <AvatarUpload
            avatar={draft.avatar} name={draft.name}
            onAvatar={handleAvatarChange}
          />

          {editMode ? (
            <div style={{ textAlign:"left" }}>
              <Lbl>Ism Familiya</Lbl>
              <TInput value={draft.name} onChange={v => setDraft(d => ({ ...d, name: v }))} placeholder="Ism Familiya" />
              <Lbl>Telefon</Lbl>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 13px",
                            borderRadius:12, border:`1.5px solid ${C.border}`, background:"#F9F9F9",
                            marginBottom:13, color:C.textMuted, fontSize:14 }}>
                <Lock size={13} color={C.textMuted} /> +998 {user.phone}
              </div>
              <Lbl>Telegram</Lbl>
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 13px",
                            borderRadius:12, border:`1.5px solid ${C.border}`, background:"#F9F9F9",
                            marginBottom:13, color:C.textMuted, fontSize:14 }}>
                <Lock size={13} color={C.textMuted} /> {user.telegram || "Telegram username yo'q"}
              </div>
              <div style={{ display:"flex", gap:9, marginTop:4 }}>
                <BtnGhost onClick={cancel}>Bekor</BtnGhost>
                <BtnPrimary onClick={save} disabled={saving}>
                  <Check size={15} /> {saving ? "Saqlanmoqda..." : "Saqlash"}
                </BtnPrimary>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:20, fontWeight:900, color:C.text, marginBottom:3 }}>{user.name}</div>
              <div style={{ fontSize:12, color:C.textMuted, marginBottom:3 }}>+998 {user.phone}</div>
              <div style={{ fontSize:11, color:C.textMuted, marginBottom:3 }}>
                ID: {user.publicId || user.public_id || "—"}
              </div>
              <div style={{ fontSize:11, color:"#0088CC", marginBottom:12 }}>
                Telegram: {user.telegram || "—"}
              </div>
              <button onClick={() => { setDraft({ name: user.name, avatar: user.avatar }); setEditMode(true); }}
                style={{ padding:"8px 22px", borderRadius:20, border:`1.5px solid ${C.primaryBorder}`,
                         background:C.primaryLight, color:C.primaryDark, fontSize:12,
                         fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                         display:"inline-flex", alignItems:"center", gap:6 }}>
                <Pencil size={13} /> Tahrirlash
              </button>
            </>
          )}
        </div>

        {/* Pending posts notice */}
        {(pendingCount > 0 || rejectedCount > 0) && (
          <div style={{ marginBottom:14 }}>
            {pendingCount > 0 && (
              <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:14,
                            padding:"12px 14px", marginBottom:8,
                            display:"flex", alignItems:"center", gap:8 }}>
                <Clock size={16} color="#D97706" style={{ flexShrink:0 }} />
                <div style={{ fontSize:12, color:"#92400E" }}>
                  <b>{pendingCount} ta e'lon</b> tekshirilmoqda (30-60 daqiqa). Operator tasdiqlashini kuting.
                </div>
              </div>
            )}
            {rejectedCount > 0 && (
              <div style={{ background:"#FFF1F0", border:"1px solid #FFCCC7", borderRadius:14,
                            padding:"12px 14px",
                            display:"flex", alignItems:"center", gap:8 }}>
                <AlertCircle size={16} color="#FF4D4F" style={{ flexShrink:0 }} />
                <div style={{ fontSize:12, color:"#CF1322" }}>
                  <b>{rejectedCount} ta e'lon</b> rad etildi. Sababini quyida ko'ring.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Balance */}
        <div style={{ borderRadius:20, padding:"18px 20px", marginBottom:14,
                      background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                      boxShadow:`0 6px 24px rgba(244,137,74,0.35)`, color:"#fff" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:11, opacity:0.85, marginBottom:4 }}>
            <Wallet size={13} /> Hisobingiz
          </div>
          <div style={{ fontSize:30, fontWeight:900, letterSpacing:1, marginBottom:6 }}>
            {Number(user.balance || 0).toLocaleString()} so'm
          </div>
          <div style={{ fontSize:11, opacity:0.8, marginBottom:12 }}>
            Pul qo'shish uchun operatorga murojaat qiling
          </div>
          <a href={`https://t.me/${OPERATOR.telegram.replace("@","")}`}
            target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:7,
                     background:"rgba(255,255,255,0.25)", borderRadius:12,
                     padding:"8px 16px", color:"#fff", textDecoration:"none",
                     fontSize:12, fontWeight:700 }}>
            <Send size={13} /> {OPERATOR.telegram} — Pul qo'shish
          </a>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
          {[
            [Package,  myProducts.length,                     "E'lonlarim"],
            [Calendar, new Date(user.joined).getFullYear(),   "A'zo yili"],
          ].map(([Icon, v, l]) => (
            <div key={l} style={{ background:C.card, borderRadius:16, padding:"14px 10px",
                                  textAlign:"center", border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:4 }}>
                <Icon size={22} color={C.primaryDark} />
              </div>
              <div style={{ fontSize:22, fontWeight:900, color:C.primaryDark }}>{v}</div>
              <div style={{ fontSize:10, color:C.textMuted }}>{l}</div>
            </div>
          ))}
        </div>

        {/* My listings — show all statuses */}
        <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:14, fontWeight:800, color:C.text, marginBottom:12 }}>
          <Package size={16} color={C.primaryDark} /> Mening e'lonlarim
        </div>

        {/* Hide self-deleted products; still show operator-rejected ones */}
        {myProducts.filter(p => p.status !== "deleted" || p.rejectedReason).length === 0 ? (
          <div style={{ textAlign:"center", padding:"32px 20px", color:C.textMuted,
                        background:C.card, borderRadius:16, border:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}>
              <Inbox size={38} color={C.textMuted} />
            </div>
            <div style={{ fontSize:13, fontWeight:700 }}>Hali e'lonlar yo'q</div>
            <div style={{ fontSize:11, marginTop:3 }}>E'lon qo'shish uchun + tugmasini bosing</div>
          </div>
        ) : (
          myProducts
            .filter(p => p.status !== "deleted" || p.rejectedReason)
            .map(p => {
            const cc = COND[p.condition] || COND["Yaxshi"];
            return (
              <div key={p.id}
                style={{ background:C.card, borderRadius:16, marginBottom:10,
                         border:`1px solid ${p.status==="rejected"?"#FFCCC7":p.status==="pending"?"#FDE68A":C.border}`,
                         boxShadow:C.shadow, display:"flex", overflow:"hidden", alignItems:"stretch" }}>
                <div style={{ width:80, flexShrink:0, background:C.primaryLight,
                              display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {p.photo
                    ? <img src={p.photo} alt={p.name} style={{ width:80, height:"100%", objectFit:"cover" }} />
                    : <Package size={28} color={C.primaryBorder} />
                  }
                </div>
                <div style={{ flex:1, padding:"10px 12px", minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:C.text, overflow:"hidden",
                                textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:2 }}>{p.name}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.primaryDark, marginBottom:4 }}>
                    {p.price.toLocaleString()} so'm/{p.unit}
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"flex-start", flexWrap:"wrap" }}>
                    <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:7,
                                   background:cc.bg, color:cc.text }}>● {p.condition}</span>
                    <span style={{ fontSize:9, color:C.textMuted, display:"inline-flex", alignItems:"center", gap:2 }}>
                      <MapPin size={9} color={C.textMuted} /> {p.tuman||p.viloyat}
                    </span>
                    {(() => {
                      const cnt = offers.filter(o => o.productId === p.id).length;
                      return cnt > 0 ? (
                        <span style={{ fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:7,
                                       background:"#E8F2FD", color:"#3A85C8",
                                       display:"inline-flex", alignItems:"center", gap:2 }}>
                          📨 {cnt} taklif
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <div style={{ marginTop:4 }}>
                    <StatusBadge status={p.status || "approved"} rejectReason={p.rejectReason} />
                  </div>
                </div>
                {p.status !== "deleted" && (
                  <div style={{ display:"flex", alignItems:"center", padding:"0 12px" }}>
                    <button onClick={() => onDelete(p.id)}
                      style={{ width:34, height:34, borderRadius:10, border:"none",
                               background:C.dangerLight, color:C.danger,
                               cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Operator button */}
        {isOperator && (
          <button onClick={onOpenOperator}
            style={{ width:"100%", padding:"13px", borderRadius:14, marginTop:8,
                     border:`1.5px solid ${C.primaryBorder}`,
                     background:C.primaryLight, color:C.primaryDark, fontSize:13, fontWeight:700,
                     cursor:"pointer", fontFamily:"inherit",
                     display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            ⚙️ Operator paneli
          </button>
        )}

        {/* Logout */}
        <button onClick={onLogout}
          style={{ width:"100%", padding:"13px", borderRadius:14, marginTop:16,
                   border:`1.5px solid #FFD4D4`, background:C.dangerLight,
                   color:C.danger, fontSize:13, fontWeight:700,
                   cursor:"pointer", fontFamily:"inherit",
                   display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <LogOut size={16} /> Chiqish (Logout)
        </button>
        <div style={{ height:16 }} />

      </>}
    </div>
  );
}