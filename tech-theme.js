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

  if(!reduceMotion){
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, nodes = [], pulses = [];
    var COLORS = ["170,182,196", "92,207,194"];
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
          vx: (Math.random() - .5) * .35,
          vy: (Math.random() - .5) * .35,
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
        if(Math.abs(n.vx) < .05) n.vx += (Math.random() - .5) * .04;
        if(Math.abs(n.vy) < .05) n.vy += (Math.random() - .5) * .04;

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
            var al = (1 - Math.sqrt(d2) / LINK) * .16;
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
          ctx.strokeStyle = "rgba(92,207,194," + ((1 - mdist / 200) * .3) + ")";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      for(var k = 0; k < nodes.length; k++){
        var s = nodes[k];
        ctx.fillStyle = "rgba(" + s.c + ",.6)";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if(Math.random() < .03) spawnPulse();
      for(var j = pulses.length - 1; j >= 0; j--){
        var pu = pulses[j];
        pu.t += .025;
        if(pu.t >= 1){ pulses.splice(j, 1); continue; }
        var px = pu.a.x + (pu.b.x - pu.a.x) * pu.t;
        var py = pu.a.y + (pu.b.y - pu.a.y) * pu.t;
        var g = ctx.createRadialGradient(px, py, 0, px, py, 6);
        g.addColorStop(0, "rgba(255,255,255,.7)");
        g.addColorStop(.4, "rgba(92,207,194,.5)");
        g.addColorStop(1, "rgba(92,207,194,0)");
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

  var CARD_SEL = ".row-item, .project-split, .panel-box, .block, .log-row, .focus-dropdown";

  if(canHover){
    document.addEventListener("mousemove", function(e){
      var card = e.target.closest && e.target.closest(CARD_SEL);
      if(!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* ---------- 3D tilt on images ---------- */

  if(canHover && !reduceMotion){
    var tilts = document.querySelectorAll(".portrait-frame, .project-media");
    Array.prototype.forEach.call(tilts, function(el){
      el.addEventListener("mousemove", function(e){
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5;
        var y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = "perspective(900px) rotateY(" + (x * 8) + "deg) rotateX(" + (-y * 8) + "deg)";
      });
      el.addEventListener("mouseleave", function(){
        el.style.transform = "";
      });
    });
  }

})();
