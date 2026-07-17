const http = require('http');

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

function postJson(url, data = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(responseBody)
          });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: responseBody });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log("=== Testing Documented API Endpoints ===");
  
  // 1. POST /auth/login
  console.log("\n1. Testing POST /api/v1/auth/login...");
  const res1 = await postJson('http://localhost:5173/api/v1/auth/login', {
    email: "teste@diskingressos.com.br",
    password: "password123"
  });
  console.log("Status:", res1.statusCode);
  console.log("Token:", res1.body.token);
  console.log("User email:", res1.body.user.email);
  
  // 2. POST /receber/{id}/baixar
  console.log("\n2. Testing POST /api/v1/receber/2/baixar...");
  const res2 = await postJson('http://localhost:5173/api/v1/receber/2/baixar');
  console.log("Status:", res2.statusCode);
  console.log("Updated status:", res2.body.status);
  
  // 3. GET /dashboard/fluxo-caixa
  console.log("\n3. Testing GET /api/v1/dashboard/fluxo-caixa...");
  const res3 = await getJson('http://localhost:5173/api/v1/dashboard/fluxo-caixa');
  console.log("Status:", res3.statusCode);
  console.log("Fluxo Caixa Resumo:", res3.body.resumo);

  if (res1.body.success === true && res2.body.status === 'recebido' && res3.body.resumo !== undefined) {
    console.log("\nSUCCESS: All documented endpoints verified successfully!");
    process.exit(0);
  } else {
    console.error("\nFAILURE: Verification failed!");
    process.exit(1);
  }
}

run().catch(console.error);
