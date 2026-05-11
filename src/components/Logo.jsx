// ReQurilish logotipi — 2 ustun + aylana o'qli R harfi
export default function Logo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120"
         fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="logo-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.25"/>
        </filter>
      </defs>

      {/* ── CHAP: 2 ta ustun ── */}
      <rect x="4"  y="16" width="15" height="88" rx="3" fill="#E85410" stroke="#1C0800" strokeWidth="4.5"/>
      <rect x="25" y="16" width="15" height="88" rx="3" fill="#E85410" stroke="#1C0800" strokeWidth="4.5"/>

      {/* ── O'NG: R harfi (arrows) ── */}
      {/* Asosiy vertikal */}
      <rect x="50" y="16" width="14" height="88" rx="3" fill="#E85410" stroke="#1C0800" strokeWidth="4.5"/>
      {/* Tepa gorizontal */}
      <rect x="50" y="16" width="44" height="14" rx="3" fill="#E85410" stroke="#1C0800" strokeWidth="4.5"/>
      {/* O'ng vertikal (tepadan o'rtaga) */}
      <rect x="80" y="16" width="14" height="46" rx="3" fill="#E85410" stroke="#1C0800" strokeWidth="4.5"/>
      {/* O'rta gorizontal */}
      <rect x="50" y="48" width="44" height="14" rx="3" fill="#E85410" stroke="#1C0800" strokeWidth="4.5"/>

      {/* Diagonal oyoq */}
      <path d="M64 62 L100 104" stroke="#E85410" strokeWidth="14" strokeLinecap="round"/>
      <path d="M64 62 L100 104" stroke="#1C0800" strokeWidth="4.5" strokeLinecap="round" fill="none"
            style={{strokeDasharray:"none"}} opacity="1"/>
      <rect x="55" y="58" width="54" height="14" rx="7" fill="#E85410" stroke="#1C0800" strokeWidth="4.5"
            transform="rotate(47 55 58)"/>

      {/* O'q 1 — tepa o'nga */}
      <polygon points="94,8  110,24  76,26" fill="#E85410" stroke="#1C0800" strokeWidth="4" strokeLinejoin="round"/>
      {/* O'q 2 — o'ng tomonda pastga */}
      <polygon points="94,62  80,56  110,52" fill="#E85410" stroke="#1C0800" strokeWidth="4" strokeLinejoin="round"/>
      {/* O'q 3 — oyoq pastki uchi */}
      <polygon points="66,110  52,96  80,92" fill="#E85410" stroke="#1C0800" strokeWidth="4" strokeLinejoin="round"/>
    </svg>
  );
}
