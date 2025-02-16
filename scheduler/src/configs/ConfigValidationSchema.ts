import * as Joi from 'joi';

export const ConfigModuleValidationSchema = Joi.object({
  KAFKA_BROKERS_SSR: Joi.string().required(),
  KAFKA_CLIENT_ID_SSR: Joi.string().required(),
  KAFKA_GROUP_ID_SSR: Joi.string().required(),
  KAFKA_USERNAME_SSR: Joi.string().required(),
  KAFKA_PASSWORD_SSR: Joi.string().required(),
  KAFKA_TOPIC_SSR: Joi.string().required(),
  TASK_SERVICE_URL: Joi.string().required(),

  PORT: Joi.number().port().required(),
  SERVICE_NAME: Joi.string().required(),

  LOGGER_URL: Joi.string().required(),
  TRACE_URL: Joi.string().required(),
});
