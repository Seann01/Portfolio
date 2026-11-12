/* =========================================================
   TECH THEME — animated network background + hover helpers
   Shared by every page; pairs with tech-theme.css.
========================================================= */

(function(){
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia && window.matchMedia("(hover: hover)").matches;

  /* ---------- Background layers ---------- */

  var canvas = document.createElement("canvas");
  canvas.id = "techCanvas";
  canvas.setAttribute("aria-hidden", "true");

  var scan = document.createElement("div");
  scan.className = "tech-scanline";
  scan.setAttribute("aria-hidden", "true");

  var glow = document.createElement("div");
  glow.className = "tech-cursor-glow";
  glow.setAttribute("aria-hidden", "true");

  document.body.insertBefore(glow, document.body.firstChild);
  document.body.insertBefore(scan, document.body.firstChild);
  document.body.insertBefore(canvas, document.body.firstChild);

  var mouse = { x: -9999, y: -9999 };

  window.addEventListener("mousemove", function(e){
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    glow.style.setProperty("--gx", e.clientX + "px");
    glow.style.setProperty("--gy", e.clientY + "px");
  }, { passive: true });

  document.addEventListener("mouseleave", function(){
    mouse.x = -9999;
    mouse.y = -9999;
  });

  /* ---------- Particle network ---------- */

  /* Always draw the constellation; with "reduce motion" on it just drifts slower. */
  var SPEED = reduceMotion ? .35 : 1;

  if(true){
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, nodes = [], pulses = [];
    var COLORS = ["176,176,176", "240,240,240"];
    var LINK = 140;

    function resize(){
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.round(Math.min(110, Math.max(36, (W * H) / 15000)));
      nodes = [];
      for(var i = 0; i < count; i++){
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - .5) * .35 * SPEED,
          vy: (Math.random() - .5) * .35 * SPEED,
          r: Math.random() * 1.6 + .6,
          c: COLORS[i % 4 === 0 ? 1 : 0]
        });
      }
    }

    function spawnPulse(){
      if(nodes.length < 2) return;
      var a = nodes[(Math.random() * nodes.length) | 0];
      var best = null, bd = LINK * LINK;
      for(var i = 0; i < nodes.length; i++){
        var b = nodes[i];
        if(b === a) continue;
        var dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
        if(d < bd){ bd = d; best = b; }
      }
      if(best) pulses.push({ a: a, b: best, t: 0 });
    }

    var last = 0;

    function frame(now){
      requestAnimationFrame(frame);
      if(document.hidden) return;
      if(now - last < 16) return;
      last = now;

      ctx.clearRect(0, 0, W, H);

      for(var i = 0; i < nodes.length; i++){
        var n = nodes[i];

        var mdx = mouse.x - n.x, mdy = mouse.y - n.y;
        var md = Math.sqrt(mdx * mdx + mdy * mdy);
        if(md < 180 && md > 0){
          n.vx -= (mdx / md) * .015;
          n.vy -= (mdy / md) * .015;
        }

        n.vx *= .995;
        n.vy *= .995;
        if(Math.abs(n.vx) < .05 * SPEED) n.vx += (Math.random() - .5) * .04 * SPEED;
        if(Math.abs(n.vy) < .05 * SPEED) n.vy += (Math.random() - .5) * .04 * SPEED;

        n.x += n.vx;
        n.y += n.vy;

        if(n.x < -20) n.x = W + 20; else if(n.x > W + 20) n.x = -20;
        if(n.y < -20) n.y = H + 20; else if(n.y > H + 20) n.y = -20;
      }

      ctx.lineWidth = 1;
      for(var a = 0; a < nodes.length; a++){
        var p = nodes[a];
        for(var b = a + 1; b < nodes.length; b++){
          var q = nodes[b];
          var dx = p.x - q.x, dy = p.y - q.y;
          var d2 = dx * dx + dy * dy;
          if(d2 < LINK * LINK){
            var al = (1 - Math.sqrt(d2) / LINK) * .26;
            ctx.strokeStyle = "rgba(" + p.c + "," + al + ")";
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        var mx = mouse.x - p.x, my = mouse.y - p.y;
        var mdist = Math.sqrt(mx * mx + my * my);
        if(mdist < 200){
          ctx.strokeStyle = "rgba(240,240,240," + ((1 - mdist / 200) * .3) + ")";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      for(var k = 0; k < nodes.length; k++){
        var s = nodes[k];
        ctx.fillStyle = "rgba(" + s.c + ",.85)";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if(!reduceMotion && Math.random() < .03) spawnPulse();
      for(var j = pulses.length - 1; j >= 0; j--){
        var pu = pulses[j];
        pu.t += .025;
        if(pu.t >= 1){ pulses.splice(j, 1); continue; }
        var px = pu.a.x + (pu.b.x - pu.a.x) * pu.t;
        var py = pu.a.y + (pu.b.y - pu.a.y) * pu.t;
        var g = ctx.createRadialGradient(px, py, 0, px, py, 6);
        g.addColorStop(0, "rgba(255,255,255,.7)");
        g.addColorStop(.4, "rgba(240,240,240,.45)");
        g.addColorStop(1, "rgba(240,240,240,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(frame);
  }

  /* ---------- Spotlight that follows the mouse inside cards ---------- */

  var CARD_SEL = ".row-item";

  if(canHover){
    document.addEventListener("mousemove", function(e){
      var card = e.target.closest && e.target.closest(CARD_SEL);
      if(!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* ---------- Projects page: auto-rotating highlights ----------
     Works even when the page arrives through the site's page-transition
     script, because it looks the carousel up fresh on every tick. */

  var HL_DELAY = 4500;
  var hlPaused = false;
  var hlLastMove = Date.now();

  function hlGo(track, page){
    var pages = track.querySelectorAll(".highlight-slide").length;
    if(!pages) return;
    page = (page + pages) % pages;
    track.dataset.page = page;
    track.style.transform = "translateX(" + (-100 * page) + "%)";
    var dots = document.querySelectorAll(".highlight-dot");
    Array.prototype.forEach.call(dots, function(d, i){
      d.classList.toggle("is-active", i === page);
      d.setAttribute("aria-selected", i === page ? "true" : "false");
    });
    hlLastMove = Date.now();
  }

  function hlPlaceArrows(){
    var vp = document.querySelector(".highlight-viewport");
    var img = vp && vp.querySelector(".highlight-img");
    if(!img) return;
    vp.style.setProperty("--hl-arrow-top", (img.offsetHeight / 2) + "px");
  }
  window.addEventListener("resize", hlPlaceArrows);

  setInterval(function(){
    hlPlaceArrows();
    var track = document.querySelector(".highlight-track");
    if(!track || hlPaused || document.hidden) return;
    if(Date.now() - hlLastMove < HL_DELAY - 50) return;
    hlGo(track, (parseInt(track.dataset.page, 10) || 0) + 1);
  }, 250);

  document.addEventListener("click", function(e){
    if(!e.target.closest) return;
    var track = document.querySelector(".highlight-track");
    if(!track) return;
    var cur = parseInt(track.dataset.page, 10) || 0;
    var dot = e.target.closest(".highlight-dot");
    if(dot){ hlGo(track, parseInt(dot.dataset.page, 10) || 0); return; }
    if(e.target.closest(".highlight-next")){ hlGo(track, cur + 1); return; }
    if(e.target.closest(".highlight-prev")){ hlGo(track, cur - 1); return; }
  });

  document.addEventListener("mouseover", function(e){
    hlPaused = !!(e.target.closest && e.target.closest(".highlight-viewport"));
  });
})();
