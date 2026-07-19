"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageMetaDto = void 0;
const openapi = require("@nestjs/swagger");
class PageMetaDto {
    page;
    limit;
    itemCount;
    pageCount;
    hasPreviousPage;
    hasNextPage;
    constructor({ pageOptionsDto, itemCount, }) {
        this.page = pageOptionsDto.page;
        this.limit = pageOptionsDto.limit;
        this.itemCount = itemCount;
        this.pageCount = Math.ceil(itemCount / pageOptionsDto.limit);
        this.hasPreviousPage = this.page > 1;
        this.hasNextPage = this.page < this.pageCount;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { page: { required: true, type: () => Number }, limit: { required: true, type: () => Number }, itemCount: { required: true, type: () => Number }, pageCount: { required: true, type: () => Number }, hasPreviousPage: { required: true, type: () => Boolean }, hasNextPage: { required: true, type: () => Boolean } };
    }
}
exports.PageMetaDto = PageMetaDto;
//# sourceMappingURL=page-meta.dto.js.map