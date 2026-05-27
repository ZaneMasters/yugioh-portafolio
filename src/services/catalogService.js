'use strict';

const axios  = require('axios');
const logger = require('../utils/logger');
const { getStorage } = require('../config/firebase');

const YGO_API_ALL_CARDS_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const BACKUP_FILENAME        = 'ygo_catalog_backup.json';
const REFRESH_INTERVAL_MS    = 7 * 24 * 60 * 60 * 1000; // 7 días en ms

// ── Estado en memoria ────────────────────────────────────────────────────────
let catalog         = [];
let isLoaded        = false;
let catalogMetadata = {
  lastUpdated: null,
  source:      null,
  totalCards:  0,
  status:      'Inicializando...',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normaliza un string para búsquedas extremas.
 * Convierte a minúscula y elimina TODOS los caracteres que no sean letras o números.
 * Ej: "Live☆Twin Ki-sikil" -> "livetwinkisikil"
 */
const normalizeString = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Normaliza los nombres de la base de datos para búsqueda rápida y minifica el objeto
 * para reducir drásticamente el uso de memoria RAM (de ~100% a ~15% del original).
 */
const buildIndex = (cards) => {
  return cards.map(card => ({
    id:        card.id,
    name:      card.name,
    type:      card.type,
    frameType: card.frameType,
    desc:      card.desc,
    atk:       card.atk,
    def:       card.def,
    level:     card.level,
    attribute: card.attribute,
    archetype: card.archetype,
    card_images: [
      {
        image_url:       card.card_images?.[0]?.image_url,
        image_url_small: card.card_images?.[0]?.image_url_small,
      },
    ],
    _searchName:      normalizeString(card.name),
    _searchArchetype: normalizeString(card.archetype),
  }));
};

// ── Operaciones con Storage ──────────────────────────────────────────────────

/**
 * Retorna la fecha de última actualización del backup en Storage,
 * o null si el archivo no existe.
 * Lee solo los metadatos del archivo — NO descarga el contenido.
 */
const getBackupUpdatedAt = async () => {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const file         = storage.file(BACKUP_FILENAME);
    const [exists]     = await file.exists();
    if (!exists) return null;

    const [metadata]   = await file.getMetadata();
    const updatedRaw   = metadata.updated ?? metadata.timeCreated;
    return updatedRaw ? new Date(updatedRaw) : null;
  } catch (err) {
    logger.warn(`⚠️  No se pudo leer metadatos del backup en Storage: ${err.message}`);
    return null;
  }
};

/**
 * Descarga el contenido del backup desde Firebase Storage y lo carga en memoria.
 * @returns {boolean} true si tuvo éxito
 */
const loadFromStorage = async () => {
  const storage = getStorage();
  if (!storage) return false;

  try {
    const file        = storage.file(BACKUP_FILENAME);
    const [contents]  = await file.download();
    const parsed      = JSON.parse(contents.toString());

    // El backup ya está indexado (buildIndex se aplica antes de guardarlo)
    catalog   = parsed;
    isLoaded  = true;
    catalogMetadata = {
      lastUpdated: new Date().toISOString(),
      source:      'Firebase Storage (Backup)',
      totalCards:  catalog.length,
      status:      'OK',
    };
    logger.info(`✅ Catálogo cargado desde Storage: ${catalog.length} cartas.`);
    return true;
  } catch (err) {
    logger.error(`❌ Error al cargar backup desde Storage: ${err.message}`);
    return false;
  }
};

/**
 * Descarga el catálogo fresco de YGOProdeck, lo indexa,
 * lo carga en memoria y guarda el backup en Storage.
 * @returns {boolean} true si tuvo éxito
 */
const loadFromYGOProdeck = async () => {
  try {
    logger.info('📦 Descargando catálogo fresco de YGOProdeck...');
    const response = await axios.get(YGO_API_ALL_CARDS_URL);
    const cards    = response.data.data;

    catalog  = buildIndex(cards);
    isLoaded = true;
    catalogMetadata = {
      lastUpdated: new Date().toISOString(),
      source:      'YGOProdeck API (Fresco)',
      totalCards:  catalog.length,
      status:      'OK',
    };
    logger.info(`✅ Catálogo descargado en RAM: ${catalog.length} cartas.`);

    // Guardar backup en Storage (sin await — no bloqueamos la respuesta)
    const storage = getStorage();
    if (storage) {
      storage.file(BACKUP_FILENAME)
        .save(JSON.stringify(catalog), {
          contentType: 'application/json',
          metadata: { cacheControl: 'public, max-age=604800' }, // 7 días
        })
        .then(() => logger.info(`☁️  Backup actualizado en Firebase Storage (${BACKUP_FILENAME}).`))
        .catch(err => logger.warn(`⚠️  No se pudo guardar backup en Storage: ${err.message}`));
    }

    return true;
  } catch (err) {
    logger.error(`❌ Error al descargar catálogo de YGOProdeck: ${err.message}`);
    return false;
  }
};

