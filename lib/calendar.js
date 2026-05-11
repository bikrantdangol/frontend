// Nepali months in English
export const BS_MONTHS_EN = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan',
  'Bhadra', 'Ashwin', 'Kartik', 'Mangsir',
  'Poush', 'Magh', 'Falgun', 'Chaitra'
]

// Nepali months in Nepali
export const BS_MONTHS_NP = [
  'बैशाख', 'जेष्ठ', 'असार', 'श्रावण',
  'भाद्र', 'आश्विन', 'कार्तिक', 'मङ्सिर',
  'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
]

// Days in each month for BS years (general pattern)
const DAYS_IN_MONTH_GENERAL = {
  1: 31, 2: 31, 3: 32, 4: 31, 5: 31, 6: 31,
  7: 30, 8: 29, 9: 30, 10: 29, 11: 30, 12: 30
}

// Reference date: Baisakh 1, 2083 = April 14, 2026 (Tuesday)
const REF_BS = { year: 2083, month: 1, day: 1 }
const REF_AD = new Date(2026, 3, 14) // April 14, 2026
const REF_WEEKDAY = 2 // Tuesday (0 = Sunday, 1 = Monday, 2 = Tuesday)

// Get days in month for any BS year
export const daysInBSMonth = (year, month) => {
  // For years beyond 2083, use pattern (every 3 years have slight variations)
  // This is a simplified version - for production use a proper library
  return DAYS_IN_MONTH_GENERAL[month] || 30
}

// Get first day of month for any BS year
export const firstDayOfBSMonth = (year, month) => {
  let totalDays = 0
  
  // Calculate total days from reference to target
  if (year > REF_BS.year) {
    for (let y = REF_BS.year; y < year; y++) {
      for (let m = 1; m <= 12; m++) {
        totalDays += daysInBSMonth(y, m)
      }
    }
    for (let m = REF_BS.month; m < month; m++) {
      totalDays += daysInBSMonth(year, m)
    }
  } else if (year === REF_BS.year) {
    for (let m = REF_BS.month; m < month; m++) {
      totalDays += daysInBSMonth(year, m)
    }
  } else {
    // For past years
    for (let y = year; y < REF_BS.year; y++) {
      for (let m = 1; m <= 12; m++) {
        totalDays -= daysInBSMonth(y, m)
      }
    }
    for (let m = month; m < REF_BS.month; m++) {
      totalDays -= daysInBSMonth(year, m)
    }
  }
  
  return (REF_WEEKDAY + totalDays) % 7
}

// Convert AD to BS date
export const adToBs = (adDate) => {
  const diffDays = Math.floor((adDate - REF_AD) / (1000 * 60 * 60 * 24))
  
  let year = REF_BS.year
  let month = REF_BS.month
  let day = REF_BS.day + diffDays
  
  while (day > daysInBSMonth(year, month)) {
    day -= daysInBSMonth(year, month)
    month++
    if (month > 12) {
      month = 1
      year++
    }
  }
  
  while (day < 1) {
    month--
    if (month < 1) {
      month = 12
      year--
    }
    day += daysInBSMonth(year, month)
  }
  
  return { year, month, day }
}

// Convert BS to AD date
export const bsToAd = (year, month, day) => {
  let totalDays = 0
  
  if (year > REF_BS.year) {
    for (let y = REF_BS.year; y < year; y++) {
      for (let m = 1; m <= 12; m++) {
        totalDays += daysInBSMonth(y, m)
      }
    }
  } else if (year < REF_BS.year) {
    for (let y = year; y < REF_BS.year; y++) {
      for (let m = 1; m <= 12; m++) {
        totalDays -= daysInBSMonth(y, m)
      }
    }
  }
  
  if (month > REF_BS.month) {
    for (let m = REF_BS.month; m < month; m++) {
      totalDays += daysInBSMonth(year, m)
    }
  } else if (month < REF_BS.month) {
    for (let m = month; m < REF_BS.month; m++) {
      totalDays -= daysInBSMonth(year, m)
    }
  }
  
  totalDays += day - REF_BS.day
  
  const resultDate = new Date(REF_AD)
  resultDate.setDate(resultDate.getDate() + totalDays)
  return resultDate
}

// Get current Nepali date dynamically
export const getTodayBS = () => {
  return adToBs(new Date())
}

// Get current AD date
export const getTodayAD = () => {
  return new Date()
}

// Format date for display
export const fmtDate = (year, month, day, lang = 'en') => {
  if (lang === 'np') {
    return `${day} ${BS_MONTHS_NP[month - 1]} ${year} BS`
  }
  return `${day} ${BS_MONTHS_EN[month - 1]} ${year} BS`
}

// Format BS date
export const formatBSDate = (year, month, day) => {
  return `${day} ${BS_MONTHS_EN[month - 1]} ${year} BS`
}

// Format AD date
export const formatADDate = (date) => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

// Format dual date (BS and AD)
export const formatDualDate = (adDate) => {
  const bs = adToBs(adDate)
  const adStr = formatADDate(adDate)
  return `${fmtDate(bs.year, bs.month, bs.day)} (${adStr})`
}

// Get previous month
export const prevBSMonth = (year, month) => {
  if (month === 1) {
    return { year: year - 1, month: 12 }
  }
  return { year, month: month - 1 }
}

// Get next month
export const nextBSMonth = (year, month) => {
  if (month === 12) {
    return { year: year + 1, month: 1 }
  }
  return { year, month: month + 1 }
}

// Get month name
export const getMonthName = (month, lang = 'en') => {
  return lang === 'np' ? BS_MONTHS_NP[month - 1] : BS_MONTHS_EN[month - 1]
}

// Check if a date is today
export const isToday = (year, month, day) => {
  const today = getTodayBS()
  return today.year === year && today.month === month && today.day === day
}

// Check if a date is in the past
export const isPastDate = (year, month, day) => {
  const today = getTodayBS()
  if (year < today.year) return true
  if (year === today.year && month < today.month) return true
  if (year === today.year && month === today.month && day < today.day) return true
  return false
}

// Check if a date is in the future
export const isFutureDate = (year, month, day) => {
  const today = getTodayBS()
  if (year > today.year) return true
  if (year === today.year && month > today.month) return true
  if (year === today.year && month === today.month && day > today.day) return true
  return false
}

// Get day of week for a BS date (0 = Sunday, 6 = Saturday)
export const getDayOfWeek = (year, month, day) => {
  const adDate = bsToAd(year, month, day)
  return adDate.getDay()
}

// Get day name for a BS date
export const getDayName = (year, month, day, lang = 'en') => {
  const daysEN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const daysNP = ['आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार']
  const dayIndex = getDayOfWeek(year, month, day)
  return lang === 'np' ? daysNP[dayIndex] : daysEN[dayIndex]
}