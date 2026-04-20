import { useState, useEffect, useCallback } from "react";
import { C } from "../constants";
import { operatorAPI } from "../services/api";
import {
  Search, Trash2, Users, Package, ChevronLeft,
  Loader2, CheckCircle, XCircle, EyeOff, Eye,
  Lock, Unlock, Clock, CreditCard, CheckSquare,
  AlertTriangle, RefreshCw, PlusCircle, MinusCircle,
  Shield, UserPlus, UserMinus, Wallet,
} from "lucide-react";

const phoneCore = (v) => {
  const d = String(v || "").replace(/\D/g, "");
  return d.startsWith("998") ? d.slice(-9) : d.slice(-9);
};
const fmtPhone = (v) => {
  const c = phoneCore(v);
  if (c.length !== 9) return v || "—";
  return `+998 ${c.slice(0,2)} ${c.slice(2,5)} ${c.slice(5,7)} ${c.slice(7,9)}`;
};
const fmtPrice = (n) => Number(n || 0).toLocaleString("uz-UZ") + " so'm";

function StatusBadge({ status }) {
  const map = {
    active:           { bg:"#E8F8F0", color:"#28A869", label:"Faol" },
    pending_approval: { bg:"#FFFBEB", color:"#D97706", label:"Tekshiruvda" },
    pending_payment:  { bg:"#EFF6FF", color:"#2563EB", label:"To'lov kutmoqda" },
    hidden:           { bg:"#F3F4F6", color:"#6B7280", label:"Yashirilgan" },
    deleted:          { bg:"#FFF1F0", color:"#EF4444", label:"O'chirilgan" },
  };
  const s = map[status] || { bg:"#F3F4F6", color:"#6B7280", label: status };
  return (
    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:8,
                   background:s.bg, color:s.color, fontWeight:700,
                   display:"inline-block", whiteSpace:"nowrap" }}>
      {s.label}
    </span>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
                  zIndex:999, display:"flex", alignItems:"center", justifyContent:"center",
                  padding:"0 20px" }}>
      <div style={{ background:"white", borderRadius:20, padding:"24px 20px",
                    width:"100%", maxWidth:360, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <AlertTriangle size={22} color={danger ? C.danger : C.primaryDark} />
          <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{title}</div>
        </div>
        <div style={{ fontSize:13, color:C.textSub, marginBottom:20, lineHeight:1.5 }}>{message}</div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:"10px 0", borderRadius:12, border:`1.5px solid ${C.border}`,
                     background:"white", color:C.text, fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Bekor
          </button>
          <button onClick={onConfirm}
            style={{ flex:1, padding:"10px 0", borderRadius:12, border:"none",
                     background: danger ? C.danger : C.primaryDark,
                     color:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Tasdiqlash
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectDialog({ onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
                  zIndex:999, display:"flex", alignItems:"center", justifyContent:"center",
                  padding:"0 20px" }}>
      <div style={{ background:"white", borderRadius:20, padding:"24px 20px",
                    width:"100%", maxWidth:360 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:16, fontWeight:800, marginBottom:12, color:C.text }}>
          <XCircle size={20} color={C.danger} /> Rad etish sababi
        </div>
        <textarea
          value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Masalan: narx to'g'ri emas, rasm sifatsiz..."
          rows={3}
          style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px",
                   borderRadius:12, border:`1.5px solid ${C.border}`, fontSize:13,
                   fontFamily:"inherit", resize:"none", outline:"none", marginBottom:16 }}
        />
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:"10px 0", borderRadius:12, border:`1.5px solid ${C.border}`,
                     background:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Bekor
          </button>
          <button onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            style={{ flex:1, padding:"10px 0", borderRadius:12, border:"none",
                     background: reason.trim() ? C.danger : C.textMuted,
                     color:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Rad et
          </button>
        </div>
      </div>
    </div>
  );
}

function AmountDialog({ title, Icon, iconColor, user, onConfirm, onCancel, maxAmount }) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (!(Number(amount) > 0) || busy) return;
    if (maxAmount !== undefined && Number(amount) > maxAmount) return;
    setBusy(true);
    try { await onConfirm(Number(amount)); }
    catch { setBusy(false); }
  };

  const valid = Number(amount) > 0 && (maxAmount === undefined || Number(amount) <= maxAmount);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
                  zIndex:999, display:"flex", alignItems:"center", justifyContent:"center",
                  padding:"0 20px" }}>
      <div style={{ background:"white", borderRadius:20, padding:"24px 20px",
                    width:"100%", maxWidth:360 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <Icon size={20} color={iconColor} />
          <div style={{ fontSize:16, fontWeight:800, color:C.text }}>{title}</div>
        </div>
        <div style={{ fontSize:12, color:C.textMuted, marginBottom:16 }}>
          {fmtPhone(user.phone)} — {user.name}
          {maxAmount !== undefined && (
            <span style={{ marginLeft:8, color:C.danger }}>Balans: {fmtPrice(maxAmount)}</span>
          )}
        </div>
        <input
          type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="Summa (so'm)" autoFocus
          style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px",
                   borderRadius:12, border:`1.5px solid ${C.border}`, fontSize:14,
                   fontFamily:"inherit", outline:"none", marginBottom:16 }}
        />
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:"10px 0", borderRadius:12, border:`1.5px solid ${C.border}`,
                     background:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Bekor
          </button>
          <button onClick={handleConfirm} disabled={!valid || busy}
            style={{ flex:1, padding:"10px 0", borderRadius:12, border:"none",
                     background: (valid && !busy) ? iconColor : C.textMuted,
                     color:"white", fontSize:13, fontWeight:700, cursor:"pointer",
                     display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            {busy ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> : <Icon size={14} />}
            Tasdiqlash
          </button>
        </div>
      </div>
    </div>
  );
}

