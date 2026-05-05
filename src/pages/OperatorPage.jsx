import { useState, useEffect, useCallback } from "react";
import { C } from "../constants";
import { operatorAPI } from "../services/api";
import {
  Search, Trash2, Users, Package, ChevronLeft,
  Loader2, CheckCircle, XCircle, EyeOff, Eye,
  Lock, Unlock, CreditCard, CheckSquare,
  AlertTriangle, RefreshCw, PlusCircle, MinusCircle,
  Shield, UserPlus, UserMinus, Wallet, Clock,
  Pencil, ToggleLeft, ToggleRight, Heart,
  Home, Calendar, BookOpen,
} from "lucide-react";

const phoneCore = (v) => String(v || "").replace(/\D/g, "").slice(-9);
const fmtPhone = (v) => {
  const c = phoneCore(v);
  if (c.length !== 9) return v || "—";
  return `+998 ${c.slice(0,2)} ${c.slice(2,5)} ${c.slice(5,7)} ${c.slice(7,9)}`;
};
const fmtPrice = (n) => Number(n || 0).toLocaleString("uz-UZ") + " so'm";

const STATUS_MAP = {
  active:           { bg:"#E8F8F0", color:"#28A869", label:"Faol" },
  pending_approval: { bg:"#FFFBEB", color:"#D97706", label:"Tekshiruvda" },
  pending_payment:  { bg:"#EFF6FF", color:"#2563EB", label:"To'lov kutmoqda" },
  hidden:           { bg:"#F3F4F6", color:"#6B7280", label:"Yashirilgan" },
  deleted:          { bg:"#FFF1F0", color:"#EF4444", label:"O'chirilgan" },
};
function Badge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.deleted;
  return (
    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6,
                   background:s.bg, color:s.color, fontWeight:700, whiteSpace:"nowrap" }}>
      {s.label}
    </span>
  );
}

/* ── Generic dialogs ──────────────────────────────────────── */
function Modal({ children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
                  zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 20px" }}>
      <div style={{ background:"white", borderRadius:16, padding:"20px", width:"100%", maxWidth:360,
                    boxShadow:"0 12px 40px rgba(0,0,0,0.2)" }}>
        {children}
      </div>
    </div>
  );
}

function Confirm({ title, msg, onOk, onCancel, okColor }) {
  return (
    <Modal>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <AlertTriangle size={18} color={okColor || C.danger} />
        <b style={{ fontSize:15, color:C.text }}>{title}</b>
      </div>
      <p style={{ fontSize:13, color:C.textSub, marginBottom:18, lineHeight:1.5 }}>{msg}</p>
      <div style={{ display:"flex", gap:8 }}>
        <Btn ghost onClick={onCancel}>Bekor</Btn>
        <Btn color={okColor || C.danger} onClick={onOk}>Tasdiqlash</Btn>
      </div>
    </Modal>
  );
}

function RejectModal({ onOk, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <Modal>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <XCircle size={18} color={C.danger} />
        <b style={{ fontSize:15, color:C.text }}>Rad etish sababi</b>
      </div>
      <textarea value={reason} onChange={e => setReason(e.target.value)}
        placeholder="Masalan: rasm sifatsiz, narx noto'g'ri..."
        rows={3} style={{ width:"100%", boxSizing:"border-box", padding:"9px 11px",
                          borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:13,
                          fontFamily:"inherit", resize:"none", outline:"none", marginBottom:14 }} />
      <div style={{ display:"flex", gap:8 }}>
        <Btn ghost onClick={onCancel}>Bekor</Btn>
        <Btn color={C.danger} onClick={() => reason.trim() && onOk(reason.trim())}
          disabled={!reason.trim()}>Rad et</Btn>
      </div>
    </Modal>
  );
}

function AmountModal({ title, Icon, iconColor, user, onOk, onCancel, maxAmount }) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = Number(amount) > 0 && (maxAmount === undefined || Number(amount) <= maxAmount);

  const go = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try { await onOk(Number(amount)); }
    catch { setBusy(false); }
  };

  return (
    <Modal>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <Icon size={18} color={iconColor} />
        <b style={{ fontSize:15, color:C.text }}>{title}</b>
      </div>
      <div style={{ fontSize:12, color:C.textMuted, marginBottom:12 }}>
        {fmtPhone(user.phone)} — {user.name}
        {maxAmount !== undefined && <span style={{ color:C.danger, marginLeft:8 }}>Balans: {fmtPrice(maxAmount)}</span>}
      </div>
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
        placeholder="Summa (so'm)" autoFocus
        style={{ width:"100%", boxSizing:"border-box", padding:"9px 11px", borderRadius:10,
                 border:`1.5px solid ${C.border}`, fontSize:14, fontFamily:"inherit",
                 outline:"none", marginBottom:14 }} />
      <div style={{ display:"flex", gap:8 }}>
        <Btn ghost onClick={onCancel}>Bekor</Btn>
        <Btn color={iconColor} onClick={go} disabled={!valid || busy}>
          {busy ? <Loader2 size={13} style={{ animation:"spin 1s linear infinite" }} /> : <Icon size={13} />}
          Tasdiqlash
        </Btn>
      </div>
    </Modal>
  );
}

