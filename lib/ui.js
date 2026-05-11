// Shared inline-style primitives — no globals.css changes needed
import { C, ROLE_COLORS, STATUS_COLORS } from './colors'

// ── Typography ──────────────────────────────────────────────────────────────
export const T = {
  h1:   { fontSize:24, fontWeight:800, color:C.text1, letterSpacing:'-0.4px', lineHeight:1.2 },
  h2:   { fontSize:18, fontWeight:700, color:C.text1, letterSpacing:'-0.2px' },
  h3:   { fontSize:15, fontWeight:700, color:C.text1 },
  h4:   { fontSize:13, fontWeight:700, color:C.text1 },
  body: { fontSize:13.5, color:C.text2, lineHeight:1.55 },
  sm:   { fontSize:12,   color:C.text3 },
  xs:   { fontSize:11,   color:C.text4 },
  label:{ fontSize:11.5, fontWeight:700, color:C.text2, textTransform:'uppercase', letterSpacing:'0.5px' },
  mono: { fontFamily:'monospace', fontSize:12.5 },
}

// ── Layout ──────────────────────────────────────────────────────────────────
export const SIDEBAR_W = 256

export const S = {
  // Cards
  card: {
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    boxShadow: '0 1px 4px rgba(10,46,18,.06), 0 2px 8px rgba(10,46,18,.03)',
  },
  cardHover: {
    boxShadow: '0 4px 16px rgba(10,46,18,.10)',
    transform: 'translateY(-1px)',
  },

  // Inputs
  input: {
    width:'100%', padding:'10px 14px',
    border: `1.5px solid ${C.border}`,
    borderRadius: 9,
    fontSize: 13.5,
    color: C.text1,
    background: C.white,
    outline:'none',
    transition:'border-color .15s, box-shadow .15s',
  },
  inputFocus: {
    borderColor: C.g500,
    boxShadow: `0 0 0 3px rgba(67,160,71,.12)`,
  },
  inputIcon: {
    position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
    color:C.text4, pointerEvents:'none', display:'flex', alignItems:'center',
  },
  togglePw: {
    position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
    color:C.text4, cursor:'pointer', background:'none', border:'none',
    display:'flex', alignItems:'center', padding:4, borderRadius:4,
  },

  // Buttons
  btnPrimary: {
    background: C.g700,
    color: C.white,
    border:'none',
    borderRadius:9,
    padding:'10px 20px',
    fontSize:13.5, fontWeight:600,
    cursor:'pointer',
    display:'inline-flex', alignItems:'center', gap:7, justifyContent:'center',
    transition:'background .15s, box-shadow .15s, transform .15s',
    boxShadow:'0 2px 6px rgba(46,125,50,.3)',
    whiteSpace:'nowrap',
  },
  btnOutline: {
    background: 'transparent',
    color: C.text2,
    border: `1.5px solid ${C.border2}`,
    borderRadius:9,
    padding:'9px 18px',
    fontSize:13.5, fontWeight:600,
    cursor:'pointer',
    display:'inline-flex', alignItems:'center', gap:7, justifyContent:'center',
    transition:'all .15s',
    whiteSpace:'nowrap',
  },
  btnDanger: {
    background: C.redBg,
    color: C.red,
    border: `1.5px solid ${C.redBdr}`,
    borderRadius:9,
    padding:'9px 18px',
    fontSize:13.5, fontWeight:600,
    cursor:'pointer',
    display:'inline-flex', alignItems:'center', gap:7, justifyContent:'center',
    transition:'all .15s',
    whiteSpace:'nowrap',
  },
  btnGold: {
    background: C.gold,
    color: C.g900,
    border:'none',
    borderRadius:9,
    padding:'10px 20px',
    fontSize:13.5, fontWeight:700,
    cursor:'pointer',
    display:'inline-flex', alignItems:'center', gap:7, justifyContent:'center',
    transition:'all .15s',
    boxShadow:'0 2px 6px rgba(200,169,81,.3)',
    whiteSpace:'nowrap',
  },
}

// ── Badge helper ─────────────────────────────────────────────────────────────
export function badgeStyle(variant='green') {
  const map = {
    green:  { bg:C.g100,    text:C.g700 },
    gold:   { bg:C.goldL,   text:C.goldD },
    red:    { bg:C.redBg,   text:C.red   },
    blue:   { bg:C.blueBg,  text:C.blue  },
    purple: { bg:'#F3E5F5', text:'#6A1B9A' },
    gray:   { bg:'#F3F4F6', text:'#4B5563' },
    amber:  { bg:C.amberBg, text:C.amber },
  }
  const v = map[variant] || map.gray
  return {
    display:'inline-flex', alignItems:'center', gap:4,
    padding:'3px 10px', borderRadius:99,
    fontSize:11.5, fontWeight:700, letterSpacing:'.2px',
    background:v.bg, color:v.text,
    whiteSpace:'nowrap',
  }
}

export function roleBadge(role) {
  const map = { admin:'blue', staff:'green', accountant:'purple', helper:'gold', user:'gray' }
  return badgeStyle(map[role]||'gray')
}

export function statusBadge(status) {
  const map = { present:'green', approved:'green', absent:'red', rejected:'red', late:'amber', pending:'gold', holiday:'gold' }
  return badgeStyle(map[status]||'gray')
}

