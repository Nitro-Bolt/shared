type RGBObject = {
  // the red component, in the range [0, 255].
  readonly r: number;
  // the green component, in the range [0, 255].
  readonly g: number;
  // the blue component, in the range [0, 255].
  readonly b: number;
  // alpha component, in the range [0, 1].
  readonly a?: number;
};

type HSVObject = {
  // hue, in the range [0-359).
  readonly h: number;
  // saturation, in the range [0,1].
  readonly s: number;
  // value, in the range [0,1].
  readonly v: number;
};

type NotNaN<T extends number> = T extends number ? (number extends T ? number : T) : never;