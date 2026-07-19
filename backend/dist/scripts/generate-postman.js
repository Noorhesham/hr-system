"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const root = process.cwd();
const spec = JSON.parse((0, fs_1.readFileSync)((0, path_1.join)(root, 'openapi.json'), 'utf8'));
const baseUrl = spec.servers?.[0]?.url ?? 'http://localhost:3004/api';
const tokenSaver = {
    listen: 'test',
    script: {
        type: 'text/javascript',
        exec: [
            'const json = pm.response.json();',
            'if (json && json.accessToken) {',
            "  pm.collectionVariables.set('accessToken', json.accessToken);",
            "  console.log('accessToken saved');",
            '}',
        ],
    },
};
const idSaver = (varName) => ({
    listen: 'test',
    script: {
        type: 'text/javascript',
        exec: [
            'const json = pm.response.json();',
            `if (json && json.id) {`,
            `  pm.collectionVariables.set('${varName}', json.id);`,
            `  console.log('${varName} saved:', json.id);`,
            '}',
        ],
    },
});
const savesToken = (path) => /\/auth\/(register|login|refresh)$/.test(path);
const savesEmployeeId = (path, method) => method === 'post' && path === '/employees';
const savesSalaryComponentId = (path, method) => method === 'post' && /\/employees\/\{employeeId\}\/salary-components$/.test(path);
const savesLoanId = (path, method) => method === 'post' && /\/employees\/\{employeeId\}\/loans$/.test(path);
const usesBearer = (op) => (op.security ?? []).some((s) => 'bearer' in s);
const getExample = (op) => {
    const content = op.requestBody?.content?.['application/json'];
    if (!content)
        return null;
    if (content.example)
        return content.example;
    if (content.examples?.default?.value)
        return content.examples.default.value;
    const first = content.examples && Object.values(content.examples)[0];
    if (first && typeof first === 'object' && 'value' in first) {
        return first.value;
    }
    return null;
};
const toPostmanPath = (openApiPath) => openApiPath.replace(/\{(\w+)\}/g, '{{$1}}');
const buildUrl = (openApiPath) => {
    const postmanPath = toPostmanPath(openApiPath);
    const segments = postmanPath.split('/').filter(Boolean);
    return {
        raw: `{{baseUrl}}${postmanPath}`,
        host: ['{{baseUrl}}'],
        path: segments,
    };
};
const folders = {};
for (const path of Object.keys(spec.paths)) {
    for (const method of Object.keys(spec.paths[path])) {
        const op = spec.paths[path][method];
        const tag = op.tags?.[0] ?? 'Default';
        (folders[tag] ??= []);
        const example = getExample(op);
        const header = example
            ? [{ key: 'Content-Type', value: 'application/json' }]
            : [];
        const request = {
            method: method.toUpperCase(),
            header,
            url: buildUrl(path),
        };
        if (example) {
            request.body = {
                mode: 'raw',
                raw: JSON.stringify(example, null, 2),
                options: { raw: { language: 'json' } },
            };
        }
        if (!usesBearer(op)) {
            request.auth = { type: 'noauth' };
        }
        const item = {
            name: op.summary ?? `${method.toUpperCase()} ${path}`,
            request,
        };
        const events = [];
        if (savesToken(path))
            events.push(tokenSaver);
        if (savesEmployeeId(path, method))
            events.push(idSaver('employeeId'));
        if (savesSalaryComponentId(path, method))
            events.push(idSaver('salaryComponentId'));
        if (savesLoanId(path, method))
            events.push(idSaver('loanId'));
        if (events.length)
            item.event = events;
        folders[tag].push(item);
    }
}
const tagOrder = [
    ...(spec.tags ?? []).map((t) => t.name),
    ...Object.keys(folders),
];
const seen = new Set();
const item = tagOrder
    .filter((n) => folders[n] && !seen.has(n) && seen.add(n))
    .map((name) => ({ name, item: folders[name] }));
const collection = {
    info: {
        name: spec.info?.title ?? 'API',
        description: spec.info?.description,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: {
        type: 'bearer',
        bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
    },
    variable: [
        { key: 'baseUrl', value: baseUrl, type: 'string' },
        { key: 'accessToken', value: '', type: 'string' },
        { key: 'employeeId', value: '', type: 'string' },
        { key: 'loanId', value: '', type: 'string' },
        { key: 'salaryComponentId', value: '', type: 'string' },
    ],
    item,
};
const outFile = (0, path_1.join)(root, 'postman_collection.json');
(0, fs_1.writeFileSync)(outFile, JSON.stringify(collection, null, 2));
console.log(`Postman collection written to ${outFile} (${item.length} folders)`);
//# sourceMappingURL=generate-postman.js.map