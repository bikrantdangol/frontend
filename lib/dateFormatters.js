import NepaliDateConverter from './nepaliDateConverter';

class DateFormatters {
  static formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  static formatDateTime(dateTime) {
    return `${dateTime.toISOString().slice(0, 16)}`.replace('T', ' ');
  }

  static formatAdDate(date) {
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  static formatBsDate(adDate) {
    try {
      const bs = NepaliDateConverter.adToBs(adDate);
      return `${bs.day} ${bs.monthName} ${bs.year} BS`;
    } catch (error) {
      return this.formatAdDate(adDate);
    }
  }

  static formatBsDayMonth(adDate) {
    try {
      const bs = NepaliDateConverter.adToBs(adDate);
      return `${bs.day} ${bs.monthName}`;
    } catch (error) {
      return adDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    }
  }

  static formatDualDate(adDate) {
    try {
      const bs = NepaliDateConverter.adToBs(adDate);
      const adStr = this.formatAdDate(adDate);
      return `${bs.day} ${bs.monthName} ${bs.year} BS  •  ${adStr} AD`;
    } catch (error) {
      return this.formatAdDate(adDate);
    }
  }
}

export default DateFormatters;