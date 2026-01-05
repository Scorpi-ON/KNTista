import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { JoiPipeModule } from "nestjs-joi";
import { createAuth } from "./auth";

import { ActivityModule } from "./activity/activity.module";
import appConfig from "./app.config";

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [appConfig],
            isGlobal: true,
            envFilePath: ["../.env"],
            expandVariables: true,
        }),
        JoiPipeModule,
        ActivityModule,
        AuthModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const baseURL =
                    configService.get<string>("app.betterAuthUrl") ??
                    configService.get<string>("app.betterAuthBaseUrl");
                const trustedOrigins = configService.get<string[]>("app.betterAuthTrustedOrigins");

                return {
                    auth: createAuth({
                        baseURL,
                        databaseUrl: configService.getOrThrow<string>("app.databaseUrl"),
                        secret: configService.getOrThrow<string>("app.betterAuthSecret"),
                        trustedOrigins,
                    }),
                };
            },
        }),
    ],
})
export class AppModule {}
