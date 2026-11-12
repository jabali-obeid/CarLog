const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xEDB88320);
    }
  }
  return (crc ^ -1) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function generatePngIcon(size, filename, isMaskable = false) {
  const width = size;
  const height = size;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  
  const cx = width / 2;
  const cy = height / 2;
  // Maskable icons require safe zone (inner 80% circle)
  const factor = isMaskable ? 0.75 : 0.95;
  const rOuter = width * 0.45 * factor;
  const rInner = width * 0.38 * factor;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    raw[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep automotive carbon background
      let r = 8, g = 9, b = 13, a = 255;

      // Tachometer outer ring (Amber / Yellow)
      if (dist <= rOuter && dist >= rInner) {
        r = 245; g = 158; b = 11; // Amber 500
      } else if (dist < rInner && dist >= rInner * 0.92) {
        r = 20; g = 20; b = 28; // Subtle groove
      } else if (dist < rInner * 0.92 && dist >= rInner * 0.78) {
        // Cyan RPM ticks arc
        const angle = Math.atan2(dy, dx);
        if (angle < Math.PI * 0.45 && angle > -Math.PI * 0.85) {
          // Dash markers
          const tickMod = Math.abs(Math.sin(angle * 12));
          if (tickMod > 0.4) {
            r = 6; g = 182; b = 212; // Cyan 500
          } else {
            r = 15; g = 23; b = 42; // Slate 900
          }
        }
      }

      // Redline zone (Crimson)
      const angle = Math.atan2(dy, dx);
      if (dist <= rOuter && dist >= rInner * 0.85 && angle >= Math.PI * 0.15 && angle <= Math.PI * 0.45) {
        r = 239; g = 68; b = 68; // Redline
      }

      // Tachometer Needle (Red needle pointing at 7000 RPM)
      const angleNeedle = -Math.PI * 0.28;
      const distFromNeedle = Math.abs(dx * Math.sin(angleNeedle) - dy * Math.cos(angleNeedle));
      const projNeedle = dx * Math.cos(angleNeedle) + dy * Math.sin(angleNeedle);
      if (distFromNeedle < width * 0.025 * factor && projNeedle > -width * 0.06 * factor && projNeedle < rInner * 0.82) {
        r = 239; g = 68; b = 68; // Bright Red
      }

      // Center chrome cap
      if (dist < width * 0.09 * factor) {
        const capShade = Math.floor(210 + (dy / (width * 0.09 * factor)) * 40);
        r = capShade; g = capShade; b = capShade;
      } else if (dist < width * 0.11 * factor) {
        r = 30; g = 41; b = 59; // Cap bezel
      }

      raw[pxOffset] = r;
      raw[pxOffset + 1] = g;
      raw[pxOffset + 2] = b;
      raw[pxOffset + 3] = a;
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = createChunk('IHDR', ihdrData);
  const idat = createChunk('IDAT', zlib.deflateSync(raw));
  const iend = createChunk('IEND', Buffer.alloc(0));

  const png = Buffer.concat([sig, ihdr, idat, iend]);
  fs.writeFileSync(filename, png);
  console.log(`Generated ${path.basename(filename)} (${size}x${size}, ${png.length} bytes)`);
}

const outDir = 'C:\\Users\\Jabali\\.gemini\\antigravity\\scratch\\cardex\\frontend\\public\\icons';

generatePngIcon(192, path.join(outDir, 'icon-192.png'), false);
generatePngIcon(512, path.join(outDir, 'icon-512.png'), false);
generatePngIcon(512, path.join(outDir, 'icon-maskable.png'), true);
generatePngIcon(180, path.join(outDir, 'apple-touch-icon.png'), false);
generatePngIcon(64, path.join(outDir, 'favicon.png'), false);

// Also generate high-res SVG Icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#181824"/>
      <stop offset="100%" stop-color="#050608"/>
    </radialGradient>
    <linearGradient id="needleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="100%" stop-color="#B91C1C"/>
    </linearGradient>
    <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bgGlow)"/>
  <circle cx="256" cy="256" r="195" fill="none" stroke="#1E293B" stroke-width="24"/>
  <circle cx="256" cy="256" r="195" fill="none" stroke="url(#amberGrad)" stroke-width="18" stroke-dasharray="880 1200" stroke-linecap="round" transform="rotate(135 256 256)"/>
  <circle cx="256" cy="256" r="195" fill="none" stroke="#EF4444" stroke-width="20" stroke-dasharray="240 1200" stroke-dashoffset="-640" stroke-linecap="round" transform="rotate(135 256 256)"/>
  <!-- RPM Numbers -->
  <text x="256" y="160" text-anchor="middle" fill="#06B6D4" font-family="monospace" font-size="28" font-weight="900" letter-spacing="4">RPM x1000</text>
  <text x="256" y="380" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-weight="900" font-size="36" letter-spacing="6">CARDEX</text>
  <!-- Needle -->
  <line x1="256" y1="256" x2="380" y2="150" stroke="url(#needleGrad)" stroke-width="12" stroke-linecap="round"/>
  <!-- Center Cap -->
  <circle cx="256" cy="256" r="32" fill="#334155" stroke="#F1F5F9" stroke-width="6"/>
  <circle cx="256" cy="256" r="12" fill="#F59E0B"/>
</svg>`;

fs.writeFileSync(path.join(outDir, 'icon.svg'), svgIcon, 'utf8');
console.log('Generated icon.svg successfully');

