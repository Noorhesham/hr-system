/**
 * Converts the generated `openapi.json` into a Postman collection v2.1
 * (`postman_collection.json`) with extras that OpenAPI cannot express:
 *
 *   - Collection-level Bearer auth using {{accessToken}}.
 *   - Post-response scripts that save accessToken, employeeId, loanId,
 *     salaryComponentId into collection variables for chained testing.
 *   - Path params as {{variable}} (not literal `{id}`) so saved IDs flow through.
 *   - Fixed example request bodies (raw JSON) for POST/PATCH.
 *   - Folders per OpenAPI tag.
 *
 * Import this file into APIDog (Import → Postman) for "log in once, everything
 * else just works". The refresh token is an httpOnly cookie — APIDog's cookie
 * jar handles it automatically for /auth/refresh.
 *
 * Run: `npm run postman:export` (regenerates openapi.json first).
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const spec = JSON.parse(readFileSync(join(root, 'openapi.json'), 'utf8'));
const baseUrl: string = spec.servers?.[0]?.url ?? 'http://localhost:3004/api';

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

/** Saves resource ids from create responses so later requests can use {{employeeId}} etc. */
const idSaver = (varName: string) => ({
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

const savesToken = (path: string) => /\/auth\/(register|login|refresh)$/.test(path);

const savesEmployeeId = (path: string, method: string) =>
  method === 'post' && path === '/employees';

const savesSalaryComponentId = (path: string, method: string) =>
  method === 'post' && /\/employees\/\{employeeId\}\/salary-components$/.test(path);

const savesLoanId = (path: string, method: string) =>
  method === 'post' && /\/employees\/\{employeeId\}\/loans$/.test(path);

const usesBearer = (op: any) =>
  (op.security ?? []).some((s: any) => 'bearer' in s);

const getExample = (op: any) => {
  const content = op.requestBody?.content?.['application/json'];
  if (!content) return null;
  if (content.example) return content.example;
  if (content.examples?.default?.value) return content.examples.default.value;
  const first = content.examples && Object.values(content.examples)[0];
  if (first && typeof first === 'object' && 'value' in (first as object)) {
    return (first as { value: unknown }).value;
  }
  return null;
};

/** OpenAPI `{employeeId}` → Postman `{{employeeId}}` in URL segments. */
const toPostmanPath = (openApiPath: string): string =>
  openApiPath.replace(/\{(\w+)\}/g, '{{$1}}');

const buildUrl = (openApiPath: string) => {
  const postmanPath = toPostmanPath(openApiPath);
  const segments = postmanPath.split('/').filter(Boolean);
  return {
    raw: `{{baseUrl}}${postmanPath}`,
    host: ['{{baseUrl}}'],
    path: segments,
  };
};

const folders: Record<string, any[]> = {};

for (const path of Object.keys(spec.paths)) {
  for (const method of Object.keys(spec.paths[path])) {
    const op = spec.paths[path][method];
    const tag: string = op.tags?.[0] ?? 'Default';
    (folders[tag] ??= []);

    const example = getExample(op);
    const header = example
      ? [{ key: 'Content-Type', value: 'application/json' }]
      : [];

    const request: any = {
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
    // Public routes (register/login) and the cookie-based refresh don't use the
    // bearer token; everything else inherits the collection Bearer auth.
    if (!usesBearer(op)) {
      request.auth = { type: 'noauth' };
    }

    const item: any = {
      name: op.summary ?? `${method.toUpperCase()} ${path}`,
      request,
    };

    const events: any[] = [];
    if (savesToken(path)) events.push(tokenSaver);
    if (savesEmployeeId(path, method)) events.push(idSaver('employeeId'));
    if (savesSalaryComponentId(path, method)) events.push(idSaver('salaryComponentId'));
    if (savesLoanId(path, method)) events.push(idSaver('loanId'));
    if (events.length) item.event = events;

    folders[tag].push(item);
  }
}

// Keep tag order from the spec, then any extras.
const tagOrder: string[] = [
  ...(spec.tags ?? []).map((t: any) => t.name),
  ...Object.keys(folders),
];
const seen = new Set<string>();
const item = tagOrder
  .filter((n) => folders[n] && !seen.has(n) && seen.add(n))
  .map((name) => ({ name, item: folders[name] }));

const collection = {
  info: {
    name: spec.info?.title ?? 'API',
    description: spec.info?.description,
    schema:
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
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

const outFile = join(root, 'postman_collection.json');
writeFileSync(outFile, JSON.stringify(collection, null, 2));
console.log(`Postman collection written to ${outFile} (${item.length} folders)`);
