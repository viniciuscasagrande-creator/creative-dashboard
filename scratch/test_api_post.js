const http = require('http');

function postJson(url, data) {
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
        resolve({
          statusCode: res.statusCode,
          body: JSON.parse(responseBody)
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function run() {
  console.log("Seeding new despesa via POST...");
  const postRes = await postJson('http://localhost:5173/api/v1/financeiro/movimentos', {
    descricao: "Contratação Coffee Break",
    tipo: "despesa",
    valor: 450.00,
    categoria: "Alimentação",
    status: "Pendente"
  });
  
  console.log("POST Response Code:", postRes.statusCode);
  console.log("Created Movement:", postRes.body);

  console.log("\nFetching new resumo to verify balance deduction...");
  const summary = await getJson('http://localhost:5173/api/v1/financeiro/resumo');
  console.log("New Summary:", summary);

  if (summary.saldoTotal === 312540.50 - 450.00) {
    console.log("\nSUCCESS: Balance correctly deducted by 450.00!");
    process.exit(0);
  } else {
    console.error("\nFAILURE: Balance did not update correctly!");
    process.exit(1);
  }
}

run().catch(console.error);
