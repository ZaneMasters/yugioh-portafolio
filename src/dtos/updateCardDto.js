'use strict';

const { z } = require('zod');

/**
 * DTO para PUT /cards/:id — Actualizar carta del inventario.
 *
 * Permite actualizar cantidad, carpetas, rareza, y detalles físicos de la carta.
 * Al menos uno de los campos debe estar presente.
 */
const updateCardSchema = z
  .object({
    quantity: z
      .number({ invalid_type_error: 'quantity debe ser un número.' })
      .int('quantity debe ser un entero.')
      .positive('quantity debe ser mayor a 0.')
      .optional(),


    folderIds: z.array(z.string()).optional(),

    // —— Datos de la versión física (editables después de agregar) ——
    setCode: z.string().trim().optional(),
    setName: z.string().trim().optional(),
    rarity:  z.string().trim().optional(),
    setPrice: z.string().optional(),

    selectedImageId: z
      .union([
        z.number().int().positive(),
        z.string().regex(/^\d+$/).transform(Number),
      ])
      .optional(),

    edition: z
      .enum(['1st Edition', 'Unlimited', 'Limited Edition'], {
        errorMap: () => ({ message: 'edition debe ser: 1st Edition, Unlimited o Limited Edition.' }),
      })
      .optional(),

    language: z
      .enum(['EN', 'SP', 'JP', 'FR', 'DE', 'IT', 'PT'], {
        errorMap: () => ({ message: 'language debe ser: EN, SP, JP, FR, DE, IT o PT.' }),
      })
      .optional(),

    /** Ocultar/mostrar en el portafolio público (campo interno existente) */
    isHidden: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.quantity     !== undefined ||
      data.folderIds    !== undefined ||
      data.setCode      !== undefined ||
      data.setName      !== undefined ||
      data.rarity       !== undefined ||
      data.setPrice     !== undefined ||
      data.selectedImageId !== undefined ||
      data.edition      !== undefined ||
      data.language     !== undefined ||
      data.isHidden     !== undefined,
    {
      message: 'Debes proporcionar al menos un campo para actualizar.',
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
