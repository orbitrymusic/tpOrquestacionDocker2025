import Joi from "joi";

const durationRegex = /^(\d+[smhd])+$/;

const envsSchema = Joi.object({
    MONGODB_URI: Joi.string().required(),
    PORT: Joi.number().required(),
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_EXPIRATION: Joi.string().required(),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
}).unknown(true);

const { value, error} = envsSchema.validate(process.env);
if(error) {
    throw new Error(`Error de validaciòn en variables de entorno: ${error.message}`);
}

export const envs = {
    MONGODB_URI: value.MONGODB_URI,
    PORT: value.PORT,
    JWT_SECRET: value.JWT_SECRET,
    JWT_EXPIRATION: value.JWT_EXPIRATION,
    NODE_ENV: value.NODE_ENV,
};


