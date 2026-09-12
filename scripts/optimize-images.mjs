import sharp from 'sharp';
import { readdir, rename, stat } from 'node:fs/promises';
import path from 'node:path';
const input = 'assets/reference-images';
for (const file of await readdir('public/images')) {
  if (file.endsWith('.jpg'))
    await rename(path.join('public/images', file), path.join(input, file));
}
for (const file of await readdir(input)) {
  if (!file.endsWith('.jpg')) continue;
  const name = file.replace('.jpg', '');
  const original = sharp(path.join(input, file)).rotate();
  const metadata = await original.metadata();
  await Promise.all(
    [720, 1280].map((width) =>
      original
        .clone()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(`public/images/${name}-${width}.webp`),
    ),
  );
  await original
    .clone()
    .resize({
      width: Math.min(metadata.width ?? 1600, name === 'hero' ? 2400 : 1600),
      withoutEnlargement: true,
    })
    .webp({ quality: 84 })
    .toFile(`public/images/${name}.webp`);
}
let bytes = 0;
for (const file of await readdir('public/images'))
  bytes += (await stat(path.join('public/images', file))).size;
console.log(
  `Optimized responsive images: ${(bytes / 1024 / 1024).toFixed(2)} MB total.`,
);
