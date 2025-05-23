import Color from './color';
import Sanitizer from './sanitizer';

/**
 * @fileoverview
 * Utilities for casting and comparing Scratch data-types.
 * Scratch behaves slightly differently from JavaScript in many respects,
 * and these differences should be encapsulated below.
 * For example, in Scratch, add(1, join("hello", world")) -> 1.
 * This is because "hello world" is cast to 0.
 * In JavaScript, 1 + Number("hello" + "world") would give you NaN.
 * Use when coercing a value before computation.
 */

class Cast {
  /**
   * Used internally by compare()
   * @param val A value that evaluates to 0 in JS string-to-number conversation such as empty string, 0, or tab.
   * @returns True if the value should not be treated as the number zero.
   */
  private static isNotActuallyZero(val: any): boolean {
    if (typeof val !== 'string') return false;
    for (let i = 0; i < val.length; i++) {
        const code = val.charCodeAt(i);
        // '0'.charCodeAt(0) === 48
        // '\t'.charCodeAt(0) === 9
        // We include tab for compatibility with scratch-www's broken trim() polyfill.
        // https://github.com/TurboWarp/scratch-vm/issues/115
        // https://scratch.mit.edu/projects/788261699/
        if (code === 48 || code === 9) {
            return false;
        }
    }
    return true;
  }

  /**
   * Scratch cast to number.
   * Treats NaN as 0.
   * In Scratch 2.0, this is captured by `interp.numArg.`
   * @param value Value to cast to number.
   * @returns The Scratch-casted number value.
   */
  public static toNumber (value: unknown): NotNaN<number> {
      // If value is already a number we don't need to coerce it with
      // Number().
      if (typeof value === 'number') {
        // Scratch treats NaN as 0, when needed as a number.
        // E.g., 0 + NaN -> 0.
        if (Number.isNaN(value)) return 0;
        return value;
      }
      const n = Number(value);
      if (Number.isNaN(n)) {
        // Scratch treats NaN as 0, when needed as a number.
        // E.g., 0 + NaN -> 0.
        return 0;
      }
      return n;
  }

