import * as Joi from 'joi';

export const ConfigModuleValidationSchema = Joi.object({
  KAFKA_BROKERS_SSR: Joi.string().required(),
  KAFKA_CLIENT_ID_SSR: Joi.string().required(),
  KAFKA_GROUP_ID_SSR: Joi.string().required(),
  KAFKA_USERNAME_SSR: Joi.string().required(),
  KAFKA_PASSWORD_SSR: Joi.string().required(),
  KAFKA_TOPIC_SSR: Joi.string().required(),
});
