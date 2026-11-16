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
  // the sky goes on above a painted plate, so a camera that follows something up never sees the plate's top edge:
  // the plate's own top colour (measured) fades in over its last strip and turns into `up` higher in the sky
  F.skyAbove = (pl, top, up, o) => F.custom(function (c) {
    const y0 = pl.y, x0 = pl.x - 600, w = pl.w + 1200, rgb = (a, al) => "rgba(" + a[0] + "," + a[1] + "," + a[2] + "," + al + ")";
    const g = c.createLinearGradient(0, y0 + 90, 0, y0);
    g.addColorStop(0, rgb(top, 0)); g.addColorStop(1, rgb(top, 1));
    c.fillStyle = g; c.fillRect(x0, y0, w, 91);
    const g2 = c.createLinearGradient(0, y0 + 1, 0, y0 - 700);
    g2.addColorStop(0, rgb(top, 1)); g2.addColorStop(1, rgb(up, 1));
    c.fillStyle = g2; c.fillRect(x0, y0 - 1200, w, 1201);
  }, Object.assign({ z: pl.z + 0.5, par: pl.par }, o));
  F.plate = (im, o) => Object.assign({
    im, x: 0, y: 0, w: W, h: 0, op: 1, z: -100, par: 1, tint: null, tintA: 0,
    draw(c) {
      const img = IM[this.im];
      if (!F.ready(img)) return;
      const h = this.h || this.w * img.height / img.width;
      c.globalAlpha = this.op;
      c.drawImage(img, this.x, this.y, this.w, h);
      if (this.ext) {                                   // mirrored copies on both sides, so no edge ever shows
        c.save(); c.translate(this.x, 0); c.scale(-1, 1); c.drawImage(img, 0, this.y, this.w, h); c.restore();
        c.save(); c.translate(this.x + 2 * this.w, 0); c.scale(-1, 1); c.drawImage(img, 0, this.y, this.w, h); c.restore();
      }
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
  // One size and one place for every sheet of a character. The cutter (web/tools/cut_sprites.py --body) writes,
  // for each sheet, the size of the character's body in it ("u") and where the body's centre is in the frames
  // ("cx", "cy"). Every sheet is drawn so that the body has the size U and sits at the same point: k is the
  // scale of a sheet whose body is exactly U, and RHO says how far below the body's centre the ground is.
  F.CHAR = {
    mirror: { U: 351, RHO: 0.538, k: 1.086 },
    probe: { U: 287, RHO: 0, k: 0.821 / 0.45 }
  };
  // where a frame of the sheet `name` goes for a character of scale s standing (or floating) at x, y
  F.place = function (sp, name, ch, s, x, y) {
    const meta = (window.SPRITES || {})[name], C = F.CHAR[ch];
    if (!meta || !meta.u) return false;
    const k = C.k * s * C.U / meta.u;
    sp.x = x; sp.y = y; sp.w = meta.w * k;
    sp.ax = meta.cx / meta.w; sp.ay = (meta.cy + C.RHO * meta.u) / meta.h;
    return true;
  };
  // the drawn frames of the Mirror, where the Mirror m is (its feet 13 units below its y, like the puppet)
  F.mirrorFrames = function (name, m, o) {
    const sp = F.spriteSet(name, Object.assign({ z: 21, frame: 0 }, o));
    if (!F.place(sp, name, "mirror", m.s, m.x, m.y + 13 * m.s)) Object.assign(sp, { x: m.x + 4, y: m.y + 8, w: 330 * m.s / 0.62, ax: 0.5, ay: 1 });
    if (o && o.x !== undefined) sp.x = o.x;
    if (o && o.y !== undefined) sp.y = o.y;
    return sp;
  };
  // the width to draw a rover sheet at, so the rover's wheels span the same distance in every sheet
  F.roverW = function (name, s) {
    const meta = (window.SPRITES || {})[name] || {};
    return (meta.wb ? meta.w * 360 / meta.wb : 470) * (s === undefined ? 0.46 : s) / 0.46;
  };
  F.R1_CYCLE = [0, 1, 2, 4, 6, 7];        // the drive cycle (drawings 3 and 5 have a panel painted the wrong colour)
  // the drawn frames of Pioneer 10, centred where the probe pr is
  F.probeFrames = function (name, pr, o) {
    const sp = F.spriteSet(name, Object.assign({ z: 31, frame: 0 }, o));
    if (!F.place(sp, name, "probe", pr.s, pr.x, pr.y)) Object.assign(sp, { x: pr.x, y: pr.y, w: 400 * pr.s / 0.45, ax: 0.5, ay: 0.5 });
    if (o && o.x !== undefined) sp.x = o.x;
    if (o && o.y !== undefined) sp.y = o.y;
    return sp;
  };
  // play once from the first frame (or loop again with loop: true)
  F.playOnce = (a) => { a.loop = false; a.frame = null; a.t0 = F.t; return F.wait(a.frames.length / a.fps * 1000); };
  // (the frames are packed as WebP by web/tools/pack_webp.py: five times lighter than PNG)
  F.spriteList = (only) => {                  // (only: a test on the set's name, to load a part of them)
    const list = [];
    Object.keys(window.SPRITES || {}).filter((n) => !only || only(n)).forEach((n) => {
      for (let i = 0; i < window.SPRITES[n].n; i++) list.push(["spr_" + n + "_" + i, "assets/sprites/" + n + "/" + (i < 10 ? "0" : "") + i + ".webp"]);
    });
    return list;
  };
  F.loadSprites = (onOne, only) => F.load(F.spriteList(only), onOne);

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

  // ---------- a rocket launch, told in clear beats ----------
  // ignition (the flame flickers on, smoke rolls out along the ground), anticipation (the rocket squats
  // and trembles while the engines build up), lift-off (it creeps off the pad, then goes faster and
  // faster, stretching, leaving a column of smoke), and the smoke stays behind after it is gone.
  // the rocket of the team's O3 sheet: drawings 0-9 are the ignition on the pad (smoke building, the rocket
  // squatting); obj_cohete2 is the same rocket cut clean from drawing 0, for the climb. Where it sits in a drawing:
  const O3 = "O3_cohete_despega", O3_BODY = { cx: 208, bottom: 451, w: 116, fw: 441, fh: 487 };
  F.rocketLaunch = async function (rocket, p, o) {
    o = o || {};
    const x0 = rocket.x, y0 = rocket.y, k0 = (rocket.im === "obj_cohete2" ? rocket.w / 0.6 : rocket.w) / 120;
    // the drawn ignition plays in place of the rocket until it lets go of the pad
    let pad = null;
    if (rocket.im === "obj_cohete2" && F.hasSprites(O3)) {
      pad = F.spriteSet(O3, { x: x0, y: y0, w: rocket.w * O3_BODY.fw / O3_BODY.w, ax: O3_BODY.cx / O3_BODY.fw,
        ay: O3_BODY.bottom / O3_BODY.fh, z: rocket.z, frame: 0 });
      F.add(pad);
      rocket.op = 0;
    }
    const padT0 = F.t, padMs = 220 + 300 + (o.build || 800) + (o.hold === undefined ? 220 : o.hold);
    const padRun = pad ? F.onFrame((t) => { pad.frame = Math.min(9, Math.floor((t - padT0) / padMs * 10)); pad.x = rocket.x; }) : null;
    const flame = F.custom(function (c, t) {
      if (this.k <= 0.01 || pad) return;          // (the drawn frames have their own flame on the pad)
      const st = F.step(t), L = (64 + (st % 3) * 16) * this.k * (1 + this.boost) * k0, W2 = 22 * k0;
      c.translate(rocket.x, rocket.y + 2); c.scale(rocket.sx, 1);
      c.fillStyle = "#ffb347"; c.strokeStyle = INK; c.lineWidth = 4; c.lineJoin = "round";
      c.beginPath(); c.moveTo(-W2, 0); c.quadraticCurveTo(-W2 * 0.8, L * 0.6, 0, L); c.quadraticCurveTo(W2 * 0.8, L * 0.6, W2, 0); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "#fff3b0"; c.beginPath(); c.moveTo(-W2 * 0.5, 0); c.quadraticCurveTo(-W2 * 0.35, L * 0.4, 0, L * 0.62); c.quadraticCurveTo(W2 * 0.35, L * 0.4, W2 * 0.5, 0); c.closePath(); c.fill();
    }, { z: rocket.z - 1, k: 0, boost: 0 });
    F.add(flame);
    const smokeFill = o.smoke || "#f6efe2", smokeInk = o.ink || "rgba(60,40,30,0.5)";
    // smoke rolling out to both sides along the ground while the rocket is still low
    const ground = F.every(60, () => {
      if (pad || flame.k < 0.2 || rocket.y < y0 - 260) return;
      for (const s of [-1, 1]) {
        p.emit("smoke", x0 + s * 26 * k0, y0 + 6, 1, { spread: 10, vx: s * (150 + 120 * flame.k), vxr: 80, vy: -12, vyr: 20, g: -6, r: 20 * k0, grow: 2.6, life: 1.8, fill: smokeFill, ink: smokeInk });
      }
    });
    // a column of smoke left behind as it climbs
    const trail = F.every(45, () => {
      if (rocket.y > y0 - 12 || rocket.y < -200) return;
      p.emit("smoke", rocket.x, rocket.y + 40 * k0, 2, { spread: 14, vx: 0, vxr: 50, vy: 30, vyr: 20, g: -4, r: 16 * k0, grow: 2.4, life: 2.6, fill: smokeFill, ink: smokeInk });
    });
    const build = o.build || 800;
    // 1. ignition: a cough of smoke, then the flame flickers on
    F.sfx("rumble", 1.4);
    if (!pad) p.emit("smoke", x0, y0 + 6, 6, { spread: 40, vy: -40, vxr: 200, g: -8, r: 22 * k0, grow: 2, life: 1.2, fill: smokeFill, ink: smokeInk });
    await F.tw(flame, { k: 0.45 }, 220, F.EZ.out);
    // 2. anticipation, in two beats: a small false start (a dip and back), then a deep squat while the
    //    engines build up and the trembling grows (exaggerated, as a cartoon would)
    let tremble = 0.4, wob = null;
    const shake = F.onFrame((t) => { rocket.x = x0 + Math.sin(t / 15) * 3.2 * tremble * flame.k; });
    try {
    await F.tw(rocket, { sx: 1.05, sy: 0.93 }, 140, F.EZ.out);
    await F.tw(rocket, { sx: 0.98, sy: 1.03 }, 160, F.EZ.inOut);
    F.tw(flame, { k: 1 }, build, F.EZ.inOut);
    F.tw({ v: 0.4 }, { v: 1.6 }, build, F.EZ.in, (e) => { tremble = 0.4 + 1.2 * e; });
    await F.tw(rocket, { sx: 1.18, sy: 0.8 }, build, F.EZ.inOut);
    F.shake(6);
    await F.wait(o.hold === undefined ? 220 : o.hold);
    // 3. release: it snaps tall with a flash, eases off the pad, then goes faster and faster, its little
    //    wobble dying out as it climbs; the camera follows a moment late
    tremble = 0;
    F.sfx("whoosh", 2); F.shake(11); F.flash(0.25);
    if (pad) {                       // on the flash, the clean rocket takes over and the drawn smoke bank bursts out
      padRun(); F.remove(pad); pad = null; rocket.op = 1;
      for (const s of [-1, 1]) p.emit("smoke", x0 + s * 60 * k0, y0, 9, { spread: 70, vx: s * 260, vxr: 160, vy: -20, vyr: 30, g: -6, r: 26 * k0, grow: 2.4, life: 2, fill: smokeFill, ink: smokeInk });
    }
    rocket.sx = 0.8; rocket.sy = 1.3;
    F.tw(rocket, { sx: 0.9, sy: 1.15 }, 420, F.EZ.out);
    F.tw(flame, { boost: 1 }, 1100, F.EZ.in);
    const tA = F.t;
    wob = F.onFrame((t) => { const u = (t - tA) / 1000; rocket.rot = Math.sin(u * 14) * 0.05 * Math.exp(-u * 2.2); });
    if (o.cam) F.tw(F.cam, o.cam, o.camMs || 2400, F.EZ.inOut);
    await F.tw(rocket, { y: y0 - 34 * k0 }, o.creep || 650, F.EZ.out);
    await F.tw(rocket, { y: -700 }, o.ms || 1900, F.EZ.in);
    // 4. gone: a streak and a twinkle where it left the sky; the smoke column stays behind
    p.emit("spark", x0, 30, 6, { spread: 30, vy: 0, vyr: 160, vxr: 160, g: 0, r: 14, life: 0.6, fill: "#fff6c8" });
    F.sfx("ting", 1.6);
    } finally {                      // also when a chapter jump cuts the launch short
      if (wob) wob();
      if (padRun) padRun();
      if (pad) { F.remove(pad); pad = null; rocket.op = 1; }
      shake(); ground(); trail();
      F.remove(flame);
      rocket.x = x0; rocket.rot = 0;
    }
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
      if (this.kicker) { c.font = "bold " + ks + "px " + FONT; w = Math.max(w, c.measureText(this.kicker.toUpperCase()).width * 1.08); }
      const pad = this.kicker && this.style === "card" ? ks * 0.9 : 0;    // room under the card's top line
      const th = this.lines.length * lh + (this.kicker ? ks * 1.6 : 0) + pad;
      if (this.style === "card") {
        const pw = w + fs * 1.1, ph = th + fs * 0.75;
        c.fillStyle = "rgba(0,0,0,0.35)"; roundRect(c, -pw / 2 + 7, -ph / 2 + 9, pw, ph, 14); c.fill();
        c.fillStyle = PAPER; roundRect(c, -pw / 2, -ph / 2, pw, ph, 14); c.fill();
        c.strokeStyle = INK; c.lineWidth = 6; c.stroke();
        c.lineWidth = 2; roundRect(c, -pw / 2 + 10, -ph / 2 + 10, pw - 20, ph - 20, 8); c.stroke();
      }
      c.textAlign = "center"; c.textBaseline = "middle";
      let y = -th / 2 + pad;
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
      c.fillStyle = INK; c.textAlign = "center"; c.textBaseline = "middle";
      let cfs = 15; c.font = cfs + "px Arial, sans-serif";            // the caption always fits the card
      while (c.measureText(this.caption).width > w + b * 2 - 16 && cfs > 10) { cfs -= 0.5; c.font = cfs + "px Arial, sans-serif"; }
      c.fillText(this.caption, 0, h / 2 + 30);
      // tape
      c.fillStyle = "rgba(236, 222, 170, 0.85)";
      c.save(); c.translate(-w / 2 + 10, -h / 2 - 6); c.rotate(-0.6); c.fillRect(-40, -12, 80, 24); c.restore();
      c.save(); c.translate(w / 2 - 10, -h / 2 - 6); c.rotate(0.6); c.fillRect(-40, -12, 80, 24); c.restore();
      // label
      c.save(); c.translate(w / 2 - 14, -h / 2 + 34); c.rotate(-0.12);      // on the photo's top corner, off the caption
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
    // the team's drawn stopwatch (X1 sheet): it bounces, squashes and tilts on its own; the face markings and
    // the hand are drawn on top, fitted to the face of each drawing. Drawings 6, 12-14 have a broken ring.
    const X1 = "X1_cronometro", X1_SEQ = [0, 0, 1, 2, 1, 0, 3, 5, 3, 0, 7, 8, 9, 10, 11, 10, 9, 8, 15];
    a.face = function (c) {                       // the face markings, in a circle of radius 100
      if (this.split > 0) {                      // the two halves of the trip
        c.fillStyle = "rgba(232,181,63,0.55)";
        c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 96, -Math.PI / 2, -Math.PI / 2 + Math.PI * this.split); c.closePath(); c.fill();
        c.fillStyle = "rgba(143,211,255,0.55)";
        c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 96, Math.PI / 2, Math.PI / 2 + Math.PI * this.split); c.closePath(); c.fill();
      }
      c.strokeStyle = INK; c.lineWidth = 8;
      for (let i = 0; i < 12; i++) {             // twelve fat ticks, the four main ones longer
        const an = i / 12 * 6.2832, r0 = i % 3 ? 74 : 62;
        c.beginPath(); c.moveTo(Math.sin(an) * r0, -Math.cos(an) * r0); c.lineTo(Math.sin(an) * 84, -Math.cos(an) * 84); c.stroke();
      }
      const an = (this.sec % 1) * 6.2832;       // the hand goes round once every second
      c.save(); c.rotate(an);                    // a fat cartoon hand: ink outline, red body, round tail
      c.fillStyle = RED; c.lineWidth = 6;
      c.beginPath(); c.moveTo(-9, 20); c.lineTo(-6, -48); c.lineTo(0, -76); c.lineTo(6, -48); c.lineTo(9, 20); c.closePath(); c.fill(); c.stroke();
      c.restore();
      c.fillStyle = INK; c.beginPath(); c.arc(0, 0, 13, 0, 6.2832); c.fill();
      c.fillStyle = "#e3b04a"; c.beginPath(); c.arc(0, 0, 5, 0, 6.2832); c.fill();
    };
    a.readout = function (c, y) {
      c.font = "bold 52px " + FONT; c.textAlign = "center"; c.textBaseline = "middle";
      const txt = this.sec.toFixed(this.digits) + " s";
      const tw = c.measureText(txt).width + 40;
      c.fillStyle = INK; roundRect(c, -tw / 2, y, tw, 70, 12); c.fill();
      c.fillStyle = "#ffe07a"; c.fillText(txt, 0, y + 37);
      if (this.label) { c.font = "bold 24px " + FONT; c.fillStyle = PAPER; c.lineWidth = 5; c.strokeStyle = INK; c.strokeText(this.label, 0, y + 100); c.fillText(this.label, 0, y + 100); }
    };
    a.drawSheet = function (c) {
      const meta = (window.SPRITES || {})[X1];
      if (!meta || !meta.faces || this.drawn === false) return false;
      const i = X1_SEQ[F.step(F.t || 0) % X1_SEQ.length], im = IM["spr_" + X1 + "_" + i], f = meta.faces[i], f0 = meta.faces[0];
      if (!F.ready(im) || !f || !f0) return false;
      const k = 1.0;                             // the face of the first drawing is about 104 px wide, like the old one
      c.fillStyle = "rgba(0,0,0,0.28)"; c.beginPath(); c.ellipse(8, 14, 118, 150, 0, 0, 6.2832); c.fill();   // soft drop shadow
      c.drawImage(im, -f0[0] * k, -f0[1] * k, meta.w * k, meta.h * k);
      c.save();
      c.translate((f[0] - f0[0]) * k, (f[1] - f0[1]) * k); c.rotate(f[4]); c.scale(f[2] * k / 100, f[3] * k / 100);
      c.lineJoin = "round"; c.lineCap = "round";
      this.face(c);
      c.restore();
      this.readout(c, (meta.h - f0[1]) * k + 14);
      return true;
    };
    a.draw = function (c) {
      c.globalAlpha = this.op;
      c.translate(this.x, this.y); c.rotate(this.rot); c.scale(this.s * this.sx, this.s * this.sy);
      if (this.drawSheet(c)) return;
      // drawn like the team's sheets: chunky ink lines, a painted gold case, a few fat tick marks
      c.lineJoin = "round"; c.lineCap = "round";
      c.strokeStyle = INK;
      c.fillStyle = "rgba(0,0,0,0.3)"; c.beginPath(); c.ellipse(8, 12, 130, 130, 0, 0, 6.2832); c.fill();   // soft drop shadow
      c.fillStyle = "#e3b04a"; c.lineWidth = 9;
      c.beginPath(); c.arc(0, -160, 20, 0, 6.2832); c.stroke();                                            // the ring on top
      roundRect(c, -20, -150, 40, 34, 9); c.fill(); c.stroke();                                           // crown
      c.beginPath(); c.arc(0, 0, 128, 0, 6.2832); c.fill(); c.stroke();                                   // gold case
      c.strokeStyle = "rgba(255,240,190,0.85)"; c.lineWidth = 9;                                          // painted highlight
      c.beginPath(); c.arc(0, 0, 114, -2.6, -1.3); c.stroke();
      c.strokeStyle = "rgba(120,70,20,0.45)"; c.beginPath(); c.arc(0, 0, 114, 0.4, 1.9); c.stroke();      // and shade
      c.strokeStyle = INK; c.fillStyle = "#f6ead0"; c.lineWidth = 7;
      c.beginPath(); c.arc(0, 0, 100, 0, 6.2832); c.fill(); c.stroke();                                   // cream face
      if (this.split > 0) {                      // the two halves of the trip
        c.fillStyle = "rgba(232,181,63,0.55)";
        c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 96, -Math.PI / 2, -Math.PI / 2 + Math.PI * this.split); c.closePath(); c.fill();
        c.fillStyle = "rgba(143,211,255,0.55)";
        c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 96, Math.PI / 2, Math.PI / 2 + Math.PI * this.split); c.closePath(); c.fill();
      }
      c.lineWidth = 8;
      for (let i = 0; i < 12; i++) {             // twelve fat ticks, the four main ones longer
        const an = i / 12 * 6.2832, r0 = i % 3 ? 78 : 66;
        c.beginPath(); c.moveTo(Math.sin(an) * r0, -Math.cos(an) * r0); c.lineTo(Math.sin(an) * 88, -Math.cos(an) * 88); c.stroke();
      }
      const an = (this.sec % 1) * 6.2832;       // the hand goes round once every second
      c.save(); c.rotate(an);                    // a fat cartoon hand: ink outline, red body, round tail
      c.fillStyle = RED; c.lineWidth = 6;
      c.beginPath(); c.moveTo(-9, 20); c.lineTo(-6, -50); c.lineTo(0, -80); c.lineTo(6, -50); c.lineTo(9, 20); c.closePath(); c.fill(); c.stroke();
      c.restore();
      c.fillStyle = INK; c.beginPath(); c.arc(0, 0, 13, 0, 6.2832); c.fill();
      c.fillStyle = "#e3b04a"; c.beginPath(); c.arc(0, 0, 5, 0, 6.2832); c.fill();
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
  // ---------- the Mirror drawn from the team's sheets: one design (with arms) in every scene ----------
  // gesture -> [sheet, first drawing of a two-step pair, flip]; a list of drawings is played as a loop
  const G = F.hasSprites("E13_espejo_gestos") ? "E13_espejo_gestos" : null;   // the teacher's gestures sheet
  const MP = {
    wave: ["E3_espejo_saluda", [6, 7, 8, 9, 10, 11, 10, 9, 8, 7]],
    self: ["E11_espejo_mira_lejos", 12], cheer: ["E11_espejo_mira_lejos", 12],     // (E13's laugh, 10-11, is missing an arm)
    right: G ? [G, 0] : ["E9_espejo_secreto", 14], present: G ? [G, 14] : ["E9_espejo_secreto", 14],
    left: G ? [G, 14] : ["E9_espejo_secreto", 14],      // (presenting with both gloves open: a flipped drawing looked wrong)
    pointUp: G ? [G, 2] : ["E6_espejo_cuenta", 10], one: ["E6_espejo_cuenta", 0], two: ["E6_espejo_cuenta", 2], three: ["E6_espejo_cuenta", 4],
    shrug: ["E6_espejo_cuenta", 6], droop: ["E6_espejo_cuenta", 8], whisper: ["E9_espejo_secreto", 6],
    thumb: G ? [G, 8] : ["E11_espejo_mira_lejos", 14], hips: ["E9_espejo_secreto", 0], shade: ["E11_espejo_mira_lejos", 2],
    tap: ["E5_espejo_anios", 6], up: ["E3_espejo_saluda", 0], big: G ? [G, 4] : ["E6_espejo_cuenta", 14]
  };
  // resting poses, chosen by the face it is making
  const WK = F.hasSprites("E2_espejo_despierta_brazos") ? "E2_espejo_despierta_brazos" : null;   // asleep, arms resting
  const MF = {
    neutral: ["E11_espejo_mira_lejos", 6], happy: ["E11_espejo_mira_lejos", 6], proud: ["E11_espejo_mira_lejos", 6],
    surprised: ["E3_espejo_saluda", 0], scared: ["E3_espejo_saluda", 0], worried: ["E11_espejo_mira_lejos", 4],
    sad: ["E11_espejo_mira_lejos", 4],
    tired: WK ? [WK, 2] : ["E5_espejo_anios", 10], asleep: WK ? [WK, 0] : ["E5_espejo_anios", 10],
    curious: ["E11_espejo_mira_lejos", 8], determined: ["E9_espejo_secreto", 2]
  };
  F.MIRROR_POSES = MP; F.MIRROR_MOODS = MF;
  // the talking sheet: 4 rows (neutral, happy, explaining with a raised glove, gentle/sad) x 4 mouths
  // (closed, half open, wide open, round "oo")
  const TALK = "E12_espejo_habla";
  const TALK_ROW = { neutral: 0, curious: 0, surprised: 0, scared: 0, happy: 1, proud: 1, determined: 2, worried: 3, sad: 3, tired: 3 };
  const mouthIdx = (lv) => (lv < 0.12 ? 0 : lv < 0.28 ? 1 : lv < 0.5 ? 3 : 2);
  // While it talks, the Mirror changes gesture at the little pauses between phrases (each row of a talking sheet is
  // one gesture with the four mouths). E12 rows: 0 neutral, 1 happy, 2 explaining with a glove up, 3 gentle/sad.
  // E15 rows: 0 gloves wide, 1 pointing up, 2 gloves clasped, 3 telling something important.
  const TALK2 = "E15_espejo_habla_gestos";
  const TALK_ROWS = {
    neutral: [[TALK, 0], [TALK, 2], [TALK2, 1], [TALK2, 0], [TALK2, 3]], curious: [[TALK, 0], [TALK2, 1], [TALK, 2], [TALK2, 3]],
    happy: [[TALK, 1], [TALK2, 0], [TALK, 2], [TALK2, 2]], proud: [[TALK, 1], [TALK2, 0], [TALK2, 1]],
    determined: [[TALK, 2], [TALK2, 1], [TALK2, 3]], surprised: [[TALK, 0], [TALK2, 0]], scared: [[TALK, 0], [TALK2, 2]],
    worried: [[TALK, 3], [TALK2, 2]], sad: [[TALK, 3], [TALK2, 2]], tired: [[TALK, 3]]
  };
  function talkRow(m, mood, t) {
    const list = (TALK_ROWS[mood] || TALK_ROWS.neutral).filter((r) => F.hasSprites(r[0]));
    if (m.level > 0.12) {
      if (m.lowT !== undefined && t - m.lowT > 160 && t - (m.rowT || 0) > 1300) { m.rowI = (m.rowI || 0) + 1; m.rowT = t; }
      m.lowT = undefined;
    } else if (m.lowT === undefined) m.lowT = t;
    if (t - m.loudT > 1500) { m.rowI = 0; m.rowT = t; }          // a new speech starts with its first gesture
    return list[(m.rowI || 0) % list.length] || [TALK, TALK_ROW[mood] || 0];
  }
  // the listening sheet: when the Mirror is quiet for a moment it reacts with its face instead of freezing
  // (each reaction drawn in two steps: interest 2-3, "oh" 4-5, warm smile 6-7, a laugh 10-11, sad sigh 12-13, proud nod 14-15)
  const LISTEN = "E14_espejo_escucha";
  const LISTEN_K = { neutral: 2, curious: 2, happy: 6, proud: 14, determined: 14, surprised: 4, scared: 4, worried: 12, sad: 12, tired: 12 };
  // hopping: the team's hop drawings (E16) follow the hop's phase (take-off squash, spring, stretch, air, down,
  // landing squash); the arc itself is done in the draw. The drawings face right: flipped when it hops left.
  // (drawings 3, 4, 10-12 have gloves with four fingers: the hop uses the fists of 2 and 6 instead)
  const HOP = "E16_espejo_salta", HOP_SEQ = [1, 2, 6, 6, 2, 5, 7, 8, 9];
  function mirrorDrawing(m, t) {
    let e;
    if (m.force && F.hasSprites(m.force[0])) {          // a scene can hold one exact drawing (m.force = [set, frame])
      const key = m.force.join(":");
      if (key !== m.drawnKey) { m.drawnKey = key; m.drawnT = t; }
      return { im: IM["spr_" + m.force[0] + "_" + m.force[1]], flip: 1, since: t - m.drawnT, set: m.force[0] };
    }
    if (m.hopping && F.hasSprites(HOP)) {
      const k = HOP_SEQ[Math.min(HOP_SEQ.length - 1, Math.floor((m.hopPhase || 0) * HOP_SEQ.length))];
      m.drawnKey = HOP; m.drawnT = t - 1000;
      return { im: IM["spr_" + HOP + "_" + k], flip: m.hopDir < 0 ? -1 : 1, since: 1000, set: HOP };
    }
    const mood = m.faceName || "neutral", resting = !MP[m.pose] || m.pose === "rest" || m.pose === "ground";
    if (m.level > 0.12 || m.loudT === undefined) m.loudT = t;
    if (m.eyes === "open" && resting && t - m.loudT > 450 && LISTEN_K[mood] !== undefined && F.hasSprites(LISTEN)) {
      const k0 = LISTEN_K[mood], key = LISTEN + k0;
      if (key !== m.drawnKey) { m.drawnKey = key; m.drawnT = t; }
      const since = t - m.drawnT;
      return { im: IM["spr_" + LISTEN + "_" + (k0 + (since > 110 ? 1 : 0))], flip: 1, since, set: LISTEN };
    }
    if (m.eyes !== "closed" && F.hasSprites(TALK)) {
      let k = -1, key = "";
      if (resting && !(m.level <= 0.12 && (mood === "surprised" || mood === "scared"))) {
        const r = talkRow(m, mood, t);
        k = r[1] * 4 + mouthIdx(m.level || 0); key = r[0] + r[1];
        if (key !== m.drawnKey) { m.drawnKey = key; m.drawnT = t; }
        return { im: IM["spr_" + r[0] + "_" + k], flip: 1, since: t - m.drawnT, set: r[0], talking: true };
      } else if ((m.pose === "present" || m.pose === "right") && m.level > 0.12) {
        k = [8, 9, 9, 11][mouthIdx(m.level)]; key = TALK + "hand";      // talking with a raised, open glove
      }
      if (k >= 0) {
        if (key !== m.drawnKey) { m.drawnKey = key; m.drawnT = t; }
        return { im: IM["spr_" + TALK + "_" + k], flip: 1, since: t - m.drawnT, set: TALK };
      }
    }
    if (m.eyes === "closed") e = MF.asleep;
    else if (MP[m.pose] && m.pose !== "rest" && m.pose !== "ground") e = MP[m.pose];
    else e = MF[m.faceName] || (m.eyes === "half" ? MF.tired : MF.neutral);
    if (!F.hasSprites(e[0])) return null;
    const key = e[0] + e[1];
    if (key !== m.drawnKey) { m.drawnKey = key; m.drawnT = t; }
    const since = t - m.drawnT, st = Math.floor(t / 1000 * 12);
    let k;
    if (Array.isArray(e[1])) k = e[1][st % e[1].length];
    else {
      k = e[1] + (since > 110 ? 1 : 0);                         // the pose lands in two small steps
      if (since > 400 && m.level > 0.15 && Math.floor(st / 3) % 2) k = e[1];   // talking: a gentle alternation
    }
    return { im: IM["spr_" + e[0] + "_" + k], flip: e[2] || 1, since, set: e[0] };
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
      // it has no legs, so when it goes somewhere it hops: about one hop every 150 px, squashing as it lands
      // and stretching in the air (a jump of more than 120 px in one frame is a cut, not a move)
      const dtm = Math.max(0.001, F.dt || 0.016), dx = this._px === undefined ? 0 : this.x - this._px;
      this._px = this.x;
      const moving = this.hops !== false && Math.abs(dx) < 120 && Math.abs(dx) / dtm > 60;
      if (moving) this.hopPh = (this.hopPh || 0) + Math.abs(dx) / (150 * Math.max(0.2, this.s));
      else if ((this.hopPh || 0) % 1 > 0.001) this.hopPh = Math.min(Math.ceil(this.hopPh), this.hopPh + dtm * 3.5);   // finish the hop
      const air = Math.sin(((this.hopPh || 0) % 1) * Math.PI), land = moving && air < 0.35 ? (0.35 - air) / 0.35 : 0;
      if (this.shadow) {
        c.fillStyle = "rgba(0,0,0," + (0.35 - air * 0.12) + ")";
        c.beginPath(); c.ellipse(0, 0, 200 * this.s * this.sx * (1 - air * 0.25), 26 * this.s, 0, 0, 6.2832); c.fill();
      }
      c.translate(0, -air * 34 * this.s);
      this.hopSq = land * 0.09 - air * 0.05;          // + squashed (landing), - stretched (in the air)
      this.hopping = moving || (this.hopPh || 0) % 1 > 0.001;
      this.hopPhase = (this.hopPh || 0) % 1;
      if (Math.abs(dx) > 0.5) this.hopDir = Math.sign(dx);
      const dr = this.drawn === false ? null : mirrorDrawing(this, t);
      if (dr && F.ready(dr.im)) {
        // the drawn Mirror: a little squash as each new pose lands, then it settles (and breathes)
        const u = Math.min(1, dr.since / 240), sq = 0.06 * (1 - u) * (1 - u);
        // while it talks the body follows the voice: it stretches a little on the loud syllables, sways gently
        // and gives a small hop on an accent (the level jumping up after a quiet moment)
        const lv = dr.talking ? Math.min(1, this.level || 0) : 0;
        if (dr.talking) {
          if (lv > 0.5 && (this.prevLv || 0) < 0.25 && t - (this.hopT || 0) > 600) this.hopT = t;
          this.prevLv = lv;
        }
        const hop = dr.talking && t - (this.hopT || 0) < 260 ? Math.sin((t - this.hopT) / 260 * Math.PI) : 0;
        const hs = (this.hopSq || 0) * (dr.set === HOP ? 0.35 : 1);   // (the hop drawings squash on their own)
        c.translate(0, -(lv * 5 + hop * 9) * this.s);
        // a gentle sway all the time (a little more while talking), so a held pose is never frozen
        c.rotate(this.rot + Math.sin(t / 900 + this.seed) * (dr.talking ? 0.022 : 0.01));
        c.scale(this.s * this.sx * (1 + sq + hs - lv * 0.025 - hop * 0.03) * dr.flip, this.s * this.sy * (1 - sq - hs + lv * 0.04 + hop * 0.05) * (1 + breathe * 0.004));
        const meta = (window.SPRITES || {})[dr.set] || {}, M = F.CHAR.mirror;
        let w = dr.im.width * 1.086, h = dr.im.height * 1.086, x0 = -w / 2 + 6, y0 = -h + 13;
        if (meta.u) {                              // same body size and same body position for every sheet
          const k = M.k * M.U / meta.u;
          w = meta.w * k; h = meta.h * k; x0 = -meta.cx * k; y0 = 13 - (meta.cy + M.RHO * meta.u) * k;
        }
        c.drawImage(dr.im, x0, y0 - breathe * 0.6, w, h);
        if (this.glow > 0.01) {
          c.globalCompositeOperation = "lighter";
          const g = c.createRadialGradient(0, -h * 0.55, 10, 0, -h * 0.55, 230);
          g.addColorStop(0, "rgba(255,240,180," + (this.glow * 0.8) + ")");
          g.addColorStop(1, "rgba(255,224,122,0)");
          c.fillStyle = g; c.fillRect(-260, -h * 0.55 - 260, 520, 520);
          c.globalCompositeOperation = "source-over";
        }
        return;
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
      // while it flies, the team's drawn flight cycle is used (8 frames, with its own speed lines)
      const fly = this.moving && F.hasSprites("F1_foton_vuela") ? IM["spr_F1_foton_vuela_" + (st % 8)] : null;
      if (F.ready(fly)) {
        const back = Math.cos(this.dir) < 0, w = 190 * this.s, h = w * fly.height / fly.width;
        c.rotate(back ? this.dir + Math.PI : this.dir);
        c.scale((back ? -1 : 1) * (1 + this.stretch), 1 - this.stretch * 0.4);
        c.drawImage(fly, -w * 0.62, -h / 2, w, h);
        return;
      }
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
    // the drawn rover (the team's sheets): one design in every scene, chosen by what it is doing
    a.drawing = function (t) {
      if (this.drawn === false) return null;
      const st = Math.floor(t / 1000 * 12), has = F.hasSprites, mood = this.faceName || "neutral";
      let set = null, k = 0;
      if (this.armT <= 1.5) this.waveT0 = -1;
      if (this.drive > 0.3 && has("R1_rover_avanza")) { set = "R1_rover_avanza"; k = F.R1_CYCLE[st % F.R1_CYCLE.length]; }
      else if ((this.eyes === "closed" || mood === "asleep") && has("R7_rover_ultimos_dias")) { set = "R7_rover_ultimos_dias"; k = 15; }
      else if (this.dusty > 0.5 && has("R5_rover_tormenta")) { set = "R5_rover_tormenta"; k = 6 + (Math.floor(st / 8) % 2); }
      else if (this.armT > 1.5 && has("R8_rover_celebra")) {    // it raises its arm and shakes its fist happily
        if (!(this.waveT0 >= 0)) this.waveT0 = t;                 // (the open-glove waves of R10 and R8 have four
        const WV = [0, 12, 14, 12];                               //  fingers, so they are not used)
        set = "R8_rover_celebra"; k = WV[Math.floor((t - this.waveT0) / 1000 * 6) % WV.length];
      }
      else if ((mood === "tired" || this.eyes === "half") && has("R7_rover_ultimos_dias")) { set = "R7_rover_ultimos_dias"; k = 3; }
      else if ((mood === "worried" || mood === "scared" || mood === "sad") && has("R5_rover_tormenta")) { set = "R5_rover_tormenta"; k = 0; }
      else if (mood === "surprised" && has("R6_rover_sacude")) { set = "R6_rover_sacude"; k = 0; }
      else if ((mood === "happy" || mood === "proud") && has("R3_rover_mira_sol")) { set = "R3_rover_mira_sol"; k = 14 + (Math.floor(st / 6) % 2); }
      else if (has("R3_rover_mira_sol")) {        // idle: it looks around, and now and then up at the sky
        const cyc = [0, 0, 1, 1, 0, 0, 1, 1, 2, 3, 3, 2, 1, 1];
        set = "R3_rover_mira_sol"; k = cyc[Math.floor(st / 5) % cyc.length];
      }
      const im = set ? IM["spr_" + set + "_" + k] : null;
      this.drawnSet = set;
      return F.ready(im) ? im : null;
    };
    a.head = function () {
      const im = this.drawing(F.t || 0);
      if (im) {                                   // the camera head on the drawings: about 68% across, 25% down
        const w = F.roverW(this.drawnSet, this.s), h = w * im.height / im.width;
        return { x: this.x + 0.18 * w * this.flip, y: this.y + 8 * this.s / 0.46 - h * 0.75 };
      }
      const bx = this.x + (300 - 466) * this.s * this.sx * this.flip, by = this.y + (330 - 789) * this.s * this.sy, L = 565 * 0.62 * this.s * this.mastLen;
      return { x: bx + Math.sin(this.mast * this.flip) * L * this.flip, y: by - Math.cos(this.mast) * L };
    };
    a.draw = function (c, t) {
      const body = IM.rover_cuerpo;
      if (!F.ready(body)) return;
      const st = F.step(t);
      const bob = this.drive ? -Math.abs(Math.sin(st * 1.3)) * 14 * this.drive : -Math.sin(t / 700) * 4;            // idle: it breathes
      const sq = this.drive ? (st % 3 === 0 ? 0.08 : st % 3 === 1 ? -0.03 : 0) * this.drive : Math.sin(t / 700) * 0.02;
      const rock = this.drive ? Math.sin(st * 1.3) * 0.025 * this.drive : 0;
      c.globalAlpha = this.op;
      c.fillStyle = "rgba(40,20,10,0.35)";
      c.beginPath(); c.ellipse(this.x, this.y + 4, 230 * this.s * this.sx, 22 * this.s, 0, 0, 6.2832); c.fill();
      const dimg = this.drawing(t);
      if (dimg) {
        const w = F.roverW(this.drawnSet, this.s), h = w * dimg.height / dimg.width;
        c.translate(this.x, this.y + bob);
        c.rotate(this.tilt + rock);
        c.scale(this.sx * (1 + sq) * this.flip, this.sy * (1 - sq));
        if (this.dim > 0) c.filter = "brightness(" + (1 - this.dim * 0.55).toFixed(2) + ") saturate(" + (1 - this.dim * 0.5).toFixed(2) + ")";
        c.drawImage(dimg, -w / 2, -h + 8 * this.s / 0.46, w, h);
        if (this.glow > 0.01) {                  // sunlight on the solar panels
          c.globalCompositeOperation = "lighter";
          c.globalAlpha = this.op * this.glow * 0.25;
          c.drawImage(dimg, -w / 2, -h + 8 * this.s / 0.46, w, h);
          c.globalCompositeOperation = "source-over";
        }
        c.filter = "none";
        return;
      }
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
      const X0 = this.x0 + 88, X1 = this.x1 - 46, Y0 = this.y0 + 40, Y1 = this.y1 - 46;
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
      c.font = "bold 14px Arial, sans-serif"; c.textAlign = "right"; c.globalAlpha = this.op; c.fillStyle = "#3a2516";
      c.fillText("Each dot: one real laser measurement to the Apollo 11 mirror. Data: NASA CDDIS / ILRS.", X1, this.y0 + 14);
    };
    return a;
  };
})();