// ── Avatar ───────────────────────────────────────────────────────────────────
export function avatarStyle(size=36) {
  return {
    width:size, height:size, borderRadius:'50%',
    background: C.g100, color: C.g700,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:700, fontSize: size*0.38, flexShrink:0,
  }
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
export const SB = {
  sidebar: {
    position:'fixed', top:0, left:0, height:'100%',
    width:SIDEBAR_W, background:C.g800,
    display:'flex', flexDirection:'column',
    boxShadow:'2px 0 16px rgba(10,46,18,.20)',
    zIndex:40,
    transition:'transform .3s cubic-bezier(.4,0,.2,1)',
  },
  logo: {
    padding:'18px 16px 14px',
    borderBottom:`1px solid rgba(255,255,255,.08)`,
    display:'flex', alignItems:'center', gap:11,
  },
  logoRing: {
    width:40, height:40, borderRadius:'50%',
    border:`2px solid ${C.gold}`,
    background:C.white,
    display:'flex', alignItems:'center', justifyContent:'center',
    flexShrink:0, fontSize:18, fontWeight:900, color:C.g800,
  },
  logoTitle:  { fontSize:14.5, fontWeight:800, color:'#fff', lineHeight:1.1 },
  logoSub:    { fontSize:11, color:'rgba(255,255,255,.45)', marginTop:1 },
  sectionLbl: {
    fontSize:10, fontWeight:700, color:'rgba(255,255,255,.3)',
    textTransform:'uppercase', letterSpacing:'.8px',
    padding:'12px 16px 4px',
  },
  link: (active) => ({
    display:'flex', alignItems:'center', gap:10,
    padding:'9px 12px', margin:'1px 8px', borderRadius:9,
    fontSize:13.5, fontWeight:500,
    color: active ? '#fff' : 'rgba(255,255,255,.62)',
    background: active ? 'rgba(255,255,255,.13)' : 'transparent',
    cursor:'pointer', textDecoration:'none',
    transition:'all .15s',
    position:'relative',
  }),
  linkBefore: { // the gold left accent
    position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
    width:3, height:20, borderRadius:'0 3px 3px 0',
    background:C.gold,
  },
  iconBox: (active) => ({
    width:30, height:30, borderRadius:7,
    display:'flex', alignItems:'center', justifyContent:'center',
    background: active ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.06)',
    transition:'background .15s', flexShrink:0,
  }),
  bottom: { marginTop:'auto', borderTop:`1px solid rgba(255,255,255,.08)`, padding:'12px 8px' },
  userBox: {
    display:'flex', alignItems:'center', gap:10,
    padding:'10px 12px', borderRadius:9,
    background:'rgba(255,255,255,.06)', marginBottom:6,
  },
  userAvatar: {
    width:33, height:33, borderRadius:'50%',
    background:C.gold, color:C.g900,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:800, fontSize:14, flexShrink:0,
  },
  userName:   { fontSize:13, fontWeight:700, color:'#fff' },
  userRole:   { fontSize:10.5, color:'rgba(255,255,255,.4)' },
  logoutBtn: {
    display:'flex', alignItems:'center', gap:10,
    padding:'9px 12px', borderRadius:9, cursor:'pointer',
    color:'rgba(239,100,100,.9)', background:'transparent',
    border:'none', width:'100%', fontSize:13.5, fontWeight:500,
    transition:'background .15s',
  },
}

// ── Table ─────────────────────────────────────────────────────────────────────
export const TABLE = {
  wrap: {
    width:'100%', overflowX:'auto',
    borderRadius:12, border:`1px solid ${C.border}`,
    background:C.white,
  },
  table: { width:'100%', borderCollapse:'collapse', fontSize:13.5 },
  th: {
    padding:'11px 16px', textAlign:'left',
    fontSize:11, fontWeight:700, color:C.text3,
    textTransform:'uppercase', letterSpacing:'.5px',
    background:'#F4F7F4',
    borderBottom:`1px solid ${C.border}`,
    whiteSpace:'nowrap',
  },
  td: { padding:'12px 16px', color:C.text2, borderBottom:`1px solid ${C.border}`, verticalAlign:'middle' },
  trHover: { background:'#F9FBF9' },
}

// ── Calendar ──────────────────────────────────────────────────────────────────
export const CAL = {
  header: {
    background:C.g800, padding:'16px 20px',
    display:'flex', alignItems:'center', justifyContent:'space-between',
    borderRadius:'12px 12px 0 0',
  },
  navBtn: {
    background:'rgba(255,255,255,.1)', border:'none',
    borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#fff',
    display:'flex', alignItems:'center', justifyContent:'center',
    transition:'background .15s',
  },
  grid: { padding:'12px 16px 16px' },
  dayName: (isSat) => ({
    textAlign:'center', fontSize:10.5, fontWeight:700,
    color: isSat ? '#EF5350' : C.text4,
    padding:'4px 0', letterSpacing:'.4px', textTransform:'uppercase',
  }),
  day: (st) => {
    const base = {
      width:'100%', aspectRatio:'1', display:'flex',
      alignItems:'center', justifyContent:'center',
      fontSize:13, borderRadius:8, cursor:'pointer', border:'none',
      background:'transparent', transition:'all .12s',
    }
    if (st==='today')   return {...base, background:C.g700, color:'#fff', fontWeight:700}
    if (st==='present') return {...base, background:C.g100, color:C.g700}
    if (st==='absent')  return {...base, background:C.redBg, color:C.red}
    if (st==='late')    return {...base, background:C.amberBg, color:C.amber}
    if (st==='holiday') return {...base, background:C.goldL, color:C.goldD}
    if (st==='sat')     return {...base, color:'#EF5350'}
    if (st==='selected')return {...base, background:C.g100, color:C.g700, fontWeight:700, outline:`2px solid ${C.g500}`}
    if (st==='disabled')return {...base, opacity:.3, cursor:'default'}
    return {...base, color:C.text2}
  },
}