const BS_MONTHS = {
  names: ['Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'],
  days: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30] // Approximate - nepali months have varying days
};

// Reference date: 2000-01-01 BS = 1943-04-14 AD (approximately)
const BS_EPOCH = { year: 2000, month: 1, day: 1 };
const AD_EPOCH = new Date(1943, 3, 14); // April 14, 1943

class NepaliDateTime {
  constructor(year, month, day) {
    this.year = year;
    this.month = month;
    this.day = day;
  }

  static fromDateTime(date) {
    // Convert AD to BS - This is a simplified conversion
    // For production, use a proper nepali date library
    const diffDays = Math.floor((date - AD_EPOCH) / (1000 * 60 * 60 * 24));
    let bsYear = BS_EPOCH.year;
    let bsMonth = BS_EPOCH.month;
    let remainingDays = diffDays;
    
    while (remainingDays > 0) {
      const daysInMonth = BS_MONTHS.days[bsMonth - 1];
      if (remainingDays >= daysInMonth) {
        remainingDays -= daysInMonth;
        bsMonth++;
        if (bsMonth > 12) {
          bsMonth = 1;
          bsYear++;
        }
      } else {
        break;
      }
    }
    
    return new NepaliDateTime(bsYear, bsMonth, remainingDays + 1);
  }

  toDateTime() {
    // Convert BS to AD - This is a simplified conversion
    let days = 0;
    for (let y = BS_EPOCH.year; y < this.year; y++) {
      for (let m = 1; m <= 12; m++) {
        days += BS_MONTHS.days[m - 1];
      }
    }
    for (let m = 1; m < this.month; m++) {
      days += BS_MONTHS.days[m - 1];
    }
    days += this.day - 1;
    
    const resultDate = new Date(AD_EPOCH);
    resultDate.setDate(resultDate.getDate() + days);
    return resultDate;
  }
}

class NepaliDateConverter {
  static bsMonthNames = BS_MONTHS.names;

  static adToBs(ad) {
    const ndt = NepaliDateTime.fromDateTime(ad);
    return { year: ndt.year, month: ndt.month, day: ndt.day, monthName: this.bsMonthNames[ndt.month - 1] };
  }

  static bsToAd(year, month, day) {
    const ndt = new NepaliDateTime(year, month, day);
    return ndt.toDateTime();
  }

  static daysInBsMonth(year, month) {
    // This needs actual nepali calendar data
    // Simplified version:
    return BS_MONTHS.days[month - 1];
  }

  static prevBsMonth(year, month) {
    if (month === 1) return { year: year - 1, month: 12 };
    return { year, month: month - 1 };
  }

  static nextBsMonth(year, month) {
    if (month === 12) return { year: year + 1, month: 1 };
    return { year, month: month + 1 };
  }

  static bsMonthStartAd(year, month) {
    return NepaliDateTime.fromDateTime(new NepaliDateTime(year, month, 1).toDateTime());
  }

  static bsMonthEndAd(year, month) {
    const days = this.daysInBsMonth(year, month);
    return NepaliDateTime.fromDateTime(new NepaliDateTime(year, month, days).toDateTime());
  }

  static isInBsMonth(adDate, year, month) {
    const bs = this.adToBs(adDate);
    return bs.year === year && bs.month === month;
  }
}

export default NepaliDateConverter;