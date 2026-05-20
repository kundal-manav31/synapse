import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// ─── Icon SVG (square, used for 192 and 512) ───────────────────────────────
function iconSvg(size) {
  const r = Math.round(size * 0.18);          // corner radius
  const cx = size / 2;
  const cy = size / 2;
  const fontSize = Math.round(size * 0.52);   // big "S"
  const subSize  = Math.round(size * 0.115);  // "SYNAPSE" label
  const labelY   = Math.round(size * 0.84);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0f0c29"/>
      <stop offset="60%"  stop-color="#1a0a3e"/>
      <stop offset="100%" stop-color="#2d1b69"/>
    </linearGradient>
    <linearGradient id="glyph" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${Math.round(size * 0.03)}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>

  <!-- Subtle inner ring -->
  <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${r - 2}"
        fill="none" stroke="rgba(139,92,246,0.25)" stroke-width="2"/>

  <!-- Brain glyph — stylised "S" with gradient + glow -->
  <text x="${cx}" y="${Math.round(size * 0.67)}"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${fontSize}"
        font-weight="900"
        fill="url(#glyph)"
        filter="url(#glow)"
        text-anchor="middle"
        dominant-baseline="auto">S</text>

  <!-- SYNAPSE wordmark -->
  <text x="${cx}" y="${labelY}"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="${subSize}"
        font-weight="700"
        fill="#a78bfa"
        letter-spacing="${Math.round(size * 0.025)}"
        text-anchor="middle">SYNAPSE</text>
</svg>`;
}

// ─── OG Image SVG (1200 × 630) ─────────────────────────────────────────────
function ogSvg() {
  const W = 1200, H = 630;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#020617"/>
      <stop offset="55%"  stop-color="#0f0c29"/>
      <stop offset="100%" stop-color="#1a0a3e"/>
    </linearGradient>
    <radialGradient id="glow" cx="38%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#7c3aed" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#6d28d9"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#c4b5fd"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Radial glow -->
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Border frame -->
  <rect x="20" y="20" width="${W-40}" height="${H-40}" rx="20"
        fill="none" stroke="rgba(139,92,246,0.3)" stroke-width="1.5"/>

  <!-- Left accent bar -->
  <rect x="60" y="190" width="5" height="250" rx="3" fill="url(#accent)"/>

  <!-- 🧠 emoji substitute — stylised "S" in a circle -->
  <circle cx="680" cy="315" r="170" fill="rgba(109,40,217,0.15)" stroke="rgba(139,92,246,0.2)" stroke-width="1"/>
  <circle cx="680" cy="315" r="120" fill="rgba(109,40,217,0.12)" stroke="rgba(139,92,246,0.15)" stroke-width="1"/>
  <text x="680" y="375"
        font-family="Georgia, serif"
        font-size="240"
        font-weight="900"
        fill="rgba(139,92,246,0.6)"
        text-anchor="middle"
        dominant-baseline="auto">S</text>

  <!-- Wordmark -->
  <text x="90" y="270"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="22"
        font-weight="700"
        fill="#7c3aed"
        letter-spacing="8">SYNAPSE</text>

  <!-- Main headline -->
  <text x="90" y="355"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="72"
        font-weight="900"
        fill="url(#titleGrad)">Daily Brain</text>
  <text x="90" y="435"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="72"
        font-weight="900"
        fill="url(#titleGrad)">Challenge</text>

  <!-- Tagline -->
  <text x="90" y="490"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="24"
        font-weight="400"
        fill="#94a3b8">2 minutes · 5 domains · one global rank</text>

  <!-- Pill badges -->
  <rect x="90" y="520" width="130" height="38" rx="19" fill="rgba(109,40,217,0.3)" stroke="rgba(139,92,246,0.5)" stroke-width="1"/>
  <text x="155" y="544"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="15" font-weight="600" fill="#a78bfa"
        text-anchor="middle">Brain ELO</text>

  <rect x="234" y="520" width="120" height="38" rx="19" fill="rgba(109,40,217,0.3)" stroke="rgba(139,92,246,0.5)" stroke-width="1"/>
  <text x="294" y="544"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="15" font-weight="600" fill="#a78bfa"
        text-anchor="middle">Streaks</text>

  <rect x="368" y="520" width="140" height="38" rx="19" fill="rgba(109,40,217,0.3)" stroke="rgba(139,92,246,0.5)" stroke-width="1"/>
  <text x="438" y="544"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="15" font-weight="600" fill="#a78bfa"
        text-anchor="middle">Leaderboard</text>

  <!-- Domain icons row (top right area) -->
  ${['🔢','⚡','🎯','🧮','🎭'].map((icon, i) => `
  <circle cx="${920 + i * 52}" cy="${115}" r="22" fill="rgba(109,40,217,0.2)" stroke="rgba(139,92,246,0.3)" stroke-width="1"/>
  <text x="${920 + i * 52}" y="124"
        font-size="20" text-anchor="middle" dominant-baseline="middle">${icon}</text>`).join('')}

  <!-- URL footer -->
  <text x="${W - 60}" y="${H - 40}"
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-size="18" font-weight="600" fill="rgba(124,58,237,0.7)"
        text-anchor="end">synapse.game</text>
</svg>`;
}

async function generate() {
  console.log('Generating PWA icons and OG image…');

  // icon-192.png
  await sharp(Buffer.from(iconSvg(192)))
    .png()
    .toFile(join(publicDir, 'icon-192.png'));
  console.log('✓  icon-192.png');

  // icon-512.png
  await sharp(Buffer.from(iconSvg(512)))
    .png()
    .toFile(join(publicDir, 'icon-512.png'));
  console.log('✓  icon-512.png');

  // apple-touch-icon.png (180×180, no rounded corners — iOS adds them)
  await sharp(Buffer.from(iconSvg(180)))
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('✓  apple-touch-icon.png');

  // favicon.ico (32×32 PNG — works in modern browsers as PNG)
  await sharp(Buffer.from(iconSvg(32)))
    .png()
    .toFile(join(publicDir, 'favicon.png'));
  console.log('✓  favicon.png  (use as favicon source)');

  // og-image.png
  await sharp(Buffer.from(ogSvg()))
    .png()
    .toFile(join(publicDir, 'og-image.png'));
  console.log('✓  og-image.png');

  console.log('\nAll assets written to public/');
}

generate().catch(err => { console.error(err); process.exit(1); });
