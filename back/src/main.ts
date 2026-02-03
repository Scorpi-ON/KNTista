import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";

interface HotModule {
    hot?: {
        accept: () => void;
        dispose: (callback: () => void) => void;
    };
};

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bodyParser: false,
    });

    const config = new DocumentBuilder()
        .setTitle("KNTista-api")
        .setDescription("Backend for the KNTista project")
        .setVersion("0.0.1")
        .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, documentFactory);

    const configService = app.get(ConfigService);
    const port = configService.getOrThrow<number>("app.port");
    await app.listen(port, "0.0.0.0");

    if (typeof module !== "undefined") {
        const hotModule = module as HotModule;
        if (hotModule.hot) {
            hotModule.hot.accept();
            hotModule.hot.dispose(() => void app.close());
        }
    }
}

void bootstrap();
