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
  })
  .refine((data) => data.name || data.cardId, {
    message: 'Debes proporcionar al menos name o cardId.',
    path: ['name'],
  });

module.exports = { createCardSchema };
