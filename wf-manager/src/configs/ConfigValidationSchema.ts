import * as Joi from 'joi';

export const ConfigModuleValidationSchema = Joi.object({
  PORT: Joi.number().port().required(),
  SERVICE_NAME: Joi.string().required(),

  LOGGER_URL: Joi.string().required(),
  TRACE_URL: Joi.string().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().required(),

  HC_CACHE_TTL: Joi.number().min(0).required(),

  KAFKA_USERNAME: Joi.string().required(),
  KAFKA_PASSWORD: Joi.string().required(),
  KAFKA_TOPIC: Joi.string().required(),
  KAFKA_BROKERS: Joi.string().required(),
  KAFKA_CLIENT_ID: Joi.string().required(),
});
