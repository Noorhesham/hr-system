"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageDto = void 0;
const openapi = require("@nestjs/swagger");
class PageDto {
    data;
    meta;
    constructor(data, meta) {
        this.data = data;
        this.meta = meta;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { data: { required: true }, meta: { required: true, type: () => require("./page-meta.dto").PageMetaDto } };
    }
}
exports.PageDto = PageDto;
//# sourceMappingURL=page.dto.js.map