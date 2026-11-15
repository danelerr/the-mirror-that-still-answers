/* The Mirror That Still Answers — the actors: painted scenes, puppets, particles, signs and charts.
   Team Unsigned Int, NASA Space Apps Challenge 2026.
   Code written with an AI coding assistant, directed and reviewed by the team. */
(function () {
  "use strict";
  const F = window.F, W = F.W, H = F.H, IM = F.IM, EZ = F.EZ;
  const INK = "#24170e", PAPER = "#f3e6c8", GOLD = "#e8b53f", RED = "#b8432f";
  F.INK = INK; F.PAPER = PAPER; F.GOLD = GOLD; F.RED = RED;
  const FONT = "Georgia, 'Times New Roman', serif";
  F.FONT = FONT;

  // ---------- a painted scene ----------
  F.plate = (im, o) => Object.assign({
    im, x: 0, y: 0, w: W, h: 0, op: 1, z: -100, par: 1, tint: null, tintA: 0,
    draw(c) {
      const img = IM[this.im];
      if (!F.ready(img)) return;
      const h = this.h || this.w * img.height / img.width;
      c.globalAlpha = this.op;
      c.drawImage(img, this.x, this.y, this.w, h);
      if (this.tint && this.tintA > 0) {
        c.globalAlpha = this.op * this.tintA;
        c.fillStyle = this.tint;
        c.fillRect(this.x, this.y, this.w, h);
      }
    }
  }, o);

  // ---------- a picture that can move, squash, stretch and play frames ----------
  F.sprite = (im, o) => Object.assign({
    im, x: 0, y: 0, s: 1, sx: 1, sy: 1, rot: 0, op: 1, ax: 0.5, ay: 0.5, flip: 1, z: 0, par: 1, w: 0, frames: null, fps: 12,
    draw(c, t) {
      let img = IM[this.im];
      if (this.frames) {
        const n = this.frames.length;
        const i = this.frame !== undefined && this.frame !== null ? Math.round(this.frame)
          : this.loop === false ? Math.min(n - 1, Math.floor((t - (this.t0 || 0)) / 1000 * this.fps))
          : Math.floor(t / 1000 * this.fps) % n;
        img = IM[this.frames[F.clamp(i, 0, n - 1)]];
      }
      if (!F.ready(img)) return;
      const w = this.w || img.width, h = w * img.height / img.width;
      c.globalAlpha = this.op;
      c.translate(this.x, this.y);
      if (this.rot) c.rotate(this.rot);
      c.scale(this.s * this.sx * this.flip, this.s * this.sy);
      c.drawImage(img, -this.ax * w, -this.ay * h, w, h);
    }
  }, o);

  // ---------- frames cut from the team's sprite sheets (web/tools/cut_sprites.py) ----------
  F.hasSprites = (name) => !!(window.SPRITES && window.SPRITES[name]);
  F.spriteSet = (name, o) => {
    const meta = (window.SPRITES || {})[name] || { n: 0, w: 0, center: true };
    const frames = [];
    for (let i = 0; i < meta.n; i++) frames.push("spr_" + name + "_" + i);
    return F.sprite(frames[0], Object.assign({ frames, fps: 12, w: meta.w, ax: 0.5, ay: meta.center ? 0.5 : 1, loop: true }, o));
  };
  // play once from the first frame (or loop again with loop: true)
  F.playOnce = (a) => { a.loop = false; a.frame = null; a.t0 = F.t; return F.wait(a.frames.length / a.fps * 1000); };
  F.loadSprites = () => {
    const list = [];
    Object.keys(window.SPRITES || {}).forEach((n) => {
      for (let i = 0; i < window.SPRITES[n].n; i++) list.push(["spr_" + n + "_" + i, "assets/sprites/" + n + "/" + (i < 10 ? "0" : "") + i + ".png"]);
    });
    return F.load(list);
  };

  // ---------- anything drawn by a function ----------
  F.custom = (draw, o) => Object.assign({ z: 0, par: 1, op: 1, draw }, o);

  // ---------- stars that twinkle in steps ----------
  F.stars = (o) => {
    const a = Object.assign({ z: -200, par: 0.15, n: 260, seed: 1969, w: W * 1.6, h: H * 1.4, x: -W * 0.3, y: -H * 0.2, op: 1, list: [] }, o);
    const r = F.rng(a.seed);
    for (let i = 0; i < a.n; i++) a.list.push({ x: a.x + r() * a.w, y: a.y + r() * a.h, r: 0.4 + r() * 1.4 });
    a.draw = function (c, t) {
      const tw = Math.floor(t / 250);
      c.fillStyle = "#fff"; c.strokeStyle = "#fff";
      for (let i = 0; i < this.list.length; i++) {
        const s = this.list[i];
        c.globalAlpha = this.op * (0.3 + 0.6 * (((i * 7919 + tw * 104729) % 97) / 97));
        if (i % 13 === 0) {
          const q = s.r * 3.4;
          c.lineWidth = 1.2;
          c.beginPath(); c.moveTo(s.x - q, s.y); c.lineTo(s.x + q, s.y); c.moveTo(s.x, s.y - q); c.lineTo(s.x, s.y + q); c.stroke();
        } else {
          c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.2832); c.fill();
        }
      }
    };
    return a;
  };

  // ---------- cartoon puffs: a cluster of circles with one ink outline ----------
  function puffShape(c, x, y, r, fill, ink, seed) {
    const k = [[0, 0, 1], [-0.75, 0.25, 0.7], [0.78, 0.2, 0.74], [-0.3, -0.45, 0.66], [0.38, -0.4, 0.6]];
    c.fillStyle = ink;
    for (const p of k) { c.beginPath(); c.arc(x + p[0] * r, y + p[1] * r, p[2] * r + Math.max(2, r * 0.09), 0, 6.2832); c.fill(); }
    c.fillStyle = fill;
    for (const p of k) { c.beginPath(); c.arc(x + p[0] * r, y + p[1] * r, p[2] * r, 0, 6.2832); c.fill(); }
  }
  F.puffShape = puffShape;
  function star4(c, x, y, r, rot) {
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? r * 0.32 : r, a = rot + i * Math.PI / 4;
      c[i ? "lineTo" : "moveTo"](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
  }
  F.star4 = star4;
  F.starburst = function (c, x, y, R, frame, fill) {
    c.beginPath();
    for (let v = 0; v < 18; v++) {
      const rr = v % 2 ? R * 0.48 : R, aa = v * Math.PI / 9 + (frame % 2) * 0.17;
      c[v ? "lineTo" : "moveTo"](x + Math.cos(aa) * rr, y + Math.sin(aa) * rr);
    }
    c.closePath();
    c.fillStyle = fill || "#ffe07a"; c.fill();
    c.strokeStyle = INK; c.lineWidth = Math.max(2, R * 0.08); c.lineJoin = "round"; c.stroke();
  };

  // ---------- particles: dust, smoke, sparkles, wind, data dots ----------
  F.particles = (o) => {
    const a = Object.assign({ z: 50, par: 1, op: 1, list: [] }, o);
    a.emit = function (kind, x, y, n, opt) {
      opt = opt || {};
      for (let i = 0; i < n; i++) {
        const sp = opt.spread === undefined ? 30 : opt.spread;
        const p = {
          kind, x: x + (Math.random() - 0.5) * sp, y: y + (Math.random() - 0.5) * sp * 0.4, life: 0,
          max: (opt.life || 1) * (0.7 + Math.random() * 0.6),
          vx: (opt.vx || 0) + (Math.random() - 0.5) * (opt.vxr === undefined ? 80 : opt.vxr),
          vy: (opt.vy === undefined ? -60 : opt.vy) + (Math.random() - 0.5) * (opt.vyr === undefined ? 50 : opt.vyr),
          g: opt.g === undefined ? 40 : opt.g, r: (opt.r || 14) * (0.7 + Math.random() * 0.6), grow: opt.grow === undefined ? 1.6 : opt.grow,
          fill: opt.fill || "#d9a77a", ink: opt.ink || "rgba(60,30,15,0.55)", rot: Math.random() * 6, vr: (Math.random() - 0.5) * 6,
          len: opt.len || 80
        };
        this.list.push(p);
      }
    };
    a.update = function (dt) {
      for (const p of this.list) {
        p.life += dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += p.g * dt;
        if (p.kind === "smoke" || p.kind === "puff") { p.vx *= Math.pow(0.4, dt); p.vy *= Math.pow(0.5, dt); }
        p.rot += p.vr * dt;
      }
      this.list = this.list.filter((p) => p.life < p.max);
    };
    a.draw = function (c, t) {
      for (const p of this.list) {
        const u = p.life / p.max, fade = Math.max(0, 1 - u);
        c.globalAlpha = this.op * (p.kind === "spark" ? Math.min(1, fade * 2) : Math.min(1, fade * 1.4));
        if (p.kind === "puff" || p.kind === "smoke") {
          puffShape(c, p.x, p.y, p.r * (1 + u * p.grow), p.fill, p.ink);
        } else if (p.kind === "spark") {
          star4(c, p.x, p.y, p.r * (1 - u * 0.5), p.rot);
          c.fillStyle = p.fill; c.fill();
          c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
        } else if (p.kind === "streak") {
          c.strokeStyle = p.fill; c.lineWidth = p.r * 0.2; c.lineCap = "round";
          c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.len * Math.sign(p.vx || 1), p.y); c.stroke();
        } else if (p.kind === "dot") {
          const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.4);
          g.addColorStop(0, p.fill); g.addColorStop(1, "rgba(255,224,122,0)");
          c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r * 2.4, 0, 6.2832); c.fill();
        } else if (p.kind === "rock") {
          c.fillStyle = p.fill; c.strokeStyle = INK; c.lineWidth = 2;
          c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
          c.beginPath(); c.moveTo(-p.r, 0); c.lineTo(-p.r * 0.3, -p.r * 0.8); c.lineTo(p.r * 0.8, -p.r * 0.4); c.lineTo(p.r * 0.6, p.r * 0.6); c.lineTo(-p.r * 0.5, p.r * 0.7); c.closePath();
          c.fill(); c.stroke(); c.restore();
        }
      }
    };
    return a;
  };

  // ---------- text on a vintage sign ----------
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  F.roundRect = roundRect;
  // style: "card" (paper sign), "ink" (big outlined letters), "gold" (gold letters with ink outline)
  F.stamp = (lines, o) => {
    const a = Object.assign({ lines: [].concat(lines), x: W / 2, y: H / 2, s: 1, sx: 1, sy: 1, rot: 0, op: 1, z: 80, par: 0, size: 54, style: "card", kicker: "", color: INK },
      o);
    a.draw = function (c) {
      c.globalAlpha = this.op;
      c.translate(this.x, this.y);
      c.rotate(this.rot);
      c.scale(this.s * this.sx, this.s * this.sy);
      const fs = this.size, lh = fs * 1.08, ks = fs * 0.42;
      c.font = "bold " + fs + "px " + FONT;
      let w = 0;
      for (const l of this.lines) w = Math.max(w, c.measureText(l).width);
      if (this.kicker) { c.font = "bold " + ks + "px " + FONT; w = Math.max(w, c.measureText(this.kicker).width * 1.25); }
      const th = this.lines.length * lh + (this.kicker ? ks * 1.6 : 0);
      if (this.style === "card") {
        const pw = w + fs * 1.1, ph = th + fs * 0.75;
        c.fillStyle = "rgba(0,0,0,0.35)"; roundRect(c, -pw / 2 + 7, -ph / 2 + 9, pw, ph, 14); c.fill();
        c.fillStyle = PAPER; roundRect(c, -pw / 2, -ph / 2, pw, ph, 14); c.fill();
        c.strokeStyle = INK; c.lineWidth = 6; c.stroke();
        c.lineWidth = 2; roundRect(c, -pw / 2 + 10, -ph / 2 + 10, pw - 20, ph - 20, 8); c.stroke();
      }
      c.textAlign = "center"; c.textBaseline = "middle";
      let y = -th / 2;
      if (this.kicker) {
        c.font = "bold " + ks + "px " + FONT;
        c.fillStyle = this.style === "card" ? RED : GOLD;
        if (this.style !== "card") { c.lineWidth = 5; c.strokeStyle = INK; c.strokeText(this.kicker.toUpperCase(), 0, y + ks * 0.7); }
        c.fillText(this.kicker.toUpperCase(), 0, y + ks * 0.7);
        y += ks * 1.6;
      }
      c.font = "bold " + fs + "px " + FONT;
      for (const l of this.lines) {
        if (this.style === "card") { c.fillStyle = this.color; c.fillText(l, 0, y + lh / 2); }
        else {
          c.lineJoin = "round";
          c.lineWidth = fs * 0.2; c.strokeStyle = INK; c.strokeText(l, 0, y + lh / 2);
          c.fillStyle = this.style === "gold" ? GOLD : PAPER; c.fillText(l, 0, y + lh / 2);
        }
        y += lh;
      }
    };
    return a;
  };
  // A sign pops in: it overshoots, wobbles and settles (squash and stretch)
  F.popIn = async function (a, ms, sound) {
    const s1 = a.s0 || (a.s0 = a.s || 1);
    a.s = 0.01; a.op = 1;
    F.add(a);
    F.sfx(sound || "pop");
    await F.tw(a, { s: s1 }, ms || 420, EZ.bigBack);
  };
  F.popOut = async function (a, ms) {
    await F.tw(a, { s: 0.01, op: 0 }, ms || 220, EZ.inBack);
    F.remove(a);
  };
  F.stampDown = async function (a) {        // slams onto the screen like a rubber stamp
    const s1 = a.s0 || (a.s0 = a.s || 1);
    a.s = s1 * 2.4; a.op = 0;
    F.add(a);
    await F.tw(a, { s: s1, op: 1 }, 180, EZ.in);
    F.sfx("stamp");
    F.shake(6);
    a.sx = 1.12; a.sy = 0.88;
    await F.tw(a, { sx: 1, sy: 1 }, 260, EZ.elastic);
  };

  // ---------- a real NASA photo, pinned up as proof ----------
  F.proof = (im, caption, o) => {
    const a = Object.assign({ im, caption, x: W / 2, y: H / 2, w: 520, s: 1, rot: -0.04, op: 1, z: 90, par: 0, label: "REAL NASA PHOTO" }, o);
    a.draw = function (c) {
      const img = IM[this.im];
      if (!F.ready(img)) return;
      const w = this.w, h = w * img.height / img.width, b = 16;
      c.globalAlpha = this.op;
      c.translate(this.x, this.y); c.rotate(this.rot); c.scale(this.s, this.s);
      c.fillStyle = "rgba(0,0,0,0.4)"; c.fillRect(-w / 2 - b + 10, -h / 2 - b + 12, w + b * 2, h + b * 2 + 44);
      c.fillStyle = "#f7f1e3"; c.fillRect(-w / 2 - b, -h / 2 - b, w + b * 2, h + b * 2 + 44);
      c.drawImage(img, -w / 2, -h / 2, w, h);
      c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(-w / 2, -h / 2, w, h);
      c.fillStyle = INK; c.font = "15px Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(this.caption, 0, h / 2 + 30);
      // tape
      c.fillStyle = "rgba(236, 222, 170, 0.85)";
      c.save(); c.translate(-w / 2 + 10, -h / 2 - 6); c.rotate(-0.6); c.fillRect(-40, -12, 80, 24); c.restore();
      c.save(); c.translate(w / 2 - 10, -h / 2 - 6); c.rotate(0.6); c.fillRect(-40, -12, 80, 24); c.restore();
      // label
      c.save(); c.translate(w / 2 - 20, h / 2 - 8); c.rotate(-0.12);
      c.font = "bold 22px " + FONT;
      const lw = c.measureText(this.label).width + 26;
      c.fillStyle = RED; roundRect(c, -lw, -18, lw, 36, 6); c.fill();
      c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = PAPER; c.textAlign = "right"; c.fillText(this.label, -13, 1);
      c.restore();
    };
    return a;
  };

  // ---------- icons that get crossed out ----------
  F.icon = (kind, o) => {
    const a = Object.assign({ kind, x: W / 2, y: H / 2, s: 1, rot: 0, op: 1, z: 85, par: 0, xp: 0 }, o);
    a.draw = function (c) {
      c.globalAlpha = this.op;
      c.translate(this.x, this.y); c.rotate(this.rot); c.scale(this.s, this.s);
      c.lineJoin = "round"; c.lineCap = "round";
      c.fillStyle = PAPER; c.strokeStyle = INK; c.lineWidth = 7;
      c.beginPath(); c.arc(0, 0, 70, 0, 6.2832); c.fill(); c.stroke();
      c.lineWidth = 6;
      if (this.kind === "battery") {
        roundRect(c, -38, -22, 70, 44, 6); c.fillStyle = "#e9c86b"; c.fill(); c.stroke();
        c.fillStyle = INK; c.fillRect(33, -9, 9, 18);
        c.beginPath(); c.moveTo(-20, 0); c.lineTo(-4, 0); c.moveTo(-12, -8); c.lineTo(-12, 8); c.moveTo(8, 0); c.lineTo(22, 0); c.stroke();
      } else if (this.kind === "gear") {
        c.fillStyle = "#b9b2a4";
        c.beginPath();
        for (let i = 0; i < 16; i++) {
          const r = i % 2 ? 30 : 42, a2 = i * Math.PI / 8;
          c[i ? "lineTo" : "moveTo"](Math.cos(a2) * r, Math.sin(a2) * r);
        }
        c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.arc(0, 0, 11, 0, 6.2832); c.fillStyle = PAPER; c.fill(); c.stroke();
      } else if (this.kind === "voice") {
        c.fillStyle = "#fff";
        c.beginPath(); c.ellipse(0, -6, 42, 30, 0, 0, 6.2832); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(-14, 20); c.lineTo(-26, 40); c.lineTo(2, 23); c.fill(); c.stroke();
        c.fillStyle = INK;
        for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(i * 16, -6, 4.5, 0, 6.2832); c.fill(); }
      }
      if (this.xp > 0) {
        c.strokeStyle = RED; c.lineWidth = 14;
        const k = Math.min(1, this.xp * 2), k2 = Math.max(0, this.xp * 2 - 1);
        c.beginPath(); c.moveTo(-58, -58); c.lineTo(-58 + 116 * k, -58 + 116 * k); c.stroke();
        if (k2 > 0) { c.beginPath(); c.moveTo(58, -58); c.lineTo(58 - 116 * k2, -58 + 116 * k2); c.stroke(); }
      }
    };
    return a;
  };

  // ---------- a big cartoon stopwatch ----------
  F.stopwatch = (o) => {
    const a = Object.assign({ x: W / 2, y: H / 2, s: 1, sx: 1, sy: 1, rot: 0, op: 1, z: 85, par: 0, sec: 0, label: "", split: 0, digits: 3 }, o);
    a.draw = function (c) {
      c.globalAlpha = this.op;
      c.translate(this.x, this.y); c.rotate(this.rot); c.scale(this.s * this.sx, this.s * this.sy);
      c.lineJoin = "round"; c.lineCap = "round";
      c.strokeStyle = INK;
      c.fillStyle = "#c9c2b3"; c.lineWidth = 7;
      roundRect(c, -18, -150, 36, 30, 6); c.fill(); c.stroke();               // crown
      c.beginPath(); c.arc(0, -158, 16, 0, 6.2832); c.fill(); c.stroke();
      c.fillStyle = "#d8a440"; c.beginPath(); c.arc(0, 0, 128, 0, 6.2832); c.fill(); c.stroke();
      c.fillStyle = PAPER; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 108, 0, 6.2832); c.fill(); c.stroke();
      if (this.split > 0) {                      // the two halves of the trip
        c.fillStyle = "rgba(232,181,63,0.55)";
        c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 104, -Math.PI / 2, -Math.PI / 2 + Math.PI * this.split); c.closePath(); c.fill();
        c.fillStyle = "rgba(143,211,255,0.55)";
        c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 104, Math.PI / 2, Math.PI / 2 + Math.PI * this.split); c.closePath(); c.fill();
      }
      c.lineWidth = 3;
      for (let i = 0; i < 60; i++) {
        const an = i / 60 * 6.2832, r0 = i % 5 ? 96 : 86;
        c.beginPath(); c.moveTo(Math.sin(an) * r0, -Math.cos(an) * r0); c.lineTo(Math.sin(an) * 104, -Math.cos(an) * 104); c.stroke();
      }
      const an = (this.sec % 1) * 6.2832;       // the hand goes round once every second
      c.lineWidth = 6; c.strokeStyle = RED;
      c.beginPath(); c.moveTo(-Math.sin(an) * 18, Math.cos(an) * 18); c.lineTo(Math.sin(an) * 92, -Math.cos(an) * 92); c.stroke();
      c.fillStyle = INK; c.beginPath(); c.arc(0, 0, 9, 0, 6.2832); c.fill();
      c.font = "bold 52px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
      const txt = this.sec.toFixed(this.digits) + " s";
      const tw = c.measureText(txt).width + 40;
      c.fillStyle = INK; roundRect(c, -tw / 2, 146, tw, 70, 12); c.fill();
      c.fillStyle = "#ffe07a"; c.fillText(txt, 0, 183);
      if (this.label) { c.font = "bold 24px " + FONT; c.fillStyle = PAPER; c.lineWidth = 5; c.strokeStyle = INK; c.strokeText(this.label, 0, 246); c.fillText(this.label, 0, 246); }
    };
    return a;
  };

  // ---------- a thought bubble with a painted memory inside ----------
  F.thought = (im, o) => {
    const a = Object.assign({ im, x: 900, y: 230, w: 460, h: 300, fromX: 700, fromY: 520, open: 0, op: 1, z: 70, par: 1 }, o);
    a.draw = function (c, t) {
      if (this.open <= 0.01) return;
      const img = IM[this.im], k = this.open, cx = this.x, cy = this.y, rw = this.w / 2 * k, rh = this.h / 2 * k;
      c.globalAlpha = this.op;
      // the trail of little bubbles
      for (let i = 0; i < 3; i++) {
        const u = (i + 1) / 4, bx = F.lerp(this.fromX, cx - rw * 0.6, u), by = F.lerp(this.fromY, cy + rh * 0.8, u), br = (8 + i * 8) * Math.min(1, k * 1.5);
        c.fillStyle = "#fff"; c.strokeStyle = INK; c.lineWidth = 4;
        c.beginPath(); c.arc(bx, by, br, 0, 6.2832); c.fill(); c.stroke();
      }
      const wob = Math.sin(t / 300) * 0.02;
      const blobs = [];
      for (let i = 0; i < 12; i++) {
        const an = i / 12 * 6.2832;
        blobs.push([cx + Math.cos(an) * rw * (0.86 + wob), cy + Math.sin(an) * rh * (0.84 - wob), Math.min(rw, rh) * 0.36]);
      }
      c.fillStyle = INK;
      c.beginPath(); c.ellipse(cx, cy, rw * 0.9 + 5, rh * 0.86 + 5, 0, 0, 6.2832); c.fill();
      for (const b of blobs) { c.beginPath(); c.arc(b[0], b[1], b[2] + 5, 0, 6.2832); c.fill(); }
      c.save();
      c.beginPath(); c.ellipse(cx, cy, rw * 0.9, rh * 0.86, 0, 0, 6.2832);
      for (const b of blobs) { c.moveTo(b[0] + b[2], b[1]); c.arc(b[0], b[1], b[2], 0, 6.2832); }
      c.fillStyle = "#fff"; c.fill("nonzero");
      c.clip("nonzero");
      if (F.ready(img)) c.drawImage(img, cx - rw * 1.25, cy - rh * 1.25, rw * 2.5, rh * 2.5);
      c.restore();
    };
    return a;
  };

  // ---------- a caption line at the bottom (sources) ----------
  F.credit = (text, o) => Object.assign({
    text, z: 200, par: 0, op: 0.85,
    draw(c) {
      c.globalAlpha = this.op;
      c.font = "12px Arial, sans-serif"; c.textAlign = "left"; c.textBaseline = "alphabetic";
      c.fillStyle = "rgba(0,0,0,0.5)"; c.fillText(this.text, 17, H - 11);
      c.fillStyle = "rgba(255,248,230,0.85)"; c.fillText(this.text, 16, H - 12);
    }
  }, o);

  // ======================== faces and gloves, drawn by code ========================
  // Expressions: every puppet keeps these numbers and they are tweened from one face to the next.
  const FACES = {
    neutral: { lid: 0, browY: 0, browT: 0, pup: 1, happy: 0, eyeS: 1 },
    happy: { lid: 0, browY: -6, browT: 0.1, pup: 1, happy: 1, eyeS: 1 },
    surprised: { lid: 0, browY: -16, browT: 0, pup: 0.6, happy: 0, eyeS: 1.2 },
    scared: { lid: 0, browY: -8, browT: 0.55, pup: 0.5, happy: 0, eyeS: 1.12 },
    worried: { lid: 0.15, browY: -3, browT: 0.45, pup: 0.85, happy: 0, eyeS: 1 },
    tired: { lid: 0.55, browY: 4, browT: 0.2, pup: 0.9, happy: 0, eyeS: 1 },
    asleep: { lid: 1, browY: 5, browT: 0, pup: 1, happy: 0, eyeS: 1 },
    determined: { lid: 0.28, browY: 3, browT: -0.45, pup: 1, happy: 0, eyeS: 1 },
    proud: { lid: 0.4, browY: -7, browT: -0.1, pup: 1, happy: 0, eyeS: 1 },
    curious: { lid: 0.1, browY: -10, browT: 0.25, pup: 1.1, happy: 0, eyeS: 1.05 },
    sad: { lid: 0.3, browY: 0, browT: 0.6, pup: 1, happy: 0, eyeS: 0.95 }
  };
  F.FACES = FACES;
  F.face = function (p, name, ms) {
    const f = FACES[name] || FACES.neutral;
    p.faceName = name;
    if (p.happy > 0.5 !== f.happy > 0.5) p.happy = f.happy;           // happy eyes switch like a new drawing
    return F.tw(p, { lid: f.lid, browY: f.browY, browT: f.browT, pup: f.pup, eyeS: f.eyeS }, ms || 140, EZ.out);
  };
  F.faceNow = function (p, name) { Object.assign(p, FACES[name] || FACES.neutral); p.faceName = name; };
  // Two cartoon eyes with pupils, lids and brows. eyes: [[x, y], [x, y]]; o: rx, ry, lidColor, browGap, ink width
  F.drawEyes = function (c, eyes, p, t, o) {
    const blink = p.blink !== false && p.lid < 0.9 && !p.happy && (t + (p.seed || 0)) % (p.blinkEvery || 3900) < 120;
    const lid = blink ? 1 : p.lid, lw = o.lw || 5;
    c.lineCap = "round"; c.lineJoin = "round";
    for (let i = 0; i < 2; i++) {
      const x = eyes[i][0], y = eyes[i][1], inner = i === 0 ? 1 : -1;
      const rx = o.rx * p.eyeS, ry = o.ry * p.eyeS;
      if (p.happy > 0.5) {
        c.strokeStyle = INK; c.lineWidth = lw * 1.3;
        c.beginPath(); c.arc(x, y + ry * 0.35, rx * 0.8, Math.PI * 1.12, Math.PI * 1.88); c.stroke();
      } else {
        c.fillStyle = "#fff"; c.strokeStyle = INK; c.lineWidth = lw;
        c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.2832); c.fill();
        c.save(); c.clip();
        const px = x + F.clamp(p.lx || 0, -1, 1) * rx * 0.42, py = y + F.clamp(p.ly || 0, -1, 1) * ry * 0.38;
        const pr = rx * 0.5 * p.pup, pry = ry * 0.58 * p.pup;
        c.fillStyle = INK; c.beginPath(); c.ellipse(px, py, pr, pry, 0, 0, 6.2832); c.fill();
        c.fillStyle = "#fff";                                     // the little pie-cut wedge of 1930s eyes
        c.beginPath(); c.moveTo(px + pr * 0.15, py - pry * 0.1); c.lineTo(px + pr * 0.95, py - pry * 0.55); c.lineTo(px + pr * 0.95, py - pry * 0.05); c.closePath(); c.fill();
        if (lid > 0.01) {
          const ly = y - ry + 2 * ry * lid;
          c.fillStyle = o.lidColor || "#d8d2c4";
          c.beginPath(); c.moveTo(x - rx - 2, y - ry - 2); c.lineTo(x + rx + 2, y - ry - 2); c.lineTo(x + rx + 2, ly); c.quadraticCurveTo(x, ly + ry * 0.25, x - rx - 2, ly); c.closePath(); c.fill();
          c.strokeStyle = INK; c.lineWidth = lw * 0.9;
          c.beginPath(); c.moveTo(x - rx, ly); c.quadraticCurveTo(x, ly + ry * 0.25, x + rx, ly); c.stroke();
        }
        c.restore();
        c.strokeStyle = INK; c.lineWidth = lw;
        c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.2832); c.stroke();
      }
      if (o.brows !== false) {
        const yb = y - o.ry - (o.browGap || o.ry * 0.45) + p.browY * (o.ry / 30);
        const ox = x - inner * rx * 0.85, ix = x + inner * rx * 0.85;
        const oy = yb + p.browT * o.ry * 0.25, iy = yb - p.browT * o.ry * 0.5;
        c.strokeStyle = INK; c.lineWidth = lw * 1.5;
        c.beginPath(); c.moveTo(ox, oy); c.quadraticCurveTo(x, Math.min(oy, iy) - o.ry * 0.18, ix, iy); c.stroke();
      }
    }
  };
  // A white cartoon glove of the 1930s: three fingers and a thumb. pose: open, point, fist, thumb, one, two, three, wave
  const GLOVE = {
    open: [1, 1, 1, 0.9], wave: [1, 1, 1, 0.9], point: [1.15, 0.2, 0.2, 0.35], fist: [0.2, 0.2, 0.2, 0.3],
    thumb: [0.2, 0.2, 0.2, 1.2], one: [1.1, 0.2, 0.2, 0.3], two: [1.1, 1.05, 0.2, 0.3], three: [1.1, 1.05, 1, 0.3]
  };
  F.glove = function (c, x, y, s, rot, pose, flip) {
    const f = GLOVE[pose] || GLOVE.open;
    c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(s * (flip || 1), s);
    const fingers = [[-12, -0.24], [0, 0], [12, 0.24]];
    const parts = (inkPad) => {
      // fingers
      fingers.forEach((fg, i) => {
        const L = 30 * f[i];
        c.save(); c.translate(fg[0], -12); c.rotate(fg[1] * (pose === "open" || pose === "wave" ? 1 : 0.4));
        c.beginPath(); c.moveTo(-6.8 - inkPad, 0); c.lineTo(-6.8 - inkPad, -L); c.arc(0, -L, 6.8 + inkPad, Math.PI, 0); c.lineTo(6.8 + inkPad, 0); c.closePath(); c.fill();
        c.restore();
      });
      // thumb
      c.save(); c.translate(-20, 2); c.rotate(pose === "thumb" ? -1.4 : -0.9);
      const T = 22 * f[3];
      c.beginPath(); c.moveTo(-6 - inkPad, 0); c.lineTo(-6 - inkPad, -T); c.arc(0, -T, 6 + inkPad, Math.PI, 0); c.lineTo(6 + inkPad, 0); c.closePath(); c.fill();
      c.restore();
      // palm and cuff
      roundRect(c, -21 - inkPad, -16 - inkPad, 42 + inkPad * 2, 38 + inkPad * 2, 14 + inkPad); c.fill();
      roundRect(c, -18 - inkPad, 20 - inkPad, 36 + inkPad * 2, 14 + inkPad * 2, 5 + inkPad); c.fill();
    };
    c.fillStyle = INK; parts(3.2);
    c.fillStyle = "#fbf8f0"; parts(0);
    c.strokeStyle = INK; c.lineWidth = 2.4; c.lineCap = "round";
    for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * 7, -6); c.lineTo(k * 7, 5); c.stroke(); }
    c.beginPath(); c.moveTo(-18, 25); c.lineTo(18, 25); c.stroke();
    c.restore();
  };

  // ======================== the Mirror ========================
  // The team's illustration (AI image generator), cut into a body and face pieces, animated here.
  const FACE = { brows: [1, 70], open: [21, 72], half: [24, 78], closed: [39, 80], happy: [39, 80],
    m_closed: [79, 42], m_small: [72, 15], m_open: [70, 46], m_oh: [67, 23], m_smile: [74, 48] };
  const FACE_IM = { brows: "espejo_cejas", open: "espejo_ojos_abiertos", half: "espejo_ojos_medio", closed: "espejo_ojos_cerrados",
    m_closed: "espejo_boca_cerrada", m_small: "espejo_boca_poco", m_open: "espejo_boca_abierta", m_oh: "espejo_boca_oh", m_smile: "espejo_boca_sonrisa" };
  function mouthFor(level) {
    if (level < 0.12) return "closed";
    if (level < 0.4) return "small";
    if (level < 0.84) return "open";
    return "oh";
  }
  F.mirror = (o) => {
    const a = Object.assign({ x: 380, y: 600, s: 1, sx: 1, sy: 1, rot: 0, op: 1, z: 20, par: 1, eyes: "closed", mouth: "closed", brows: false,
      glow: 0, lx: 0, ly: 0, level: 0, bobAmt: 1, shadow: true, dust: 0, hands: true, seed: Math.random() * 3000,
      lid: 0, browY: 0, browT: 0, pup: 1, happy: 0, eyeS: 1,
      gL: { x: -255, y: -170, rot: 0.25, s: 1.3, pose: "open" }, gR: { x: 255, y: -170, rot: -0.25, s: 1.3, pose: "open" } }, o);
    a.talk = (lv) => { a.level = lv; };
    a.draw = function (c, t) {
      const body = IM.espejo_cuerpo;
      if (!F.ready(body)) return;
      const st = F.step(t);
      const awake = this.eyes !== "closed";
      const breathe = awake ? Math.sin(st * 0.55) * 3 * this.bobAmt : Math.sin(t / 900) * 1.5;
      const talkBob = this.level > 0.15 ? (st % 2) * 2.5 : 0;
      c.globalAlpha = this.op;
      c.translate(this.x, this.y);
      if (this.shadow) {
        c.fillStyle = "rgba(0,0,0,0.35)";
        c.beginPath(); c.ellipse(0, 0, 200 * this.s * this.sx, 26 * this.s, 0, 0, 6.2832); c.fill();
      }
      c.rotate(this.rot);
      c.scale(this.s * this.sx, this.s * this.sy * (1 + breathe * 0.004));
      c.translate(-215, -410 - breathe - talkBob);
      c.drawImage(body, 0, 0, 430, 410);
      // the face sits on the blank window of the tray, drawn in perspective
      c.save();
      c.translate(133, 104);
      c.transform(0.9948, -0.1001, 0.2597, 0.9656, 0, 0);
      if (this.glow > 0.01) {
        const g = c.createRadialGradient(74, 84, 4, 74, 84, 110);
        g.addColorStop(0, "rgba(255,251,224," + this.glow + ")");
        g.addColorStop(0.55, "rgba(255,224,122," + (this.glow * 0.8) + ")");
        g.addColorStop(1, "rgba(255,224,122,0)");
        c.fillStyle = g; c.fillRect(-40, -30, 230, 230);
      }
      const part = (key, dx, dy) => {
        const img = IM[FACE_IM[key]], f = FACE[key];
        if (!F.ready(img) || !f) return;
        const w = f[1] / 100 * 148, h = w * img.height / img.width;
        c.drawImage(img, 74 - w / 2 + (dx || 0), f[0] / 100 * 169 + (dy || 0), w, h);
      };
      // eyes drawn by code: they look around, blink, squint and raise their brows
      const base = { open: 0, half: 0.5, closed: 1, happy: 0 }[this.eyes] || 0;
      const ef = { lid: Math.max(base, this.lid), browY: this.browY + (this.brows ? -12 : 0) + (this.eyes === "closed" ? 4 : 0), browT: this.browT,
        pup: this.pup, happy: this.happy || this.eyes === "happy" ? 1 : 0, eyeS: this.eyeS * (this.brows ? 1.12 : 1), lx: this.lx / 10, ly: this.ly / 10,
        seed: this.seed, blinkEvery: 3700 };
      F.drawEyes(c, [[48, 68], [100, 68]], ef, t, { rx: 20, ry: 27, lidColor: "#f2e8cc", browGap: 9, lw: 4 });
      const m = this.level > 0 ? mouthFor(this.level) : this.mouth;
      part("m_" + m);
      c.restore();
      if (this.hands) {                       // two floating gloves, a little behind the body's movement
        for (const side of [-1, 1]) {
          const g = side < 0 ? this.gL : this.gR;
          const ph = side < 0 ? 0 : 1.7, st2 = F.step(t);
          const fy = Math.sin(st2 * 0.45 + ph) * 6 * this.bobAmt;
          let r = g.rot;
          if (g.pose === "wave") r += Math.sin(t / 110) * 0.45;
          F.glove(c, 215 + g.x, 410 + g.y + fy + breathe, g.s, r, g.pose, side < 0 ? -1 : 1);
        }
      }
      if (this.dust > 0.01) {                  // dust that settled over the years
        c.globalAlpha = this.op * this.dust;
        c.fillStyle = "#cfc7b8";
        for (let i = 0; i < 26; i++) {
          const px = 70 + ((i * 97) % 290), py = 70 + ((i * 53) % 60) - (i % 3) * 8;
          c.beginPath(); c.arc(px, py, 6 + (i % 4) * 3, 0, 6.2832); c.fill();
        }
      }
    };
    return a;
  };
  F.mouthFor = mouthFor;

  // ======================== the photon ========================
  F.photon = (o) => {
    const a = Object.assign({ x: 0, y: 0, dir: 0, s: 1, stretch: 0, op: 1, z: 60, par: 1, lines: true, face: "foton_rapido", moving: true }, o);
    a.draw = function (c, t) {
      const st = F.step(t), img = IM[this.face];
      c.globalAlpha = this.op;
      c.translate(this.x, this.y);
      if (this.lines && this.moving) {
        c.lineCap = "round";
        for (let j = -1; j <= 1; j++) {
          const len = (60 + ((st * 31 + (j + 2) * 17) % 70)) * this.s;
          const sx = -Math.cos(this.dir) * 30 * this.s + Math.cos(this.dir + 1.5708) * j * 14 * this.s;
          const sy = -Math.sin(this.dir) * 30 * this.s + Math.sin(this.dir + 1.5708) * j * 14 * this.s;
          const ex = sx - Math.cos(this.dir) * len, ey = sy - Math.sin(this.dir) * len;
          c.strokeStyle = INK; c.lineWidth = 10 * this.s; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();
          c.strokeStyle = "#ffe07a"; c.lineWidth = 5 * this.s; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();
        }
      }
      if (F.ready(img)) {
        const wob = this.moving && st % 2 ? 1.12 : 1, back = Math.cos(this.dir) < 0;
        c.rotate(back ? this.dir + Math.PI : this.dir);
        c.scale((back ? -1 : 1) * this.s * wob * (1 + this.stretch), this.s / wob * (1 - this.stretch * 0.4));
        c.drawImage(img, -36, -39, 72, 78);
      }
    };
    return a;
  };

  // ======================== Opportunity ========================
  // Body, mast and arm are separate pieces. Follow-through: the mast and arm lag behind every change of speed.
  F.rover = (o) => {
    const a = Object.assign({ x: 640, y: 640, s: 0.46, sx: 1, sy: 1, tilt: 0, op: 1, z: 30, par: 1,
      mast: 0, mastV: 0, mastT: 0, mastLen: 1, arm: 0.1, armV: 0, armT: 0.1, look: 0, lookX: 0, eyes: "open", drive: 0, px: null, lvx: 0,
      dim: 0, glow: 0, dusty: 0, puffs: null, lastPuff: 0, flip: 1, seed: Math.random() * 3000,
      lid: 0, browY: 0, browT: 0, pup: 1, happy: 0, eyeS: 1, hand: "open", handRot: 3.55, handS: 2.1 }, o);
    a.update = function (dt, t) {
      if (this.px === null) this.px = this.x;
      const vx = (this.x - this.px) / Math.max(dt, 0.001), acc = (vx - this.lvx) / Math.max(dt, 0.001);
      this.lvx = vx; this.px = this.x;
      const lag = F.clamp(-acc * 0.00022 * this.flip, -0.35, 0.35);
      spring(this, "mast", "mastV", this.mastT + lag, 90, 9, dt);
      spring(this, "arm", "armV", this.armT + lag * 1.4, 70, 6, dt);
      const st = F.step(t);
      if (this.drive && this.puffs && st - this.lastPuff >= 4) {
        this.lastPuff = st;
        this.puffs.emit("puff", this.x - 150 * this.s * this.flip, this.y - 14, 2, { vx: -70 * this.flip, vy: -40, r: 14, life: 0.9, fill: "#d9a77a" });
      }
    };
    function spring(o, k, vk, target, stiff, damp, dt) {
      const acc = (target - o[k]) * stiff - o[vk] * damp;
      o[vk] += acc * dt; o[k] += o[vk] * dt;
    }
    a.head = function () {
      const bx = this.x + (300 - 466) * this.s * this.sx * this.flip, by = this.y + (330 - 789) * this.s * this.sy, L = 565 * 0.62 * this.s * this.mastLen;
      return { x: bx + Math.sin(this.mast * this.flip) * L * this.flip, y: by - Math.cos(this.mast) * L };
    };
    a.draw = function (c, t) {
      const body = IM.rover_cuerpo;
      if (!F.ready(body)) return;
      const st = F.step(t);
      const bob = this.drive ? -Math.abs(Math.sin(st * 1.3)) * 14 * this.drive : -Math.sin(t / 900) * 2;
      const sq = this.drive ? (st % 3 === 0 ? 0.08 : st % 3 === 1 ? -0.03 : 0) * this.drive : Math.sin(t / 900) * 0.012;
      const rock = this.drive ? Math.sin(st * 1.3) * 0.025 * this.drive : 0;
      c.globalAlpha = this.op;
      c.fillStyle = "rgba(40,20,10,0.35)";
      c.beginPath(); c.ellipse(this.x, this.y + 4, 230 * this.s * this.sx, 22 * this.s, 0, 0, 6.2832); c.fill();
      c.translate(this.x, this.y + bob);
      c.rotate(this.tilt + rock);
      c.scale(this.s * this.sx * (1 + sq) * this.flip, this.s * this.sy * (1 - sq));
      if (this.dim > 0) c.filter = "brightness(" + (1 - this.dim * 0.55).toFixed(2) + ") saturate(" + (1 - this.dim * 0.5).toFixed(2) + ")";
      c.drawImage(body, -466, -789);
      if (this.glow > 0.01) {                    // sunlight on the solar panels
        c.globalCompositeOperation = "lighter";
        c.globalAlpha = this.op * this.glow * 0.35;
        c.drawImage(body, -466, -789);
        c.globalCompositeOperation = "source-over";
        c.globalAlpha = this.op;
      }
      c.save();
      c.translate(300 - 466, 330 - 789);
      c.rotate(this.mast);
      c.scale(0.62, 0.62 * this.mastLen);
      if (F.ready(IM.rover_mastil)) c.drawImage(IM.rover_mastil, -172, -640);
      c.scale(1, 1 / this.mastLen);
      const base = { open: 0, half: 0.5, closed: 1 }[this.eyes] || 0, by = (78 - 640) * this.mastLen;
      F.drawEyes(c, [[80 - 172, by], [265 - 172, by]], { lid: Math.max(base, this.lid), browY: this.browY + (this.eyes === "closed" ? 6 : 0), browT: this.browT,
        pup: this.pup, happy: this.happy, eyeS: this.eyeS, lx: this.lookX / 10, ly: this.look / 10, seed: this.seed, blinkEvery: 4300 }, t,
        { rx: 50, ry: 54, lidColor: "#d9dadc", browGap: 16, lw: 7 });
      c.restore();
      c.save();
      c.translate(210 - 466, 395 - 789);
      c.rotate(this.arm);
      c.scale(0.5, 0.5);
      if (F.ready(IM.rover_brazo)) c.drawImage(IM.rover_brazo, -205, -45);
      if (this.hand) {
        let r = this.handRot;
        if (this.hand === "wave") r += Math.sin(t / 110) * 0.5;
        F.glove(c, -150, 392, this.handS, r, this.hand, 1);
      }
      c.restore();
      c.filter = "none";
      if (this.dusty > 0.01) {
        c.globalAlpha = this.op * this.dusty;
        c.fillStyle = "#b07a4e";
        for (let i = 0; i < 30; i++) { c.beginPath(); c.arc(-380 + ((i * 131) % 760), -560 + ((i * 37) % 90), 16 + (i % 4) * 6, 0, 6.2832); c.fill(); }
      }
    };
    return a;
  };

  // ======================== the chart of the laser measurements ========================
  F.llrChart = (o) => {
    const DATA = F.LLR;
    const a = Object.assign({ x0: 300, y0: 150, x1: 980, y1: 470, prog: 1, line: 1, sel: null, z: 10, par: 1, op: 1, light: true, glowAll: 0 }, o);
    a.draw = function (c) {
      const X0 = this.x0 + 70, X1 = this.x1 - 16, Y0 = this.y0 + 40, Y1 = this.y1 - 46;
      const t0 = DATA[0].t, t1 = DATA[DATA.length - 1].t;
      let kmMin = Infinity, kmMax = -Infinity;
      DATA.forEach((d) => { kmMin = Math.min(kmMin, d.km); kmMax = Math.max(kmMax, d.km); });
      kmMin = Math.floor(kmMin / 10000) * 10000; kmMax = Math.ceil(kmMax / 10000) * 10000;
      const x = (tt) => X0 + (tt - t0) / (t1 - t0) * (X1 - X0), y = (km) => Y1 - (km - kmMin) / (kmMax - kmMin) * (Y1 - Y0);
      const fg = this.light ? INK : PAPER, grid = this.light ? "rgba(36,23,14,0.18)" : "rgba(244,236,216,0.18)";
      c.globalAlpha = this.op;
      c.font = "13px Arial, sans-serif"; c.textBaseline = "middle"; c.textAlign = "right";
      for (let km = kmMin; km <= kmMax; km += 10000) {
        c.strokeStyle = grid; c.lineWidth = 1;
        c.beginPath(); c.moveTo(X0, y(km)); c.lineTo(X1, y(km)); c.stroke();
        c.fillStyle = fg; c.fillText(km.toLocaleString("en-US") + " km", X0 - 8, y(km));
      }
      c.textAlign = "center"; c.textBaseline = "top";
      const d0 = new Date(t0);
      for (let m = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth(), 1)); m.getTime() <= t1; m.setUTCMonth(m.getUTCMonth() + 3)) {
        if (m.getTime() < t0) continue;
        c.fillStyle = fg; c.fillText(m.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }), x(m.getTime()), Y1 + 8);
      }
      const cut = t0 + this.prog * (t1 - t0), lineCut = t0 + this.line * (t1 - t0);
      c.save();
      c.beginPath(); c.rect(X0, Y0 - 6, X1 - X0, Y1 - Y0 + 12); c.clip();
      c.strokeStyle = this.light ? "rgba(36,23,14,0.6)" : "rgba(244,236,216,0.6)"; c.lineWidth = 2.5;
      c.beginPath();
      let first = true;
      window.MOON_ORBIT.forEach((p) => {
        if (p[0] > lineCut) return;
        if (first) { c.moveTo(x(p[0]), y(p[1])); first = false; } else c.lineTo(x(p[0]), y(p[1]));
      });
      c.stroke();
      c.restore();
      const span = (t1 - t0) * 0.05;
      DATA.forEach((d) => {
        if (d.t > cut) return;
        const age = (cut - d.t) / span, q = Math.min(1, age) - 1;
        const k = age >= 1 ? 1 : Math.max(0, 1 + 2.70158 * q * q * q + 1.70158 * q * q);
        const px = x(d.t), py = y(d.km), gk = 1 + this.glowAll * 0.6;
        if (d.station === "APOL") { c.fillStyle = "#2f6fa8"; c.fillRect(px - 4 * k * gk, py - 4 * k * gk, 8 * k * gk, 8 * k * gk); }
        else { c.fillStyle = "#c0562c"; c.beginPath(); c.arc(px, py, 4.6 * k * gk, 0, 6.2832); c.fill(); }
      });
      if (this.sel && this.prog >= 1) {
        c.strokeStyle = RED; c.lineWidth = 3;
        c.beginPath(); c.arc(x(this.sel.t), y(this.sel.km), 13, 0, 6.2832); c.stroke();
        c.fillStyle = RED; c.textAlign = "right"; c.textBaseline = "bottom"; c.font = "bold 15px Arial, sans-serif";
        c.fillText("your light", x(this.sel.t) - 16, y(this.sel.km) - 8);
      }
      c.textAlign = "left"; c.textBaseline = "middle"; c.font = "14px Arial, sans-serif";
      const ly = this.y1 - 12;
      c.fillStyle = "#c0562c"; c.beginPath(); c.arc(X0 + 6, ly, 5, 0, 6.2832); c.fill();
      c.fillStyle = fg; c.fillText("Grasse, France", X0 + 16, ly);
      c.fillStyle = "#2f6fa8"; c.fillRect(X0 + 130, ly - 5, 10, 10);
      c.fillStyle = fg; c.fillText("Apache Point, New Mexico", X0 + 146, ly);
      c.strokeStyle = fg; c.lineWidth = 2; c.beginPath(); c.moveTo(X0 + 340, ly); c.lineTo(X0 + 366, ly); c.stroke();
      c.fillText("center to center (JPL Horizons)", X0 + 372, ly);
      c.font = "12px Arial, sans-serif"; c.textAlign = "right"; c.globalAlpha = this.op * 0.8;
      c.fillText("Each dot: one real laser measurement to the Apollo 11 mirror. Data: NASA CDDIS / ILRS.", X1, this.y0 + 14);
    };
    return a;
  };
})();
