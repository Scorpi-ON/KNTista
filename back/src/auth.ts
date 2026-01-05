import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "../generated/prisma/client";

interface AuthConfig {
    baseURL?: string;
    databaseUrl: string;
    secret: string;
    trustedOrigins?: string[];
}

export const createAuth = ({ baseURL, databaseUrl, secret, trustedOrigins }: AuthConfig) => {
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    const prisma = new PrismaClient({ adapter });

    return betterAuth({
        baseURL,
        secret,
        trustedOrigins: trustedOrigins && trustedOrigins.length > 0 ? trustedOrigins : undefined,
        database: prismaAdapter(prisma, {
            provider: "postgresql",
        }),
        emailAndPassword: {
            enabled: true,
        },
    });
};