  /**
   * Scratch cast to boolean.
   * In Scratch 2.0, this is captured by `interp.boolArg.`
   * Treats some string values differently from JavaScript.
   * @param value Value to cast to boolean.
   * @returns The Scratch-casted boolean value.
   */
  public static toBoolean (value: any): boolean {
    // Already a boolean?
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      // These specific strings are treated as false in Scratch.
      if ((value === '') ||
        (value === '0') ||
        (value.toLowerCase() === 'false')) {
        return false;
      }
      // All other strings treated as true.
      return true;
    }
    // Coerce other values and numbers.
    return Boolean(value);
  }

  /**
   * Scratch cast to string.
   * @param value Value to cast to string.
   * @returns The Scratch-casted string value.
   */
  public static toString (value: any): string {
    return String(value);
  }

  /**
   * Cast any Scratch argument to an RGB color array to be used for the renderer.
   * @param value Value to convert to RGB color array.
   * @returns [r,g,b], values between 0-255.
   */
  public static toRgbColorList (value: any): number[] {
    const color = this.toRgbColorObject(value);
    return [color.r, color.g, color.b];
  }

  /**
   * Cast any Scratch argument to an RGB color object to be used for the renderer.
   * @param value Value to convert to RGB color object.
   * @returns [r,g,b], values between 0-255.
   */
  public static toRgbColorObject (value: any): RGBObject {
    let color: RGBObject | null;
    if (typeof value === 'string' && value.substring(0, 1) === '#') {
      color = Color.hexToRgb(value);
      // If the color wasn't *actually* a hex color, cast to black
      if (!color) color = {r: 0, g: 0, b: 0, a: 255};
    } else {
      color = Color.decimalToRgb(this.toNumber(value));
    }
    return color;
  }

  /**
   * Determine if a Scratch argument is a white space string (or null / empty).
   * @param val value to check.
   * @returns True if the argument is all white spaces or null / empty.
   */
  public static isWhiteSpace (val: any): boolean {
    return val === null || (typeof val === 'string' && val.trim().length === 0);
  }

  /**
   * Compare two values, using Scratch cast, case-insensitive string compare, etc.
   * In Scratch 2.0, this is captured by `interp.compare.`
   * @param v1 First value to compare.
   * @param v2 Second value to compare.
   * @returns Negative number if v1 < v2; 0 if equal; positive otherwise.
   */
  public static compare (v1: any, v2: any): number {
    let n1: number = Number(v1);
    let n2: number = Number(v2);
    if (n1 === 0 && this.isNotActuallyZero(v1)) {
        n1 = NaN;
    } else if (n2 === 0 && this.isNotActuallyZero(v2)) {
        n2 = NaN;
    }
    if (isNaN(n1) || isNaN(n2)) {
      // At least one argument can't be converted to a number.
      // Scratch compares strings as case insensitive.
      const s1: string = String(v1).toLowerCase();
      const s2: string = String(v2).toLowerCase();
      if (s1 < s2) return -1;
      else if (s1 > s2) return 1;
      return 0;
    }
    // Handle the special case of Infinity
    if (
      (n1 === Infinity && n2 === Infinity) ||
      (n1 === -Infinity && n2 === -Infinity)
    ) {
      return 0;
    }
    // Compare as numbers.
    return n1 - n2;
  }

  /**
   * Determine if a Scratch argument number represents a round integer.
   * @param val Value to check.
   * @returns True if number looks like an integer.
   */
  static isInt (val: any): boolean {
    // Values that are already numbers.
    if (typeof val === 'number') {
      if (isNaN(val)) { // NaN is considered an integer.
        return true;
      }
      // True if it's "round" (e.g., 2.0 and 2).
      return val === Math.floor(val);
    } else if (typeof val === 'boolean') {
      // `True` and `false` always represent integer after Scratch cast.
      return true;
    } else if (typeof val === 'string') {
      // If it contains a decimal point, don't consider it an int.
      return val.indexOf('.') < 0;
    }
    return false;
  }

  public static get LIST_INVALID (): 'INVALID' {
    return 'INVALID';
  }

  public static get LIST_ALL (): 'ALL' {
      return 'ALL';
  }

  /**
   * Compute a 1-based index into a list, based on a Scratch argument.
   * Two special cases may be returned:
   * LIST_ALL: if the block is referring to all of the items in the list.
   * LIST_INVALID: if the index was invalid in any way.
   * @param index Scratch arg, including 1-based numbers or special cases.
   * @param length Length of the list.
   * @param acceptAll Whether it should accept "all" or not.
   * @returns 1-based index for list, LIST_ALL, or LIST_INVALID.
   */
  static toListIndex (index: any, length: number, acceptAll: boolean): number | string {
    if (typeof index !== 'number') {
      if (index === 'all') return acceptAll ? this.LIST_ALL : this.LIST_INVALID;
      if (index === 'last') {
        if (length > 0) return length;
        return this.LIST_INVALID;
      } else if (index === 'random' || index === 'any') {
        if (length > 0) return 1 + Math.floor(Math.random() * length);
        return this.LIST_INVALID;
      }
    }
    index = Math.floor(this.toNumber(index));
    if (index < 1 || index > length) return this.LIST_INVALID;
    return index;
  }

  // NB: More casting utilities.
  /**
   * Convert's a translatable menu value to a index or a string.
   * @param value Item in valid format.
   * @param count Modulo value. this is optional.
   * @param valid Optional valid options. in all lowercase.
   * @returns The casted option.
   * NOTE: If you use valid, make sure you handle translation support correctly;
   *       make sure the items are all lowercase.
   */
  public static asNumberedItem (value: string | number, count?: number, valid?: string[]): string {
    // eslint-disable-next-line spaced-comment
    /**!
     * This code is modified and borrowed from the following code.
     * @see https://raw.githubusercontent.com/surv-is-a-dev/surv-is-a-dev.github.io/fa453c76e2bcc2ceed87cc4c9af4ee2951886139/static/0001tt.txt
     * It is used as a reference to handle the numbered dropdown values.
     */
    if (typeof value === 'number') {
      count = count ?? (valid && valid.length) ?? 0;
      value = ((+value % (1 + count || 1)) || 1);
      if (!valid) return value.toString();
      // Disable === null and === checks because `== null` passes if the value is
      // null or undefined, which is what we want.
      // eslint-disable-next-line no-eq-null, eqeqeq
      if (valid[value] == null) return '1'; // Fallback to 1 if the value is null / undefined.
      return value.toString(); // The index is valid so we can just return it.
    }
    value = this.toString(value).toLowerCase();
    if (value[0] !== '(') return value;
    const match = value.match(/^\([0-9]+\) ?/); // The space is optional for the sake of ease.
    if (match && match[0]) {
      let v = parseInt(match[0].trim().slice(1, -1), 10);
      if (count) v = ((v % (1 + count || 1)) || 1);
      if (!valid) return v.toString();
      // See above.
      // eslint-disable-next-line no-eq-null, eqeqeq
      if (valid[+value] == null) return '1';
      return v.toString();
    }
    if (valid && valid.indexOf(value.toLowerCase()) === -1) return '1'; // Fallback to 1 if the item is not valid.
    return value;
  }

  /**
   * Determine if a Scratch argument number represents a big integer. (BigInt)
   * This treats normal integers as valid BigInts. @see {isInt}
   * @param val Value to check.
   * @returns True if number looks like an integer.
   */
  public static isBigInt (val: any): boolean {
    return (typeof val === 'bigint') || this.isInt(val);
  }

  /**
   * Scratch cast to BigInt.
   * Treats NaN-likes as 0. Floats are truncated.
   * @param value Value to cast to BigInt.
   * @returns The Scratch-casted BigInt value.
   */
  public static toBigInt (value: any): bigint {
    // If the value is already a BigInt then we don't have to do anything.
    if (typeof value === 'bigint') return value;
    // Handle NaN like value's as BigInt will throw an error if it cannot coerce the value.
    if (isNaN(value)) return 0n;
    // Same with floats.
    if (!this.isBigInt(value)) value = Math.trunc(value);
    // eslint-disable-next-line no-undef
    return BigInt(value);
  }

  /**
   * Scratch cast to Object.
   * @param value Value to cast to Object.
   * @param noBad Should null and undefined be disabled? Defaults to false.
   * @param nullAssign See {Sanitizer.object}. Defaults to false.
   * @returns The Scratch-casted Object value.
   */
  public static toObjectLike (value: any, noBad?: boolean, nullAssign?: boolean): object {
    noBad = noBad ?? false;
    nullAssign = nullAssign ?? false;
    // eslint-disable-next-line no-eq-null, eqeqeq
    if (value == null && noBad) return nullAssign ? Object.create(null) : {};
    // @ts-expect-error
    if (typeof value === 'object') return noBad ? Sanitizer.value(value, '', nullAssign) : value;
    if (typeof value !== 'string' || value === '') return nullAssign ? Object.create(null) : {};
    try {
      if (noBad) {
          value = Sanitizer.parseJSON(value, '', nullAssign);
      } else value = JSON.parse(value);
    } catch {
      value = nullAssign ? Object.create(null) : {};
    }
    return this.toObjectLike(value, noBad, nullAssign);
  }

  /**
   * Scratch cast to an Object.
   * Treats null, undefined and arrays as empty objects.
   * @param value Value to cast to Object.
   * @returns The Scratch-casted Object value.
   */
  public static toObject (value: any): object {
    if (typeof value === 'object') {
      // eslint-disable-next-line no-eq-null, eqeqeq
      if (Array.isArray(value) || value == null) return Object.create(null);
      return Sanitizer.object(value, '', true); // This doesn't take into account for other Object typed values.
    }
    return this.toObject(this.toObjectLike(value, true, true));
  }

  /**
   * Scratch cast to an Array.
   * Treats null, undefined and objects as empty arrays.
   * @param value Value to cast to Array.
   * @return The Scratch-casted Array value.
   */
  public static toArray (value: any): unknown[] {
    if (Array.isArray(value)) return Sanitizer.array(value, '');
    // eslint-disable-next-line no-eq-null, eqeqeq
    if (typeof value === 'object' && value != null) {
      try {
        value = Array.from(value);
      } catch {
        value = [];
      }
      return this.toArray(value); // Just in case.
    }
    return this.toArray(this.toObjectLike(value, true, true));
  }

  /**
   * Scratch cast to a Map.
   * Treats null and undefined as empty maps.
   * @param {*} value Value to cast to Map.
   * @return {map} The Scratch-casted Map value.
   * NOTE: This is an alternative to `toObject`.
   */
  public static toMap (value: Map<unknown, unknown>): Map<unknown, unknown> {
    if (value instanceof Map) return Sanitizer.map(value, '', true);
    // This is done to handle null / undefined values popping up in our values.
    let inter: any = this.toObjectLike(Sanitizer.value(value, '', true), true);
    try {
      if (!Array.isArray(value)) {
          if (typeof value === 'object') inter = Object.entries(value);
          else inter = [];
      }
      inter = this.toArray(inter); // Cast the value to an array.
      return Sanitizer.map(new Map(inter), '', true);
    } catch {
      return new Map();
    }
  }
}

export default Cast;