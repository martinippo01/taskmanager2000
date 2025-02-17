import * as Joi from 'joi';

export const ConfigModuleValidationSchema = Joi.object({
  KAFKA_BROKERS_SSR: Joi.string().required(),
  KAFKA_CLIENT_ID_SSR: Joi.string().required(),
  KAFKA_USERNAME_SSR: Joi.string().required(),
  KAFKA_PASSWORD_SSR: Joi.string().required(),
  KAFKA_TOPIC_SSR: Joi.string().required(),

  KAFKA_BROKERS_WER: Joi.string().required(),
  KAFKA_CLIENT_ID_WER: Joi.string().required(),
  KAFKA_USERNAME_WER: Joi.string().required(),
  KAFKA_PASSWORD_WER: Joi.string().required(),
  KAFKA_GROUP_ID_WER: Joi.string().required(),
  KAFKA_TOPIC_WER: Joi.string().required(),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  TYPEORM_SYNC: Joi.boolean().required(),

  PORT: Joi.number().port().required(),
  SERVICE_NAME: Joi.string().required(),

  LOGGER_URL: Joi.string().required(),
  TRACE_URL: Joi.string().required(),

  NFS_PATH: Joi.string().required(),
});
