import re

with open('static/js/game.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace Arial with Roboto Mono
content = content.replace('"Arial"', "'Roboto Mono'").replace("'Arial'", "'Roboto Mono'")
content = content.replace('13px Arial', "14px 'Roboto Mono'") # Adjust some small sizes
content = content.replace('14px Arial', "14px 'Roboto Mono'")
content = content.replace('16px Arial', "16px 'Roboto Mono'")
content = content.replace('18px Arial', "18px 'Roboto Mono'")
content = content.replace('22px Arial', "22px 'Roboto Mono'")
content = content.replace('24px Arial', "24px 'Roboto Mono'")

# 2. Inject Canvas Overrides for Pixel Art
overrides = """const ctx = canvas.getContext("2d");

// --- PIXEL ART OVERRIDES ---
const originalArc = ctx.arc.bind(ctx);
ctx.arc = function(x, y, radius, startAngle, endAngle, counterclockwise) {
  if (Math.abs(endAngle - startAngle) >= Math.PI * 2 - 0.1) {
    this.rect(x - radius, y - radius, radius * 2, radius * 2);
  } else {
    originalArc(x, y, radius, startAngle, endAngle, counterclockwise);
  }
};

const originalEllipse = ctx.ellipse.bind(ctx);
ctx.ellipse = function(x, y, rx, ry, rot, sa, ea, ccw) {
  if (Math.abs(ea - sa) >= Math.PI * 2 - 0.1) {
    this.rect(x - rx, y - ry, rx * 2, ry * 2);
  } else {
    originalEllipse(x, y, rx, ry, rot, sa, ea, ccw);
  }
};

Object.defineProperty(ctx, 'shadowBlur', { set: function() {}, get: function() { return 0; } });
Object.defineProperty(ctx, 'shadowOffsetX', { set: function() {}, get: function() { return 0; } });
Object.defineProperty(ctx, 'shadowOffsetY', { set: function() {}, get: function() { return 0; } });
"""
content = content.replace('const ctx = canvas.getContext("2d");', overrides)

# 3. Modify roundRect helper
round_rect_old = """function roundRect(x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}"""
round_rect_new = """function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.closePath();
}"""
content = content.replace(round_rect_old, round_rect_new)

# 4. Modify drawBackground to use flat colors and add Grid
bg_old = """const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, pal[0]); bg.addColorStop(.55, pal[1]); bg.addColorStop(1, pal[2]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  drawAmbientDecorations(theme);

  // subtle tile texture
  for (let x = 0; x < W; x += 38) {
    for (let y = 0; y < H; y += 38) drawGroundTile(x, y, 38);
  }"""
  
bg_new = """ctx.fillStyle = pal[0];
  ctx.fillRect(0, 0, W, H);
  
  // draw 2D retro grid
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (let y = 0; y < H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();

  drawAmbientDecorations(theme);"""
content = content.replace(bg_old, bg_new)

# Optional: remove gradient from yard (base yard)
yard_old = """const yard = ctx.createLinearGradient(0, pad, 0, H - 78);
  yard.addColorStop(0, pal[3]);
  yard.addColorStop(1, pal[4]);
  ctx.fillStyle = yard;"""
yard_new = """ctx.fillStyle = pal[3];"""
content = content.replace(yard_old, yard_new)

# Replace 'Arial' that might be part of string concatenation
content = re.sub(r'(\d+)px Arial', r'\1px Roboto Mono', content)

with open('static/js/game.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied!")
