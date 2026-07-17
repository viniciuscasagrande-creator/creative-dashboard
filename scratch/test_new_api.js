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
  console.log("=== Testing Mock API Endpoints ===");
  
  // 1. GET /receber
  console.log("\n1. Testing GET /api/v1/receber...");
  const res1 = await getJson('http://localhost:5173/api/v1/receber');
  console.log("Status:", res1.statusCode);
  console.log("Items Count:", res1.body.length);
  
  // 2. POST /receber
  console.log("\n2. Testing POST /api/v1/receber...");
  const res2 = await postJson('http://localhost:5173/api/v1/receber', {
    descricao: "Patrocínio Arena",
    valor: 45000.00,
    metodo: "pix"
  });
  console.log("Status:", res2.statusCode);
  console.log("Created:", res2.body);
  
  // 3. POST /receber/{id}/receber
  console.log(`\n3. Testing POST /api/v1/receber/${res2.body.id}/receber...`);
  const res3 = await postJson(`http://localhost:5173/api/v1/receber/${res2.body.id}/receber`);
  console.log("Status:", res3.statusCode);
  console.log("Updated status:", res3.body.status);
  
  // 4. GET /receber/pix
  console.log("\n4. Testing GET /api/v1/receber/pix...");
  const res4 = await getJson('http://localhost:5173/api/v1/receber/pix');
  console.log("Status:", res4.statusCode);
  console.log("PIX Items:", res4.body.map(r => `${r.descricao} - R$ ${r.valor}`));

  // 5. GET /planocontas
  console.log("\n5. Testing GET /api/v1/planocontas...");
  const res5 = await getJson('http://localhost:5173/api/v1/planocontas');
  console.log("Status:", res5.statusCode);
  console.log("Plano de Contas:", res5.body);

  // 6. GET /integracoes & POST /integracoes/google
  console.log("\n6. Testing Integrations...");
  const res6a = await getJson('http://localhost:5173/api/v1/integracoes');
  console.log("Integrations:", Object.keys(res6a.body));
  const res6b = await postJson('http://localhost:5173/api/v1/integracoes/google', { trackingId: "UA-998877-1" });
  console.log("Google updated status:", res6b.body.data);

  // 7. GET /analytics/faturamento
  console.log("\n7. Testing Analytics...");
  const res7 = await getJson('http://localhost:5173/api/v1/analytics/faturamento');
  console.log("Analytics Faturamento Total:", res7.body.total);

  if (res3.body.status === 'recebido' && res4.body.some(r => r.id === res2.body.id) && res6b.body.data.connected === true) {
    console.log("\nSUCCESS: All endpoints verified successfully!");
    process.exit(0);
  } else {
    console.error("\nFAILURE: Verification failed!");
    process.exit(1);
  }
}

run().catch(console.error);
