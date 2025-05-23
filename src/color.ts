import './types';

class Color {
  public static get RGB_BLACK (): RGBObject {
    return {r: 0, g: 0, b: 0};
  }

  public static get RGB_WHITE (): RGBObject {
    return {r: 255, g: 255, b: 255};
  }

  /**
   * Convert a Scratch decimal color to a hex string, #RRGGBB.
   * @param decimal RGB color as a decimal.
   * @returns RGB color as #RRGGBB hex string.
   */
  static decimalToHex (decimal: number): string {
    if (decimal < 0) decimal += 0xFFFFFF + 1;
    let hex: number | string = Number(decimal).toString(16);
    /**@type {string}*/hex = `#${'000000'.substr(0, 6 - hex.length)}${hex}`;
    return hex;
  }

  /**
   * Convert a Scratch decimal color to an RGB color object.
   * @param decimal RGB color as decimal.
   * @returns rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
   */
  static decimalToRgb (decimal: number): RGBObject {
    const a: number = (decimal >> 24) & 0xFF;
    const r: number = (decimal >> 16) & 0xFF;
    const g: number = (decimal >> 8) & 0xFF;
    const b: number = decimal & 0xFF;
    return {r: r, g: g, b: b, a: a > 0 ? a : 255};
  }

  /**
   * Convert a hex color (e.g., F00, #03F, #0033FF) to an RGB color object.
   * @param hex Hex representation of the color.
   * @returns null on failure, or rgb: {r: red [0,255], g: green [0,255], b: blue [0,255]}.
   */
  public static hexToRgb (hex: string): RGBObject | null {
    if (hex.startsWith('#')) hex = hex.substring(1);
    const parsed = parseInt(hex, 16);
    if (isNaN(parsed)) return null;
    if (hex.length === 6) {
      return {
        r: (parsed >> 16) & 0xff,
        g: (parsed >> 8) & 0xff,
        b: parsed & 0xff
      };
    } else if (hex.length === 3) {
      const r = ((parsed >> 8) & 0xf);
      const g = ((parsed >> 4) & 0xf);
      const b = parsed & 0xf;
      return {
        r: (r << 4) | r,
        g: (g << 4) | g,
        b: (b << 4) | b
      };
    }
    return null;
  }

  /**
   * Convert an RGB color object to a hex color.
   * @param rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
   * @returns Hex representation of the color.
   */
  public static rgbToHex (rgb: RGBObject): string {
    return this.decimalToHex(this.rgbToDecimal(rgb));
  }

  /**
   * Convert an RGB color object to a Scratch decimal color.
   * @param rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
   * @returns Number representing the color.
   */
  public static rgbToDecimal (rgb: RGBObject): number {
    return (rgb.r << 16) + (rgb.g << 8) + rgb.b;
  }

  /**
  * Convert a hex color (e.g., F00, #03F, #0033FF) to a decimal color number.
  * @param hex - Hex representation of the color.
  * @returns Number representing the color.
  */
  public static hexToDecimal (hex: string) {
    // @ts-expect-error
    return this.rgbToDecimal(this.hexToRgb(hex));
  }

  /**
   * Convert an HSV color to RGB format.
   * @param hsv - {h: hue [0,360), s: saturation [0,1], v: value [0,1]}
   * @returns rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
   */
  public static hsvToRgb (hsv: HSVObject): RGBObject {
    let h: number = hsv.h % 360;
    if (h < 0) h += 360;
    const s: number = Math.max(0, Math.min(hsv.s, 1));
    const v: number = Math.max(0, Math.min(hsv.v, 1));

    const i: number = Math.floor(h / 60);
    const f: number = (h / 60) - i;
    const p: number = v * (1 - s);
    const q: number = v * (1 - (s * f));
    const t: number = v * (1 - (s * (1 - f)));

    let r: number;
    let g: number;
    let b: number;

    switch (i) {
    default:
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
    }

    return {
      r: Math.floor(r * 255),
      g: Math.floor(g * 255),
      b: Math.floor(b * 255)
    };
  }

  /**
   * Convert an RGB color to HSV format.
   * @param rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
   * @returns hsv - {h: hue [0,360), s: saturation [0,1], v: value [0,1]}
   */
  public static rgbToHsv (rgb: RGBObject): HSVObject {
    const r: number = rgb.r / 255;
    const g: number = rgb.g / 255;
    const b: number = rgb.b / 255;
    const x: number = Math.min(Math.min(r, g), b);
    const v: number = Math.max(Math.max(r, g), b);

    // For grays, hue will be arbitrarily reported as zero. Otherwise, calculate
    let h: number = 0;
    let s: number = 0;
    if (x !== v) {
      const f: number = (r === x) ? g - b : ((g === x) ? b - r : r - g);
      const i: number = (r === x) ? 3 : ((g === x) ? 5 : 1);
      h = ((i - (f / (v - x))) * 60) % 360;
      s = (v - x) / v;
    }

    return {h: h, s: s, v: v};
  }

  /**
   * Linear interpolation between rgb0 and rgb1.
   * @param rgb0 - the color corresponding to fraction1 <= 0.
   * @param rgb1 - the color corresponding to fraction1 >= 1.
   * @param fraction1 - the interpolation parameter. If this is 0.5, for example, mix the two colors equally.
   * @returns the interpolated color.
   */
  public static mixRgb (rgb0: RGBObject, rgb1: RGBObject, fraction1: number): RGBObject {
    if (fraction1 <= 0) return rgb0;
    if (fraction1 >= 1) return rgb1;
    const fraction0: number = 1 - fraction1;
    return {
      r: (fraction0 * rgb0.r) + (fraction1 * rgb1.r),
      g: (fraction0 * rgb0.g) + (fraction1 * rgb1.g),
      b: (fraction0 * rgb0.b) + (fraction1 * rgb1.b)
    };
  }

  // This class is not constructable :innocent:
  private constructor() {}
}

export default Color;