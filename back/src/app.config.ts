import { registerAs } from "@nestjs/config";
import Joi from "joi";

export interface AppConfig {
    port: number;
    authEnabled: boolean;
    betterAuthSecret: string;
    betterAuthUrl?: string;
    betterAuthBaseUrl?: string;
    betterAuthTrustedOrigins?: string[];
    databaseUrl: string;
}

const schema = Joi.object<AppConfig>({
    port: Joi.number().integer().required(),
    authEnabled: Joi.boolean().default(true),
    betterAuthSecret: Joi.string().required(),
    betterAuthUrl: Joi.string().uri().optional(),
    betterAuthBaseUrl: Joi.string().uri().optional(),
    betterAuthTrustedOrigins: Joi.array().items(Joi.string().uri()).optional(),
    databaseUrl: Joi.string().required(),
}).or("betterAuthUrl", "betterAuthBaseUrl");

const config = registerAs("app", (): AppConfig => {
    const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    const values = {
        port: process.env.PORT,
        authEnabled: process.env.AUTH_ENABLED,
        betterAuthSecret: process.env.BETTER_AUTH_SECRET,
        betterAuthUrl: process.env.BETTER_AUTH_URL,
        betterAuthBaseUrl: process.env.BETTER_AUTH_BASE_URL,
        betterAuthTrustedOrigins: trustedOrigins?.length ? trustedOrigins : undefined,
        databaseUrl: process.env.DATABASE_URL,
    };

    const result = schema.validate(values, { abortEarly: false });
    if (result.error) {
        throw new Error(result.error.message);
    }

    return result.value;
});

export default config;
