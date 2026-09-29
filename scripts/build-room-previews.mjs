/** Small decorative previews reused from the existing room imagery. */
import sharp from 'sharp';
const rooms = {
  living: 'living',
  bedroom: 'bedroom',
  bathroom: 'world-modern-bathroom',
  kitchen: 'kitchen',
};
for (const [room, source] of Object.entries(rooms)) {
  await sharp(`public/images/${source}.webp`)
    .resize(192, 192, { fit: 'cover' })
    .webp({ quality: 78 })
    .toFile(`public/images/home-chapters/room-preview-${room}.webp`);
}
