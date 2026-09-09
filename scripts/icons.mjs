/**
 * Rasterises the site mark into the formats browsers and link previews ask for.
 *
 * The single source of truth is src/app/icon.svg — the vector Next.js links directly. Everything
 * else here is derived from it, so the mark is edited in exactly one place. Two derivations:
 *
 *   - favicon.ico, because crawlers and older browsers request /favicon.ico whether or not the
 *     document links one, and a 404 on every crawl is a silly thing to leave lying around.
 *   - a full-bleed square for iOS and Android, which apply their own mask. Handing them a
 *     rounded rectangle gets it rounded twice, so the corners are squared off and the mark is
 *     pulled in slightly to survive the mask.
 *
 *   - a 1200x630 social card, because a link pasted into a chat with no preview is a link
 *     people scroll past. Its text is rendered by the SVG rasteriser using system fonts, so it
 *     wants Georgia and Helvetica present - which is why the output is committed rather than
 *     generated during a build that might run anywhere.
 *
 * Not part of `npm run build`: the outputs are committed. Rerun it only when the mark changes.
 * Needs sharp, which arrives with Next.js.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import sharp from 'sharp';

const SOURCE = 'src/app/icon.svg';

/** The one line fullBleed() rewrites. Structural rather than artistic, so redrawing the mark
    does not break the derivation. */
const BACKGROUND = '<rect width="32" height="32" rx="7" fill="#17181a"/>';

/** Sizes packed into favicon.ico. 48 is what Windows uses for shortcuts. */
const ICO_SIZES = [16, 32, 48];

/** Square outputs and where they go. 180 is the Apple touch icon; 192/512 are the manifest. */
const SQUARE = [
  { size: 180, path: 'src/app/apple-icon.png' },
  { size: 192, path: 'public/icon-192.png' },
  { size: 512, path: 'public/icon-512.png' },
];

/** Squares the corners and shrinks the mark, so a platform mask has something to bite on. */
function fullBleed(svg) {
  const opened = [
    BACKGROUND.replace(' rx="7"', ''),
    '  <g transform="translate(16 16) scale(0.86) translate(-16 -16)">',
  ].join('\n');

  const replacements = [
    [BACKGROUND, opened],
    ['</svg>', ['  </g>', '</svg>'].join('\n')],
  ];

  let out = svg;
  for (const [from, to] of replacements) {
    if (!out.includes(from)) {
      throw new Error(`${SOURCE} no longer contains ${JSON.stringify(from)} — update this script.`);
    }
    out = out.replace(from, to);
  }
  return out;
}

/**
 * An ICO is a six-byte header, a sixteen-byte directory entry per image, then the images. PNG
 * payloads have been legal since Windows Vista and are what every current tool emits.
 */
function packIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size === 256 ? 0 : size, 0); // width, 0 meaning 256
    e.writeUInt8(size === 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette size, 0 for truecolour
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

/** SVG is resolution-independent, so every size is rendered from the vector, never resampled. */
const render = (svg, size) =>
  sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();


/**
 * The social card. Deliberately typographic rather than a screenshot: a screenshot of a text-heavy
 * site reduced to a thumbnail is illegible, and reads as clutter next to a title people can
 * already see.
 */
function socialCard(markSvg) {
  /* Reuse the mark itself, scaled and positioned, so the card cannot drift from the favicon. */
  const inner = markSvg
    .replace(/^[\s\S]*?<rect[^>]*\/>/, '')
    .replace('</svg>', '')
    .replace(/<title>.*?<\/title>/, '');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#17181a"/>
  <!-- The mark carries the right half at a size where its edges are actually visible, and
       balances a text block that is otherwise all in the left third. -->
  <g transform="translate(830 196) scale(7.4)" opacity="0.9">${inner}</g>
  <text x="88" y="286" font-family="Georgia, 'Times New Roman', serif" font-size="74" fill="#e7e8ea">System Design</text>
  <text x="88" y="368" font-family="Georgia, 'Times New Roman', serif" font-size="74" fill="#e7e8ea">Academy</text>
  <rect x="90" y="412" width="120" height="2" fill="#86aee8"/>
  <text x="88" y="470" font-family="Helvetica, Arial, sans-serif" font-size="27" fill="#a2a8b0">Mental models, trade-offs, failure modes,</text>
  <text x="88" y="506" font-family="Helvetica, Arial, sans-serif" font-size="27" fill="#a2a8b0">and the judgment to choose between them.</text>
</svg>`;
}

async function main() {
  const svg = await readFile(SOURCE, 'utf8');
  const square = fullBleed(svg);

  const ico = await Promise.all(
    ICO_SIZES.map(async (size) => ({ size, data: await render(svg, size) })),
  );
  await writeFile('public/favicon.ico', packIco(ico));
  console.log(`public/favicon.ico  ${ICO_SIZES.join(', ')}px`);

  for (const { size, path } of SQUARE) {
    await writeFile(path, await render(square, size));
    console.log(`${path}  ${size}px`);
  }

  const card = socialCard(svg);
  await writeFile(
    'public/social-card.png',
    await sharp(Buffer.from(card), { density: 96 }).png({ compressionLevel: 9 }).toBuffer(),
  );
  console.log('public/social-card.png  1200x630');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
