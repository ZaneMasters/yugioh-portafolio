const sharp = require('sharp');
const axios = require('axios');
const logger = require('../utils/logger');

async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  } catch (err) {
    logger.error(`Error downloading image ${url}:`, err.message);
    return null;
  }
}

/**
 * Generate an SVG label for the badge
 * @param {string} text The text to display
 * @param {string} bgColor Background color
 * @param {number} x X position
 * @param {number} y Y position
 * @param {number} width Width of badge
 */
function createBadgeSVG(text, bgColor, x, y, width, height = 30) {
  return `
    <g transform="translate(${x}, ${y})">
      <rect width="${width}" height="${height}" rx="15" fill="${bgColor}" />
      <text x="${width / 2}" y="${height / 2 + 5}" font-family="Arial, sans-serif" font-weight="bold" font-size="14" fill="#ffffff" text-anchor="middle">${text}</text>
    </g>
  `;
}

/**
 * Generates an OG Image using Sharp
 * @param {Array} cards Array of up to 5 card objects
 * @param {string} type "wishlist" or "inventory"
 */
async function generateOGImage(cards, type) {
  const WIDTH = 1200;
  const HEIGHT = 630;
  const PADDING = 20;
  const CARD_WIDTH = 210;
  const CARD_HEIGHT = 306; // Standard YGO ratio
  const GAP = 15;

  const bgBuffer = await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 17, g: 24, b: 39, alpha: 1 } // Tailwind slate-900 (#111827)
    }
  }).png().toBuffer();

  const composites = [];

  // Center the cards horizontally
  const totalCardsWidth = (cards.length * CARD_WIDTH) + ((cards.length - 1) * GAP);
  const startX = (WIDTH - totalCardsWidth) / 2;
  const startY = 100; // Leave space at top/bottom

  let svgOverlays = `<svg width="${WIDTH}" height="${HEIGHT}">`;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const x = startX + i * (CARD_WIDTH + GAP);
    const y = startY;

    // 1. Download card image
    if (card.image) {
      const imgBuffer = await downloadImage(card.image);
      if (imgBuffer) {
        try {
          const resizedImg = await sharp(imgBuffer)
            .resize(CARD_WIDTH, CARD_HEIGHT)
            .png()
            .toBuffer();

          composites.push({
            input: resizedImg,
            top: y,
            left: x
          });
        } catch (err) {
          logger.error(`Error resizing image for ${card.name}:`, err.message);
        }
      }
    }

    // 2. Add SVG Badges (Quantity, Set, Rarity) over the card
    const badgeWidth = 140;
    const badgeX = x + (CARD_WIDTH - badgeWidth) / 2;
    let badgeY = y + CARD_HEIGHT - 15; // Start placing badges at the bottom edge of the card

    const qtyText = type === 'wishlist' ? `BUSCO x${card.quantity}` : `TENGO x${card.quantity}`;
    const qtyBg = type === 'wishlist' ? '#f97316' : '#10b981'; // Orange / Emerald

    svgOverlays += createBadgeSVG(qtyText, qtyBg, badgeX, badgeY, badgeWidth);
    badgeY += 35; // Move down for the next pill

    if (card.setCode) {
      svgOverlays += createBadgeSVG(card.setCode, '#374151', badgeX, badgeY, badgeWidth);
      badgeY += 35;
    }

    if (card.rarity) {
      const rarityStr = card.rarity.substring(0, 4).toUpperCase(); // e.g. "SR", "UR"
      svgOverlays += createBadgeSVG(rarityStr, '#eab308', badgeX + 30, badgeY, badgeWidth - 60);
    }
  }

  svgOverlays += '</svg>';

  // Add the SVG layer
  composites.push({
    input: Buffer.from(svgOverlays),
    top: 0,
    left: 0
  });

  const finalImage = await sharp(bgBuffer)
    .composite(composites)
    .jpeg({ quality: 85 })
    .toBuffer();

  return finalImage;
}

module.exports = {
  generateOGImage
};