function EditPostModal({ post, onOk, onCancel }) {
  const [form, setForm] = useState({
    name:      post.name || "",
    price:     String(post.price || ""),
    qty:       String(post.qty || ""),
    unit:      post.unit || "dona",
    category:  post.category || "boshqa",
    condition: post.condition || "Yaxshi",
    viloyat:   post.viloyat || "",
    tuman:     post.tuman || "",
  });
  const [busy, setBusy] = useState(false);

  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const go = async () => {
    if (!form.name || !form.price || busy) return;
    setBusy(true);
    try {
      await onOk({
        ...form,
        price: Number(form.price),
        qty:   Number(form.qty),
      });
    } catch { setBusy(false); }
  };

  return (
    <Modal>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <Pencil size={16} color={C.primaryDark} />
        <b style={{ fontSize:15, color:C.text }}>Postni tahrirlash</b>
      </div>
      <div style={{ maxHeight:"60vh", overflowY:"auto" }}>
        <div style={{ fontSize:10, color:C.textSub, marginBottom:3, fontWeight:700 }}>Nomi *</div>
        <input value={form.name} onChange={e => f("name")(e.target.value)}
          style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:8,
                   border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:10 }} />

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
          <div>
            <div style={{ fontSize:10, color:C.textSub, marginBottom:3, fontWeight:700 }}>Narx *</div>
            <input type="number" value={form.price} onChange={e => f("price")(e.target.value)}
              style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:8,
                       border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none" }} />
          </div>
          <div>
            <div style={{ fontSize:10, color:C.textSub, marginBottom:3, fontWeight:700 }}>Miqdor</div>
            <input type="number" value={form.qty} onChange={e => f("qty")(e.target.value)}
              style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:8,
                       border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none" }} />
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
          <div>
            <div style={{ fontSize:10, color:C.textSub, marginBottom:3, fontWeight:700 }}>O'lchov</div>
            <select value={form.unit} onChange={e => f("unit")(e.target.value)}
              style={{ width:"100%", padding:"8px 10px", borderRadius:8,
                       border:`1.5px solid ${C.border}`, fontSize:12, fontFamily:"inherit", outline:"none" }}>
              {["dona","kg","m²","m","m³","ton"].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:10, color:C.textSub, marginBottom:3, fontWeight:700 }}>Holat</div>
            <select value={form.condition} onChange={e => f("condition")(e.target.value)}
              style={{ width:"100%", padding:"8px 10px", borderRadius:8,
                       border:`1.5px solid ${C.border}`, fontSize:12, fontFamily:"inherit", outline:"none" }}>
              {["A'lo","Yaxshi","O'rta"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ fontSize:10, color:C.textSub, marginBottom:3, fontWeight:700 }}>Viloyat</div>
        <input value={form.viloyat} onChange={e => f("viloyat")(e.target.value)}
          style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:8,
                   border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:10 }} />

        <div style={{ fontSize:10, color:C.textSub, marginBottom:3, fontWeight:700 }}>Tuman</div>
        <input value={form.tuman} onChange={e => f("tuman")(e.target.value)}
          style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:8,
                   border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:14 }} />
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <Btn ghost onClick={onCancel}>Bekor</Btn>
        <Btn color={C.primaryDark} onClick={go} disabled={!form.name || !form.price || busy}>
          {busy ? <Loader2 size={13} style={{ animation:"spin 1s linear infinite" }} /> : <CheckCircle size={13} />}
          Saqlash
        </Btn>
      </div>
    </Modal>
  );
}

function AddOpModal({ onOk, onCancel }) {
  const [ident, setIdent] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (!ident.trim() || busy) return;
    setBusy(true);
    try { await onOk(ident.trim()); }
    catch { setBusy(false); }
  };

  return (
    <Modal>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <UserPlus size={18} color={C.primaryDark} />
        <b style={{ fontSize:15, color:C.text }}>Operator qo'shish</b>
      </div>
      <div style={{ fontSize:12, color:C.textMuted, marginBottom:10 }}>Telefon raqam yoki ism:</div>
      <input value={ident} onChange={e => setIdent(e.target.value)}
        placeholder="901234567 yoki Abdulloh Karimov" autoFocus
        style={{ width:"100%", boxSizing:"border-box", padding:"9px 11px", borderRadius:10,
                 border:`1.5px solid ${C.border}`, fontSize:14, fontFamily:"inherit",
                 outline:"none", marginBottom:14 }} />
      <div style={{ display:"flex", gap:8 }}>
        <Btn ghost onClick={onCancel}>Bekor</Btn>
        <Btn color={C.primaryDark} onClick={go} disabled={!ident.trim() || busy}>
          {busy ? <Loader2 size={13} style={{ animation:"spin 1s linear infinite" }} /> : <UserPlus size={13} />}
          Qo'shish
        </Btn>
      </div>
    </Modal>
  );
}

/* ── Simple button ────────────────────────────────────────── */
function Btn({ children, onClick, color, ghost, disabled, style = {} }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ flex:1, padding:"9px 12px", borderRadius:10, cursor: disabled ? "default" : "pointer",
               border: ghost ? `1.5px solid ${C.border}` : "none",
               background: disabled ? C.border : ghost ? "white" : (color || C.primaryDark),
               color: ghost ? C.text : "white", fontSize:12, fontWeight:700,
               fontFamily:"inherit", display:"flex", alignItems:"center",
               justifyContent:"center", gap:5, ...style }}>
      {children}
    </button>
  );
}

/* ── Row separator ─────────────────────────────────────────── */
const Sep = () => <div style={{ height:1, background:C.border, margin:"0 -14px" }} />;

/* ── Tabs ─────────────────────────────────────────────────── */
const TABS = [
  { key:"approval",  Icon:CheckSquare, label:"Tasdiqlash" },
  { key:"users",     Icon:Users,       label:"Foydalanuvchi" },
  { key:"products",  Icon:Package,     label:"Mahsulot" },
  { key:"rentals",   Icon:Home,        label:"Arenda" },
  { key:"payments",  Icon:CreditCard,  label:"To'lov" },
  { key:"operators", Icon:Shield,      label:"Operator" },
];

