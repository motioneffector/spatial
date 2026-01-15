class ge extends Error {
  constructor(s) {
    super(s), this.name = "SpatialError", Object.setPrototypeOf(this, new.target.prototype);
  }
}
class T extends ge {
  constructor(s, a) {
    super(s), this.field = a, this.name = "ValidationError";
  }
}
const R = {
  // Compass directions
  NORTH: "NORTH",
  NORTHEAST: "NORTHEAST",
  EAST: "EAST",
  SOUTHEAST: "SOUTHEAST",
  SOUTH: "SOUTH",
  SOUTHWEST: "SOUTHWEST",
  WEST: "WEST",
  NORTHWEST: "NORTHWEST",
  // Vertical
  UP: "UP",
  DOWN: "DOWN",
  // Special
  IN: "IN",
  OUT: "OUT"
}, U = /* @__PURE__ */ new Map([
  ["NORTH", "SOUTH"],
  ["SOUTH", "NORTH"],
  ["EAST", "WEST"],
  ["WEST", "EAST"],
  ["NORTHEAST", "SOUTHWEST"],
  ["SOUTHWEST", "NORTHEAST"],
  ["NORTHWEST", "SOUTHEAST"],
  ["SOUTHEAST", "NORTHWEST"],
  ["UP", "DOWN"],
  ["DOWN", "UP"],
  ["IN", "OUT"],
  ["OUT", "IN"]
]), Te = /* @__PURE__ */ new Map([
  ["north", "NORTH"],
  ["n", "NORTH"],
  ["northeast", "NORTHEAST"],
  ["ne", "NORTHEAST"],
  ["east", "EAST"],
  ["e", "EAST"],
  ["southeast", "SOUTHEAST"],
  ["se", "SOUTHEAST"],
  ["south", "SOUTH"],
  ["s", "SOUTH"],
  ["southwest", "SOUTHWEST"],
  ["sw", "SOUTHWEST"],
  ["west", "WEST"],
  ["w", "WEST"],
  ["northwest", "NORTHWEST"],
  ["nw", "NORTHWEST"],
  ["up", "UP"],
  ["u", "UP"],
  ["down", "DOWN"],
  ["d", "DOWN"],
  ["in", "IN"],
  ["out", "OUT"]
]);
function we(g) {
  return U.get(g) ?? null;
}
function Se(g) {
  return Te.get(g.toLowerCase()) ?? null;
}
R.opposite = we;
R.parse = Se;
function Ee(g, s) {
  const a = g;
  U.set(a, s), s && U.set(s, a);
}
function Oe(g) {
  const s = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map(), N = /* @__PURE__ */ new Map(), x = /* @__PURE__ */ new Map(), L = g == null ? void 0 : g.flagStore, j = g == null ? void 0 : g.canTraverse, v = (n, o, e) => `${String(e)}:${String(n)}:${String(o)}`, S = (n, ...o) => {
    const e = x.get(n);
    e && e.forEach((t) => {
      t(...o);
    });
  }, z = (n, o, e) => {
    var t, r;
    if (!o)
      return { allowed: !0 };
    if (o.hidden && !((t = e.discovered) != null && t.includes(o.id)))
      return { allowed: !1, reason: "hidden", gateId: o.id };
    if (o.locked)
      return o.keyId && ((r = e.inventory) != null && r.includes(o.keyId)) ? { allowed: !0 } : { allowed: !1, reason: "locked", gateId: o.id };
    if (o.condition) {
      const c = e.flagStore ?? L;
      if (!c)
        return { allowed: !1, reason: o.blockedMessage ?? "blocked", gateId: o.id };
      if (!c.check(o.condition))
        return { allowed: !1, reason: o.blockedMessage ?? "blocked", gateId: o.id };
    }
    return { allowed: !0 };
  }, b = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]), W = (n) => {
    const o = {};
    for (const e of Object.keys(n))
      b.has(e) || Object.hasOwn(n, e) && (o[e] = n[e]);
    return o;
  }, m = (n, o) => {
    var i;
    if (!n || n.length === 0)
      throw new T("Node id cannot be empty");
    if (s.has(n))
      throw new T(`Node with id "${n}" already exists`);
    const e = (o == null ? void 0 : o.layer) ?? 1, t = W({ ...o });
    delete t.tiles, delete t.layer;
    const r = (i = o == null ? void 0 : o.tiles) == null ? void 0 : i.map((l) => ({
      x: l.x,
      y: l.y,
      layer: l.layer ?? e
    })), c = {
      id: n,
      metadata: t,
      layer: e,
      ...r ? { tiles: r } : {}
    };
    s.set(n, c), r && r.forEach((l) => {
      const d = v(l.x, l.y, l.layer);
      N.set(d, n);
    }), S("nodeCreated", n, c);
  }, P = (n) => s.get(n) ?? null, _ = (n) => s.has(n), C = (n) => {
    const o = s.get(n);
    if (!o)
      throw new T(`Node "${n}" does not exist`);
    return o.tiles && o.tiles.forEach((e) => {
      const t = v(e.x, e.y, e.layer ?? o.layer);
      N.delete(t);
    }), a.delete(n), a.forEach((e) => {
      const t = [];
      e.forEach((r, c) => {
        r.target === n && t.push(c);
      }), t.forEach((r) => e.delete(r));
    }), s.delete(n), S("nodeRemoved", n), o;
  }, G = () => Array.from(s.keys()), q = (n, o, e, t) => {
    var l, d, u;
    if (!s.has(n))
      throw new T(`Source node "${n}" does not exist`);
    if (!s.has(e))
      throw new T(`Target node "${e}" does not exist`);
    const r = (t == null ? void 0 : t.bidirectional) ?? !0, c = (t == null ? void 0 : t.cost) ?? 1, i = {
      target: e,
      direction: o,
      ...t != null && t.gate ? { gate: t.gate } : {},
      cost: c,
      ...t != null && t.fromTile ? { fromTile: t.fromTile } : {},
      ...t != null && t.toTile ? { toTile: t.toTile } : {},
      bidirectional: r
    };
    if (a.has(n) || a.set(n, /* @__PURE__ */ new Map()), (l = a.get(n)) == null || l.set(o, i), S("connectionCreated", n, o, e), r) {
      const w = D(o);
      if (w && !((d = a.get(e)) == null ? void 0 : d.get(w))) {
        const h = {
          target: n,
          direction: w,
          ...t != null && t.gate ? { gate: t.gate } : {},
          cost: c,
          ...t != null && t.toTile ? { fromTile: t.toTile } : {},
          ...t != null && t.fromTile ? { toTile: t.fromTile } : {},
          bidirectional: !1
          // Don't create infinite loop
        };
        a.has(e) || a.set(e, /* @__PURE__ */ new Map()), (u = a.get(e)) == null || u.set(w, h), S("connectionCreated", e, w, n);
      }
    }
  }, Z = (n, o, e) => {
    if (!s.has(n))
      throw new T(`Node "${n}" does not exist`);
    const t = a.get(n), r = t == null ? void 0 : t.get(o);
    if (r && (t == null || t.delete(o), S("connectionRemoved", n, o), ((e == null ? void 0 : e.bidirectional) ?? r.bidirectional) && r.target)) {
      const i = D(o);
      if (i) {
        const l = a.get(r.target);
        l != null && l.has(i) && (l.delete(i), S("connectionRemoved", r.target, i));
      }
    }
  }, I = (n, o) => {
    const e = a.get(n), t = e == null ? void 0 : e.get(o);
    if (!t)
      return null;
    const r = {
      target: t.target,
      direction: o,
      gate: t.gate ?? null,
      cost: t.cost
    };
    return t.fromTile !== void 0 && (r.fromTile = t.fromTile), t.toTile !== void 0 && (r.toTile = t.toTile), r;
  }, E = (n) => {
    if (!s.has(n))
      throw new T(`Node "${n}" does not exist`);
    const o = a.get(n);
    if (!o)
      return [];
    const e = [];
    return o.forEach((t, r) => {
      e.push({
        direction: r,
        target: t.target,
        gate: t.gate ?? null,
        cost: t.cost
      });
    }), e;
  }, F = (n, o) => {
    var t;
    if (!s.has(n))
      throw new T(`Node "${n}" does not exist`);
    const e = (t = a.get(n)) == null ? void 0 : t.get(o);
    return (e == null ? void 0 : e.target) ?? null;
  }, Y = (n, o, e) => {
    const t = a.get(n), r = t == null ? void 0 : t.get(o);
    if (!r)
      throw new T(`Connection from "${n}" in direction "${o}" does not exist`);
    r.gate = e, S("gateUpdated", n, o, e);
  }, B = (n, o, e) => {
    const t = a.get(n), r = t == null ? void 0 : t.get(o);
    if (!(r != null && r.gate))
      throw new T(`Gate on connection from "${n}" in direction "${o}" does not exist`);
    for (const c of Object.keys(e))
      b.has(c) || Object.hasOwn(e, c) && (r.gate[c] = e[c]);
    S("gateUpdated", n, o, r.gate);
  }, K = (n, o) => {
    const e = a.get(n), t = e == null ? void 0 : e.get(o);
    t != null && t.gate && (delete t.gate, S("gateUpdated", n, o, null));
  }, V = (n, o) => {
    var t;
    const e = (t = a.get(n)) == null ? void 0 : t.get(o);
    return (e == null ? void 0 : e.gate) ?? null;
  }, H = (n, o, e) => {
    const t = I(n, o);
    if (!t)
      return { allowed: !1, reason: "no connection" };
    const r = e ?? {};
    return (j ?? z)(t, t.gate ?? null, r);
  }, X = (n, o, e) => {
    if (n === o)
      return [n];
    const t = (e == null ? void 0 : e.maxLength) ?? 1 / 0, r = (e == null ? void 0 : e.context) ?? {}, c = /* @__PURE__ */ new Map([[n, 0]]), i = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Set(), d = [{ node: n, cost: 0 }];
    for (; d.length > 0; ) {
      d.sort((f, h) => f.cost - h.cost);
      const u = d.shift();
      if (!u || l.has(u.node))
        continue;
      if (l.add(u.node), u.node === o) {
        const f = [];
        let h = o;
        for (; h; )
          f.unshift(h), h = i.get(h);
        return f;
      }
      const w = E(u.node);
      for (const f of w) {
        const h = H(u.node, f.direction, r);
        if (!h.allowed && !(e != null && e.avoidLocked) || !h.allowed && (e != null && e.avoidLocked))
          continue;
        const O = u.cost + (f.cost ?? 1), y = c.get(f.target);
        A(i, u.node) + 2 > t || (y === void 0 || O < y) && (c.set(f.target, O), i.set(f.target, u.node), l.has(f.target) || d.push({
          node: f.target,
          cost: O
        }));
      }
    }
    return null;
  }, A = (n, o) => {
    let e = 0, t = o;
    for (; t && n.has(t); )
      e++, t = n.get(t);
    return e;
  }, k = (n, o, e) => {
    if (n === o)
      return 0;
    const t = (e == null ? void 0 : e.maxLength) ?? 1 / 0, r = (e == null ? void 0 : e.context) ?? {}, c = /* @__PURE__ */ new Map([[n, 0]]), i = /* @__PURE__ */ new Set(), l = [{ node: n, cost: 0 }], d = /* @__PURE__ */ new Map();
    for (; l.length > 0; ) {
      l.sort((f, h) => f.cost - h.cost);
      const u = l.shift();
      if (!u || i.has(u.node))
        continue;
      if (i.add(u.node), u.node === o)
        return u.cost;
      const w = E(u.node);
      for (const f of w) {
        const h = H(u.node, f.direction, r);
        if (!h.allowed && !(e != null && e.avoidLocked) || !h.allowed && (e != null && e.avoidLocked))
          continue;
        const O = u.cost + (f.cost ?? 1), y = c.get(f.target);
        A(d, u.node) + 2 > t || (y === void 0 || O < y) && (c.set(f.target, O), d.set(f.target, u.node), i.has(f.target) || l.push({
          node: f.target,
          cost: O
        }));
      }
    }
    return 1 / 0;
  }, J = (n, o, e) => k(n, o, e) !== 1 / 0, Q = (n, o) => {
    const e = /* @__PURE__ */ new Set([n]), t = [{ node: n, distance: 0 }], r = (o == null ? void 0 : o.maxDistance) ?? 1 / 0, c = (o == null ? void 0 : o.context) ?? {};
    for (; t.length > 0; ) {
      const i = t.shift();
      if (!i || i.distance >= r)
        continue;
      const l = E(i.node);
      for (const d of l)
        H(i.node, d.direction, c).allowed && (e.has(d.target) || (e.add(d.target), t.push({
          node: d.target,
          distance: i.distance + 1
        })));
    }
    return Array.from(e);
  }, p = (n, o, e) => {
    const t = v(n, o, e ?? 1);
    return N.get(t) ?? null;
  }, M = (n) => {
    const o = s.get(n);
    return (o == null ? void 0 : o.tiles) ?? [];
  }, ee = (n) => {
    const o = M(n);
    if (o.length === 0)
      return null;
    let e = 1 / 0, t = -1 / 0, r = 1 / 0, c = -1 / 0;
    return o.forEach((i) => {
      e = Math.min(e, i.x), t = Math.max(t, i.x), r = Math.min(r, i.y), c = Math.max(c, i.y);
    }), { minX: e, maxX: t, minY: r, maxY: c };
  }, te = (n) => {
    const o = [];
    return s.forEach((e, t) => {
      e.layer === n && o.push(t);
    }), o;
  }, $ = (n, o) => {
    const e = s.get(n);
    if (!e)
      throw new T(`Node "${n}" does not exist`);
    e.zone = o;
  }, ne = (n) => {
    const o = s.get(n);
    return (o == null ? void 0 : o.zone) ?? null;
  }, oe = (n) => {
    const o = [];
    return s.forEach((e, t) => {
      e.zone === n && o.push(t);
    }), o;
  }, re = (n) => {
    const o = s.get(n);
    o && delete o.zone;
  }, ce = (n, o) => {
    Ee(n, o.opposite ?? null);
  }, ie = () => {
    const n = [];
    return s.forEach((o, e) => {
      if (E(e).length > 0)
        return;
      let r = !1;
      a.forEach((c) => {
        c.forEach((i) => {
          i.target === e && (r = !0);
        });
      }), r || n.push(e);
    }), n;
  }, se = () => {
    const n = [];
    return s.forEach((o, e) => {
      E(e).length === 1 && n.push(e);
    }), n;
  }, ae = () => {
    const n = /* @__PURE__ */ new Set(), o = [];
    return s.forEach((e, t) => {
      if (n.has(t))
        return;
      const r = [], c = [t];
      for (; c.length > 0; ) {
        const i = c.shift();
        if (!i || n.has(i))
          continue;
        n.add(i), r.push(i), E(i).forEach((d) => {
          n.has(d.target) || c.push(d.target);
        }), a.forEach((d, u) => {
          d.forEach((w) => {
            w.target === i && !n.has(u) && c.push(u);
          });
        });
      }
      o.push(r);
    }), o;
  }, le = () => {
    const n = [];
    return a.forEach((o, e) => {
      s.has(e) || n.push(`Connection from non-existent node "${e}"`), o.forEach((t, r) => {
        s.has(t.target) || n.push(`Connection from "${e}" direction "${r}" to non-existent node "${t.target}"`);
      });
    }), n.length === 0 ? { valid: !0 } : { valid: !1, errors: n };
  }, ue = (n, o) => {
    x.has(n) || x.set(n, /* @__PURE__ */ new Set());
    const e = x.get(n);
    return e && e.add(o), () => {
      var t;
      (t = x.get(n)) == null || t.delete(o);
    };
  }, fe = () => {
    const n = {};
    s.forEach((e, t) => {
      n[t] = { ...e };
    });
    const o = {};
    return a.forEach((e, t) => {
      o[t] = {}, e.forEach((r, c) => {
        const i = {
          target: r.target,
          direction: c,
          gate: r.gate ?? null,
          cost: r.cost
        };
        r.fromTile !== void 0 && (i.fromTile = r.fromTile), r.toTile !== void 0 && (i.toTile = r.toTile), o[t] && (o[t][c] = i);
      });
    }), {
      nodes: n,
      connections: o
    };
  }, de = (n) => {
    s.clear(), a.clear(), N.clear();
    const o = n;
    if (!o.nodes || typeof o.nodes != "object")
      throw new T("Invalid serialized data: missing nodes");
    Object.entries(n.nodes).forEach(([e, t]) => {
      const r = { ...W(t.metadata), layer: t.layer };
      t.tiles && (r.tiles = t.tiles), m(e, r), t.zone && $(e, t.zone);
    }), Object.entries(n.connections).forEach(([e, t]) => {
      Object.entries(t).forEach(([r, c]) => {
        var l;
        const i = {
          target: c.target,
          direction: r,
          ...c.gate ? { gate: c.gate } : {},
          cost: c.cost ?? 1,
          ...c.fromTile ? { fromTile: c.fromTile } : {},
          ...c.toTile ? { toTile: c.toTile } : {},
          bidirectional: !1
        };
        a.has(e) || a.set(e, /* @__PURE__ */ new Map()), (l = a.get(e)) == null || l.set(r, i);
      });
    });
  }, D = (n) => R.opposite(n);
  return {
    createNode: m,
    getNode: P,
    hasNode: _,
    removeNode: C,
    getAllNodes: G,
    connect: q,
    disconnect: Z,
    getConnection: I,
    getExits: E,
    getDestination: F,
    setGate: Y,
    updateGate: B,
    removeGate: K,
    getGate: V,
    canTraverse: H,
    findPath: X,
    getDistance: k,
    canReach: J,
    getReachable: Q,
    getNodeAt: p,
    getTiles: M,
    getBounds: ee,
    getNodesInLayer: te,
    setZone: $,
    getZone: ne,
    getNodesInZone: oe,
    removeZone: re,
    registerDirection: ce,
    getOrphans: ie,
    getDeadEnds: se,
    getSubgraphs: ae,
    validate: le,
    on: ue,
    serialize: fe,
    deserialize: de
  };
}
export {
  R as Direction,
  ge as SpatialError,
  T as ValidationError,
  Oe as createSpatialGraph
};
