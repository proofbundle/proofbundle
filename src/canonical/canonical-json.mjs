// Canonical JSON: a strict parser into one admitted semantic-value domain,
// plus a canonical byte serializer for that domain, following RFC 8785
// (JSON Canonicalization Scheme) for the parts of the standard implemented
// here.
//
// Admitted semantic value domain (the ONLY values this module accepts):
//   null | boolean | finite number | string (valid Unicode, no lone
//   surrogate) | Array<Value> | Map<string, Value>
//
// Objects are represented as Map, not plain JS objects, specifically
// because a plain object cannot represent "these two keys collided" — by
// the time JSON.parse has built a plain object, the collision is already
// gone. Using a Map lets the parser build up entries one at a time and
// throw the instant a second occurrence of the same key arrives, which is
// the only place a duplicate key can be honestly detected.
//
// SCOPE: number canonicalization is exact for safe integers (minimal
// decimal digits, no leading zeros, negative zero normalized to "0" per
// RFC 8785 §3.2.2.3). Non-integer finite numbers are serialized via the
// platform's native Number-to-String conversion, which on a
// spec-compliant engine already implements the ECMA-262 ToString
// algorithm RFC 8785 itself mandates — this is not a hand-rolled
// alternative, it is the same algorithm the RFC points to. What is NOT
// implemented here: RFC 8785's exact escaping table beyond the mandatory
// control characters and the two structural quote/backslash cases (this
// covers every string JSON can express; it does not yet special-case
// every RFC 8785 "MAY escape" cosmetic choice a producer is permitted but
// not required to make).

import { hasLoneSurrogate } from '../bytes/utf8.mjs';

// ---------------------------------------------------------------- parsing

class ParseError extends RangeError {
  constructor(message, pos) {
    super(`canonical-json parse error at offset ${pos}: ${message}`);
    this.name = 'ParseError';
    this.offset = pos;
  }
}

// Explicit recursion-depth bound. Without this, nesting depth is limited
// only by the host engine's call stack, which fails as an uncaught,
// unclassified error rather than a deterministic MALFORMED/LIMIT_EXCEEDED
// verdict — the exact "resource exhaustion excludes VERIFIED, but must be
// a classified verdict, not a crash" property the spec requires. 512 is
// deep enough for any realistic document and shallow enough to never
// approach V8's actual stack limit, so this bound is what fires, not the
// engine's.
export const DEFAULT_MAX_DEPTH = 512;

export function strictParseJSON(text, { maxDepth = DEFAULT_MAX_DEPTH } = {}) {
  if (typeof text !== 'string') throw new TypeError('strictParseJSON: expected a string');
  const p = new Parser(text, maxDepth);
  p.skipWhitespace();
  const value = p.parseValue();
  p.skipWhitespace();
  if (p.pos !== text.length) throw new ParseError('trailing data after JSON value', p.pos);
  return value;
}

class Parser {
  constructor(text, maxDepth = DEFAULT_MAX_DEPTH) {
    this.text = text;
    this.pos = 0;
    this.maxDepth = maxDepth;
    this.depth = 0;
  }

  peek() { return this.text[this.pos]; }

  expect(ch) {
    if (this.text[this.pos] !== ch) {
      throw new ParseError(`expected '${ch}', got ${JSON.stringify(this.text[this.pos] ?? '<eof>')}`, this.pos);
    }
    this.pos++;
  }

  skipWhitespace() {
    while (this.pos < this.text.length && ' \t\n\r'.includes(this.text[this.pos])) this.pos++;
  }

  parseValue() {
    if (this.pos >= this.text.length) throw new ParseError('unexpected end of input', this.pos);
    const ch = this.text[this.pos];
    if (ch === '{' || ch === '[') {
      this.depth++;
      if (this.depth > this.maxDepth) {
        throw new ParseError(`maximum nesting depth exceeded (limit ${this.maxDepth})`, this.pos);
      }
      try {
        return ch === '{' ? this.parseObject() : this.parseArray();
      } finally {
        this.depth--;
      }
    }
    if (ch === '"') return this.parseString();
    if (ch === 't' || ch === 'f') return this.parseBoolean();
    if (ch === 'n') return this.parseNull();
    if (ch === '-' || (ch >= '0' && ch <= '9')) return this.parseNumber();
    throw new ParseError(`unexpected character ${JSON.stringify(ch)}`, this.pos);
  }

  parseObject() {
    this.expect('{');
    const map = new Map();
    this.skipWhitespace();
    if (this.peek() === '}') { this.pos++; return map; }
    for (;;) {
      this.skipWhitespace();
      if (this.peek() !== '"') throw new ParseError('expected string key', this.pos);
      const key = this.parseString();
      this.skipWhitespace();
      this.expect(':');
      this.skipWhitespace();
      const value = this.parseValue();
      if (map.has(key)) throw new ParseError(`duplicate object key ${JSON.stringify(key)}`, this.pos);
      map.set(key, value);
      this.skipWhitespace();
      const c = this.peek();
      if (c === ',') { this.pos++; continue; }
      if (c === '}') { this.pos++; break; }
      throw new ParseError(`expected ',' or '}' in object`, this.pos);
    }
    return map;
  }

  parseArray() {
    this.expect('[');
    const arr = [];
    this.skipWhitespace();
    if (this.peek() === ']') { this.pos++; return arr; }
    for (;;) {
      this.skipWhitespace();
      arr.push(this.parseValue());
      this.skipWhitespace();
      const c = this.peek();
      if (c === ',') { this.pos++; continue; }
      if (c === ']') { this.pos++; break; }
      throw new ParseError(`expected ',' or ']' in array`, this.pos);
    }
    return arr;
  }

