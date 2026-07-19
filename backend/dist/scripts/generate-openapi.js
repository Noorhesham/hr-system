"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const fs_1 = require("fs");
const path_1 = require("path");
const app_module_1 = require("../src/app.module");
const openapi_config_1 = require("../src/openapi.config");
async function run() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { logger: false });
    const document = swagger_1.SwaggerModule.createDocument(app, (0, openapi_config_1.buildOpenApiConfig)());
    const outFile = (0, path_1.join)(process.cwd(), 'openapi.json');
    (0, fs_1.writeFileSync)(outFile, JSON.stringify(document, null, 2));
    await app.close();
    console.log(`OpenAPI spec written to ${outFile}`);
}
run().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=generate-openapi.js.map