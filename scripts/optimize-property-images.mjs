/**
 * One-off property image optimizer. Uses sharp from Next.js dependencies.
 * Preserves originals in incoming/; writes WebP to hero/ and gallery/.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public", "images", "properties");

const jobs = [
  {
    property: "morpho-house",
    items: [
      {
        source: "NuvoHauz-13.jpg",
        dest: "hero/morpho-house-bedroom-garden-view-built-in-bed.webp",
        maxWidth: 1600,
        quality: 82,
      },
      {
        source: "NuvoHauz-10.jpg",
        dest: "gallery/morpho-house-kitchen-garden-door-indoor-outdoor.webp",
        maxWidth: 2000,
        quality: 82,
      },
      {
        source: "NuvoHauz-11.jpg",
        dest: "gallery/morpho-house-studio-kitchen-living-open-plan.webp",
        maxWidth: 2000,
        quality: 82,
      },
      {
        source: "NuvoHauz-14.jpg",
        dest: "gallery/morpho-house-bathroom-chinoiserie-sink-wood-vanity.webp",
        maxWidth: 2000,
        quality: 82,
      },
      {
        source: "NuvoHauz-15.jpg",
        dest: "gallery/morpho-house-bedroom-tv-garden-view.webp",
        maxWidth: 2000,
        quality: 82,
      },
      {
        source: "NuvoHauz-16.jpg",
        dest: "gallery/morpho-house-outdoor-dining-patio-wood-deck.webp",
        maxWidth: 2000,
        quality: 82,
      },
    ],
  },
  {
    property: "casita-green-iguana",
    items: [
      {
        source: "NuvoHauz-8.jpg",
        dest: "hero/casita-green-iguana-terrace-entrance-unit-2-evening.webp",
        maxWidth: 1600,
        quality: 82,
      },
      {
        source: "NuvoHauz-2.jpg",
        dest: "gallery/casita-green-iguana-living-room-patio-door-garden.webp",
        maxWidth: 2000,
        quality: 82,
      },
      {
        source: "NuvoHauz-1.jpg",
        dest: "gallery/casita-green-iguana-living-room-peacock-art-sofa.webp",
        maxWidth: 2000,
        quality: 82,
      },
      {
        source: "NuvoHauz-4.jpg",
        dest: "gallery/casita-green-iguana-open-plan-living-kitchen-dining.webp",
        maxWidth: 2000,
        quality: 82,
      },
      {
        source: "NuvoHauz-6.jpg",
        dest: "gallery/casita-green-iguana-bedroom-macrame-boho-decor.webp",
        maxWidth: 2000,
        quality: 82,
      },
      {
        source: "NuvoHauz-7.jpg",
        dest: "gallery/casita-green-iguana-bathroom-green-tile-yellow-sink.webp",
        maxWidth: 2000,
        quality: 82,
      },
    ],
  },
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const report = [];

for (const { property, items } of jobs) {
  for (const item of items) {
    const inputPath = path.join(PUBLIC, property, "incoming", item.source);
    const outputPath = path.join(PUBLIC, property, item.dest);

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Missing source image: ${inputPath}`);
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const inputStats = fs.statSync(inputPath);
    const image = sharp(inputPath, { failOn: "none" }).rotate();

    await image
      .resize({
        width: item.maxWidth,
        withoutEnlargement: true,
      })
      .webp({ quality: item.quality, effort: 4 })
      .toFile(outputPath);

    const outputStats = fs.statSync(outputPath);
    const optimizedMeta = await sharp(outputPath).metadata();

    report.push({
      property,
      source: item.source,
      output: item.dest.replace(/^hero\//, "").replace(/^gallery\//, ""),
      folder: item.dest.startsWith("hero/") ? "hero" : "gallery",
      originalBytes: inputStats.size,
      optimizedBytes: outputStats.size,
      originalSize: formatBytes(inputStats.size),
      optimizedSize: formatBytes(outputStats.size),
      width: optimizedMeta.width,
      height: optimizedMeta.height,
    });
  }
}

console.log(JSON.stringify(report, null, 2));