  parseString() {
    this.expect('"');
    let out = '';
    for (;;) {
      if (this.pos >= this.text.length) throw new ParseError('unterminated string', this.pos);
      const ch = this.text[this.pos];
      const code = this.text.charCodeAt(this.pos);
      if (code < 0x20) throw new ParseError('unescaped control character in string', this.pos);
      if (ch === '"') { this.pos++; break; }
      if (ch === '\\') {
        this.pos++;
        const esc = this.text[this.pos];
        if (esc === undefined) throw new ParseError('unterminated escape', this.pos);
        switch (esc) {
          case '"': out += '"'; this.pos++; break;
          case '\\': out += '\\'; this.pos++; break;
          case '/': out += '/'; this.pos++; break;
          case 'b': out += '\b'; this.pos++; break;
          case 'f': out += '\f'; this.pos++; break;
          case 'n': out += '\n'; this.pos++; break;
          case 'r': out += '\r'; this.pos++; break;
          case 't': out += '\t'; this.pos++; break;
          case 'u': {
            this.pos++;
            const hex = this.text.slice(this.pos, this.pos + 4);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new ParseError('invalid \\u escape', this.pos);
            out += String.fromCharCode(parseInt(hex, 16));
            this.pos += 4;
            break;
          }
          default: throw new ParseError(`invalid escape '\\${esc}'`, this.pos);
        }
      } else {
        out += ch;
        this.pos++;
      }
    }
    if (hasLoneSurrogate(out)) throw new ParseError('string contains an unpaired surrogate', this.pos);
    return out;
  }

  parseBoolean() {
    if (this.text.startsWith('true', this.pos)) { this.pos += 4; return true; }
    if (this.text.startsWith('false', this.pos)) { this.pos += 5; return false; }
    throw new ParseError('invalid literal', this.pos);
  }

  parseNull() {
    if (this.text.startsWith('null', this.pos)) { this.pos += 4; return null; }
    throw new ParseError('invalid literal', this.pos);
  }

  parseNumber() {
    const start = this.pos;
    if (this.peek() === '-') this.pos++;
    if (this.peek() === '0') {
      this.pos++;
    } else if (this.peek() >= '1' && this.peek() <= '9') {
      while (this.peek() >= '0' && this.peek() <= '9') this.pos++;
    } else {
      throw new ParseError('invalid number: expected digit', this.pos);
    }
    if (this.peek() === '.') {
      this.pos++;
      if (!(this.peek() >= '0' && this.peek() <= '9')) throw new ParseError('invalid number: digit required after decimal point', this.pos);
      while (this.peek() >= '0' && this.peek() <= '9') this.pos++;
    }
    if (this.peek() === 'e' || this.peek() === 'E') {
      this.pos++;
      if (this.peek() === '+' || this.peek() === '-') this.pos++;
      if (!(this.peek() >= '0' && this.peek() <= '9')) throw new ParseError('invalid number: digit required in exponent', this.pos);
      while (this.peek() >= '0' && this.peek() <= '9') this.pos++;
    }
    const literal = this.text.slice(start, this.pos);
    const num = Number(literal);
    if (!Number.isFinite(num)) throw new ParseError('number literal is not finite (forbidden)', start);
    return num;
  }
}

// ------------------------------------------------------------ canonicalize

export function canonicalizeValue(value) {
  return utf8EncodeString(canonicalizeToString(value));
}

function canonicalizeToString(value) {
  if (value === null) return 'null';
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (typeof value === 'number') return canonicalNumber(value);
  if (typeof value === 'string') return canonicalString(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalizeToString).join(',') + ']';
  if (value instanceof Map) {
    const keys = [...value.keys()].sort(compareUtf16);
    const seen = new Set();
    for (const k of keys) {
      if (seen.has(k)) throw new TypeError('canonicalizeValue: duplicate key in Map (invariant violation)');
      seen.add(k);
    }
    return '{' + keys.map((k) => canonicalString(k) + ':' + canonicalizeToString(value.get(k))).join(',') + '}';
  }
  throw new TypeError(`canonicalizeValue: value is not in the admitted domain (got ${typeToLabel(value)})`);
}

function typeToLabel(v) {
  if (v === undefined) return 'undefined';
  if (typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Map)) return 'plain object (use Map for objects)';
  return typeof v;
}

// RFC 8785 §3.2.3: object keys are ordered by comparing UTF-16 code units.
function compareUtf16(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function canonicalNumber(n) {
  if (!Number.isFinite(n)) throw new RangeError('canonicalizeValue: non-finite number is forbidden');
  if (Object.is(n, -0)) return '0'; // RFC 8785 §3.2.2.3: -0 canonicalizes as 0.
  if (Number.isInteger(n) && Number.isSafeInteger(n)) return n.toString(10);
  return String(n); // ECMA-262 Number::toString — the algorithm RFC 8785 itself specifies.
}

function canonicalString(str) {
  if (typeof str !== 'string') throw new TypeError('canonicalString: expected a string');
  if (hasLoneSurrogate(str)) throw new RangeError('canonicalString: unpaired surrogate is forbidden');
  let out = '"';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    const ch = str[i];
    if (ch === '"') out += '\\"';
    else if (ch === '\\') out += '\\\\';
    else if (code === 0x08) out += '\\b';
    else if (code === 0x0c) out += '\\f';
    else if (code === 0x0a) out += '\\n';
    else if (code === 0x0d) out += '\\r';
    else if (code === 0x09) out += '\\t';
    else if (code < 0x20) out += '\\u' + code.toString(16).padStart(4, '0');
    else out += ch;
  }
  return out + '"';
}

function utf8EncodeString(str) {
  return new TextEncoder().encode(str);
}

// Convenience: parse text straight to canonical bytes in one call.
export function canonicalizeText(text) {
  return canonicalizeValue(strictParseJSON(text));
}
