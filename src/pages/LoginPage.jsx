import { useState, useEffect } from "react";
import { BtnPrimary, Lbl, TInput } from "../components/UI";
import { C } from "../constants";
import { authAPI, setToken } from "../services/api";
import Logo from "../components/Logo";
import {
  Smartphone, Loader2,
  KeyRound, CheckCircle, AlertTriangle, ArrowLeft, Send, Lock,
} from "lucide-react";

function formatPhone(raw) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("998")) d = d.slice(3);
  d = d.slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5)}`;
  return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5,7)} ${d.slice(7)}`;
}

const BOT_URL = import.meta.env.VITE_TG_BOT_URL || "https://t.me/Requrilishbot";

export default function LoginPage({ onLogin }) {
  const [mode,        setMode]        = useState("login");
  const [step,        setStep]        = useState(1);
  const [phone,       setPhone]       = useState("");
  const [originPhone, setOriginPhone] = useState("");
  const [name,        setName]        = useState("");
  const [telegram,    setTelegram]    = useState("");
  const [tgLocked,    setTgLocked]    = useState(false); // telegram field locked from TG WebApp
  const [code,        setCode]        = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const normalizePhone = (v = "") => v.replace(/\D/g, "").slice(-9);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tgToken  = params.get("tgToken");
    const tgPhone  = params.get("phone");
    const tgName   = params.get("name");
    const tgUser   = params.get("telegram");
    const tgChatId = params.get("tgChatId");
    const isReg    = params.get("register") === "1";

    window.history.replaceState({}, "", window.location.pathname);

    if (tgToken) {
      setLoading(true);
      authAPI.loginWithTgToken(tgToken)
        .then((data) => {
          setToken(data.token);
          localStorage.setItem("rm_user", JSON.stringify(data.user));
          onLogin(data.user);
        })
        .catch(() => setLoading(false));
      return;
    }

    if (isReg && tgPhone) {
      const digits = tgPhone.replace(/\D/g, "").slice(-9);
      const cleanName = tgName || "Foydalanuvchi";
      setOriginPhone(digits);
      setLoading(true);
      authAPI.register({
        name: cleanName,
        phone: digits,
        telegram: tgUser || "",
        tgChatId: tgChatId || null,
      })
        .then((data) => {
          setToken(data.token);
          localStorage.setItem("rm_user", JSON.stringify(data.user));
          onLogin(data.user);
        })
        .catch((e) => {
          setMode("register");
          setPhone(formatPhone(digits));
          setName(cleanName);
          if (tgUser) { setTelegram(tgUser); setTgLocked(true); }
          if (tgChatId) window.__tgChatId = tgChatId;
          setError(e.message || "Xatolik yuz berdi");
          setLoading(false);
        });
      return;
    }

    // Auto-fill from Telegram WebApp initDataUnsafe (no phone, but name/username available)
    const tgWaUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgWaUser) {
      const waName = [tgWaUser.first_name, tgWaUser.last_name].filter(Boolean).join(" ");
      const waUsername = tgWaUser.username ? `@${tgWaUser.username}` : "";
      if (waName) setName(waName);
      if (waUsername) { setTelegram(waUsername); setTgLocked(true); }
    }
  }, []);

  const switchMode = (m) => { setMode(m); setError(""); setCode(""); setStep(1); };

  const handleNextStep = async () => {
    setError("");
    if (!phone.trim()) { setError("Telefon raqam kiriting"); return; }
    if (mode === "register" && !name.trim()) { setError("Ism familiya kiriting"); return; }
    if (mode === "register" && !telegram.trim()) { setError("Telegram username kiriting"); return; }
    if (mode === "register" && originPhone && normalizePhone(phone) !== originPhone) {
      setError("Faqat o'zingizning botda yuborgan raqamingizdan ro'yxatdan o'tishingiz mumkin");
      return;
    }

    if (mode === "login") {
      setLoading(true);
      try {
        await authAPI.sendCode(phone.replace(/\s/g, ""));
        setStep(2);
      } catch (e) {
        if (e.message?.includes("needBot") || e.message?.includes("botda")) {
          setError("Bu raqam botda ro'yxatdan o'tmagan. @Requrilishbot da /start bosing.");
        } else {
          setError(e.message || "Xatolik yuz berdi");
        }
      } finally {
        setLoading(false);
      }
    } else {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setError("");
    const tgChatId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
      || window.__tgChatId
      || null;

    if (mode === "register") {
      if (!telegram.trim()) { setError("Telegram username majburiy"); return; }
      if (originPhone && normalizePhone(phone) !== originPhone) {
        setError("Telefon raqam faqat o'zingizniki bo'lishi kerak");
        return;
      }
      setLoading(true);
      try {
        const data = await authAPI.register({
          name: name.trim(), phone: phone.replace(/\s/g, ""),
          telegram: telegram.trim(), tgChatId,
        });
        setToken(data.token);
        localStorage.setItem("rm_user", JSON.stringify(data.user));
        onLogin(data.user);
      } catch (e) {
        setError(e.message || "Xatolik yuz berdi");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (code.trim().length !== 6) { setError("6 xonali kod kiriting"); return; }
    setLoading(true);
    try {
      const data = await authAPI.login({
        phone: phone.replace(/\s/g, ""), code: code.trim(), tgChatId,
      });
      setToken(data.token);
      localStorage.setItem("rm_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) {
      setError(e.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      fontFamily: "'Nunito','Segoe UI',sans-serif", background: C.bg,
      minHeight: "100vh", maxWidth: 430, margin: "0 auto",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "40px 28px",
    }}>
      {loading && step === 1 && !phone && (
        <div style={{ textAlign: "center", color: C.textMuted }}>
          <Loader2 size={32} color={C.primaryDark} style={{ margin: "0 auto 12px", display:"block", animation:"spin 1s linear infinite" }} />
          <div style={{ fontSize: 14 }}>Telegram orqali kirilmoqda...</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <Logo size={80} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 4 }}>ReQurilish</div>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 32, textAlign: "center" }}>
        Qurilish materiallari bozori
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ width:"100%", background:C.card, borderRadius:22,
                      border:`1px solid ${C.border}`, padding:"24px 20px",
                      boxShadow:"0 4px 22px rgba(0,0,0,0.08)" }}>
          <div style={{ display:"flex", background:C.bg, borderRadius:14, padding:4, marginBottom:22, gap:4 }}>
            {[["login","Kirish"],["register","Ro'yxatdan o'tish"]].map(([m,lbl]) => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex:1, padding:"9px 0", borderRadius:11, border:"none",
                cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700, transition:"all .2s",
                background: mode===m ? C.primaryDark : "transparent",
                color: mode===m ? "white" : C.textMuted,
              }}>{lbl}</button>
            ))}
          </div>

          {mode === "register" && (
            <>
              <Lbl>Ism Familiya *</Lbl>
              <TInput value={name} onChange={setName} placeholder="Abdulloh Karimov" />
            </>
          )}
          <Lbl>Telefon raqam *</Lbl>
          <PhoneInput
            value={phone} onChange={setPhone} onEnter={handleNextStep}
            locked={!!originPhone}
          />
          {mode === "register" && (
            <>
              <Lbl>Telegram username *</Lbl>
              {tgLocked ? (
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 13px",
                              borderRadius:12, border:`1.5px solid ${C.border}`,
                              background:"#F9FAFB", marginBottom:13, fontSize:14, color:C.text }}>
                  <Lock size={14} color={C.textMuted} />
                  <span style={{ flex:1 }}>{telegram}</span>
                </div>
              ) : (
                <TInput value={telegram} onChange={setTelegram} placeholder="@username" />
              )}
            </>
          )}

          {error && <ErrorBox msg={error} />}

          <BtnPrimary onClick={handleNextStep} fullWidth disabled={loading}>
            {loading
              ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }} /> Tekshirilmoqda...</>
              : <><Smartphone size={15} /> {mode === "login" ? "Kod yuborish →" : "Davom etish →"}</>
            }
          </BtnPrimary>

          <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0 14px" }}>
            <div style={{ flex:1, height:1, background:C.border }} />
            <span style={{ fontSize:11, color:C.textMuted, whiteSpace:"nowrap" }}>yoki</span>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>

          <a href={BOT_URL} target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
            <button style={{
              width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              padding:"11px 0", borderRadius:14, border:"1.5px solid #2AABEE",
              background:"#E8F6FD", color:"#0088CC", fontFamily:"inherit",
              fontSize:13, fontWeight:700, cursor:"pointer", transition:"background .15s",
            }}
              onMouseOver={e => e.currentTarget.style.background="#d0ecf9"}
              onMouseOut={e => e.currentTarget.style.background="#E8F6FD"}
            >
              <Send size={15} color="#0088CC" />
              Telegram orqali kirish
            </button>
          </a>

          <div style={{ textAlign:"center", marginTop:14, fontSize:11, color:C.textMuted }}>
            {mode === "login" ? (
              <>Hisobingiz yo'qmi?{" "}
                <span onClick={() => switchMode("register")} style={{ color:C.primaryDark, fontWeight:700, cursor:"pointer" }}>
                  Ro'yxatdan o'ting
                </span></>
            ) : (
              <>Hisobingiz bormi?{" "}
                <span onClick={() => switchMode("login")} style={{ color:C.primaryDark, fontWeight:700, cursor:"pointer" }}>
                  Kiring
                </span></>
            )}
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ width:"100%", background:C.card, borderRadius:22,
                      border:`1px solid ${C.border}`, padding:"24px 20px",
                      boxShadow:"0 4px 22px rgba(0,0,0,0.08)" }}>
          <button onClick={() => { setStep(1); setCode(""); setError(""); }} style={{
            display:"flex", alignItems:"center", gap:5, background:"none",
            border:"none", cursor:"pointer", color:C.textSub,
            fontSize:12, fontWeight:700, marginBottom:20, padding:0, fontFamily:"inherit",
          }}>
            <ArrowLeft size={14} /> Orqaga
          </button>

          {mode === "login" ? (
            <>
              <div style={{ textAlign:"center", marginBottom:24 }}>
                <div style={{ width:60, height:60, borderRadius:18, margin:"0 auto 14px",
                              background:"#E8F6FD", border:"2px solid #2AABEE",
                              display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Send size={28} color="#0088CC" />
                </div>
                <div style={{ fontSize:18, fontWeight:900, color:C.text, marginBottom:6 }}>Telegram kod</div>
                <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.5 }}>
                  @Requrilishbot dan 6 xonali kod keldi
                </div>
                <div style={{ display:"inline-block", marginTop:6, background:C.primaryLight,
                              border:`1px solid ${C.primaryBorder}`, borderRadius:10, padding:"5px 14px",
                              fontSize:15, fontWeight:900, color:C.primaryDark }}>
                  +998 {phone}
                </div>
              </div>

              <input value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
                placeholder="• • • • • •" inputMode="numeric" autoFocus
                style={{ width:"100%", boxSizing:"border-box", padding:"16px", borderRadius:16, marginBottom:16,
                         border:`2.5px solid ${code.length>=6?C.primaryDark:C.primaryBorder}`,
                         background:C.bg, fontSize:32, fontWeight:900, letterSpacing:10,
                         textAlign:"center", color:C.text, outline:"none", fontFamily:"inherit", transition:"border-color .2s" }}
                onKeyDown={e => e.key==="Enter" && handleSubmit()}
              />

              {error && <ErrorBox msg={error} />}

              <BtnPrimary onClick={handleSubmit} fullWidth disabled={loading}>
                {loading ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }} /> Tekshirilmoqda...</>
                         : <><KeyRound size={15} /> Kirish</>}
              </BtnPrimary>

              <div style={{ textAlign:"center", marginTop:14, fontSize:11, color:C.textMuted }}>
                Kod kelmadimi?{" "}
                <span onClick={() => { setStep(1); setCode(""); }}
                  style={{ color:C.primaryDark, fontWeight:700, cursor:"pointer" }}>
                  Qayta yuborish
                </span>
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign:"center", marginBottom:20 }}>
                <div style={{ width:60, height:60, borderRadius:18, margin:"0 auto 14px",
                              background:C.primaryLight, border:`2px solid ${C.primaryBorder}`,
                              display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <CheckCircle size={28} color={C.primaryDark} />
                </div>
                <div style={{ fontSize:18, fontWeight:900, color:C.text, marginBottom:6 }}>Tasdiqlash</div>
                <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.6 }}>
                  Quyidagi ma'lumotlar bilan ro'yxatdan o'tasiz:
                </div>
              </div>

              <div style={{ background:C.bg, borderRadius:12, padding:"12px 14px", marginBottom:16,
                            border:`1px solid ${C.border}`, fontSize:13, lineHeight:2 }}>
                <div><b>Ism:</b> {name}</div>
                <div><b>Telefon:</b> +998 {phone}</div>
                {telegram && <div><b>Telegram:</b> {telegram}</div>}
              </div>

              {error && <ErrorBox msg={error} />}

              <BtnPrimary onClick={handleSubmit} fullWidth disabled={loading}>
                {loading ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }} /> Yuklanmoqda...</>
                         : <><CheckCircle size={15} /> Ro'yxatdan o'tish</>}
              </BtnPrimary>
            </>
          )}
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function PhoneInput({ value, onChange, onEnter, locked }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position:"relative", marginBottom:13 }}>
      <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)",
                     fontSize:13, color:C.textSub, fontWeight:700, userSelect:"none", pointerEvents:"none" }}>
        +998
      </span>
      {locked && (
        <Lock size={13} color={C.textMuted} style={{ position:"absolute", right:12, top:"50%",
                                                      transform:"translateY(-50%)", pointerEvents:"none" }} />
      )}
      <input
        value={value} inputMode="numeric" placeholder="90 000 00 00"
        readOnly={locked}
        onChange={locked ? undefined : e => onChange(formatPhone(e.target.value))}
        onKeyDown={locked ? undefined : e => e.key==="Enter" && onEnter?.()}
        onFocus={() => !locked && setFocus(true)} onBlur={() => setFocus(false)}
        style={{ width:"100%", boxSizing:"border-box", padding:"10px 13px 10px 54px",
                 borderRadius:12, border:`1.5px solid ${focus?C.primary:C.border}`,
                 fontSize:15, fontWeight:400, color:C.text, fontFamily:"inherit", outline:"none",
                 background: locked ? "#F9FAFB" : C.bg, transition:"border-color 0.2s",
                 letterSpacing:1, cursor: locked ? "default" : "text" }}
      />
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{ padding:"10px 14px", borderRadius:10, marginBottom:12,
                  background:"#FFF1F0", color:"#FF4D4F", fontSize:12, fontWeight:600,
                  display:"flex", alignItems:"center", gap:7 }}>
      <AlertTriangle size={14} color="#FF4D4F" />
      {msg}
    </div>
  );
}