export default function OperatorPage({ onBack, user }) {
  const isMainOp = phoneCore(user?.phone) === "331350206";
  const visibleTabs = isMainOp ? TABS : TABS.filter(t => t.key !== "operators");

  const [tab,          setTab]          = useState("approval");
  const [loading,      setLoading]      = useState(false);
  const [err,          setErr]          = useState("");
  const [toast,        setToast]        = useState("");
  const [confirmDlg,   setConfirmDlg]   = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [depositUser,  setDepositUser]  = useState(null);
  const [withdrawUser, setWithdrawUser] = useState(null);
  const [addOpDlg,     setAddOpDlg]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);

  const [pending,        setPending]        = useState([]);
  const [users,          setUsers]          = useState([]);
  const [userQ,          setUserQ]          = useState("");
  const [prods,          setProds]          = useState([]);
  const [prodQ,          setProdQ]          = useState("");
  const [prodStatus,     setProdStatus]     = useState("");
  const [payments,       setPayments]       = useState([]);
  const [pendingOffers,  setPendingOffers]  = useState([]);
  const [operators,      setOperators]      = useState([]);
  const [stats,          setStats]          = useState(null);
  const [rentals,        setRentals]        = useState([]);
  const [rentalQ,        setRentalQ]        = useState("");
  const [rentalStatus,   setRentalStatus]   = useState("");
  const [rentalBookings, setRentalBookings] = useState([]);
  const [rentalSubTab,   setRentalSubTab]   = useState("listings"); // "listings" | "bookings"

  const toast$ = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };
  const ok  = (msg) => toast$("✓ " + msg);
  const fail = (e)  => toast$("✗ " + (e?.message || e));

  const loadTab = useCallback(async (t = tab) => {
    setLoading(true); setErr("");
    try {
      if (t === "approval") {
        const [d, s] = await Promise.all([
          operatorAPI.getPendingPosts(),
          operatorAPI.getStats().catch(() => null),
        ]);
        setPending(d); if (s) setStats(s);
      } else if (t === "users") {
        setUsers(await operatorAPI.getUsers(userQ));
      } else if (t === "products") {
        setProds(await operatorAPI.getProducts(prodQ, prodStatus));
      } else if (t === "rentals") {
        const [rents, bookings] = await Promise.all([
          operatorAPI.getRentals(rentalQ, rentalStatus).catch(() => []),
          operatorAPI.getRentalBookings().catch(() => []),
        ]);
        setRentals(rents); setRentalBookings(bookings);
      } else if (t === "payments") {
        const [pays, offs] = await Promise.all([
          operatorAPI.getPayments(),
          operatorAPI.getPendingOffers().catch(() => []),
        ]);
        setPayments(pays); setPendingOffers(offs);
      } else if (t === "operators") {
        setOperators(await operatorAPI.getOperators());
      }
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [tab, userQ, prodQ, prodStatus, rentalQ, rentalStatus]);

  useEffect(() => { loadTab(tab); }, [tab]);

  /* ── Actions ──────────────────────────────────────────── */
  const approve  = async (id) => { try { await operatorAPI.approvePost(id); setPending(p => p.filter(x => x.id !== id)); ok("Tasdiqlandi"); } catch(e) { fail(e); } };
  const reject   = async (id, reason) => { try { await operatorAPI.rejectPost(id, reason); setPending(p => p.filter(x => x.id !== id)); setRejectTarget(null); ok("Rad etildi"); } catch(e) { fail(e); } };

  const block    = async (u) => {
    try {
      if (u.is_blocked) { await operatorAPI.unblockUser(u.id); ok("Blok ochildi"); }
      else              { await operatorAPI.blockUser(u.id);   ok("Bloklandi"); }
      setUsers(p => p.map(x => x.id === u.id ? { ...x, is_blocked: !x.is_blocked } : x));
    } catch(e) { fail(e); }
    setConfirmDlg(null);
  };
  const delUser  = async (id) => { try { await operatorAPI.deleteUser(id); setUsers(p => p.filter(x => x.id !== id)); ok("O'chirildi"); } catch(e) { fail(e); } setConfirmDlg(null); };

  const deposit  = async (u, amount) => {
    try { await operatorAPI.deposit(u.phone, amount); setDepositUser(null); ok(`${amount.toLocaleString()} so'm qo'shildi`); loadTab("users"); }
    catch(e) { fail(e); throw e; }
  };
  const withdraw = async (u, amount) => {
    try { await operatorAPI.withdraw(u.phone, amount); setWithdrawUser(null); ok(`${amount.toLocaleString()} so'm ayirildi`); loadTab("users"); }
    catch(e) { fail(e); throw e; }
  };

  const hideShow = async (p) => {
    try {
      if (p.status === "hidden") { await operatorAPI.showPost(p.id); setProds(ps => ps.map(x => x.id === p.id ? { ...x, status:"active" } : x)); ok("Ko'rsatildi"); }
      else                       { await operatorAPI.hidePost(p.id); setProds(ps => ps.map(x => x.id === p.id ? { ...x, status:"hidden" } : x)); ok("Yashirildi"); }
    } catch(e) { fail(e); }
    setConfirmDlg(null);
  };
  const delProd  = async (id) => { try { await operatorAPI.deletePost(id); setProds(p => p.filter(x => x.id !== id)); ok("O'chirildi"); } catch(e) { fail(e); } setConfirmDlg(null); };

  const confirmPay   = async (offerId) => { try { await operatorAPI.confirmPayment(offerId); setPayments(p => p.filter(x => x.offer_id !== offerId)); ok("To'lov tasdiqlandi!"); } catch(e) { fail(e); } setConfirmDlg(null); };
  const manualConfirm= async (offerId) => { try { await operatorAPI.manualConfirm(offerId); setPendingOffers(p => p.filter(x => x.offer_id !== offerId)); ok("Qo'lda tasdiqlandi!"); } catch(e) { fail(e); } setConfirmDlg(null); };

  const togglePay = async (p) => {
    try {
      await operatorAPI.togglePayment(p.id);
      const newStatus = p.status === "pending_payment" ? "active" : "pending_payment";
      setProds(ps => ps.map(x => x.id === p.id ? { ...x, status: newStatus } : x));
      ok(newStatus === "active" ? "Faollashtirildi" : "To'lov kutish holatiga qaytarildi");
    } catch(e) { fail(e); }
  };

  const editProd = async (id, body) => {
    try {
      await operatorAPI.editPost(id, body);
      setProds(ps => ps.map(x => x.id === id ? { ...x, ...body } : x));
      setEditTarget(null);
      ok("Yangilandi");
    } catch(e) { fail(e); throw e; }
  };

  const addOp    = async (ident) => { try { await operatorAPI.addOperator(ident); setAddOpDlg(false); ok("Operator qo'shildi"); loadTab("operators"); } catch(e) { fail(e); throw e; } };
  const removeOp = async (id)    => { try { await operatorAPI.removeOperator(id); setOperators(p => p.filter(x => x.id !== id)); ok("Olib tashlandi"); } catch(e) { fail(e); } setConfirmDlg(null); };

  /* ── Rental actions ──────────────────────────────────────── */
  const approveRental = async (id) => {
    try { await operatorAPI.approveRental(id); setRentals(ps => ps.map(x => x.id === id ? { ...x, status:"active" } : x)); ok("Tasdiqlandi"); }
    catch(e) { fail(e); }
  };
  const rejectRental = async (id) => {
    try { await operatorAPI.rejectRental(id); setRentals(ps => ps.filter(x => x.id !== id)); ok("Rad etildi"); }
    catch(e) { fail(e); }
    setConfirmDlg(null);
  };
  const hideShowRental = async (r) => {
    try {
      if (r.status === "hidden") { await operatorAPI.showRental(r.id); setRentals(ps => ps.map(x => x.id === r.id ? { ...x, status:"active" } : x)); ok("Ko'rsatildi"); }
      else                       { await operatorAPI.hideRental(r.id); setRentals(ps => ps.map(x => x.id === r.id ? { ...x, status:"hidden" } : x)); ok("Yashirildi"); }
    } catch(e) { fail(e); }
    setConfirmDlg(null);
  };
  const deleteRental = async (id) => {
    try { await operatorAPI.deleteRental(id); setRentals(ps => ps.filter(x => x.id !== id)); ok("O'chirildi"); }
    catch(e) { fail(e); }
    setConfirmDlg(null);
  };
  const cancelRentalBooking = async (id) => {
    try {
      await operatorAPI.cancelRentalBooking(id);
      setRentalBookings(ps => ps.filter(x => x.id !== id));
      ok("Bron bekor qilindi, hisobi qaytarildi");
    } catch(e) { fail(e); }
    setConfirmDlg(null);
  };

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div style={{ minHeight:"100vh", background:"#F8F9FA", maxWidth:430, margin:"0 auto",
                  fontFamily:"'Nunito','Segoe UI',sans-serif", paddingBottom:24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
                      background:"#1C1C1E", color:"white", padding:"9px 16px", borderRadius:12,
                      fontSize:13, fontWeight:700, zIndex:1000, whiteSpace:"nowrap",
                      boxShadow:"0 4px 20px rgba(0,0,0,0.25)" }}>
          {toast}
        </div>
      )}

      {/* Modals */}
      {confirmDlg?.type === "del-user"        && <Confirm title="Foydalanuvchini o'chirish" msg={`"${confirmDlg.d.name}" ni o'chirasizmi?`} onOk={() => delUser(confirmDlg.d.id)} onCancel={() => setConfirmDlg(null)} />}
      {confirmDlg?.type === "block-user"      && <Confirm title={confirmDlg.d.is_blocked ? "Blokni ochish" : "Bloklash"} msg={`${confirmDlg.d.name}?`} okColor={confirmDlg.d.is_blocked ? C.primaryDark : C.danger} onOk={() => block(confirmDlg.d)} onCancel={() => setConfirmDlg(null)} />}
      {confirmDlg?.type === "del-prod"        && <Confirm title="Mahsulotni o'chirish" msg={`"${confirmDlg.d.name}"?`} onOk={() => delProd(confirmDlg.d.id)} onCancel={() => setConfirmDlg(null)} />}
      {confirmDlg?.type === "hide-prod"       && <Confirm title={confirmDlg.d.status==="hidden"?"Ko'rsatish":"Yashirish"} msg={`"${confirmDlg.d.name}"?`} okColor={confirmDlg.d.status==="hidden"?C.primaryDark:C.danger} onOk={() => hideShow(confirmDlg.d)} onCancel={() => setConfirmDlg(null)} />}
      {confirmDlg?.type === "confirm-pay"     && <Confirm title="To'lovni tasdiqlash" msg={`${confirmDlg.d.buyer_name} — ${fmtPrice(confirmDlg.d.amount)}`} okColor={C.primaryDark} onOk={() => confirmPay(confirmDlg.d.offer_id)} onCancel={() => setConfirmDlg(null)} />}
      {confirmDlg?.type === "manual-pay"      && <Confirm title="Qo'lda tasdiqlash" msg={`${confirmDlg.d.buyer_name} → ${confirmDlg.d.product_name} (${fmtPrice(confirmDlg.d.product_price)})`} okColor={C.primaryDark} onOk={() => manualConfirm(confirmDlg.d.offer_id)} onCancel={() => setConfirmDlg(null)} />}
      {confirmDlg?.type === "rem-op"          && <Confirm title="Operatorni o'chirish" msg={`"${confirmDlg.d.name}"?`} onOk={() => removeOp(confirmDlg.d.id)} onCancel={() => setConfirmDlg(null)} />}
      {confirmDlg?.type === "del-rental"      && <Confirm title="Arendani o'chirish" msg={`"${confirmDlg.d.name}"?`} onOk={() => deleteRental(confirmDlg.d.id)} onCancel={() => setConfirmDlg(null)} />}
      {confirmDlg?.type === "hide-rental"     && <Confirm title={confirmDlg.d.status==="hidden"?"Ko'rsatish":"Yashirish"} msg={`"${confirmDlg.d.name}"?`} okColor={confirmDlg.d.status==="hidden"?C.primaryDark:C.danger} onOk={() => hideShowRental(confirmDlg.d)} onCancel={() => setConfirmDlg(null)} />}
      {confirmDlg?.type === "reject-rental"   && <Confirm title="Rad etish" msg={`"${confirmDlg.d.name}"?`} onOk={() => rejectRental(confirmDlg.d.id)} onCancel={() => setConfirmDlg(null)} />}
      {confirmDlg?.type === "cancel-booking"  && <Confirm title="Bronni bekor qilish" msg={`${confirmDlg.d.renter_name} bronini bekor qilasizmi? To'lov qaytariladi.`} onOk={() => cancelRentalBooking(confirmDlg.d.id)} onCancel={() => setConfirmDlg(null)} />}
      {rejectTarget && <RejectModal onOk={(r) => reject(rejectTarget, r)} onCancel={() => setRejectTarget(null)} />}
      {depositUser  && <AmountModal title="Pul qo'shish"  Icon={PlusCircle}  iconColor={C.primaryDark} user={depositUser}  onOk={(a) => deposit(depositUser, a)}  onCancel={() => setDepositUser(null)} />}
      {withdrawUser && <AmountModal title="Pul ayirish"   Icon={MinusCircle} iconColor={C.danger}      user={withdrawUser} onOk={(a) => withdraw(withdrawUser, a)} onCancel={() => setWithdrawUser(null)} maxAmount={Number(withdrawUser.balance || 0)} />}
      {addOpDlg     && <AddOpModal onOk={addOp} onCancel={() => setAddOpDlg(false)} />}
      {editTarget   && <EditPostModal post={editTarget} onOk={(body) => editProd(editTarget.id, body)} onCancel={() => setEditTarget(null)} />}

      {/* Header */}
      <div style={{ background:"white", borderBottom:`1px solid ${C.border}`,
                    padding:"14px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: stats ? 12 : 0 }}>
          <button onClick={onBack}
            style={{ background:"none", border:"none", cursor:"pointer", padding:4,
                     display:"flex", color:C.textSub }}>
            <ChevronLeft size={22} />
          </button>
          <div style={{ fontSize:16, fontWeight:900, color:C.text, flex:1 }}>Operator Panel</div>
          <button onClick={() => loadTab(tab)}
            style={{ background:"none", border:"none", cursor:"pointer", padding:4,
                     display:"flex", color:C.textSub }}>
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display:"flex", gap:6 }}>
            {[
              [Users,      stats.total_users,     "Foydalanuvchi"],
              [Package,    stats.active_products,  "Faol post"],
              [Clock,      stats.pending_approval, "Navbatda"],
              [CreditCard, stats.pending_payments, "To'lov"],
            ].map(([Icon, val, lbl]) => (
              <div key={lbl} style={{ flex:1, background:"#F8F9FA", borderRadius:10,
                                      padding:"8px 6px", textAlign:"center" }}>
                <Icon size={14} color={C.primaryDark} style={{ marginBottom:2 }} />
                <div style={{ fontSize:15, fontWeight:900, color:C.text }}>{val || 0}</div>
                <div style={{ fontSize:9, color:C.textMuted }}>{lbl}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", background:"white", borderBottom:`1px solid ${C.border}`,
                    position:"sticky", top:0, zIndex:10 }}>
        {visibleTabs.map(({ key, Icon, label }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex:1, padding:"10px 2px", border:"none", background:"transparent",
                     cursor:"pointer", fontFamily:"inherit", fontSize:9, fontWeight:700,
                     color: tab===key ? C.primaryDark : C.textMuted,
                     borderBottom: `2.5px solid ${tab===key ? C.primaryDark : "transparent"}`,
                     display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                     position:"relative", transition:"color .15s" }}>
            <Icon size={17} />
            {label}
            {key==="approval" && pending.length > 0 && (
              <div style={{ position:"absolute", top:6, right:"calc(50% - 14px)",
                            background:C.danger, color:"white", borderRadius:"50%",
                            width:14, height:14, fontSize:8, fontWeight:900,
                            display:"flex", alignItems:"center", justifyContent:"center" }}>
                {pending.length}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:"12px 14px 0" }}>
        {err && (
          <div style={{ background:"#FFF1F0", borderRadius:10, padding:"10px 13px",
                        fontSize:12, color:C.danger, marginBottom:12 }}>
            {err}
          </div>
        )}
        {loading && (
          <div style={{ display:"flex", justifyContent:"center", padding:48 }}>
            <Loader2 size={28} color={C.primaryDark} style={{ animation:"spin 1s linear infinite" }} />
          </div>
        )}

        {/* ── TASDIQLASH ─────────────────────────────── */}
        {!loading && tab === "approval" && (
          <div>
            {pending.length === 0 ? (
              <EmptyState Icon={CheckCircle} text="Barcha postlar ko'rib chiqildi" />
            ) : pending.map(p => (
              <div key={p.id} style={{ background:"white", borderRadius:12, marginBottom:10,
                                       border:`1px solid ${C.border}`, overflow:"hidden" }}>
                {p.photos?.[0] && (
                  <img src={p.photos[0]} alt="" style={{ width:"100%", height:150, objectFit:"cover", display:"block" }} />
                )}
                <div style={{ padding:"12px 13px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:C.text, flex:1 }}>{p.name}</div>
                    <Badge status={p.status} />
                  </div>
                  <div style={{ fontSize:13, color:C.primaryDark, fontWeight:700, marginBottom:3 }}>
                    {fmtPrice(p.price)} / {p.unit}
                  </div>
                  <div style={{ fontSize:11, color:C.textSub }}>
                    {p.viloyat}{p.tuman?", "+p.tuman:""} · {p.qty} {p.unit}
                  </div>
                  <div style={{ fontSize:11, color:C.textMuted }}>
                    {p.ownerName} · {fmtPhone(p.ownerPhone)}{p.ownerTelegram?" · "+p.ownerTelegram:""}
                  </div>
                  <div style={{ display:"flex", gap:10, marginTop:3, marginBottom:10 }}>
                    <span style={{ fontSize:10, color:C.textMuted, display:"flex", alignItems:"center", gap:3 }}>
                      <Eye size={10} /> {p.view_count || 0} ko'rish
                    </span>
                    <span style={{ fontSize:10, color:C.textMuted, display:"flex", alignItems:"center", gap:3 }}>
                      <Heart size={10} /> {p.like_count || 0} like
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <Btn color="#28A869" onClick={() => approve(p.id)}>
                      <CheckCircle size={13}/> Tasdiqlash
                    </Btn>
                    <Btn color={C.danger} onClick={() => setRejectTarget(p.id)}>
                      <XCircle size={13}/> Rad etish
                    </Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FOYDALANUVCHILAR ───────────────────────── */}
        {!loading && tab === "users" && (
          <div>
            <SearchBar value={userQ} onChange={setUserQ} onSearch={() => loadTab("users")} />
            {users.length === 0 ? (
              <EmptyState Icon={Users} text="Foydalanuvchi topilmadi" />
            ) : users.map((u, i) => (
              <div key={u.id} style={{ background:"white", borderRadius:12, marginBottom:8,
                                       border:`1px solid ${u.is_blocked?"#FCA5A5":C.border}` }}>
                <div style={{ padding:"11px 13px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.text }}>{u.name}</div>
                    {u.is_blocked && <Badge status="hidden" />}
                  </div>
                  <div style={{ fontSize:11, color:C.textSub }}>{fmtPhone(u.phone)}</div>
                  {u.telegram && <div style={{ fontSize:11, color:"#0088CC" }}>{u.telegram}</div>}
                  <div style={{ fontSize:10, color:C.textMuted, marginTop:1, marginBottom:6,
                                display:"flex", gap:10 }}>
                    <span style={{ fontFamily:"monospace" }}>ID: {String(u.id).slice(0,8)}…</span>
                    <span><Wallet size={10} style={{ verticalAlign:"middle" }} /> {Number(u.balance||0).toLocaleString()} so'm</span>
                    {u.tg_chat_id
                      ? <span style={{ color:"#28A869" }}>✓ Bot</span>
                      : <span style={{ color:C.danger }}>Bot yo'q</span>}
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => setDepositUser(u)}
                      style={{ flex:1, padding:"6px 0", borderRadius:8, border:`1px solid #BBF7D0`,
                               background:"#F0FDF4", color:"#16A34A", fontSize:11, fontWeight:700, cursor:"pointer",
                               display:"flex", alignItems:"center", justifyContent:"center", gap:3 }}>
                      <PlusCircle size={12}/> Qo'sh
                    </button>
                    <button onClick={() => setWithdrawUser(u)}
                      style={{ flex:1, padding:"6px 0", borderRadius:8, border:`1px solid #FECACA`,
                               background:"#FEF2F2", color:"#DC2626", fontSize:11, fontWeight:700, cursor:"pointer",
                               display:"flex", alignItems:"center", justifyContent:"center", gap:3 }}>
                      <MinusCircle size={12}/> Ayir
                    </button>
                    <button onClick={() => setConfirmDlg({ type:"block-user", d:u })}
                      style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${C.border}`,
                               background:"white", cursor:"pointer",
                               color: u.is_blocked ? "#16A34A" : "#D97706" }}>
                      {u.is_blocked ? <Unlock size={14}/> : <Lock size={14}/>}
                    </button>
                    <button onClick={() => setConfirmDlg({ type:"del-user", d:u })}
                      style={{ padding:"6px 10px", borderRadius:8, border:"none",
                               background:"#FEF2F2", color:C.danger, cursor:"pointer" }}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MAHSULOTLAR ────────────────────────────── */}
        {!loading && tab === "products" && (
          <div>
            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              <SearchBar value={prodQ} onChange={setProdQ} onSearch={() => loadTab("products")} flex />
              <select value={prodStatus}
                onChange={e => { setProdStatus(e.target.value); loadTab("products"); }}
                style={{ padding:"8px 8px", borderRadius:10, border:`1.5px solid ${C.border}`,
                         fontSize:11, background:"white", color:C.text, cursor:"pointer" }}>
                <option value="">Barchasi</option>
                <option value="active">Faol</option>
                <option value="pending_approval">Tekshiruvda</option>
                <option value="pending_payment">To'lov kutmoqda</option>
                <option value="hidden">Yashirilgan</option>
              </select>
            </div>
            {prods.length === 0 ? (
              <EmptyState Icon={Package} text="Mahsulot topilmadi" />
            ) : prods.map(p => (
              <div key={p.id} style={{ background:"white", borderRadius:12, marginBottom:8,
                                       border:`1px solid ${C.border}`, padding:"11px 13px" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2, flexWrap:"wrap" }}>
                      <div style={{ fontSize:13, fontWeight:800, color:C.text, overflow:"hidden",
                                    textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160 }}>{p.name}</div>
                      <Badge status={p.status} />
                    </div>
                    <div style={{ fontSize:11, color:C.textSub }}>{fmtPrice(p.price)} · {p.viloyat}</div>
                    <div style={{ fontSize:11, color:C.textMuted }}>
                      {p.owner_name||"Noma'lum"} · {fmtPhone(p.owner_phone)}
                    </div>
                    {/* View / Like stats */}
                    <div style={{ display:"flex", gap:10, marginTop:4 }}>
                      <span style={{ fontSize:10, color:C.textMuted, display:"flex", alignItems:"center", gap:3 }}>
                        <Eye size={10} /> {p.view_count || 0}
                      </span>
                      <span style={{ fontSize:10, color:C.textMuted, display:"flex", alignItems:"center", gap:3 }}>
                        <Heart size={10} /> {p.like_count || 0}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {/* Edit */}
                    <button onClick={() => setEditTarget(p)}
                      style={{ padding:"5px 8px", borderRadius:7, border:"none",
                               background:"#EFF6FF", color:"#2563EB", cursor:"pointer",
                               display:"flex", alignItems:"center", gap:3, fontSize:10, fontWeight:700 }}>
                      <Pencil size={12}/> Tahrir
                    </button>
                    {/* Toggle payment */}
                    {(p.status === "pending_payment" || p.status === "active") && (
                      <button onClick={() => togglePay(p)}
                        style={{ padding:"5px 8px", borderRadius:7, border:"none",
                                 background: p.status==="pending_payment" ? "#F0FDF4" : "#FFFBEB",
                                 color: p.status==="pending_payment" ? "#16A34A" : "#D97706",
                                 cursor:"pointer", display:"flex", alignItems:"center", gap:3,
                                 fontSize:10, fontWeight:700 }}>
                        {p.status==="pending_payment"
                          ? <><ToggleRight size={12}/> Faol</>
                          : <><ToggleLeft size={12}/> To'lov</>
                        }
                      </button>
                    )}
                    {/* Hide/Show */}
                    <button onClick={() => setConfirmDlg({ type:"hide-prod", d:p })}
                      style={{ padding:"5px 8px", borderRadius:7, border:"none",
                               background: p.status==="hidden" ? "#F0FDF4" : "#F3F4F6",
                               color: p.status==="hidden" ? "#16A34A" : C.textSub,
                               cursor:"pointer", display:"flex", alignItems:"center", gap:3,
                               fontSize:10, fontWeight:700 }}>
                      {p.status==="hidden" ? <><Eye size={12}/> Ko'rsat</> : <><EyeOff size={12}/> Yashir</>}
                    </button>
                    {/* Delete */}
                    <button onClick={() => setConfirmDlg({ type:"del-prod", d:p })}
                      style={{ padding:"5px 8px", borderRadius:7, border:"none",
                               background:"#FEF2F2", color:C.danger, cursor:"pointer",
                               display:"flex", alignItems:"center", gap:3, fontSize:10, fontWeight:700 }}>
                      <Trash2 size={12}/> O'chir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ARENDA ─────────────────────────────────── */}
        {!loading && tab === "rentals" && (
          <div>
            {/* Sub-tabs */}
            <div style={{ display:"flex", background:"white", borderRadius:12, padding:3,
                          marginBottom:12, gap:3, border:`1px solid ${C.border}` }}>
              {[["listings","🏠 E'lonlar"], ["bookings","📅 Bronlar"]].map(([key, lbl]) => (
                <button key={key} onClick={() => setRentalSubTab(key)} style={{
                  flex:1, padding:"7px 0", borderRadius:9, border:"none", cursor:"pointer",
                  fontFamily:"inherit", fontSize:11, fontWeight:700,
                  background: rentalSubTab===key ? "#059669" : "transparent",
                  color: rentalSubTab===key ? "white" : C.textMuted,
                }}>{lbl}</button>
              ))}
            </div>

            {/* ── Rental listings ── */}
            {rentalSubTab === "listings" && (
              <div>
                <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                  <SearchBar value={rentalQ} onChange={setRentalQ} onSearch={() => loadTab("rentals")} flex />
                  <select value={rentalStatus}
                    onChange={e => { setRentalStatus(e.target.value); loadTab("rentals"); }}
                    style={{ padding:"8px 8px", borderRadius:10, border:`1.5px solid ${C.border}`,
                             fontSize:11, background:"white", color:C.text, cursor:"pointer" }}>
                    <option value="">Barchasi</option>
                    <option value="active">Faol</option>
                    <option value="pending_approval">Tekshiruvda</option>
                    <option value="hidden">Yashirilgan</option>
                  </select>
                </div>
                {rentals.length === 0 ? (
                  <EmptyState Icon={Home} text="Arenda e'lonlar yo'q" />
                ) : rentals.map(r => (
                  <div key={r.id} style={{ background:"white", borderRadius:12, marginBottom:8,
                                           border:`1px solid ${r.status==="pending_approval"?"#FDE68A":"#D1FAE5"}`,
                                           padding:"11px 13px" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2, flexWrap:"wrap" }}>
                          <div style={{ fontSize:13, fontWeight:800, color:C.text, overflow:"hidden",
                                        textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160 }}>{r.name}</div>
                          <Badge status={r.status} />
                        </div>
                        <div style={{ fontSize:11, color:"#059669", fontWeight:700 }}>
                          {fmtPrice(r.price_per_day)} / kun
                        </div>
                        <div style={{ fontSize:11, color:C.textSub }}>{r.viloyat}{r.tuman?`, ${r.tuman}`:""}</div>
                        <div style={{ fontSize:11, color:C.textMuted }}>
                          {r.owner_name||"—"} · {fmtPhone(r.owner_phone)}
                        </div>
                        <div style={{ display:"flex", gap:10, marginTop:3 }}>
                          <span style={{ fontSize:10, color:C.textMuted, display:"flex", alignItems:"center", gap:2 }}>
                            <Eye size={10} /> {r.view_count || 0}
                          </span>
                          <span style={{ fontSize:10, color:C.textMuted }}>
                            🗂 {r.category}
                          </span>
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        {r.status === "pending_approval" && (
                          <>
                            <button onClick={() => approveRental(r.id)}
                              style={{ padding:"5px 8px", borderRadius:7, border:"none",
                                       background:"#D1FAE5", color:"#059669", cursor:"pointer",
                                       fontSize:10, fontWeight:700, display:"flex", alignItems:"center", gap:3 }}>
                              <CheckCircle size={12}/> Tasdiqlash
                            </button>
                            <button onClick={() => setConfirmDlg({ type:"reject-rental", d:r })}
                              style={{ padding:"5px 8px", borderRadius:7, border:"none",
                                       background:"#FEF2F2", color:C.danger, cursor:"pointer",
                                       fontSize:10, fontWeight:700, display:"flex", alignItems:"center", gap:3 }}>
                              <XCircle size={12}/> Rad et
                            </button>
                          </>
                        )}
                        <button onClick={() => setConfirmDlg({ type:"hide-rental", d:r })}
                          style={{ padding:"5px 8px", borderRadius:7, border:"none",
                                   background: r.status==="hidden" ? "#D1FAE5" : "#F3F4F6",
                                   color: r.status==="hidden" ? "#059669" : C.textSub,
                                   cursor:"pointer", fontSize:10, fontWeight:700,
                                   display:"flex", alignItems:"center", gap:3 }}>
                          {r.status==="hidden" ? <><Eye size={12}/> Ko'rsat</> : <><EyeOff size={12}/> Yashir</>}
                        </button>
                        <button onClick={() => setConfirmDlg({ type:"del-rental", d:r })}
                          style={{ padding:"5px 8px", borderRadius:7, border:"none",
                                   background:"#FEF2F2", color:C.danger, cursor:"pointer",
                                   fontSize:10, fontWeight:700, display:"flex", alignItems:"center", gap:3 }}>
                          <Trash2 size={12}/> O'chir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Rental bookings ── */}
            {rentalSubTab === "bookings" && (
              <div>
                {rentalBookings.length === 0 ? (
                  <EmptyState Icon={Calendar} text="Hali bronlar yo'q" />
                ) : rentalBookings.map(b => (
                  <div key={b.id} style={{ background:"white", borderRadius:12, marginBottom:8,
                                           border:"1px solid #D1FAE5", padding:"11px 13px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                      <div style={{ fontSize:13, fontWeight:800, color:C.text, flex:1 }}>{b.rental_name}</div>
                      <span style={{ fontSize:9, padding:"2px 7px", borderRadius:6, fontWeight:700,
                                     background: b.status==="confirmed" ? "#D1FAE5" : "#FEF2F2",
                                     color: b.status==="confirmed" ? "#059669" : C.danger }}>
                        {b.status==="confirmed" ? "✓ Tasdiqlangan" : "Bekor"}
                      </span>
                    </div>
                    <div style={{ fontSize:11, color:C.textSub, marginBottom:3 }}>
                      📅 {b.start_date} → {b.end_date} ({b.total_days} kun)
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#059669", marginBottom:3 }}>
                      {fmtPrice(b.total_price)}
                      <span style={{ fontSize:10, fontWeight:400, color:C.textMuted, marginLeft:6 }}>
                        Xizmat haqi: {fmtPrice(b.fee)}
                      </span>
                    </div>
                    <div style={{ fontSize:11, color:C.textMuted }}>
                      Ijarachi: {b.renter_name} · {fmtPhone(b.renter_phone)}
                    </div>
                    <div style={{ fontSize:11, color:C.textMuted, marginBottom:6 }}>
                      Egasi: {b.owner_name} · {fmtPhone(b.owner_phone)}
                    </div>
                    {b.status === "confirmed" && (
                      <button onClick={() => setConfirmDlg({ type:"cancel-booking", d:b })}
                        style={{ padding:"6px 12px", borderRadius:8, border:"none",
                                 background:"#FEF2F2", color:C.danger, fontSize:11, fontWeight:700,
                                 cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                        <XCircle size={12}/> Bekor qilish
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TO'LOVLAR ──────────────────────────────── */}
        {!loading && tab === "payments" && (
          <div>
            {/* App tashqarisida to'langan offerlar */}
            {pendingOffers.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <SectionTitle>Telegram orqali to'langan</SectionTitle>
                {pendingOffers.map(o => (
                  <div key={o.offer_id} style={{ background:"white", borderRadius:12, marginBottom:8,
                                                  border:"1px solid #FDE68A", padding:"11px 13px" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:3 }}>{o.product_name}</div>
                    <div style={{ fontSize:12, color:C.primaryDark, fontWeight:700, marginBottom:6 }}>{fmtPrice(o.product_price)}</div>
                    <div style={{ fontSize:11, color:C.textSub }}>Xaridor: {o.buyer_name} · {fmtPhone(o.buyer_phone)}</div>
                    <div style={{ fontSize:11, color:C.textSub, marginBottom:8 }}>Sotuvchi: {o.seller_name} · {fmtPhone(o.seller_phone)}</div>
                    <Btn color="#D97706" onClick={() => setConfirmDlg({ type:"manual-pay", d:o })}>
                      <CheckCircle size={13}/> Qo'lda tasdiqlash
                    </Btn>
                  </div>
                ))}
              </div>
            )}

            {/* App orqali kelib qolgan to'lovlar */}
            {payments.length > 0 && (
              <div>
                <SectionTitle>App orqali to'lov</SectionTitle>
                {payments.map(p => (
                  <div key={p.id} style={{ background:"white", borderRadius:12, marginBottom:8,
                                           border:`1px solid ${C.border}`, padding:"11px 13px" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:3 }}>{p.product_name || "Mahsulot"}</div>
                    <div style={{ fontSize:13, color:C.primaryDark, fontWeight:700, marginBottom:6 }}>{fmtPrice(p.amount)}</div>
                    <div style={{ fontSize:11, color:C.textSub }}>Xaridor: {p.buyer_name} · {fmtPhone(p.buyer_phone)}</div>
                    <div style={{ fontSize:11, color:C.textSub, marginBottom: p.card_from ? 2 : 8 }}>
                      Sotuvchi: {p.seller_name} · {fmtPhone(p.seller_phone)}
                    </div>
                    {p.card_from && <div style={{ fontSize:11, color:C.textSub, marginBottom:8 }}>Karta: {p.card_from}</div>}
                    <Btn color="#28A869" onClick={() => setConfirmDlg({ type:"confirm-pay", d:p })}>
                      <CheckCircle size={13}/> Tasdiqlash
                    </Btn>
                  </div>
                ))}
              </div>
            )}

            {payments.length === 0 && pendingOffers.length === 0 && (
              <EmptyState Icon={CreditCard} text="Kutayotgan to'lov yo'q" />
            )}
          </div>
        )}

        {/* ── OPERATORLAR ────────────────────────────── */}
        {!loading && tab === "operators" && isMainOp && (
          <div>
            <button onClick={() => setAddOpDlg(true)}
              style={{ width:"100%", padding:"11px", borderRadius:12, border:"none",
                       background:C.primaryDark, color:"white", fontSize:13, fontWeight:800,
                       cursor:"pointer", display:"flex", alignItems:"center",
                       justifyContent:"center", gap:7, marginBottom:12 }}>
              <UserPlus size={16}/> Operator qo'shish
            </button>
            {operators.length === 0 ? (
              <EmptyState Icon={Shield} text="Hali operator yo'q" />
            ) : operators.map(op => {
              const isMain = phoneCore(op.phone) === "331350206";
              return (
                <div key={op.id} style={{ background:"white", borderRadius:12, marginBottom:8,
                                           border:`1px solid ${C.border}`, padding:"11px 13px",
                                           display:"flex", alignItems:"center", gap:10 }}>
                  <Shield size={18} color={C.primaryDark} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.text }}>{op.name}</div>
                    <div style={{ fontSize:11, color:C.textSub }}>{fmtPhone(op.phone)}</div>
                    <div style={{ fontSize:10, fontFamily:"monospace", color:C.textMuted }}>
                      ID: {String(op.id).slice(0,8)}…
                    </div>
                  </div>
                  {isMain
                    ? <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6,
                                     background:"#EFF6FF", color:"#2563EB", fontWeight:700 }}>Bosh</span>
                    : <button onClick={() => setConfirmDlg({ type:"rem-op", d:op })}
                        style={{ padding:"6px 10px", borderRadius:8, border:"none",
                                 background:"#FEF2F2", color:C.danger, cursor:"pointer" }}>
                        <UserMinus size={15}/>
                      </button>
                  }
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ Icon, text }) {
  return (
    <div style={{ textAlign:"center", padding:"48px 20px", color:C.textMuted }}>
      <Icon size={36} color={C.border} style={{ marginBottom:10 }} />
      <div style={{ fontSize:13, fontWeight:700 }}>{text}</div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, textTransform:"uppercase",
                  letterSpacing:0.5, marginBottom:8 }}>
      {children}
    </div>
  );
}

function SearchBar({ value, onChange, onSearch, flex }) {
  return (
    <div style={{ position:"relative", marginBottom:10, flex: flex ? 1 : undefined }}>
      <Search size={14} color={C.textMuted}
        style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }} />
      <input value={value} onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key==="Enter" && onSearch()}
        placeholder="Qidirish..."
        style={{ width:"100%", boxSizing:"border-box", padding:"9px 11px 9px 33px",
                 borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:13,
                 background:"white", color:C.text, outline:"none", fontFamily:"inherit" }} />
    </div>
  );
}
