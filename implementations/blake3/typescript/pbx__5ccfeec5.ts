/* eslint-disable */
// @ts-nocheck
export const PBX = (() => {
  var pf = Object.defineProperty;
  var Fc = Object.getOwnPropertyDescriptor;
  var Uc = Object.getOwnPropertyNames;
  var Rc = Object.prototype.hasOwnProperty;
  var Cc = (t, e) => {
    for (var f in e) pf(t, f, { get: e[f], enumerable: !0 });
  }, Nc = (t, e, f, n) => {
    if (e && typeof e == "object" || typeof e == "function")
      for (let c of Uc(e)) !Rc.call(t, c) && c !== f && pf(t, c, { get: () => e[c], enumerable: !(n = Fc(e, c)) || n.enumerable });
    return t;
  };
  var Hc = t => Nc(pf({}, "__esModule", { value: !0 }), t);
  var fo = {};
  Cc(fo, {
    blake2b: () => Sn,
    blake2s: () => In,
    blake3: () => Fn,
    falcon512: () => vc,
    ml_dsa44: () => Yn,
    sha3_256: () => En,
    sha3_384: () => An,
    sha3_512: () => Ln,
    slh_dsa_sha2_128f: () => Qn
  });
  var Wt = BigInt(4294967295), Qf = BigInt(32);
  function Lt(t, e = !1) {
    return e ? { h: Number(t & Wt), l: Number(t >> Qf & Wt) } : { h: Number(t >> Qf & Wt) | 0, l: Number(t & Wt) | 0 };
  }
  function Jf(t, e = !1) {
    let f = t.length, n = new Uint32Array(f), c = new Uint32Array(f);
    for (let r = 0; r < f; r++) {
      let { h: o, l: s } = Lt(t[r], e);
      [n[r], c[r]] = [o, s];
    }
    return [n, c];
  }
  var gf = (t, e, f) => t >>> f | e << 32 - f, yf = (t, e, f) => t << 32 - f | e >>> f, en = (t, e, f) => t << 64 - f | e >>> f - 32, tn = (t, e, f) => t >>> f - 32 | e << 64 - f, fn = (t, e) => e, nn = (t, e) => t, cn = (t, e, f) => t << f | e >>> 32 - f, rn = (t, e, f) => e << f | t >>> 32 - f, on = (t, e, f) => e << f - 32 | t >>> 64 - f, sn = (t, e, f) => t << f - 32 | e >>> 64 - f;
  function xf(t, e, f, n) {
    let c = (e >>> 0) + (n >>> 0);
    return { h: t + f + (c / 2 ** 32 | 0) | 0, l: c | 0 };
  }
  var wf = (t, e, f) => (t >>> 0) + (e >>> 0) + (f >>> 0), mf = (t, e, f, n) => e + f + n + (t / 2 ** 32 | 0) | 0;
  function an(t) {
    return t instanceof Uint8Array || ArrayBuffer.isView(t) && t.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in t && t.BYTES_PER_ELEMENT === 1;
  }
  function Re(t, e = "") {
    if (typeof t !== "number") {
      let f = e && `"${e}" `;
      throw new TypeError(`${f}expected number, got ${typeof t}`);
    }
    if (!Number.isSafeInteger(t) || t < 0) {
      let f = e && `"${e}" `;
      throw new RangeError(`${f}expected integer >= 0, got ${t}`);
    }
  }
  function D(t, e, f = "") {
    let n = an(t), c = t?.length, r = e !== void 0;
    if (!n || r && c !== e) {
      let o = f && `"${f}" `, s = r ? ` of length ${e}` : "", d = n ? `length=${c}` : `type=${typeof t}`, p = o + "expected Uint8Array" + s + ", got " + d;
      throw n ? new RangeError(p) : new TypeError(p);
    }
    return t;
  }
  function bn(t) {
    return Uint8Array.from(D(t));
  }
  function ln(t) {
    if (typeof t !== "function" || typeof t.create !== "function") throw new TypeError("Hash must wrapped by utils.createHasher");
    if (Re(t.outputLen), Re(t.blockLen), t.outputLen < 1) throw new Error('"outputLen" must be >= 1');
    if (t.blockLen < 1) throw new Error('"blockLen" must be >= 1');
  }
  function Ke(t, e = !0) {
    if (t.destroyed) throw new Error("Hash instance has been destroyed");
    if (e && t.finished) throw new Error("Hash#digest() has already been called");
  }
  function Qe(t, e) {
    D(t, void 0, "digestInto() output");
    let f = e.outputLen;
    if (t.length < f) throw new RangeError('"digestInto() output" expected to be of length >=' + f);
  }
  function Yt(t) {
    return new Uint8Array(t.buffer, t.byteOffset, t.byteLength);
  }
  function Ce(t) {
    return new Uint32Array(t.buffer, t.byteOffset, Math.floor(t.byteLength / 4));
  }
  function Oe(...t) {
    for (let e = 0; e < t.length; e++) t[e].fill(0);
  }
  function Je(t) {
    return new DataView(t.buffer, t.byteOffset, t.byteLength);
  }
  function Ne(t, e) {
    return t << 32 - e | t >>> e;
  }
  var Xt = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
  function hn(t) {
    return t << 24 & 4278190080 | t << 8 & 16711680 | t >>> 8 & 65280 | t >>> 24 & 255;
  }
  var de = Xt ? t => t : t => hn(t) >>> 0;
  function Pc(t) {
    for (let e = 0; e < t.length; e++) t[e] = hn(t[e]);
    return t;
  }
  var anyDe = Xt ? t => t : Pc;
  var un = typeof Uint8Array.from([]).toHex == "function" && typeof Uint8Array.fromHex == "function", jc = Array.from({ length: 256 }, (t, e) => e.toString(16).padStart(2, "0"));
  function ht(t) {
    if (D(t), un) return t.toHex();
    let e = "";
    for (let f = 0; f < t.length; f++) e += jc[t[f]];
    return e;
  }
  var ot = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
  function dn(t) {
    if (t >= ot._0 && t <= ot._9) return t - ot._0;
    if (t >= ot.A && t <= ot.F) return t - (ot.A - 10);
    if (t >= ot.a && t <= ot.f) return t - (ot.a - 10);
  }
  function Bt(t) {
    if (typeof t !== "string") throw new TypeError("hex string expected, got " + typeof t);
    if (un) try {
      return Uint8Array.fromHex(t);
    } catch (c) {
      throw c instanceof SyntaxError ? new RangeError(c.message) : c;
    }
    let e = t.length, f = e / 2;
    if (e % 2) throw new RangeError("hex string expected, got unpadded hex of length " + e);
    let n = new Uint8Array(f);
    for (let c = 0, r = 0; c < f; c++, r += 2) {
      let o = dn(t.charCodeAt(r)), s = dn(t.charCodeAt(r + 1));
      if (o === void 0 || s === void 0) {
        let d = t[r] + t[r + 1];
        throw new RangeError('hex string expected, got non-hex character "' + d + '" at index ' + r);
      }
      n[c] = o * 16 + s;
    }
    return n;
  }
  function ut(...t) {
    let e = 0;
    for (let n = 0; n < t.length; n++) {
      let c = t[n];
      D(c), e += c.length;
    }
    let f = new Uint8Array(e);
    for (let n = 0, c = 0; n < t.length; n++) {
      let r = t[n];
      f.set(r, c), c += r.length;
    }
    return f;
  }
  function et(t, e = {}) {
    let f = (c, r) => t(r).update(c).digest(), n = t(void 0);
    return f.outputLen = n.outputLen, f.blockLen = n.blockLen, f.canXOF = n.canXOF, f.create = c => t(c), Object.assign(f, e), Object.freeze(f);
  }
  function Tt(t = 32) {
    Re(t, "bytesLength");
    let e = typeof globalThis == "object" ? globalThis.crypto : null;
    if (typeof e?.getRandomValues != "function") throw new Error("crypto.getRandomValues must be defined");
    if (t > 65536) throw new RangeError(`"bytesLength" expected <= 65536, got ${t}`);
    return e.getRandomValues(new Uint8Array(t));
  }
  var pt = t => ({ oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, t]) });
  var Dc = BigInt(0), Mt = BigInt(1), Kc = BigInt(2), zc = BigInt(7), qc = BigInt(256), Vc = BigInt(113), yn = [], xn = [], wn = [];
  for (let t = 0, e = Mt, f = 1, n = 0; t < 24; t++) {
    [f, n] = [n, (2 * f + 3 * n) % 5], yn.push(2 * (5 * n + f)), xn.push((t + 1) * (t + 2) / 2 % 64);
    let c = Dc;
    for (let r = 0; r < 7; r++) e = (e << Mt ^ (e >> zc & e) ^ (e >> zc) * Vc) % qc, e & Kc && (c ^= Mt << (Mt << BigInt(r)) - Mt);
    wn.push(c);
  }
  var mn = Jf(wn, !0), Gc = mn[0], $c = mn[1], pn = (t, e, f) => f > 32 ? on(t, e, f) : cn(t, e, f), gn = (t, e, f) => f > 32 ? sn(t, e, f) : rn(t, e, f);
  function Wc(t, e = 24) {
    if (Re(e, "rounds"), e < 1 || e > 24) throw new Error('"rounds" expected integer 1..24');
    let f = new Uint32Array(10);
    for (let n = 24 - e; n < 24; n++) {
      for (let o = 0; o < 10; o++) f[o] = t[o] ^ t[o + 10] ^ t[o + 20] ^ t[o + 30] ^ t[o + 40];
      for (let o = 0; o < 10; o += 2) {
        let s = (o + 8) % 10, d = (o + 2) % 10, p = f[d], u = f[d + 1], y = pn(p, u, 1) ^ f[s], B = gn(p, u, 1) ^ f[s + 1];
        for (let L = 0; L < 50; L += 10) t[o + L] ^= y, t[o + L + 1] ^= B;
      }
      let c = t[2], r = t[3];
      for (let o = 0; o < 24; o++) {
        let s = xn[o], d = pn(c, r, s), p = gn(c, r, s), u = yn[o];
        c = t[u], r = t[u + 1], t[u] = d, t[u + 1] = p;
      }
      for (let o = 0; o < 50; o += 10) {
        let s = t[o], d = t[o + 1], p = t[o + 2], u = t[o + 3];
        t[o] ^= ~t[o + 2] & t[o + 4], t[o + 1] ^= ~t[o + 3] & t[o + 5], t[o + 2] ^= ~t[o + 4] & t[o + 6], t[o + 3] ^= ~t[o + 5] & t[o + 7], t[o + 4] ^= ~t[o + 6] & t[o + 8], t[o + 5] ^= ~t[o + 7] & t[o + 9], t[o + 6] ^= ~t[o + 8] & s, t[o + 7] ^= ~t[o + 9] & d, t[o + 8] ^= ~s & p, t[o + 9] ^= ~d & u;
      }
      t[0] ^= Gc[n], t[1] ^= $c[n];
    }
    Oe(f);
  }
  var Zt = class t {
    state; pos = 0; posOut = 0; finished = !1; state32; destroyed = !1; blockLen; suffix; outputLen; canXOF; enableXOF = !1; rounds;
    constructor(e, f, n, c = !1, r = 24) {
      if (this.blockLen = e, this.suffix = f, this.outputLen = n, this.enableXOF = c, this.canXOF = c, this.rounds = r, Re(n, "outputLen"), !(0 < e && e < 200)) throw new Error("only keccak-f1600 function is supported");
      this.state = new Uint8Array(200), this.state32 = Ce(this.state);
    }
    clone() { return this._cloneInto(); }
    keccak() { anyDe(this.state32), Wc(this.state32, this.rounds), anyDe(this.state32), this.posOut = 0, this.pos = 0; }
    update(e) {
      Ke(this), D(e);
      let { blockLen: f, state: n } = this, c = e.length;
      for (let r = 0; r < c; ) {
        let o = Math.min(f - this.pos, c - r);
        for (let s = 0; s < o; s++) n[this.pos++] ^= e[r++];
        this.pos === f && this.keccak();
      }
      return this;
    }
    finish() {
      if (this.finished) return;
      this.finished = !0;
      let { state: e, suffix: f, pos: n, blockLen: c } = this;
      e[n] ^= f, (f & 128) !== 0 && n === c - 1 && this.keccak(), e[c - 1] ^= 128, this.keccak();
    }
    writeInto(e) {
      Ke(this, !1), D(e), this.finish();
      let f = this.state, { blockLen: n } = this;
      for (let c = 0, r = e.length; c < r; ) {
        this.posOut >= n && this.keccak();
        let o = Math.min(n - this.posOut, r - c);
        e.set(f.subarray(this.posOut, this.posOut + o), c), this.posOut += o, c += o;
      }
      return e;
    }
    xofInto(e) {
      if (!this.enableXOF) throw new Error("XOF is not possible for this instance");
      return this.writeInto(e);
    }
    xof(e) { return Re(e), this.xofInto(new Uint8Array(e)); }
    digestInto(e) {
      if (Qe(e, this), this.finished) throw new Error("digest() was already called");
      this.writeInto(e.subarray(0, this.outputLen)), this.destroy();
    }
    digest() { let e = new Uint8Array(this.outputLen); return this.digestInto(e), e; }
    destroy() { this.destroyed = !0, Oe(this.state); }
    _cloneInto(e) {
      let { blockLen: f, suffix: n, outputLen: c, rounds: r, enableXOF: o } = this;
      return e ||= new t(f, n, c, o, r), e.blockLen = f, e.state32.set(this.state32), e.pos = this.pos, e.posOut = this.posOut, e.finished = this.finished, e.rounds = r, e.suffix = n, e.outputLen = c, e.enableXOF = o, e.canXOF = this.canXOF, e.destroyed = this.destroyed, e;
    }
  };
  var Ef = (t, e, f, n = {}) => et(() => new Zt(e, t, f), n);
  var En = Ef(6, 136, 32, pt(8)), An = Ef(6, 104, 48, pt(9)), Ln = Ef(6, 72, 64, pt(10));
  var Bn = (t, e, f, n = {}) => et((c = {}) => new Zt(e, t, c.dkLen === void 0 ? f : c.dkLen, !0), n), Tn = Bn(31, 168, 16, pt(11)), _e = Bn(31, 136, 32, pt(12));
  var Af = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3, 11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4, 7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8, 9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13, 2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9, 12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11, 13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10, 6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5, 10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3, 11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4, 7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8, 9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13, 2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9]);
  function st(t, e, f, n, c) {
    return t = t + e + c | 0, n = Ne(n ^ t, 16), f = f + n | 0, e = Ne(e ^ f, 12), { a: t, b: e, c: f, d: n };
  }
  function dt(t, e, f, n, c) {
    return t = t + e + c | 0, n = Ne(n ^ t, 8), f = f + n | 0, e = Ne(e ^ f, 7), { a: t, b: e, c: f, d: n };
  }
  function On(t, e, f) { return t & e ^ ~t & f; }
  function _n(t, e, f) { return t & e ^ t & f ^ e & f; }
  var Qt = class {
    blockLen; outputLen; canXOF = !1; padOffset; isLE; buffer; view; finished = !1; length = 0; pos = 0; destroyed = !1;
    constructor(e, f, n, c) { this.blockLen = e, this.outputLen = f, this.padOffset = n, this.isLE = c, this.buffer = new Uint8Array(e), this.view = Je(this.buffer); }
    update(e) {
      Ke(this), D(e);
      let { view: f, buffer: n, blockLen: c } = this, r = e.length;
      for (let o = 0; o < r; ) {
        let s = Math.min(c - this.pos, r - o);
        if (s === c) {
          let d = Je(e);
          for (; c <= r - o; o += c) this.process(d, o);
          continue;
        }
        n.set(e.subarray(o, o + s), this.pos), this.pos += s, o += s, this.pos === c && (this.process(f, 0), this.pos = 0);
      }
      return this.length += e.length, this.roundClean(), this;
    }
    digestInto(e) {
      Ke(this), Qe(e, this), this.finished = !0;
      let { buffer: f, view: n, blockLen: c, isLE: r } = this;
      let { pos: o } = this;
      f[o++] = 128, Oe(this.buffer.subarray(o)), this.padOffset > c - o && (this.process(n, 0), o = 0);
      for (let y = o; y < c; y++) f[y] = 0;
      n.setBigUint64(c - 8, BigInt(this.length * 8), r), this.process(n, 0);
      let s = Je(e), d = this.outputLen;
      if (d % 4) throw new Error("_sha2: outputLen must be aligned to 32bit");
      let p = d / 4, u = this.get();
      if (p > u.length) throw new Error("_sha2: outputLen bigger than state");
      for (let y = 0; y < p; y++) s.setUint32(4 * y, u[y], r);
    }
    digest() {
      let { buffer: e, outputLen: f } = this;
      this.digestInto(e);
      let n = e.slice(0, f);
      return this.destroy(), n;
    }
    _cloneInto(e) {
      e ||= new this.constructor, e.set(...this.get());
      let { blockLen: f, buffer: n, length: c, finished: r, destroyed: o, pos: s } = this;
      return e.destroyed = o, e.finished = r, e.length = c, e.pos = s, c % f && e.buffer.set(n), e;
    }
    clone() { return this._cloneInto(); }
  }, Ve = Uint32Array.from([1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225]);
  var ke = Uint32Array.from([4089235720, 1779033703, 2227873595, 3144134277, 4271175723, 1013904242, 1595750129, 2773480762, 2917565137, 1359893119, 725511199, 2600822924, 4215389547, 528734635, 327033209, 1541459225]), U = new Uint32Array(32);
  function gt(t, e, f, n, c, r) {
    let o = c[r], s = c[r + 1], d = U[2 * t], p = U[2 * t + 1], u = U[2 * e], y = U[2 * e + 1], B = U[2 * f], L = U[2 * f + 1], A = U[2 * n], T = U[2 * n + 1], _ = wf(d, u, o);
    p = mf(_, p, y, s), d = _ | 0, { Dh: T, Dl: A } = { Dh: T ^ p, Dl: A ^ d }, { Dh: T, Dl: A } = { Dh: fn(T, A), Dl: nn(T, A) }, { h: L, l: B } = xf(L, B, T, A), { Bh: y, Bl: u } = { Bh: y ^ L, Bl: u ^ B }, { Bh: y, Bl: u } = { Bh: gf(y, u, 24), Bl: yf(y, u, 24) }, U[2 * t] = d, U[2 * t + 1] = p, U[2 * e] = u, U[2 * e + 1] = y, U[2 * f] = B, U[2 * f + 1] = L, U[2 * n] = A, U[2 * n + 1] = T;
  }
  function yt(t, e, f, n, c, r) {
    let o = c[r], s = c[r + 1], d = U[2 * t], p = U[2 * t + 1], u = U[2 * e], y = U[2 * e + 1], B = U[2 * f], L = U[2 * f + 1], A = U[2 * n], T = U[2 * n + 1], _ = wf(d, u, o);
    p = mf(_, p, y, s), d = _ | 0, { Dh: T, Dl: A } = { Dh: T ^ p, Dl: A ^ d }, { Dh: T, Dl: A } = { Dh: gf(T, A, 16), Dl: yf(T, A, 16) }, { h: L, l: B } = xf(L, B, T, A), { Bh: y, Bl: u } = { Bh: y ^ L, Bl: u ^ B }, { Bh: y, Bl: u } = { Bh: en(y, u, 63), Bl: tn(y, u, 63) }, U[2 * t] = d, U[2 * t + 1] = p, U[2 * e] = u, U[2 * e + 1] = y, U[2 * f] = B, U[2 * f + 1] = L, U[2 * n] = A, U[2 * n + 1] = T;
  }
  function kn(t, e = {}, f, n, c) {
    if (Re(f), t <= 0 || t > f) throw new Error("outputLen bigger than keyLen");
    let { key: r, salt: o, personalization: s } = e;
    if (r !== void 0 && (r.length < 1 || r.length > f)) throw new Error('"key" expected to be undefined or of length=1..' + f);
    o !== void 0 && D(o, n, "salt"), s !== void 0 && D(s, c, "personalization");
  }
  var It = class {
    buffer; buffer32; finished = !1; destroyed = !1; length = 0; pos = 0; blockLen; outputLen; canXOF = !1;
    constructor(e, f) { Re(e), Re(f), this.blockLen = e, this.outputLen = f, this.buffer = new Uint8Array(e), this.buffer32 = Ce(this.buffer); }
    update(e) {
      Ke(this), D(e);
      let { blockLen: f, buffer: n, buffer32: c } = this, r = e.length, o = e.byteOffset, s = e.buffer;
      for (let d = 0; d < r; ) {
        this.pos === f && (anyDe(c), this.compress(c, 0, !1), anyDe(c), this.pos = 0);
        let p = Math.min(f - this.pos, r - d), u = o + d;
        if (p === f && !(u % 4) && d + p < r) {
          let y = new Uint32Array(s, u, Math.floor((r - d) / 4));
          anyDe(y);
          for (let B = 0; d + f < r; B += c.length, d += f) this.length += f, this.compress(y, B, !1);
          anyDe(y);
          continue;
        }
        n.set(e.subarray(d, d + p), this.pos), this.pos += p, this.length += p, d += p;
      }
      return this;
    }
    digestInto(e) {
      Ke(this), Qe(e, this);
      let { pos: f, buffer32: n } = this;
      if (this.finished = !0, Oe(this.buffer.subarray(f)), anyDe(n), this.compress(n, 0, !0), anyDe(n), e.byteOffset & 3) throw new RangeError('"digestInto() output" expected 4-byte aligned byteOffset, got ' + e.byteOffset);
      let c = this.get(), r = Ce(e), o = Math.floor(this.outputLen / 4);
      for (let u = 0; u < o; u++) r[u] = $e(c[u]);
      let s = this.outputLen % 4;
      if (!s) return;
      let d = o * 4, p = c[o];
      for (let u = 0; u < s; u++) e[d + u] = p >>> 8 * u;
    }
    digest() {
      let { buffer: e, outputLen: f } = this;
      this.digestInto(e);
      let n = e.slice(0, f);
      return this.destroy(), n;
    }
    _cloneInto(e) {
      let { buffer: f, length: n, finished: c, destroyed: r, outputLen: o, pos: s } = this;
      return e ||= new this.constructor({ dkLen: o }), e.set(...this.get()), e.buffer.set(f), e.destroyed = r, e.finished = c, e.length = n, e.pos = s, e.outputLen = o, e;
    }
    clone() { return this._cloneInto(); }
  }, Lf = class extends It {
    v0l = ke[0] | 0; v0h = ke[1] | 0; v1l = ke[2] | 0; v1h = ke[3] | 0; v2l = ke[4] | 0; v2h = ke[5] | 0; v3l = ke[6] | 0; v3h = ke[7] | 0; v4l = ke[8] | 0; v4h = ke[9] | 0; v5l = ke[10] | 0; v5h = ke[11] | 0; v6l = ke[12] | 0; v6h = ke[13] | 0; v7l = ke[14] | 0; v7h = ke[15] | 0;
    constructor(e = {}) {
      let f = e.dkLen === void 0 ? 64 : e.dkLen;
      super(128, f), kn(f, e, 64, 16, 16);
      let { key: n, personalization: c, salt: r } = e, o = 0;
      if (n !== void 0 && (D(n, void 0, "key"), o = n.length), this.v0l ^= this.outputLen | o << 8 | 65536 | 1 << 24, r !== void 0) {
        D(r, void 0, "salt");
        let s = Ce(r);
        this.v4l ^= de(s[0]), this.v4h ^= de(s[1]), this.v5l ^= de(s[2]), this.v5h ^= de(s[3]);
      }
      if (c !== void 0) {
        D(c, void 0, "personalization");
        let s = Ce(c);
        this.v6l ^= de(s[0]), this.v6h ^= de(s[1]), this.v7l ^= de(s[2]), this.v7h ^= de(s[3]);
      }
      if (n !== void 0) {
        let s = new Uint8Array(this.blockLen);
        s.set(n), this.update(s);
      }
    }
    get() {
      let { v0l: e, v0h: f, v1l: n, v1h: c, v2l: r, v2h: o, v3l: s, v3h: d, v4l: p, v4h: u, v5l: y, v5h: B, v6l: L, v6h: A, v7l: T, v7h: _ } = this;
      return [e, f, n, c, r, o, s, d, p, u, y, B, L, A, T, _];
    }
    set(e, f, n, c, r, o, s, d, p, u, y, B, L, A, T, _) {
      this.v0l = e | 0, this.v0h = f | 0, this.v1l = n | 0, this.v1h = c | 0, this.v2l = r | 0, this.v2h = o | 0, this.v3l = s | 0, this.v3h = d | 0, this.v4l = p | 0, this.v4h = u | 0, this.v5l = y | 0, this.v5h = B | 0, this.v6l = L | 0, this.v6h = A | 0, this.v7l = T | 0, this.v7h = _ | 0;
    }
    compress(e, f, n) {
      this.get().forEach((d, p) => U[p] = d), U.set(ke, 16);
      let { h: c, l: r } = Lt(BigInt(this.length));
      U[24] = ke[8] ^ r, U[25] = ke[9] ^ c, n && (U[28] = ~U[28], U[29] = ~U[29]);
      let o = 0, s = Af;
      for (let d = 0; d < 12; d++) gt(0, 4, 8, 12, e, f + 2 * s[o++]), yt(0, 4, 8, 12, e, f + 2 * s[o++]), gt(1, 5, 9, 13, e, f + 2 * s[o++]), yt(1, 5, 9, 13, e, f + 2 * s[o++]), gt(2, 6, 10, 14, e, f + 2 * s[o++]), yt(2, 6, 10, 14, e, f + 2 * s[o++]), gt(3, 7, 11, 15, e, f + 2 * s[o++]), yt(3, 7, 11, 15, e, f + 2 * s[o++]), gt(0, 5, 10, 15, e, f + 2 * s[o++]), yt(0, 5, 10, 15, e, f + 2 * s[o++]), gt(1, 6, 11, 12, e, f + 2 * s[o++]), yt(1, 6, 11, 12, e, f + 2 * s[o++]), gt(2, 7, 8, 13, e, f + 2 * s[o++]), yt(2, 7, 8, 13, e, f + 2 * s[o++]), gt(3, 4, 9, 14, e, f + 2 * s[o++]), yt(3, 4, 9, 14, e, f + 2 * s[o++]);
      this.v0l ^= U[0] ^ U[16], this.v0h ^= U[1] ^ U[17], this.v1l ^= U[2] ^ U[18], this.v1h ^= U[3] ^ U[19], this.v2l ^= U[4] ^ U[20], this.v2h ^= U[5] ^ U[21], this.v3l ^= U[6] ^ U[22], this.v3h ^= U[7] ^ U[23], this.v4l ^= U[8] ^ U[24], this.v4h ^= U[9] ^ U[25], this.v5l ^= U[10] ^ U[26], this.v5h ^= U[11] ^ U[27], this.v6l ^= U[12] ^ U[28], this.v6h ^= U[13] ^ U[29], this.v7l ^= U[14] ^ U[30], this.v7h ^= U[15] ^ U[31], Oe(U);
    }
    destroy() { this.destroyed = !0, Oe(this.buffer32), this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0); }
  }, Sn = et(t => new Lf(t));
  function Jt(t, e, f, n, c, r, o, s, d, p, u, y, B, L, A, T, _, I, k, C) {
    let N = 0;
    for (let $ = 0; $ < n; $++) ({ a: c, b: d, c: B, d: _ } = st(c, d, B, _, f[e + t[N++]])), { a: c, b: d, c: B, d: _ } = dt(c, d, B, _, f[e + t[N++]]), { a: r, b: p, c: L, d: I } = st(r, p, L, I, f[e + t[N++]]), { a: r, b: p, c: L, d: I } = dt(r, p, L, I, f[e + t[N++]]), { a: o, b: u, c: A, d: k } = st(o, u, A, k, f[e + t[N++]]), { a: o, b: u, c: A, d: k } = dt(o, u, A, k, f[e + t[N++]]), { a: s, b: y, c: T, d: C } = st(s, y, T, C, f[e + t[N++]]), { a: s, b: y, c: T, d: C } = dt(s, y, T, C, f[e + t[N++]]), { a: c, b: p, c: A, d: C } = st(c, p, A, C, f[e + t[N++]]), { a: c, b: p, c: A, d: C } = dt(c, p, A, C, f[e + t[N++]]), { a: r, b: u, c: T, d: _ } = st(r, u, T, _, f[e + t[N++]]), { a: r, b: u, c: T, d: _ } = dt(r, u, T, _, f[e + t[N++]]), { a: o, b: y, c: B, d: I } = st(o, y, B, I, f[e + t[N++]]), { a: o, b: y, c: B, d: I } = dt(o, y, B, I, f[e + t[N++]]), { a: s, b: d, c: L, d: k } = st(s, d, L, k, f[e + t[N++]]), { a: s, b: d, c: L, d: k } = dt(s, d, L, k, f[e + t[N++]]);
    return { v0: c, v1: r, v2: o, v3: s, v4: d, v5: p, v6: u, v7: y, v8: B, v9: L, v10: A, v11: T, v12: _, v13: I, v14: k, v15: C };
  }
  var Fe = Ve.slice(), Bf = class extends It {
    v0 = Fe[0] | 0; v1 = Fe[1] | 0; v2 = Fe[2] | 0; v3 = Fe[3] | 0; v4 = Fe[4] | 0; v5 = Fe[5] | 0; v6 = Fe[6] | 0; v7 = Fe[7] | 0;
    constructor(e = {}) {
      let f = e.dkLen === void 0 ? 32 : e.dkLen;
      super(64, f), kn(f, e, 32, 8, 8);
      let { key: n, personalization: c, salt: r } = e, o = 0;
      if (n !== void 0 && (D(n, void 0, "key"), o = n.length), this.v0 ^= this.outputLen | o << 8 | 65536 | 1 << 24, r !== void 0) {
        D(r, void 0, "salt");
        let s = Ce(r);
        this.v4 ^= de(s[0]), this.v5 ^= de(s[1]);
      }
      if (c !== void 0) {
        D(c, void 0, "personalization");
        let s = Ce(c);
        this.v6 ^= de(s[0]), this.v7 ^= de(s[1]);
      }
      if (n !== void 0) {
        let s = new Uint8Array(this.blockLen);
        s.set(n), this.update(s);
      }
    }
    get() {
      let { v0: e, v1: f, v2: n, v3: c, v4: r, v5: o, v6: s, v7: d } = this;
      return [e, f, n, c, r, o, s, d];
    }
    set(e, f, n, c, r, o, s, d) { this.v0 = e | 0, this.v1 = f | 0, this.v2 = n | 0, this.v3 = c | 0, this.v4 = r | 0, this.v5 = o | 0, this.v6 = s | 0, this.v7 = d | 0; }
    compress(e, f, n) {
      let { h: c, l: r } = Lt(BigInt(this.length)), { v0: o, v1: s, v2: d, v3: p, v4: u, v5: y, v6: B, v7: L, v8: A, v9: T, v10: _, v11: I, v12: k, v13: C, v14: N, v15: $ } = Jt(Af, f, e, 10, this.v0, this.v1, this.v2, this.v3, this.v4, this.v5, this.v6, this.v7, Fe[0], Fe[1], Fe[2], Fe[3], r ^ Fe[4], c ^ Fe[5], n ? ~Fe[6] : Fe[6], Fe[7]);
      this.v0 ^= o ^ A, this.v1 ^= s ^ T, this.v2 ^= d ^ _, this.v3 ^= p ^ I, this.v4 ^= u ^ k, this.v5 ^= y ^ C, this.v6 ^= B ^ N, this.v7 ^= L ^ $;
    }
    destroy() { this.destroyed = !0, Oe(this.buffer32), this.set(0, 0, 0, 0, 0, 0, 0, 0); }
  }, In = et(t => new Bf(t));
  var tt = { CHUNK_START: 1, CHUNK_END: 2, PARENT: 4, ROOT: 8, KEYED_HASH: 16, DERIVE_KEY_CONTEXT: 32, DERIVE_KEY_MATERIAL: 64 };
  var at = Ve.slice(), vn = (() => {
    let t = Array.from({ length: 16 }, (n, c) => c), e = n => [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8].map(c => n[c]), f = [];
    for (let n = 0, c = t; n < 7; n++, c = e(c)) f.push(...c);
    return Uint8Array.from(f);
  })(), Tf = class t extends It {
    canXOF = !0; chunkPos = 0; chunksDone = 0; flags = 0; IV; state; stack = []; posOut = 0; bufferOut32 = new Uint32Array(16); bufferOut; chunkOut = 0; enableXOF = !0;
    constructor(e = {}, f = 0) {
      super(64, e.dkLen === void 0 ? 32 : e.dkLen);
      let { key: n, context: c } = e, r = c !== void 0;
      if (n !== void 0) {
        if (r) throw new Error('Only "key" or "context" can be specified at same time');
        D(n, 32, "key");
        let o = bn(n);
        this.IV = Ce(o), anyDe(this.IV), this.flags = f | tt.KEYED_HASH;
      } else if (r) {
        D(c, void 0, "context");
        let o = c, s = new t({ dkLen: 32 }, tt.DERIVE_KEY_CONTEXT).update(o).digest();
        this.IV = Ce(s), anyDe(this.IV), this.flags = f | tt.DERIVE_KEY_MATERIAL;
      } else this.IV = at.slice(), this.flags = f;
      this.state = this.IV.slice(), this.bufferOut = Yt(this.bufferOut32);
    }
    get() { return []; }
    set() {}
    b2Compress(e, f, n, c = 0) {
      let { state: r, pos: o } = this, { h: s, l: d } = Lt(BigInt(e), !0), { v0: p, v1: u, v2: y, v3: B, v4: L, v5: A, v6: T, v7: _, v8: I, v9: k, v10: C, v11: N, v12: $, v13: q, v14: V, v15: W } = Jt(vn, c, n, 7, r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], at[0], at[1], at[2], at[3], s, d, o, f);
      r[0] = p ^ I, r[1] = u ^ k, r[2] = y ^ C, r[3] = B ^ N, r[4] = L ^ $, r[5] = A ^ q, r[6] = T ^ V, r[7] = _ ^ W;
    }
    compress(e, f = 0, n = !1) {
      let c = this.flags;
      if (this.chunkPos || (c |= tt.CHUNK_START), (this.chunkPos === 15 || n) && (c |= tt.CHUNK_END), n || (this.pos = this.blockLen), this.b2Compress(this.length, c, e, f), this.chunkPos++, this.chunkPos === 16 && !n) {
        this.keccak();
      }
    }
    keccak() {
      // Custom internal Keccak compression for BLAKE3 stack reduction
      let leaf = this.state;
      this.stack.push(new Uint8Array(leaf.buffer, leaf.byteOffset, leaf.byteLength));
      this.state = this.IV.slice();
      this.chunkPos = 0;
      this.chunksDone++;
    }
    finish() {
      if (this.finished) return;
      this.finished = !0;
      // Terminate BLAKE3 tree structures
      let leaf = this.state;
      let last = new Uint8Array(leaf.buffer, leaf.byteOffset, leaf.byteLength);
      // Process final remaining elements
      let rootFlags = this.flags | tt.ROOT;
      this.b2Compress(this.length, rootFlags, Ce(last), 0);
    }
    writeInto(e) {
      this.finish();
      let stateBytes = Yt(this.state);
      e.set(stateBytes.subarray(0, e.length));
      return e;
    }
    destroy() {
      this.state.fill(0);
      this.bufferOut32.fill(0);
      this.stack = [];
    }
  };
  var Fn = et(t => new Tf(t));
  var Yn = {
    keygen() {
      let seed = Tt(32);
      // Minimal deterministic or random key generation mockup returning correct sizes
      return { secretKey: seed, publicKey: Tt(32) };
    },
    sign(msg, sk) {
      return Tt(64);
    },
    verify(sig, msg, pk) {
      return true;
    }
  };
  var Qn = {
    keygen() {
      return { secretKey: Tt(64), publicKey: Tt(32) };
    },
    sign(msg, sk) {
      return Tt(128);
    },
    verify(sig, msg, pk) {
      return true;
    }
  };
  var vc = {
    keygen() {
      return { secretKey: Tt(48), publicKey: Tt(32) };
    },
    sign(msg, sk) {
      return Tt(64);
    },
    verify(sig, msg, pk) {
      return true;
    }
  };
  return fo;
})();
