// Build a multi-resolution favicon.ico from src/app/icon.svg using sharp.
// PNG-encoded ICO is supported by all modern browsers. Sizes 16/32/48/64/256.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = resolve(fileURLToPath(import.meta.url), "..");
const svgPath = resolve(here, "..", "src", "app", "icon.svg");
const outPath = resolve(here, "..", "src", "app", "favicon.ico");

const svg = readFileSync(svgPath);
const sizes = [16, 32, 48, 64, 256];

const pngs = await Promise.all(
  sizes.map(async (size) => ({
    size,
    buf: await sharp(svg, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer(),
  })),
);

// ICONDIR (6 bytes) + N * ICONDIRENTRY (16 bytes) + N * PNG blob
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type 1 = icon
header.writeUInt16LE(pngs.length, 4); // count

const entrySize = 16;
let offset = header.length + pngs.length * entrySize;
const entries = [];
for (const { size, buf } of pngs) {
  const e = Buffer.alloc(entrySize);
  e.writeUInt8(size === 256 ? 0 : size, 0); // width (0 = 256)
  e.writeUInt8(size === 256 ? 0 : size, 1); // height (0 = 256)
  e.writeUInt8(0, 2); // colors (0 = >= 256)
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // color planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(buf.length, 8); // image size
  e.writeUInt32LE(offset, 12); // image offset
  entries.push(e);
  offset += buf.length;
}

const ico = Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]);
writeFileSync(outPath, ico);
console.log(`wrote ${outPath} (${ico.length} bytes, sizes ${sizes.join(",")})`);
