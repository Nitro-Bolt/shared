import Color from './color';

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
}

export default Cast;