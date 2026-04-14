'use strict';

const { z } = require('zod');

/**
 * DTO para PUT /cards/:id — Actualizar carta del inventario.
 *
 * Solo permite actualizar quantity y condition.
 * Al menos uno de los dos campos debe estar presente.
 */
const updateCardSchema = z
  .object({
    quantity: z
      .number({ invalid_type_error: 'quantity debe ser un número.' })
      .int('quantity debe ser un entero.')
      .nonnegative('quantity debe ser 0 o mayor.')
      .optional(),

    condition: z
      .enum(['new', 'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged'], {
        errorMap: () => ({
          message:
            'condition debe ser: new, near_mint, lightly_played, moderately_played, heavily_played o damaged.',
        }),
      })
      .optional(),
  })
  .refine((data) => data.quantity !== undefined || data.condition !== undefined, {
    message: 'Debes proporcionar al menos quantity o condition para actualizar.',
    path: ['quantity'],
  });

/**
 * Schema para validar el parámetro :id de la ruta.
 */
const idParamSchema = z.object({
  id: z.string().min(1, 'El ID no puede estar vacío.'),
});

module.exports = { updateCardSchema, idParamSchema };
