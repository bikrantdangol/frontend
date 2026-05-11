// ── Green palette (MERGED + FULL SCALE) ─────────────────────────
export const G = {
  50:  '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#43A047',
  600: '#388E3C',
  700: '#2E7D32',
  800: '#1B5E20',
  900: '#0A2E12',
}

// ── Gold palette ────────────────────────────────────────────────
export const GOLD = {
  L: '#fffbeb',
  M: '#C8A951',
  D: '#9A7A20',
}

// ── Neutral palette ─────────────────────────────────────────────
export const N = {
  bg:       '#F4F7F4',
  white:    '#FFFFFF',
  border:   '#D6E4D7',
  border2:  '#C2D5C3',
  surface2: '#EEF3EE',
}

// ── Text ───────────────────────────────────────────────────────
export const TXT = {
  1: '#0A2E12',
  2: '#2D5A35',
  3: '#5A8A60',
  4: '#8EB894',
}

// ── Error ──────────────────────────────────────────────────────
export const ERR = {
  bg:  '#FFEBEE',
  bdr: '#FFCDD2',
  txt: '#C62828',
}

// ── Extra palettes ─────────────────────────────────────────────
export const BLUE   = { bg: '#E3F2FD', txt: '#1565C0' }
export const PURPLE = { bg: '#F3E5F5', txt: '#6A1B9A' }

// ── Status (NEW ADDITION ✅) ────────────────────────────────────
export const STATUS = {
  present:  { bg: '#dcfce7', color: '#15803d' },
  absent:   { bg: '#fef2f2', color: '#dc2626' },
  late:     { bg: '#fffbeb', color: '#b45309' },
  leave:    { bg: '#eff6ff', color: '#1d4ed8' },
  holiday:  { bg: '#fef2f2', color: '#dc2626' },
  pending:  { bg: '#fffbeb', color: '#b45309' },
  approved: { bg: '#dcfce7', color: '#15803d' },
  rejected: { bg: '#fef2f2', color: '#dc2626' },
}

// ── Style helpers ──────────────────────────────────────────────
export const card = (extra = {}) => ({
  background:  N.white,
  border:      `1px solid ${N.border}`,
  borderRadius: 14,
  boxShadow:   '0 1px 4px rgba(10,46,18,.07), 0 2px 8px rgba(10,46,18,.04)',
  ...extra,
})

export const badge = (role) => {
  const map = {
    admin:      { bg: BLUE.bg,    tc: BLUE.txt    },
    staff:      { bg: G[100],     tc: G[700]      },
    accountant: { bg: PURPLE.bg,  tc: PURPLE.txt  },
    helper:     { bg: GOLD.L,     tc: GOLD.D      },
    user:       { bg: '#F3F4F6',  tc: '#4B5563'   },

    // status
    pending:    STATUS.pending,
    approved:   STATUS.approved,
    rejected:   STATUS.rejected,
    present:    STATUS.present,
    absent:     STATUS.absent,
    late:       STATUS.late,
    holiday:    STATUS.holiday,
  }

  const v = map[role] || map.user

  return {
    display:      'inline-flex',
    alignItems:   'center',
    padding:      '3px 10px',
    borderRadius: 99,
    fontSize:     11.5,
    fontWeight:   700,
    background:   v.bg,
    color:        v.tc || v.color,
    whiteSpace:   'nowrap',
  }
}

export const avatar = (size = 36) => ({
  width:           size,
  height:          size,
  borderRadius:   '50%',
  background:      G[100],
  color:           G[700],
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  fontWeight:      700,
  fontSize:        size * 0.38,
  flexShrink:      0,
})

export const btn = {
  primary: {
    background:     G[700],
    color:         '#fff',
    border:        'none',
    borderRadius:   9,
    padding:       '10px 20px',
    fontSize:       13.5,
    fontWeight:     600,
    cursor:        'pointer',
    display:       'inline-flex',
    alignItems:    'center',
    gap:            7,
    justifyContent:'center',
    boxShadow:     '0 2px 6px rgba(46,125,50,.28)',
    transition:    'all .15s',
    whiteSpace:    'nowrap',
  },

  outline: {
    background:     'transparent',
    color:          TXT[2],
    border:        `1.5px solid ${N.border2}`,
    borderRadius:   9,
    padding:       '9px 18px',
    fontSize:       13.5,
    fontWeight:     600,
    cursor:        'pointer',
    display:       'inline-flex',
    alignItems:    'center',
    gap:            7,
    justifyContent:'center',
  },

  danger: {
    background:     ERR.bg,
    color:          ERR.txt,
    border:        `1.5px solid ${ERR.bdr}`,
    borderRadius:   9,
    padding:       '9px 18px',
    fontSize:       13.5,
    fontWeight:     600,
    cursor:        'pointer',
    display:       'inline-flex',
    alignItems:    'center',
    gap:            7,
    justifyContent:'center',
  },
}

export const input = {
  base: {
    width:        '100%',
    padding:      '10px 14px',
    border:      `1.5px solid ${N.border}`,
    borderRadius: 9,
    fontSize:     14,
    color:        TXT[1],
    background:   N.white,
    outline:     'none',
  },
}

export const th = {
  padding:       '11px 16px',
  fontSize:       11,
  fontWeight:     700,
  color:          TXT[3],
  textTransform: 'uppercase',
  background:     N.surface2,
  borderBottom:  `1px solid ${N.border}`,
}

export const td = {
  padding:       '12px 16px',
  color:          TXT[2],
  borderBottom: `1px solid ${N.border}`,
}

export const SIDEBAR_W = 256