// ── Lógica principal: Lazy Refresh ───────────────────────────────────────────

/**
 * Inicializa el catálogo en memoria siguiendo la estrategia "lazy refresh":
 *
 *  1. Verificar si existe backup en Storage y leer su fecha (solo metadatos, sin descargar).
 *  2a. Si el backup tiene menos de 7 días → cargar desde Storage (barato y rápido).
 *  2b. Si el backup tiene más de 7 días o no existe → descargar de YGOProdeck → guardar en Storage.
 *  3.  Si YGOProdeck falla y hay backup (aunque viejo) → cargarlo como fallback de emergencia.
 *
 * Con esta estrategia, YGOProdeck se llama como máximo 1 vez por semana,
 * en el primer cold start tras 7 días de inactividad del catálogo.
 * No se necesita node-cron ni Cloud Scheduler.
 */
const initCatalog = async () => {
  logger.info('🔍 Verificando estado del catálogo en Storage...');

  const backupUpdatedAt = await getBackupUpdatedAt();

  if (backupUpdatedAt) {
    const ageMs     = Date.now() - backupUpdatedAt.getTime();
    const ageDays   = (ageMs / (1000 * 60 * 60 * 24)).toFixed(1);

    if (ageMs < REFRESH_INTERVAL_MS) {
      // ── Caso 1: Backup reciente → cargar desde Storage ──────────────────
      logger.info(`📅 Backup tiene ${ageDays} días (< 7). Cargando desde Storage...`);
      const ok = await loadFromStorage();
      if (ok) return;

      logger.warn('⚠️  Fallo al leer Storage. Intentando YGOProdeck como fallback...');
    } else {
      // ── Caso 2: Backup viejo (>= 7 días) → refrescar desde YGOProdeck ──
      logger.info(`📅 Backup tiene ${ageDays} días (>= 7). Refrescando desde YGOProdeck...`);
    }
  } else {
    // ── Caso 3: No hay backup → primera vez ─────────────────────────────
    logger.info('📦 No se encontró backup en Storage. Descarga inicial desde YGOProdeck...');
  }

  // Intentar YGOProdeck
  const ok = await loadFromYGOProdeck();

  if (!ok && backupUpdatedAt) {
    // ── Fallback de emergencia: YGOProdeck caído pero hay backup (aunque viejo) ──
    logger.warn('🔄 YGOProdeck no disponible. Usando backup viejo de Storage como emergencia...');
    await loadFromStorage();
  }

  if (!isLoaded) {
    catalogMetadata.status = 'Error Crítico: Sin catálogo disponible.';
    logger.error('❌ No se pudo cargar el catálogo por ninguna vía.');
  }
};

// ── API pública ──────────────────────────────────────────────────────────────

/**
 * Busca cartas difusamente en memoria.
 * @param {string} query - Ej: "live twin", "dark mag"
 */
const searchCardsFuzzy = async (query) => {
  if (!isLoaded) throw new Error('El catálogo local aún no está listo. Inténtalo en unos segundos.');

  const normalizedQuery = normalizeString(query);
  const results = catalog.filter(card => card._searchName.includes(normalizedQuery));
  return results.slice(0, 50);
};

/**
 * Busca por arquetipo en memoria (búsqueda parcial/difusa).
 */
const searchArchetype = async (archetypeQuery) => {
  if (!isLoaded) throw new Error('El catálogo local aún no está listo. Inténtalo en unos segundos.');

  const normalizedQuery = normalizeString(archetypeQuery);
  if (!normalizedQuery) return [];

  return catalog.filter(card =>
    card._searchArchetype && card._searchArchetype.includes(normalizedQuery)
  );
};

/**
 * Obtiene carta exacta por ID.
 */
const getCardById = (id) => {
  if (!isLoaded) return null;
  return catalog.find(c => c.id.toString() === id.toString());
};

/**
 * Obtiene el estado actual del catálogo (trazabilidad).
 */
const getStatus = () => ({ isLoaded, ...catalogMetadata });

module.exports = {
  initCatalog,
  searchCardsFuzzy,
  searchArchetype,
  getCardById,
  getStatus,
};
