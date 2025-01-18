import * as Joi from 'joi';

export const ConfigModuleValidationSchema = Joi.object({
  PORT: Joi.number().port().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().required(),
});
