import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { C } from "../constants";

const MONTHS_UZ = ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
const DAYS_UZ   = ["Du","Se","Ch","Pa","Ju","Sh","Ya"];

function toYMD(date) {
  if (!date) return null;
  const d = new Date(date);
  d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}

function isBooked(dateStr, bookedRanges) {
  return bookedRanges.some(r => dateStr >= r.startDate && dateStr <= r.endDate);
}

function isBetween(dateStr, start, end) {
  if (!start || !end) return false;
  const [s, e] = start <= end ? [start, end] : [end, start];
  return dateStr > s && dateStr < e;
}

export default function BookingCalendar({ bookedRanges = [], startDate, endDate, onSelect }) {
  const today = toYMD(new Date());

  const [viewYear,  setViewYear]  = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth()); // 0-11

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay  = new Date(viewYear, viewMonth + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
  const daysInMonth = lastDay.getDate();

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    cells.push(dateStr);
  }

  const handleDayClick = (dateStr) => {
    if (!dateStr) return;
    if (dateStr < today) return;
    if (isBooked(dateStr, bookedRanges)) return;

    if (!startDate || (startDate && endDate)) {
      onSelect({ startDate: dateStr, endDate: null });
    } else {
      if (dateStr === startDate) {
        onSelect({ startDate: null, endDate: null });
        return;
      }
      const [s, e] = dateStr >= startDate ? [startDate, dateStr] : [dateStr, startDate];
      // Check no booked dates in range
      const hasConflict = bookedRanges.some(r => !(r.endDate < s || r.startDate > e));
      if (hasConflict) {
        onSelect({ startDate: dateStr, endDate: null });
        return;
      }
      onSelect({ startDate: s, endDate: e });
    }
  };

  return (
    <div style={{ userSelect:"none" }}>
      {/* Month nav */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <button onClick={prevMonth}
          style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, width:32, height:32,
                   cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <ChevronLeft size={16} color={C.textSub} />
        </button>
        <span style={{ fontSize:14, fontWeight:800, color:C.text }}>
          {MONTHS_UZ[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth}
          style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, width:32, height:32,
                   cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <ChevronRight size={16} color={C.textSub} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
        {DAYS_UZ.map(d => (
          <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:700,
                                color:C.textMuted, padding:"4px 0" }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {cells.map((dateStr, idx) => {
          if (!dateStr) return <div key={idx} />;

          const isPast     = dateStr < today;
          const booked     = isBooked(dateStr, bookedRanges);
          const isStart    = dateStr === startDate;
          const isEnd      = dateStr === endDate;
          const inRange    = isBetween(dateStr, startDate, endDate);
          const isToday    = dateStr === today;
          const disabled   = isPast || booked;

          let bg = "transparent", color = C.text, border = "none";
          if (booked)   { bg = "#FEE2E2"; color = "#FCA5A5"; }
          if (isPast)   { color = C.textMuted; }
          if (inRange)  { bg = "#D1FAE5"; color = "#065F46"; }
          if (isStart || isEnd) { bg = "#059669"; color = "white"; }
          if (isToday && !isStart && !isEnd) { border = `2px solid ${C.primaryDark}`; }

          return (
            <div key={dateStr} onClick={() => !disabled && handleDayClick(dateStr)}
              style={{ textAlign:"center", padding:"7px 2px", borderRadius:8, fontSize:12, fontWeight:600,
                       background:bg, color, border,
                       cursor: disabled ? "default" : "pointer",
                       opacity: isPast ? 0.4 : 1,
                       position:"relative",
                       transition:"background 0.1s" }}>
              {parseInt(dateStr.slice(8))}
              {booked && !isPast && (
                <div style={{ position:"absolute", bottom:2, left:"50%", transform:"translateX(-50%)",
                              width:4, height:4, borderRadius:"50%", background:"#EF4444" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:12, marginTop:10, fontSize:9, color:C.textMuted }}>
        <span style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ width:10, height:10, borderRadius:3, background:"#059669", display:"inline-block" }} />
          Tanlangan
        </span>
        <span style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ width:10, height:10, borderRadius:3, background:"#D1FAE5", display:"inline-block" }} />
          Oraliq
        </span>
        <span style={{ display:"flex", alignItems:"center", gap:4 }}>
          <span style={{ width:10, height:10, borderRadius:3, background:"#FEE2E2", display:"inline-block" }} />
          Band
        </span>
      </div>
    </div>
  );
}
