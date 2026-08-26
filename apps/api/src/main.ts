import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { runSeedIfEmpty } from "./database/seed";

async function bootstrap() {
  // rawBody:true preserves req.rawBody (a Buffer) on every request alongside the
  // normal parsed req.body — needed so the Razorpay webhook route can verify its
  // signature against the exact raw bytes Razorpay signed.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string>("CORS_ORIGIN", "http://localhost:3001"),
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("QuickBite API")
    .setDescription("Central backend for the QuickBite food delivery platform")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  await runSeedIfEmpty(app);

  const port = config.get<number>("PORT", 3000);
  await app.listen(port);
  console.log(`QuickBite API listening on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