function AddOperatorDialog({ onConfirm, onCancel }) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (!phone.trim() || busy) return;
    setBusy(true);
    try { await onConfirm(phone.trim()); }
    catch { setBusy(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
                  zIndex:999, display:"flex", alignItems:"center", justifyContent:"center",
                  padding:"0 20px" }}>
      <div style={{ background:"white", borderRadius:20, padding:"24px 20px", width:"100%", maxWidth:360 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:16, fontWeight:800, marginBottom:12, color:C.text }}>
          <UserPlus size={20} color={C.primaryDark} /> Operator qo'shish
        </div>
        <div style={{ fontSize:12, color:C.textMuted, marginBottom:12 }}>
          Foydalanuvchining telefon raqamini kiriting:
        </div>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="901234567" autoFocus
          style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px",
                   borderRadius:12, border:`1.5px solid ${C.border}`, fontSize:14,
                   fontFamily:"inherit", outline:"none", marginBottom:16 }} />
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel}
            style={{ flex:1, padding:"10px 0", borderRadius:12, border:`1.5px solid ${C.border}`,
                     background:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Bekor
          </button>
          <button onClick={handleConfirm} disabled={!phone.trim() || busy}
            style={{ flex:1, padding:"10px 0", borderRadius:12, border:"none",
                     background: phone.trim() && !busy ? C.primaryDark : C.textMuted,
                     color:"white", fontSize:13, fontWeight:700, cursor:"pointer",
                     display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            {busy ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> : <UserPlus size={14} />}
            Qo'shish
          </button>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: "approval",  Icon: CheckSquare, label: "Tasdiqlash" },
  { key: "users",     Icon: Users,       label: "Foydalanuvchilar" },
  { key: "products",  Icon: Package,     label: "Mahsulotlar" },
  { key: "payments",  Icon: CreditCard,  label: "To'lovlar" },
  { key: "operators", Icon: Shield,      label: "Operatorlar" },
];

export default function OperatorPage({ onBack, user }) {
  const isMainOp = (user?.phone || "").replace(/\D/g,"").slice(-9) === "331350206";
  const visibleTabs = isMainOp ? TABS : TABS.filter(t => t.key !== "operators");

  const [tab,        setTab]        = useState("approval");
  const [loading,    setLoading]    = useState(false);
  const [err,        setErr]        = useState("");
  const [toast,      setToast]      = useState("");

  const [pending,    setPending]    = useState([]);
  const [rejectTarget, setRejectTarget] = useState(null);

  const [users,      setUsers]      = useState([]);
  const [userQ,      setUserQ]      = useState("");
  const [confirmDlg, setConfirmDlg] = useState(null);
  const [depositUser, setDepositUser] = useState(null);
  const [withdrawUser, setWithdrawUser] = useState(null);

  const [prods,      setProds]      = useState([]);
  const [prodQ,      setProdQ]      = useState("");
  const [prodStatus, setProdStatus] = useState("");

  const [payments,   setPayments]   = useState([]);

  const [operators,  setOperators]  = useState([]);
  const [addOpDlg,   setAddOpDlg]   = useState(false);

  const [stats,      setStats]      = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  const loadTab = useCallback(async (t = tab) => {
    setLoading(true);
    setErr("");
    try {
      if (t === "approval") {
        const [data, statsData] = await Promise.all([
          operatorAPI.getPendingPosts(),
          operatorAPI.getStats().catch(() => null),
        ]);
        setPending(data);
        if (statsData) setStats(statsData);
      } else if (t === "users") {
        const data = await operatorAPI.getUsers(userQ);
        setUsers(data);
      } else if (t === "products") {
        const data = await operatorAPI.getProducts(prodQ, prodStatus);
        setProds(data);
      } else if (t === "payments") {
        const data = await operatorAPI.getPayments();
        setPayments(data);
      } else if (t === "operators") {
        const data = await operatorAPI.getOperators();
        setOperators(data);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, userQ, prodQ, prodStatus]);

  useEffect(() => { loadTab(tab); }, [tab]);

  const handleApprove = async (id) => {
    try {
      await operatorAPI.approvePost(id);
      setPending(prev => prev.filter(p => p.id !== id));
      showToast("Tasdiqlandi!");
    } catch (e) { showToast("Xato: " + e.message); }
  };

  const handleReject = async (id, reason) => {
    try {
      await operatorAPI.rejectPost(id, reason);
      setPending(prev => prev.filter(p => p.id !== id));
      setRejectTarget(null);
      showToast("Rad etildi");
    } catch (e) { showToast("Xato: " + e.message); }
  };

  const handleBlock = async (u) => {
    try {
      if (u.is_blocked) {
        await operatorAPI.unblockUser(u.id);
        showToast("Blok ochildi");
      } else {
        await operatorAPI.blockUser(u.id);
        showToast("Bloklandi");
      }
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_blocked: !x.is_blocked } : x));
    } catch (e) { showToast("Xato: " + e.message); }
    setConfirmDlg(null);
  };

  const handleDeleteUser = async (id) => {
    try {
      await operatorAPI.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast("O'chirildi");
    } catch (e) { showToast("Xato: " + e.message); }
    setConfirmDlg(null);
  };

  const handleDeposit = async (u, amount) => {
    await operatorAPI.deposit(u.phone, amount);
    setDepositUser(null);
    showToast(`${amount.toLocaleString()} so'm qo'shildi`);
    loadTab("users");
  };

  const handleWithdraw = async (u, amount) => {
    await operatorAPI.withdraw(u.phone, amount);
    setWithdrawUser(null);
    showToast(`${amount.toLocaleString()} so'm ayirildi`);
    loadTab("users");
  };

  const handleHideShow = async (p) => {
    try {
      if (p.status === "hidden") {
        await operatorAPI.showPost(p.id);
        setProds(prev => prev.map(x => x.id === p.id ? { ...x, status: "active" } : x));
        showToast("Ko'rsatildi");
      } else {
        await operatorAPI.hidePost(p.id);
        setProds(prev => prev.map(x => x.id === p.id ? { ...x, status: "hidden" } : x));
        showToast("Yashirildi");
      }
    } catch (e) { showToast("Xato: " + e.message); }
    setConfirmDlg(null);
  };

  const handleDeleteProd = async (id) => {
    try {
      await operatorAPI.deletePost(id);
      setProds(prev => prev.filter(p => p.id !== id));
      showToast("O'chirildi");
    } catch (e) { showToast("Xato: " + e.message); }
    setConfirmDlg(null);
  };

  const handleConfirmPayment = async (offerId) => {
    try {
      await operatorAPI.confirmPayment(offerId);
      setPayments(prev => prev.filter(p => p.offer_id !== offerId));
      showToast("To'lov tasdiqlandi, bitim yakunlandi!");
    } catch (e) { showToast("Xato: " + e.message); }
    setConfirmDlg(null);
  };

  const handleAddOperator = async (phone) => {
    await operatorAPI.addOperator(phone);
    setAddOpDlg(false);
    showToast("Operator qo'shildi");
    loadTab("operators");
  };

  const handleRemoveOperator = async (id) => {
    try {
      await operatorAPI.removeOperator(id);
      setOperators(prev => prev.filter(o => o.id !== id));
      showToast("Operator o'chirildi");
    } catch (e) { showToast("Xato: " + e.message); }
    setConfirmDlg(null);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, maxWidth:430, margin:"0 auto",
                  fontFamily:"'Nunito','Segoe UI',sans-serif", paddingBottom:20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {toast && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)",
                      background:"#1C1C1E", color:"white", padding:"10px 18px",
                      borderRadius:14, fontSize:13, fontWeight:700, zIndex:1000,
                      boxShadow:"0 8px 24px rgba(0,0,0,0.25)", whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}

      {confirmDlg?.type === "delete-user" && (
        <ConfirmDialog
          title="Foydalanuvchini o'chirish"
          message={`"${confirmDlg.data.name}" ni o'chirishni tasdiqlaysizmi?`}
          onConfirm={() => handleDeleteUser(confirmDlg.data.id)}
          onCancel={() => setConfirmDlg(null)}
        />
      )}
      {confirmDlg?.type === "block-user" && (
        <ConfirmDialog
          title={confirmDlg.data.is_blocked ? "Blokni ochish" : "Bloklash"}
          message={`${confirmDlg.data.name} (${fmtPhone(confirmDlg.data.phone)})?`}
          danger={!confirmDlg.data.is_blocked}
          onConfirm={() => handleBlock(confirmDlg.data)}
          onCancel={() => setConfirmDlg(null)}
        />
      )}
      {confirmDlg?.type === "delete-prod" && (
        <ConfirmDialog
          title="Mahsulotni o'chirish"
          message={`"${confirmDlg.data.name}" ni o'chirishni tasdiqlaysizmi?`}
          onConfirm={() => handleDeleteProd(confirmDlg.data.id)}
          onCancel={() => setConfirmDlg(null)}
        />
      )}
      {confirmDlg?.type === "hide-prod" && (
        <ConfirmDialog
          title={confirmDlg.data.status === "hidden" ? "Ko'rsatish" : "Yashirish"}
          message={`"${confirmDlg.data.name}"?`}
          danger={confirmDlg.data.status !== "hidden"}
          onConfirm={() => handleHideShow(confirmDlg.data)}
          onCancel={() => setConfirmDlg(null)}
        />
      )}
      {confirmDlg?.type === "confirm-payment" && (
        <ConfirmDialog
          title="To'lovni tasdiqlash"
          message={`${confirmDlg.data.buyer_name} tomonidan ${fmtPrice(confirmDlg.data.amount)} tasdiqlandi?`}
          danger={false}
          onConfirm={() => handleConfirmPayment(confirmDlg.data.offer_id)}
          onCancel={() => setConfirmDlg(null)}
        />
      )}
      {confirmDlg?.type === "remove-operator" && (
        <ConfirmDialog
          title="Operatorni o'chirish"
          message={`"${confirmDlg.data.name}" operatorligini bekor qilasizmi?`}
          onConfirm={() => handleRemoveOperator(confirmDlg.data.id)}
          onCancel={() => setConfirmDlg(null)}
        />
      )}
      {rejectTarget && (
        <RejectDialog
          onConfirm={(reason) => handleReject(rejectTarget, reason)}
          onCancel={() => setRejectTarget(null)}
        />
      )}
      {depositUser && (
        <AmountDialog
          title="Pul qo'shish" Icon={PlusCircle} iconColor={C.primaryDark}
          user={depositUser}
          onConfirm={(amount) => handleDeposit(depositUser, amount)}
          onCancel={() => setDepositUser(null)}
        />
      )}
      {withdrawUser && (
        <AmountDialog
          title="Pul ayirish" Icon={MinusCircle} iconColor={C.danger}
          user={withdrawUser}
          maxAmount={Number(withdrawUser.balance || 0)}
          onConfirm={(amount) => handleWithdraw(withdrawUser, amount)}
          onCancel={() => setWithdrawUser(null)}
        />
      )}
      {addOpDlg && (
        <AddOperatorDialog
          onConfirm={handleAddOperator}
          onCancel={() => setAddOpDlg(false)}
        />
      )}

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                    padding:"18px 16px 14px", color:"white" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
          <button onClick={onBack}
            style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"white",
                     borderRadius:10, padding:"6px 10px", cursor:"pointer", display:"flex" }}>
            <ChevronLeft size={18} />
          </button>
          <div style={{ fontSize:18, fontWeight:900 }}>Operator Panel</div>
          <button onClick={() => loadTab(tab)}
            style={{ marginLeft:"auto", background:"rgba(255,255,255,0.2)", border:"none",
                     color:"white", borderRadius:10, padding:"6px 10px", cursor:"pointer", display:"flex" }}>
            <RefreshCw size={16} />
          </button>
        </div>

        {stats && (
          <div style={{ display:"flex", gap:8 }}>
            {[
              [Users, stats.total_users, "Foydalanuvchi"],
              [Package, stats.active_products, "Faol post"],
              [Clock, stats.pending_approval, "Navbatda"],
              [CreditCard, stats.pending_payments, "To'lov"],
            ].map(([Icon, val, lbl]) => (
              <div key={lbl} style={{ flex:1, background:"rgba(255,255,255,0.18)",
                                      borderRadius:10, padding:"6px 4px", textAlign:"center" }}>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:2 }}>
                  <Icon size={14} color="white" />
                </div>
                <div style={{ fontSize:14, fontWeight:900 }}>{val || 0}</div>
                <div style={{ fontSize:8, opacity:0.85 }}>{lbl}</div>
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
            style={{ flex:1, padding:"10px 4px", border:"none", background:"transparent",
                     cursor:"pointer", fontFamily:"inherit", fontSize:9, fontWeight:700,
                     color: tab===key ? C.primaryDark : C.textMuted,
                     borderBottom: tab===key ? `2.5px solid ${C.primaryDark}` : "2.5px solid transparent",
                     display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                     transition:"all .15s" }}>
            <Icon size={18} color={tab===key ? C.primaryDark : C.textMuted} />
            {label}
            {key==="approval" && pending.length > 0 && (
              <span style={{ background:C.danger, color:"white", borderRadius:"50%",
                             width:16, height:16, fontSize:9, fontWeight:900,
                             display:"flex", alignItems:"center", justifyContent:"center",
                             marginTop:1 }}>{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding:"14px 14px 0" }}>
        {err && (
          <div style={{ background:"#FFF1F0", border:`1px solid ${C.danger}`, borderRadius:12,
                        padding:"10px 14px", fontSize:12, color:C.danger, marginBottom:12 }}>
            {err}
          </div>
        )}
        {loading && (
          <div style={{ display:"flex", justifyContent:"center", padding:40 }}>
            <Loader2 size={28} color={C.primaryDark} style={{ animation:"spin 1s linear infinite" }} />
          </div>
        )}

        {/* TASDIQLASH */}
        {!loading && tab === "approval" && (
          <div>
            {pending.length === 0 ? (
              <div style={{ textAlign:"center", padding:"50px 20px", color:C.textMuted }}>
                <CheckCircle size={40} color="#28A869" style={{ marginBottom:10 }} />
                <div style={{ fontSize:14, fontWeight:700 }}>Barcha postlar ko'rib chiqildi</div>
              </div>
            ) : pending.map(p => (
              <div key={p.id} style={{ background:"white", borderRadius:16,
                                       border:`1px solid ${C.border}`, marginBottom:12,
                                       overflow:"hidden", boxShadow:C.shadow }}>
                {p.photos?.[0] && (
                  <img src={p.photos[0]} alt="" style={{ width:"100%", height:160,
                                                          objectFit:"cover", display:"block" }} />
                )}
                <div style={{ padding:"12px 14px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:C.text, flex:1 }}>{p.name}</div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.primaryDark, marginBottom:4 }}>
                    {fmtPrice(p.price)} / {p.unit}
                  </div>
                  <div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>
                    {p.viloyat}{p.tuman ? ", "+p.tuman : ""} · {p.qty} {p.unit}
                  </div>
                  <div style={{ fontSize:11, color:C.textSub, marginBottom:10 }}>
                    {p.ownerName} · {fmtPhone(p.ownerPhone)}
                    {p.ownerTelegram && ` · ${p.ownerTelegram}`}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => handleApprove(p.id)}
                      style={{ flex:1, padding:"9px 0", borderRadius:11, border:"none",
                               background:"#E8F8F0", color:"#28A869", fontSize:12,
                               fontWeight:800, cursor:"pointer", display:"flex",
                               alignItems:"center", justifyContent:"center", gap:5 }}>
                      <CheckCircle size={14} /> Tasdiqlash
                    </button>
                    <button onClick={() => setRejectTarget(p.id)}
                      style={{ flex:1, padding:"9px 0", borderRadius:11, border:"none",
                               background:"#FFF1F0", color:C.danger, fontSize:12,
                               fontWeight:800, cursor:"pointer", display:"flex",
                               alignItems:"center", justifyContent:"center", gap:5 }}>
                      <XCircle size={14} /> Rad etish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FOYDALANUVCHILAR */}
        {!loading && tab === "users" && (
          <div>
            <div style={{ position:"relative", marginBottom:12 }}>
              <Search size={15} color={C.textMuted}
                style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
              <input value={userQ} onChange={e => setUserQ(e.target.value)}
                onKeyDown={e => e.key==="Enter" && loadTab("users")}
                placeholder="Telefon, ism yoki ID..."
                style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px 10px 36px",
                         borderRadius:12, border:`1.5px solid ${C.border}`, fontSize:13,
                         background:C.bg, color:C.text, outline:"none", fontFamily:"inherit" }} />
            </div>

            {users.map(u => (
              <div key={u.id} style={{ background:"white", borderRadius:14,
                                       border:`1px solid ${u.is_blocked ? "#FCA5A5" : C.border}`,
                                       padding:"12px 14px", marginBottom:10,
                                       opacity: u.is_blocked ? 0.75 : 1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:C.text }}>{u.name}</div>
                  {u.is_blocked && (
                    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:8,
                                   background:"#FFF1F0", color:C.danger, fontWeight:700 }}>Bloklangan</span>
                  )}
                </div>
                <div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>{fmtPhone(u.phone)}</div>
                {u.telegram && <div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>{u.telegram}</div>}
                <div style={{ fontSize:11, color:C.textSub, marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
                  <Wallet size={12} color={C.textMuted} />
                  {Number(u.balance || 0).toLocaleString()} so'm
                  {u.tg_chat_id
                    ? <><CheckCircle size={12} color="#28A869" /> Bot</>
                    : <><XCircle size={12} color={C.danger} /> Bot yo'q</>}
                </div>
                <div style={{ display:"flex", gap:7 }}>
                  <button onClick={() => setDepositUser(u)}
                    style={{ flex:1, padding:"7px 0", borderRadius:10, border:`1.5px solid ${C.primaryBorder || C.border}`,
                             background:"#E8F8F0", color:"#28A869", fontSize:11,
                             fontWeight:700, cursor:"pointer", display:"flex",
                             alignItems:"center", justifyContent:"center", gap:4 }}>
                    <PlusCircle size={13} /> Qo'shish
                  </button>
                  <button onClick={() => setWithdrawUser(u)}
                    style={{ flex:1, padding:"7px 0", borderRadius:10, border:`1.5px solid #FCA5A5`,
                             background:"#FFF1F0", color:C.danger, fontSize:11,
                             fontWeight:700, cursor:"pointer", display:"flex",
                             alignItems:"center", justifyContent:"center", gap:4 }}>
                    <MinusCircle size={13} /> Ayirish
                  </button>
                  <button onClick={() => setConfirmDlg({ type:"block-user", data:u })}
                    style={{ padding:"7px 10px", borderRadius:10, border:"none",
                             background: u.is_blocked ? "#E8F8F0" : "#FFF8E6",
                             color: u.is_blocked ? "#28A869" : "#D97706",
                             fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center" }}>
                    {u.is_blocked ? <Unlock size={13} /> : <Lock size={13} />}
                  </button>
                  <button onClick={() => setConfirmDlg({ type:"delete-user", data:u })}
                    style={{ padding:"7px 10px", borderRadius:10, border:"none",
                             background:"#FFF1F0", color:C.danger,
                             fontSize:11, fontWeight:700, cursor:"pointer" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && !loading && (
              <div style={{ textAlign:"center", padding:"40px 20px", color:C.textMuted }}>
                <Users size={40} color={C.border} style={{ marginBottom:10 }} />
                <div>Foydalanuvchi topilmadi</div>
              </div>
            )}
          </div>
        )}

        {/* MAHSULOTLAR */}
        {!loading && tab === "products" && (
          <div>
            <div style={{ display:"flex", gap:8, marginBottom:12 }}>
              <div style={{ flex:1, position:"relative" }}>
                <Search size={15} color={C.textMuted}
                  style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
                <input value={prodQ} onChange={e => setProdQ(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && loadTab("products")}
                  placeholder="Qidirish..."
                  style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px 10px 36px",
                           borderRadius:12, border:`1.5px solid ${C.border}`, fontSize:13,
                           background:C.bg, outline:"none", fontFamily:"inherit" }} />
              </div>
              <select value={prodStatus} onChange={e => { setProdStatus(e.target.value); loadTab("products"); }}
                style={{ padding:"8px 10px", borderRadius:12, border:`1.5px solid ${C.border}`,
                         fontSize:12, background:"white", color:C.text, cursor:"pointer" }}>
                <option value="">Barchasi</option>
                <option value="active">Faol</option>
                <option value="pending_approval">Tekshiruvda</option>
                <option value="pending_payment">To'lov kutmoqda</option>
                <option value="hidden">Yashirilgan</option>
              </select>
            </div>

            {prods.map(p => (
              <div key={p.id} style={{ background:"white", borderRadius:14,
                                       border:`1px solid ${C.border}`, padding:"12px 14px",
                                       marginBottom:10, display:"flex",
                                       alignItems:"center", gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.text,
                                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {p.name}
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div style={{ fontSize:11, color:C.textSub }}>
                    {fmtPrice(p.price)} · {p.viloyat}
                  </div>
                  <div style={{ fontSize:11, color:C.textMuted }}>
                    {p.owner_name || "Noma'lum"} · {fmtPhone(p.owner_phone)}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <button onClick={() => setConfirmDlg({ type:"hide-prod", data:p })}
                    style={{ padding:"6px 10px", borderRadius:9, border:"none",
                             background: p.status==="hidden" ? "#E8F8F0" : "#F3F4F6",
                             color: p.status==="hidden" ? "#28A869" : C.textSub,
                             cursor:"pointer", display:"flex", alignItems:"center" }}>
                    {p.status==="hidden" ? <Eye size={14}/> : <EyeOff size={14}/>}
                  </button>
                  <button onClick={() => setConfirmDlg({ type:"delete-prod", data:p })}
                    style={{ padding:"6px 10px", borderRadius:9, border:"none",
                             background:"#FFF1F0", color:C.danger,
                             cursor:"pointer", display:"flex", alignItems:"center" }}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            ))}
            {prods.length === 0 && !loading && (
              <div style={{ textAlign:"center", padding:"40px 20px", color:C.textMuted }}>
                <Package size={40} color={C.border} style={{ marginBottom:10 }} />
                <div>Mahsulot topilmadi</div>
              </div>
            )}
          </div>
        )}

        {/* TO'LOVLAR */}
        {!loading && tab === "payments" && (
          <div>
            {payments.length === 0 ? (
              <div style={{ textAlign:"center", padding:"50px 20px", color:C.textMuted }}>
                <CreditCard size={40} color={C.border} style={{ marginBottom:10 }} />
                <div style={{ fontSize:14, fontWeight:700 }}>Kutayotgan to'lov yo'q</div>
              </div>
            ) : payments.map(p => (
              <div key={p.id} style={{ background:"white", borderRadius:14,
                                       border:`1px solid ${C.border}`, padding:"14px",
                                       marginBottom:10, boxShadow:C.shadow }}>
                <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:6 }}>
                  {p.product_name || "Mahsulot"}
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:C.primaryDark, marginBottom:8 }}>
                  {fmtPrice(p.amount)}
                </div>
                <div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>
                  Xaridor: {p.buyer_name} · {fmtPhone(p.buyer_phone)}
                </div>
                <div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>
                  Sotuvchi: {p.seller_name} · {fmtPhone(p.seller_phone)}
                </div>
                {p.card_from && (
                  <div style={{ fontSize:11, color:C.textSub, marginBottom:2 }}>
                    Karta: {p.card_from}
                  </div>
                )}
                {p.note && (
                  <div style={{ fontSize:11, color:C.textMuted, marginBottom:8, fontStyle:"italic" }}>
                    "{p.note}"
                  </div>
                )}
                <button onClick={() => setConfirmDlg({ type:"confirm-payment", data:p })}
                  style={{ width:"100%", padding:"10px 0", borderRadius:12, border:"none",
                           background:"#E8F8F0", color:"#28A869", fontSize:13,
                           fontWeight:800, cursor:"pointer", display:"flex",
                           alignItems:"center", justifyContent:"center", gap:6, marginTop:6 }}>
                  <CheckCircle size={15} /> To'lovni tasdiqlash
                </button>
              </div>
            ))}
          </div>
        )}

        {/* OPERATORLAR (faqat bosh operator) */}
        {!loading && tab === "operators" && isMainOp && (
          <div>
            <button onClick={() => setAddOpDlg(true)}
              style={{ width:"100%", padding:"11px 0", borderRadius:13, border:"none",
                       background:C.primaryDark, color:"white", fontSize:13, fontWeight:800,
                       cursor:"pointer", display:"flex", alignItems:"center",
                       justifyContent:"center", gap:7, marginBottom:14 }}>
              <UserPlus size={16} /> Operator qo'shish
            </button>

            {operators.map(op => {
              const isMain = (op.phone || "").replace(/\D/g,"").slice(-9) === "331350206";
              return (
                <div key={op.id} style={{ background:"white", borderRadius:14,
                                           border:`1px solid ${C.border}`, padding:"12px 14px",
                                           marginBottom:10, display:"flex",
                                           alignItems:"center", gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:12,
                                background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                                display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Shield size={20} color="white" />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.text }}>{op.name}</div>
                    <div style={{ fontSize:11, color:C.textSub }}>{fmtPhone(op.phone)}</div>
                    {op.telegram && <div style={{ fontSize:11, color:C.textSub }}>{op.telegram}</div>}
                  </div>
                  {isMain ? (
                    <span style={{ fontSize:10, padding:"3px 10px", borderRadius:8,
                                   background:"#EFF6FF", color:"#2563EB", fontWeight:700 }}>
                      Bosh
                    </span>
                  ) : (
                    <button onClick={() => setConfirmDlg({ type:"remove-operator", data:op })}
                      style={{ padding:"7px 10px", borderRadius:10, border:"none",
                               background:"#FFF1F0", color:C.danger, cursor:"pointer" }}>
                      <UserMinus size={15} />
                    </button>
                  )}
                </div>
              );
            })}
            {operators.length === 0 && (
              <div style={{ textAlign:"center", padding:"40px 20px", color:C.textMuted }}>
                <Shield size={40} color={C.border} style={{ marginBottom:10 }} />
                <div>Hali operator yo'q</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
