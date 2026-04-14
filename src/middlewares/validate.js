'use strict';

/**
 * Middleware factory de validación de request con Zod.
 *
 * Uso:
 *   router.post('/', validate({ body: createCardSchema }), controller.create);
 *
 * @param {{ body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }} schemas
 * @returns Express middleware
 */
const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    next();
  } catch (err) {
    // Zod lanza ZodError → lo captura errorHandler global
    next(err);
  }
};

module.exports = validate;
