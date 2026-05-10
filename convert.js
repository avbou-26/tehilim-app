const sharp = require('sharp');
const fs = require('fs');

const svg = fs.readFileSync('./public/og-image.svg');

sharp(svg)
  .resize(1200, 630)
  .png()
  .toFile('./public/og-image.png', (err, info) => {
    if (err) console.error(err);
    else console.log('Image créée !', info);
  });