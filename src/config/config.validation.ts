import Joi from 'joi';

export const validate = (config: Record<string, any>) => {
  const schema = Joi.object({
    NODE_ENV: Joi.string().valid('mainnet', 'testnet1', 'testnet2').required(),
    BLOCKCHAIN_URL: Joi.string().uri().required(),
    DATABASE_URL: Joi.string().required(),
    AWS_ACCESS_KEY_ID: Joi.string().required(),
    AWS_SECRET_ACCESS_KEY: Joi.string().required(),
    AWS_BUCKET_NAME: Joi.string().required(),
    LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error'),
    LOG_OUTPUT: Joi.string().valid('console', 'file', 'json'),
  });

  const { error, value } = schema.validate(config, { allowUnknown: true, abortEarly: false });
  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }
  return value;
};
