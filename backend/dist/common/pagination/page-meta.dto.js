"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageMetaDto = void 0;
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
}
exports.PageMetaDto = PageMetaDto;
//# sourceMappingURL=page-meta.dto.js.map