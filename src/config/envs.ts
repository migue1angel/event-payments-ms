import * as joi from 'joi';
import 'dotenv/config';

interface EnvsSchema {
  PORT: number;
  NAT_SERVERS: string[];
  PAYPAL_CLIENT_ID: string;
  PAYPAL_CLIENT_SECRET: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    NAT_SERVERS: joi.array().items(joi.string()).required(),
    PAYPAL_CLIENT_ID: joi.string().required(),
    PAYPAL_CLIENT_SECRET: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
  NAT_SERVERS: process.env.NAT_SERVERS?.split(','),
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const envs: EnvsSchema = {
  PORT: value.PORT,
  NAT_SERVERS: value.NAT_SERVERS,
  PAYPAL_CLIENT_ID: value.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: value.PAYPAL_CLIENT_SECRET,
};
