'use strict';

const axios = require('axios');
const sharp = require('sharp');
const { getStorage } = require('../config/firebase');
const logger = require('../utils/logger');

/**
 * Servicio de gestión de imágenes de cartas.
 *
 * Cumple con los términos de uso de la API de YGOProdeck:
 *   "Please only pull an image once and then store it locally."
 *
 * Flujo al agregar una carta:
 *  1. Descargar imagen desde images.ygoprodeck.com (una sola vez)
 *  2. Comprimir a WebP 200×290px con sharp (~5-15 KB vs ~80 KB original)
 *  3. Subir a Firebase Storage en la ruta: cards/{cardId}.webp
 *  4. Actualizar Firestore con la URL pública de Storage (en segundo plano)
 *
 * Si Storage no está configurado o falla, usa la URL original de YGOProdeck
 * como fallback para no bloquear el flujo.
 */

const STORAGE_FOLDER = 'cards';
// Dimensiones máximas — suficientes para portafolio, HEVC/WebP reduce ~80%
const IMG_WIDTH  = 200;
const IMG_HEIGHT = 290;
const IMG_QUALITY = 80; // WebP quality 0-100

/**
 * Descarga, comprime y sube una imagen de carta a Firebase Storage.
 * Retorna la URL pública de Storage, o null si no es posible.
 *
 * @param {number|string} cardId  — ID numérico de la carta
 * @param {string}        imageUrl — URL original en images.ygoprodeck.com
 * @returns {Promise<string|null>}
 */
async function uploadCardImage(cardId, imageUrl) {
  const bucket = getStorage();

  if (!bucket) {
    logger.warn('⚠️  Firebase Storage no configurado — usando URL externa de YGOProdeck');
    return null;
  }

  if (!imageUrl) return null;

  const filePath = `${STORAGE_FOLDER}/${cardId}.webp`;
  const file = bucket.file(filePath);

  // Si la imagen ya existe en Storage, devolver URL sin re-descargar
  try {
    const [exists] = await file.exists();
    if (exists) {
      const url = buildPublicUrl(bucket.name, filePath);
      logger.debug(`🖼️  Imagen ya en Storage → ${cardId}.webp`);
      return url;
    }
  } catch (checkErr) {
    logger.warn(`⚠️  No se pudo verificar existencia en Storage: ${checkErr.message}`);
  }

  // ── 1. Descargar imagen original ───────────────────────────────────────────
  let rawBuffer;
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10_000,
      headers: { 'User-Agent': 'yugioh-inventory-api/1.0' },
    });
    rawBuffer = Buffer.from(response.data);
    logger.debug(`⬇️  Imagen descargada: ${cardId} (${rawBuffer.length} bytes)`);
  } catch (downloadErr) {
    logger.warn(`⚠️  No se pudo descargar imagen (${imageUrl}): ${downloadErr.message}`);
    return null;
  }

  // ── 2. Comprimir con sharp → WebP ─────────────────────────────────────────
  let compressedBuffer;
  try {
    compressedBuffer = await sharp(rawBuffer)
      .resize(IMG_WIDTH, IMG_HEIGHT, {
        fit: 'inside',        // mantiene proporción, no recorta
        withoutEnlargement: true, // no agranda si ya es pequeña
      })
      .webp({ quality: IMG_QUALITY, effort: 4 })
      .toBuffer();

    const savedPct = (((rawBuffer.length - compressedBuffer.length) / rawBuffer.length) * 100).toFixed(0);
    logger.info(`🗜️  Imagen comprimida: ${cardId} ${rawBuffer.length} → ${compressedBuffer.length} bytes (-${savedPct}%)`);
  } catch (compressErr) {
    logger.warn(`⚠️  Falló compresión con sharp (${cardId}): ${compressErr.message}`);
    compressedBuffer = rawBuffer; // fallback: subir sin comprimir
  }

  // ── 3. Subir a Firebase Storage ────────────────────────────────────────────
  try {
    await file.save(compressedBuffer, {
      metadata: {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000', // 1 año — las imágenes no cambian
      },
    });
    await file.makePublic();

    const url = buildPublicUrl(bucket.name, filePath);
    logger.info(`✅ Imagen guardada en Storage: ${url}`);
    return url;
  } catch (uploadErr) {
    logger.warn(`⚠️  Falló subida a Storage para carta ${cardId}: ${uploadErr.message}`);
    return null;
  }
}

/** Construye la URL pública de un archivo en Firebase Storage. */
function buildPublicUrl(bucketName, filePath) {
  return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}

module.exports = { uploadCardImage };

