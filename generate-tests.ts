import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

// Load OpenAPI spec
const openApiPath = path.resolve(__dirname, 'oas/product.json');
const openApiSpec = yaml.load(fs.readFileSync(openApiPath, 'utf8')) as any;

function generateTest(endpoint: string, method: string, statusCode: string) {
  return `
describe('${method.toUpperCase()} ${endpoint}', () => {
  it('should return status ${statusCode}', async () => {
    const response = await request(app).${method}('${endpoint}');
    expect(response.status).toBe(${statusCode});
  });
});
  `;
}

function generateTests() {
  let testFileContent = `
import request from 'supertest';
import app from '../src/app';

`;

  for (const [endpoint, methods] of Object.entries(openApiSpec.paths)) {
    for (const [method, details] of Object.entries(methods as any)) {
      //@ts-ignore
      for (const [statusCode] of Object.entries(details.responses)) {
        testFileContent += generateTest(endpoint, method, statusCode);
      }
    }
  }

  fs.writeFileSync('./tests/api.test.ts', testFileContent);
}

generateTests();

