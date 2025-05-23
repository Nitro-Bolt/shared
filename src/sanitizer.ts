class Sanitizer {
  /**
   * Sanitizes unsafe values (null / undefined) out of an array.
   * @param arr Array to sanitize.
   * @param def Default value to replace null / undefined with.
   * @param nullAssign See {object}.
   * @returns Sanitized array.
   * NOTE: This does not mutate the original array.
   */
  static array (arr: unknown[], def?: string, nullAssign?: boolean): unknown[] {
      return arr.flatMap((val: unknown) => {
          // eslint-disable-next-line no-eq-null, eqeqeq
          if (val == null) return [];
          if (Array.isArray(val)) return [this.array(val, def)];
          if (typeof val !== 'object') return [val];
          // @ts-ignore
          return [this.object(val, def, nullAssign)];
      });
  }

  /**
   * Sanitizes unsafe values (null / undefined) out of an object.
   * @param obj Object to sanitize.
   * @param def Default value to replace null / undefined with.
   * @param nullAssign Should we assign the value to a null prototyped object?
   *                               this helps prevent prototype pollution attacks.
   * @returns Sanitized object.
   * NOTE: This mutates the original object.
   */
  static object (obj: {[key: string]: unknown}, def?: string, nullAssign?: boolean) {
      const keys: string[] = Object.keys(obj);
      for (let i: number = 0; i < keys.length; ++i) {
          obj[keys[i]] = this.value(obj[keys[i]], def);
      }
      if (nullAssign) return Object.assign(Object.create(null), obj);
      return obj;
  }

  /**
   * Sanitizes unsafe values (null / undefined) out of an array.
   * @param arr Array to sanitize.
   * @param def Default value to replace null / undefined with.
   * @param nullAssign See {object}.
   * @returns Sanitized map.
   * NOTE: This mutates the original map.
   */
  static map (map: Map<unknown, unknown>, def?: string, nullAssign?: boolean): Map<unknown, unknown> {
    for (const key of map.keys()) {
      // eslint-disable-next-line no-eq-null, eqeqeq
      if (key == null) {
        map.delete(key);
        continue;
      }
      map.set(key, this.value(map.get(key), def, nullAssign));
    }
    return map;
  }

  /**
   * Sanitizes unsafe values (null / undefined) out of an array.
   * @param val Value to sanitize.
   * @param def Default value to replace null / undefined with. Defaults to an empty string.
   * @param nullAssign See {object}. Defaults to true.
   * @returns Sanitized value.
   * NOTE: This *may* mutate the original value.
   */
  static value (val: unknown, def?: string, nullAssign?: boolean): unknown {
      def = def ?? '';
      nullAssign = nullAssign ?? true;
      // eslint-disable-next-line no-eq-null, eqeqeq
      if (val == null) return def; // This is done before the type check because of `undefined`.
      if (typeof val !== 'object') return val;
      if (Array.isArray(val)) return this.array(val, def, nullAssign);
      if (val instanceof Map) return this.map(val, def, nullAssign);
      // @ts-ignore
      return this.object(val, def, nullAssign);
  }

  /**
   * Sanitizes unsafe values (null / undefined) out of an array.
   * @param val Value to attempt to parse.
   * @param def Default value to replace null / undefined with. Defaults to an empty string.
   * @param nullAssign See {object}. Defaults to true.
   * @returns Sanitized value.
   * NOTE: This *may* mutate the original value if it is not a string. @see {value}
   */
  static parseJSON (val: any, def?: string , nullAssign?: boolean): unknown {
    def = def ?? '';
    nullAssign = nullAssign ?? true;
    if (typeof val !== 'string') return this.value(val, def, nullAssign);
    try {
      val = JSON.parse(val, (_key: string, value: any) => this.value(value, def, nullAssign));
    } catch {
      val = def;
    }
    return this.value(val, def, nullAssign);
  }
}

export default Sanitizer;