const axios = require('axios');
const cron = require('node-cron');
const logger = require('../utils/logger');
const { getStorage } = require('../config/firebase');

const YGO_API_ALL_CARDS_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const BACKUP_FILENAME = 'ygo_catalog_backup.json';

// Variables en memoria
let catalog = [];
let isLoaded = false;
let catalogMetadata = {
  lastUpdated: null,
  source: null,
  totalCards: 0,
  status: 'Inicializando...'
};

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
 * Normaliza los nombres de la base de datos para búsqueda rápida.
 */
const buildIndex = (cards) => {
  return cards.map(card => ({
    ...card,
    _searchName: normalizeString(card.name),
    _searchArchetype: normalizeString(card.archetype)
  }));
};

/**
 * Descarga el catálogo de YGOProdeck, lo guarda en RAM y sube un respaldo a Storage.
 * Si falla, intenta recuperar el respaldo desde Storage.
 */
const loadCatalog = async () => {
  const storage = getStorage();
  
  try {
    logger.info('📦 Descargando catálogo fresco de YGOProdeck...');
    const response = await axios.get(YGO_API_ALL_CARDS_URL);
    const cards = response.data.data;
    
    catalog = buildIndex(cards);
    isLoaded = true;
    catalogMetadata = {
      lastUpdated: new Date().toISOString(),
      source: 'YGOProdeck API (Fresco)',
      totalCards: catalog.length,
      status: 'Éxito'
    };
    logger.info(`✅ Catálogo cargado en RAM: ${catalog.length} cartas.`);

    // Crear/actualizar el respaldo en Firebase Storage (si Storage está disponible)
    if (storage) {
      try {
        const file = storage.file(BACKUP_FILENAME);
        await file.save(JSON.stringify(cards), {
          contentType: 'application/json',
          metadata: {
            cacheControl: 'public, max-age=31536000',
          }
        });
        logger.info(`☁️ Respaldo guardado exitosamente en Firebase Storage (${BACKUP_FILENAME}).`);
      } catch (storageErr) {
        logger.warn('⚠️ No se pudo guardar el respaldo en Firebase Storage:', storageErr.message);
      }
    }
  } catch (error) {
    logger.error('❌ Error al descargar catálogo de YGOProdeck:', error.message);
    
    // Si falla YGOProdeck, intentamos el Fallback con Storage
    if (storage) {
      logger.info('🔄 Intentando cargar catálogo desde copia de respaldo en Firebase Storage...');
      try {
        const file = storage.file(BACKUP_FILENAME);
        const [exists] = await file.exists();
        
        if (exists) {
          const [contents] = await file.download();
          const cards = JSON.parse(contents.toString());
          catalog = buildIndex(cards);
          isLoaded = true;
          catalogMetadata = {
            lastUpdated: new Date().toISOString(),
            source: 'Firebase Storage (Respaldo)',
            totalCards: catalog.length,
            status: 'Éxito (Fallback)'
          };
          logger.info(`✅ Catálogo de respaldo cargado en RAM: ${catalog.length} cartas.`);
        } else {
          logger.error('❌ No se encontró ninguna copia de respaldo en Firebase Storage.');
          catalogMetadata.status = 'Error Crítico: YGOProdeck caído y sin respaldo.';
        }
      } catch (fallbackErr) {
        logger.error('❌ Error al cargar la copia de respaldo desde Firebase Storage:', fallbackErr.message);
        catalogMetadata.status = 'Error Crítico: Fallo al leer respaldo.';
      }
    } else {
      catalogMetadata.status = 'Error Crítico: YGOProdeck caído y Storage inactivo.';
    }
  }
};

/**
 * Inicializa la carga y el cronjob.
 */
const startCron = () => {
  // Carga inicial al encender el servidor (fondo, no bloqueante)
  loadCatalog();

  // Cronjob: Todos los Lunes a las 3:00 AM (0 3 * * 1)
  cron.schedule('0 3 * * 1', () => {
    logger.info('⏰ Ejecutando cron job semanal: Actualizando catálogo YGOProdeck...');
    loadCatalog();
  });
};

/**
 * Busca cartas difusamente en memoria.
 * @param {string} query - Ej: "live twin", "Live Twin Ki-sikil", "dark mag"
 */
const searchCardsFuzzy = async (query) => {
  if (!isLoaded) throw new Error('El catálogo local aún no está listo. Inténtalo en unos segundos.');
  
  const normalizedQuery = normalizeString(query);
  
  // Búsqueda difusa: la consulta debe estar incluida dentro del nombre de la carta
  const results = catalog.filter(card => card._searchName.includes(normalizedQuery));
  
  // Limitar resultados a un número razonable para no saturar el cliente
  return results.slice(0, 50);
};

/**
 * Busca por arquetipo en memoria (búsqueda parcial/difusa).
 */
const searchArchetype = async (archetypeQuery) => {
  if (!isLoaded) throw new Error('El catálogo local aún no está listo. Inténtalo en unos segundos.');
  
  const normalizedQuery = normalizeString(archetypeQuery);
  if (!normalizedQuery) return [];
  
  // Búsqueda parcial para arquetipo (ej. "cyber" encuentra "Cyber Dragon", "Cyberdark")
  const results = catalog.filter(card => 
    card._searchArchetype && card._searchArchetype.includes(normalizedQuery)
  );
  
  return results;
};

/**
 * Obtiene carta exacta por ID (usado si quieres buscar by Id rápido)
 */
const getCardById = (id) => {
  if (!isLoaded) return null;
  return catalog.find(c => c.id.toString() === id.toString());
};

/**
 * Obtiene el estado actual del catálogo (trazabilidad).
 */
const getStatus = () => {
  return {
    isLoaded,
    ...catalogMetadata
  };
};

module.exports = {
  startCron,
  loadCatalog,
  searchCardsFuzzy,
  searchArchetype,
  getCardById,
  getStatus
};
