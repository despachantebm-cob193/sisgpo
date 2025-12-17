import AppError from '../utils/AppError';

type JoiSchema = {
  validate: (data: any, options?: Record<string, unknown>) => { error?: any };
};

const validationMiddleware =
  (schema: JoiSchema) => (req: any, res: any, next: any) => {
    if (!schema) {
      throw new AppError('Schema de validacao nao fornecido para esta rota.', 500);
    }

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail: any) => ({
        field: detail.context.key,
        message: detail.message.replace(/"/g, ''),
      }));

      console.error('[Validation Error]', JSON.stringify(errors, null, 2));

      return res.status(400).json({
        message: 'Erro de validacao nos dados enviados.',
        errors,
      });
    }

    return next();
  };

export = validationMiddleware;
