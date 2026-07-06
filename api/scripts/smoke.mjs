const baseUrl = process.env.API_BASE_URL || 'http://localhost:8080';

async function check(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`${path} failed with status ${response.status}`);
  }
  return response.json();
}

console.log(`Running API smoke checks against ${baseUrl}`);
await check('/');
await check('/health');
await check('/db/health');
console.log('API smoke checks passed.');
