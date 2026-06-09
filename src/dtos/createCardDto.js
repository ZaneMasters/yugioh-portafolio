'use strict';

const { z } = require('zod');

/**
 * DTO para POST /cards — Crear / registrar carta en inventario.
 *
 * El usuario puede identificar la carta por nombre o por ID externo (cardId).
 * Al menos uno de los dos es obligatorio.
 */
const createCardSchema = z
  .object({
    name: z
      .string({ invalid_type_error: 'El nombre debe ser texto.' })
      .trim()
      .min(1, 'El nombre no puede estar vacío.')
      .optional(),

    cardId: z
      .union([
        z.number({ invalid_type_error: 'cardId debe ser un número.' }).int().positive(),
        z
          .string()
          .regex(/^\d+$/, 'cardId debe contener solo dígitos.')
          .transform(Number),
      ])
      .optional(),

    condition: z
      .enum(['new', 'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged'], {
        errorMap: () => ({
          message:
            'condition debe ser: new, near_mint, lightly_played, moderately_played, heavily_played o damaged.',
        }),
      })
      .default('new'),

    quantity: z
      .number({ invalid_type_error: 'quantity debe ser un número.' })
      .int('quantity debe ser un entero.')
      .positive('quantity debe ser mayor a 0.')
      .default(1),

    folderIds: z.array(z.string()).optional(),

    // —— Datos de la versión física de la carta ——
    /** Código de expansión exacto, ej: "LOB-EN005" */
    setCode: z.string().trim().optional(),

    /** Nombre de la expansión, ej: "Legend of Blue Eyes White Dragon" */
    setName: z.string().trim().optional(),

    /** Rareza de la carta en esa expansión, ej: "Ultra Rare" */
    rarity: z.string().trim().optional(),

    /** Precio estimado de mercado de esa expansión (string de la API), ej: "49.41" */
    setPrice: z.string().optional(),

    /** ID numérico de la imagen elegida (para cartas con artes alternativas) */
    selectedImageId: z
      .union([
        z.number().int().positive(),
        z.string().regex(/^\d+$/).transform(Number),
      ])
      .optional(),

    /** Edición física — no viene de la API, el usuario lo sabe */
    edition: z
      .enum(['1st Edition', 'Unlimited', 'Limited Edition'], {
        errorMap: () => ({ message: 'edition debe ser: 1st Edition, Unlimited o Limited Edition.' }),
      })
      .optional(),

    /** Idioma de la carta física — no viene de la API */
    language: z
      .enum(['EN', 'SP', 'JP', 'FR', 'DE', 'IT', 'PT'], {
        errorMap: () => ({ message: 'language debe ser: EN, SP, JP, FR, DE, IT o PT.' }),
      })
      .optional(),
  })
  .refine((data) => data.name || data.cardId, {
    message: 'Debes proporcionar al menos name o cardId.',
    path: ['name'],
  });

module.exports = { createCardSchema };
