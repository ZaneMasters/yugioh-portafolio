'use strict';

const { z } = require('zod');

/**
 * DTO para PUT /cards/:id — Actualizar carta del inventario.
 *
 * Solo permite actualizar quantity y condition.
 * Al menos uno de los dos campos debe estar presente.
 * Solo permite actualizar quantity, condition y folderIds.
 * Al menos uno de los campos debe estar presente.
 */
const updateCardSchema = z
  .object({
    quantity: z
      .number({ invalid_type_error: 'quantity debe ser un número.' })
      .int('quantity debe ser un entero.')
      .positive('quantity debe ser mayor a 0.')
      .optional(),

    condition: z
      .enum(['new', 'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged'], {
        errorMap: () => ({
          message:
            'condition debe ser: new, near_mint, lightly_played, moderately_played, heavily_played o damaged.',
        }),
      })
      .optional(),

    folderIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) =>
      data.quantity !== undefined ||
      data.condition !== undefined ||
      data.folderIds !== undefined,
    {
      message: 'Debes proporcionar al menos quantity, condition o folderIds para actualizar.',
      path: ['quantity'],
    }
  );

/**
 * Schema para validar el parámetro :id de la ruta.
 */
const idParamSchema = z.object({
  id: z.string().min(1, 'El ID no puede estar vacío.'),
});

module.exports = { updateCardSchema, idParamSchema };
