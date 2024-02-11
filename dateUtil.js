export default class DateUtil {
  constructor() {
    // this.stringUtil = new StringUtil();
  }

  getWeekdays(data, options = {}) {
    let syntaxVariations = {
      monday: ["mon", "monday", "m", "mo", "1"],
      tuesday: ["tue", "tuesday", "tu", "t", "2"],
      wednesday: ["wed", "wednesday", "we", "w", "3"],
      thursday: ["thu", "thursday", "thur", "th", "4"],
      friday: ["fri", "friday", "fr", "f", "5"],
      saturday: ["sat", "saturday", "sa", "s", "6"],
      sunday: ["sun", "sunday", "su", "7"],
    };
    if (Array.isArray(data)) {
      let remove = options.remove
        ? options.remove.map((d) => this.getWeekdays(d))
        : [];
      if (options.sort) {
        return data
          .map((day) => this.getWeekdays(day))
          .filter((day, index, arr) => arr.indexOf(day) === index)
          .filter((day) => (remove.includes(day) ? false : true));
      }
      return Object.keys(syntaxVariations);
    } else if (typeof data === "object" && Object.keys(data).length === 0) {
      return this.objUtil.reduceToObj(this.getWeekdays([]), {});
    }

    let string = String(data).toLowerCase();

    for (let day in syntaxVariations) {
      if (syntaxVariations[day].includes(string)) {
        return day;
      }
    }
  }

  getMonths(data, options = {}) {
    let syntaxVariations = {
      january: ["january", "jan", "1"],
      february: ["february", "feb", "2"],
      march: ["march", "mar", "3"],
      april: ["april", "apr", "4"],
      may: ["may", "5"],
      june: ["june", "jun", "6"],
      july: ["july", "jul", "7"],
      august: ["august", "aug", "8"],
      september: ["september", "sep", "sept", "9"],
      october: ["october", "oct", "10"],
      november: ["november", "nov", "11"],
      december: ["december", "dec", "12"],
    };
    if (Array.isArray(data)) {
      if (options.sort) {
        return data
          .map((month) => this.getMonths(month))
          .filter((month, index, arr) => arr.indexOf(month) === index)
          .filter((month) => (remove.includes(month) ? false : true));
      }
      if (options.short) {
        return Object.keys(syntaxVariations).map(month => month.slice(0, 3));
      } else {
        return Object.keys(syntaxVariations)
      }
    } else if (typeof data === "object" && Object.keys(data).length === 0) {
      return this.objUtil.reduceToObj(this.getMonths([]), {});
    }

    let string = String(data).toLowerCase();
    for (let month in syntaxVariations) {
      if (syntaxVariations[month].includes(string)) {
        return options.short ? month.slice(0, 3) : month;
      }
    }
  }

  dateDifference(date1, date2) {
    // calculate the time difference in milliseconds
    let daysBetween = Math.abs(date1.getTime() - date2.getTime());
    // convert the time difference from milliseconds to days
    daysBetween = Math.ceil(daysBetween / (24 * 60 * 60 * 1000));
    return daysBetween;
  }

  getDayAndMonth(date, { short = false } = {}) {
    const dateObj = this.op(date).format();
    const day = dateObj.getDate(date);
    const month = dateObj.getMonth(date);
    return `${day} ${this.getMonths(month + 1, { short })}`;
  }

  /**
   * This function finds the next or previous order date!
   * @param {object} [dateFrom] - Provide a date object for the start date! For example today!
   * @param {Object} [options] - An options object for customization.
   * @param {boolean} [options.asDate = false] returns result as a date Object!
   * @param {boolean} [options.asArray = false] Return an array?
   * @param {boolean} [options.asDateMap = false] Return an object of date Ranges
   * @param {object} [options.dateTo = null] Will return complete day sequence between two dates if specified!
   * @returns {any} Depending on option selected 1.date, 2.array, 3.number
   */
  findDeliveryDate(
    dateFrom,
    options = {
      asDate: false,
      asArray: false,
      goBack: false,
      dateTo: null,
      asDateMap: false,
    }
  ) {
    const weekGuide = this.getWeekdays([]);
    dateFrom =
      typeof dateFrom === "object" ? dateFrom : this.op(dateFrom).format();
    let orderDays = storeSettings.orderDays.map(
      (day) => weekGuide.indexOf(day) + 1
    );
    let step = options.goBack ? -1 : 1;
    let i = dateFrom.getDay();
    let arr = [];
    let countDown = options.dateTo
      ? this.dateDifference(dateFrom, options.dateTo)
      : 0;

    //Fill an array with a range of weekdays matching the selected dates!
    arr.push(i);
    do {
      i += step;
      countDown !== 0 ? countDown-- : countDown;
      i > 7 ? (i = 1) : i;
      i < 1 ? (i = 7) : i;
      arr.push(i);
    } while (countDown !== 0 || !orderDays.includes(i));

    //If array has been selected as output
    if (options.asArray) {
      //If asDateMap is true convert dates to a map of weekly stats and estimates
      if (options.asDateMap) {
        let map = new Map();
        let dateStamp = new Date(dateFrom);
        let dateStampFormat;
        let properties = {};
        for (let i = 0; i < arr.length; i++) {
          const day = dateStamp.getDay();
          dateStampFormat = `${weekGuide[(day === 0 ? 7 : day) - 1]
            } <=> ${this.op(dateStamp).format()}`;
          map.set(dateStampFormat, properties);
          dateStamp = new Date(dateStamp.setDate(dateStamp.getDate() + 1));
        }

        return map;
      }
      return arr;
    }
    //if date has been selected as output
    if (options.asDate) {
      let date = new Date(dateFrom);
      if (options.goBack) {
        date = new Date(date.setDate(dateFrom.getDate() - arr.length - 1));
      }
      date = new Date(date.setDate(dateFrom.getDate() + arr.length - 1));
      return date;
    }
  }

  op(date) {
    this.result = date;
    return {
      format: ({ delimiter = "/", asString = false } = {}) => {
        if (typeof this.result === "object") {
          let del = delimiter;
          return `${this.result.getFullYear()}${del}${this.result.getMonth() + 1
            }${del}${this.result.getDate()}`;
        }
        let datePattern =
          /(?<normal>(?<day>\d{1,2})(?<d>\D+)(?<month>\d{1,2})\k<d>(?<year>\d{2,4}))|(?<reverse>(?<year1>\d{2,4})(?<d1>\D+)(?<month1>\d{1,2})\k<d1>(?<day1>\d{1,2}))/;

        let dateMatch = this.result.match(datePattern);
        if (!dateMatch) {
          alert("Wrong date format!");
        }

        let day, month, year;
        if (dateMatch.groups.normal) {
          [day, month, year] = [
            dateMatch.groups.day,
            dateMatch.groups.month,
            dateMatch.groups.year,
          ];
        } else if (dateMatch.groups.reverse) {
          [day, month, year] = [
            dateMatch.groups.day1,
            dateMatch.groups.month1,
            dateMatch.groups.year1,
          ];
        }
        let fullYearLength = 4;
        let yearStart = `${new Date().getFullYear()}`.slice(
          0,
          fullYearLength - `${year}`.length
        );
        year = `${yearStart}${year}`;
        return asString
          ? `${year}/${month}/${day}`
          : new Date(`${year}/${month}/${day}`);
      },

      fromISO(date) {
        const result = new Date(date);
        return `${result.getDate()}-${result.getMonth()}-${result.getFullYear()}`;
      },

      getMonday: (options = {}) => {
        let step = options.next ? 1 : -1;
        let date = this.result;
        if (typeof date !== "object") {
          date = this.op(date).format();
        }
        if (date.getDay() === 1 && !options.previous && !options.next) {
          return date;
        }
        date = new Date(date.setDate(date.getDate() + step));
        let day = date.getDay();
        while (day !== 1) {
          date = new Date(date.setDate(date.getDate() + step));
          day = date.getDay();
        }
        return options.string ? this.op(date).format() : date;
      },

      toCalendarInput: (date) => {
        if (typeof date !== "object") {
          date = this.op(date).format();
        }
        return `${date.getDate()}-${this.getMonth(
          date.getMonth()
        )}-${date.getFullYear()} - ${this.stringUtil.toPascalCase(
          this.getWeekdays(date.getDay() + 1)
        )}`;
      },
      getWeekSpread: ({ customWeek = null, string = false } = {}) => {
        if (typeof this.result !== "object") {
          this.result = this.op(this.result).format();
        }

        if (customWeek) {
          const weekdays = this.getWeekdays([]);
          return customWeek.map((day) => {
            let newDate = new Date(this.result);
            newDate.setDate(this.result.getDate() + weekdays.indexOf(day));
            newDate = string ? this.op(newDate).format() : newDate;
            return newDate;
          });
        }

        return Array(7)
          .fill(0)
          .map((_, index) => {
            let newDate = new Date(this.result);
            newDate.setDate(this.result.getDate() + index);
            newDate = string ? this.op(newDate).format() : newDate;
            return newDate;
          });
      },
    };
  }

  getDateOrdinal(num) {
    let number = String(num);
    const ordinals = {
      1: "st",
      21: "st",
      31: "st",
      2: "nd",
      22: "nd",
      3: "rd",
      23: "rd",
    };
    if (ordinals[number]) {
      return ordinals[number];
    } else if (num !== 0) {
      return "th";
    }
    return null;
  }

  consecutiveDays(daysArr) {
    let weekGuide = this.getWeekdays([]);
    daysArr = daysArr.sort(
      (a, b) => weekGuide.indexOf(a) - weekGuide.indexOf(b)
    );

    for (let day of daysArr) {
      let rotated = this.objUtil.rotateArr(weekGuide, { element: day });
      let backElement = this.objUtil.rotateArr(rotated, {
        left: false,
        amount: 1,
      })[0];
      let frontElement = this.objUtil.rotateArr(rotated, { amount: 1 })[0];
      if (!daysArr.includes(backElement) && !daysArr.includes(frontElement)) {
        return false;
      }
    }
    return true;
  }
}
