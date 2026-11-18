import { assertWellFormedUnicode, utf8 } from './bytes.mjs';
import { ProofBundleError, Verdict } from './errors.mjs';

function invalid(message) {
  throw new ProofBundleError(Verdict.MALFORMED, message);
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function serialize(value, path) {
  if (value === null) return 'null';
  if (value === true) return 'true';
  if (value === false) return 'false';

  if (typeof value === 'string') {
    assertWellFormedUnicode(value, path);
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) invalid(`${path} contains a non-finite number`);
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
      invalid(`${path} contains an integer outside the interoperable IEEE-754 safe range`);
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const parts = [];
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) invalid(`${path}[${index}] is an array hole`);
      parts.push(serialize(value[index], `${path}[${index}]`));
    }
    return `[${parts.join(',')}]`;
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    const members = [];
    for (const key of keys) {
      assertWellFormedUnicode(key, `${path} key`);
      members.push(`${JSON.stringify(key)}:${serialize(value[key], `${path}.${key}`)}`);
    }
    return `{${members.join(',')}}`;
  }

  invalid(`${path} contains a value that JCS cannot represent`);
}

export function canonicalizeJson(value) {
  return serialize(value, '$');
}

export function canonicalizeJsonBytes(value) {
  return utf8(canonicalizeJson(value));
}

class StrictJsonParser {
  constructor(source) {
    this.source = source;
    this.offset = 0;
  }

  error(message) {
    invalid(`invalid JSON at UTF-16 index ${this.offset}: ${message}`);
  }

  skipWhitespace() {
    while (this.offset < this.source.length && /[\u0009\u000a\u000d\u0020]/.test(this.source[this.offset])) {
      this.offset += 1;
    }
  }

  parse() {
    this.skipWhitespace();
    const value = this.parseValue('$');
    this.skipWhitespace();
    if (this.offset !== this.source.length) this.error('trailing data');
    return value;
  }

  parseValue(path) {
    this.skipWhitespace();
    const c = this.source[this.offset];
    if (c === '"') return this.parseString(path);
    if (c === '{') return this.parseObject(path);
    if (c === '[') return this.parseArray(path);
    if (c === 't') return this.parseLiteral('true', true);
    if (c === 'f') return this.parseLiteral('false', false);
    if (c === 'n') return this.parseLiteral('null', null);
    if (c === '-' || (c >= '0' && c <= '9')) return this.parseNumber(path);
    this.error('expected a JSON value');
  }

  parseLiteral(token, value) {
    if (this.source.slice(this.offset, this.offset + token.length) !== token) {
      this.error(`expected ${token}`);
    }
    this.offset += token.length;
    return value;
  }

  parseString(path) {
    const start = this.offset;
    this.offset += 1;
    let escaped = false;
    while (this.offset < this.source.length) {
      const code = this.source.charCodeAt(this.offset);
      const c = this.source[this.offset];
      if (!escaped && c === '"') {
        this.offset += 1;
        let decoded;
        try {
          decoded = JSON.parse(this.source.slice(start, this.offset));
        } catch {
          this.error('invalid string escape');
        }
        assertWellFormedUnicode(decoded, path);
        return decoded;
      }
      if (!escaped && code < 0x20) this.error('unescaped control character in string');
      if (escaped) {
        if (c === 'u') {
          const hex = this.source.slice(this.offset + 1, this.offset + 5);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) this.error('invalid Unicode escape');
          this.offset += 4;
        } else if (!'"\\/bfnrt'.includes(c)) {
          this.error('invalid string escape');
        }
        escaped = false;
      } else if (c === '\\') {
        escaped = true;
      }
      this.offset += 1;
    }
    this.error('unterminated string');
  }

  parseNumber(path) {
    const match = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(
      this.source.slice(this.offset),
    );
    if (!match) this.error('invalid number');
    this.offset += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) invalid(`${path} parses outside the finite IEEE-754 range`);
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
      invalid(`${path} parses outside the interoperable IEEE-754 safe-integer range`);
    }
    return value;
  }

  parseArray(path) {
    this.offset += 1;
    this.skipWhitespace();
    const result = [];
    if (this.source[this.offset] === ']') {
      this.offset += 1;
      return result;
    }
    while (true) {
      result.push(this.parseValue(`${path}[${result.length}]`));
      this.skipWhitespace();
      const c = this.source[this.offset];
      if (c === ']') {
        this.offset += 1;
        return result;
      }
      if (c !== ',') this.error('expected comma or closing bracket');
      this.offset += 1;
      this.skipWhitespace();
    }
  }

  parseObject(path) {
    this.offset += 1;
    this.skipWhitespace();
    const result = Object.create(null);
    const keys = new Set();
    if (this.source[this.offset] === '}') {
      this.offset += 1;
      return result;
    }
    while (true) {
      if (this.source[this.offset] !== '"') this.error('expected an object member name');
      const key = this.parseString(`${path} key`);
      if (keys.has(key)) invalid(`${path} contains duplicate member name ${JSON.stringify(key)}`);
      keys.add(key);
      this.skipWhitespace();
      if (this.source[this.offset] !== ':') this.error('expected colon');
      this.offset += 1;
      result[key] = this.parseValue(`${path}.${key}`);
      this.skipWhitespace();
      const c = this.source[this.offset];
      if (c === '}') {
        this.offset += 1;
        return result;
      }
      if (c !== ',') this.error('expected comma or closing brace');
      this.offset += 1;
      this.skipWhitespace();
    }
  }
}

export function parseJsonStrict(source) {
  if (typeof source !== 'string') invalid('JSON source must be a string');
  assertWellFormedUnicode(source, 'JSON source');
  return new StrictJsonParser(source).parse();
}

export function canonicalizeJsonSource(source) {
  return canonicalizeJson(parseJsonStrict(source));
}
