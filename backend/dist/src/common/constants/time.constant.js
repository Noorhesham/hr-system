"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultTz = exports.HH_MM_REGEX = void 0;
exports.HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const getDefaultTz = () => process.env.DEFAULT_TZ || 'Asia/Riyadh';
exports.getDefaultTz = getDefaultTz;
//# sourceMappingURL=time.constant.js.map