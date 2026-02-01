import { registerAs } from "@nestjs/config";
import Joi from "joi";

const schema = Joi.object({
    port: Joi.number().integer().required(),
    betterAuthSecret: Joi.string().required(),
    betterAuthUrl: Joi.string().uri().optional(),
    betterAuthBaseUrl: Joi.string().uri().optional(),
    betterAuthTrustedOrigins: Joi.array().items(Joi.string().uri()).optional(),
    databaseUrl: Joi.string().required(),
}).or("betterAuthUrl", "betterAuthBaseUrl");

const config = registerAs("app", () => {
    const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    const values = {
        port: Number.parseInt(String(process.env.PORT), 10),
        betterAuthSecret: process.env.BETTER_AUTH_SECRET,
        betterAuthUrl: process.env.BETTER_AUTH_URL,
        betterAuthBaseUrl: process.env.BETTER_AUTH_BASE_URL,
        betterAuthTrustedOrigins: trustedOrigins?.length ? trustedOrigins : undefined,
        databaseUrl: process.env.DATABASE_URL,
    };

    const { error } = schema.validate(values, { abortEarly: false });
    if (error) {
        throw new Error(error.message);
    }

    return values;
});

export default config;
