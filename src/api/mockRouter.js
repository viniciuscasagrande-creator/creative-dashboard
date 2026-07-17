import fs from 'fs';
import path from 'path';

function getRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

export async function handleApiRequest(req, res, cleanUrl, data, saveData) {
  const method = req.method;
  
  // Helper to extract ID from URL pattern: /api/v1/something/123
  const matchId = (prefix) => {
    const regex = new RegExp(`^/api/v1/${prefix}/(\\w+)$`);
    const match = cleanUrl.match(regex);
    return match ? (isNaN(match[1]) ? match[1] : parseInt(match[1])) : null;
  };

  // Helper to match action URLs: /api/v1/something/123/action
  const matchAction = (prefix, action) => {
    const regex = new RegExp(`^/api/v1/${prefix}/(\\w+)/${action}$`);
    const match = cleanUrl.match(regex);
    return match ? (isNaN(match[1]) ? match[1] : parseInt(match[1])) : null;
  };

  try {
    // 1. RECEBER (Accounts Receivable)
    if (cleanUrl === '/api/v1/receber') {
      if (method === 'GET') {
        res.end(JSON.stringify(data.receber));
        return true;
      }
      if (method === 'POST') {
        const body = await getRequestBody(req);
        const newId = data.receber.length > 0 ? Math.max(...data.receber.map(r => r.id)) + 1 : 1;
        const newRecord = {
          id: newId,
          descricao: body.descricao || 'Nova Receita',
          valor: parseFloat(body.valor) || 0,
          status: body.status || 'pendente',
          data: body.data || new Date().toISOString().split('T')[0],
          metodo: body.metodo || 'boleto'
        };
        data.receber.push(newRecord);
        saveData();
        res.statusCode = 201;
        res.end(JSON.stringify(newRecord));
        return true;
      }
    }
    
    // /receber/boletos, /receber/pix, /receber/cartoes
    if (cleanUrl === '/api/v1/receber/boletos') {
      res.end(JSON.stringify(data.receber.filter(r => r.metodo === 'boleto')));
      return true;
    }
    if (cleanUrl === '/api/v1/receber/pix') {
      res.end(JSON.stringify(data.receber.filter(r => r.metodo === 'pix')));
      return true;
    }
    if (cleanUrl === '/api/v1/receber/cartoes') {
      res.end(JSON.stringify(data.receber.filter(r => r.metodo === 'cartao')));
      return true;
    }

    const receberId = matchId('receber');
    if (receberId !== null) {
      const idx = data.receber.findIndex(r => r.id === receberId);
      if (idx === -1) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Registro não encontrado' }));
        return true;
      }
      if (method === 'GET') {
        res.end(JSON.stringify(data.receber[idx]));
        return true;
      }
      if (method === 'PUT') {
        const body = await getRequestBody(req);
        data.receber[idx] = { ...data.receber[idx], ...body, id: receberId };
        saveData();
        res.end(JSON.stringify(data.receber[idx]));
        return true;
      }
      if (method === 'DELETE') {
        const deleted = data.receber.splice(idx, 1);
        saveData();
        res.end(JSON.stringify({ success: true, deleted }));
        return true;
      }
    }

    // Actions under receber
    const recReceberId = matchAction('receber', 'receber') || matchAction('receber', 'baixar');
    if (recReceberId !== null) {
      const idx = data.receber.findIndex(r => r.id === recReceberId);
      if (idx !== -1) {
        data.receber[idx].status = 'recebido';
        saveData();
        res.end(JSON.stringify(data.receber[idx]));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Registro não encontrado' }));
      }
      return true;
    }

    const recCancelarId = matchAction('receber', 'cancelar');
    if (recCancelarId !== null) {
      const idx = data.receber.findIndex(r => r.id === recCancelarId);
      if (idx !== -1) {
        data.receber[idx].status = 'cancelado';
        saveData();
        res.end(JSON.stringify(data.receber[idx]));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Registro não encontrado' }));
      }
      return true;
    }

    const recEstornarId = matchAction('receber', 'estornar');
    if (recEstornarId !== null) {
      const idx = data.receber.findIndex(r => r.id === recEstornarId);
      if (idx !== -1) {
        data.receber[idx].status = 'estornado';
        saveData();
        res.end(JSON.stringify(data.receber[idx]));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Registro não encontrado' }));
      }
      return true;
    }

    // 2. PAGAR (Accounts Payable)
    if (cleanUrl === '/api/v1/pagar') {
      if (method === 'GET') {
        res.end(JSON.stringify(data.pagar));
        return true;
      }
      if (method === 'POST') {
        const body = await getRequestBody(req);
        const newId = data.pagar.length > 0 ? Math.max(...data.pagar.map(p => p.id)) + 1 : 1;
        const newRecord = {
          id: newId,
          descricao: body.descricao || 'Nova Despesa',
          valor: parseFloat(body.valor) || 0,
          status: body.status || 'pendente',
          dataVencimento: body.dataVencimento || new Date().toISOString().split('T')[0]
        };
        data.pagar.push(newRecord);
        saveData();
        res.statusCode = 201;
        res.end(JSON.stringify(newRecord));
        return true;
      }
    }

    const pagarId = matchId('pagar');
    if (pagarId !== null) {
      const idx = data.pagar.findIndex(p => p.id === pagarId);
      if (idx === -1) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Despesa não encontrada' }));
        return true;
      }
      if (method === 'GET') {
        res.end(JSON.stringify(data.pagar[idx]));
        return true;
      }
      if (method === 'PUT') {
        const body = await getRequestBody(req);
        data.pagar[idx] = { ...data.pagar[idx], ...body, id: pagarId };
        saveData();
        res.end(JSON.stringify(data.pagar[idx]));
        return true;
      }
      if (method === 'DELETE') {
        const deleted = data.pagar.splice(idx, 1);
        saveData();
        res.end(JSON.stringify({ success: true, deleted }));
        return true;
      }
    }

    // Actions under pagar
    const pagBaixarId = matchAction('pagar', 'baixar');
    if (pagBaixarId !== null) {
      const idx = data.pagar.findIndex(p => p.id === pagBaixarId);
      if (idx !== -1) {
        data.pagar[idx].status = 'pago';
        saveData();
        res.end(JSON.stringify(data.pagar[idx]));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Registro não encontrado' }));
      }
      return true;
    }

    const pagCancelarId = matchAction('pagar', 'cancelar');
    if (pagCancelarId !== null) {
      const idx = data.pagar.findIndex(p => p.id === pagCancelarId);
      if (idx !== -1) {
        data.pagar[idx].status = 'cancelado';
        saveData();
        res.end(JSON.stringify(data.pagar[idx]));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Registro não encontrado' }));
      }
      return true;
    }

    const pagEstornarId = matchAction('pagar', 'estornar');
    if (pagEstornarId !== null) {
      const idx = data.pagar.findIndex(p => p.id === pagEstornarId);
      if (idx !== -1) {
        data.pagar[idx].status = 'estornado';
        saveData();
        res.end(JSON.stringify(data.pagar[idx]));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Registro não encontrado' }));
      }
      return true;
    }

    // 3. FLUXO DE CAIXA
    if (cleanUrl === '/api/v1/fluxocaixa') {
      res.end(JSON.stringify({
        resumo: data['fluxo-caixa'].resumo,
        diario: data.fluxocaixa.diario,
        mensal: data.fluxocaixa.mensal,
        projecao: data.fluxocaixa.projecao
      }));
      return true;
    }
    if (cleanUrl === '/api/v1/fluxocaixa/diario') {
      res.end(JSON.stringify(data.fluxocaixa.diario));
      return true;
    }
    if (cleanUrl === '/api/v1/fluxocaixa/mensal') {
      res.end(JSON.stringify(data.fluxocaixa.mensal));
      return true;
    }
    if (cleanUrl === '/api/v1/fluxocaixa/projecao') {
      res.end(JSON.stringify(data.fluxocaixa.projecao));
      return true;
    }
    if (cleanUrl === '/api/v1/fluxocaixa/lancamento') {
      if (method === 'POST') {
        const body = await getRequestBody(req);
        const newId = Date.now();
        const newEntry = { id: newId, ...body };
        data.fluxocaixa.lancamentos.push(newEntry);
        saveData();
        res.statusCode = 201;
        res.end(JSON.stringify(newEntry));
        return true;
      }
    }

    // 4. BANCOS
    if (cleanUrl === '/api/v1/bancos') {
      if (method === 'GET') {
        res.end(JSON.stringify(data.bancos.list));
        return true;
      }
      if (method === 'POST') {
        const body = await getRequestBody(req);
        const newId = data.bancos.list.length > 0 ? Math.max(...data.bancos.list.map(b => b.id)) + 1 : 1;
        const newBank = { id: newId, nome: body.nome || 'Novo Banco', agencia: body.agencia || '0000', conta: body.conta || '00000-0', saldo: parseFloat(body.saldo) || 0 };
        data.bancos.list.push(newBank);
        saveData();
        res.statusCode = 201;
        res.end(JSON.stringify(newBank));
        return true;
      }
    }

    const bancoId = matchId('bancos');
    if (bancoId !== null) {
      const idx = data.bancos.list.findIndex(b => b.id === bancoId);
      if (idx === -1) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Banco não encontrado' }));
        return true;
      }
      if (method === 'GET') {
        res.end(JSON.stringify(data.bancos.list[idx]));
        return true;
      }
      if (method === 'PUT') {
        const body = await getRequestBody(req);
        data.bancos.list[idx] = { ...data.bancos.list[idx], ...body, id: bancoId };
        saveData();
        res.end(JSON.stringify(data.bancos.list[idx]));
        return true;
      }
    }

    if (cleanUrl === '/api/v1/bancos/extrato') {
      res.end(JSON.stringify(data.bancos.extrato));
      return true;
    }
    if (cleanUrl === '/api/v1/bancos/conciliar') {
      if (method === 'POST') {
        const body = await getRequestBody(req);
        const newId = Date.now();
        const cnc = { id: newId, ...body, status: 'conciliado' };
        data.bancos.conciliacoes.push(cnc);
        saveData();
        res.statusCode = 201;
        res.end(JSON.stringify(cnc));
        return true;
      }
    }
    if (cleanUrl === '/api/v1/bancos/importar/ofx' || cleanUrl === '/api/v1/bancos/importar/cnab') {
      if (method === 'POST') {
        res.statusCode = 201;
        res.end(JSON.stringify({ success: true, message: 'Arquivo bancário importado e processado com sucesso!', importCount: 12 }));
        return true;
      }
    }

    // 5. PIX
    if (cleanUrl === '/api/v1/pix') {
      res.end(JSON.stringify({ status: 'PIX gateway operando normalmente', chaves: data.pix.chaves }));
      return true;
    }
    if (cleanUrl === '/api/v1/pix/cobrar') {
      if (method === 'POST') {
        const body = await getRequestBody(req);
        res.statusCode = 201;
        res.end(JSON.stringify({
          txid: 'pix-' + Date.now(),
          pixCopiarColar: '00020126580014br.gov.bcb.pix0136financeiro@diskingressos.com.br5204000053039865405' + (body.valor || 0),
          qrcodeMockUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=mock-pix-payment',
          valor: body.valor || 0
        }));
        return true;
      }
    }
    if (cleanUrl === '/api/v1/pix/devolver') {
      if (method === 'POST') {
        res.end(JSON.stringify({ success: true, status: 'Devolvido', valorDevolvido: 10.00 }));
        return true;
      }
    }
    if (cleanUrl === '/api/v1/pix/chaves') {
      if (method === 'GET') {
        res.end(JSON.stringify(data.pix.chaves));
        return true;
      }
      if (method === 'POST') {
        const body = await getRequestBody(req);
        const newId = Date.now();
        const newKey = { id: newId, chave: body.chave, tipo: body.tipo || 'aleatoria', status: 'ativo' };
        data.pix.chaves.push(newKey);
        saveData();
        res.statusCode = 201;
        res.end(JSON.stringify(newKey));
        return true;
      }
    }

    // 6. CARTOES
    if (cleanUrl === '/api/v1/cartoes') {
      if (method === 'GET') {
        res.end(JSON.stringify({ status: 'Gateway de cartão ativo', bandeirasAceitas: ['visa', 'mastercard', 'elo', 'amex'] }));
        return true;
      }
      if (method === 'POST') {
        res.statusCode = 201;
        res.end(JSON.stringify({ success: true, message: 'Configuração do gateway atualizada!' }));
        return true;
      }
    }
    if (cleanUrl === '/api/v1/cartoes/transacoes') {
      res.end(JSON.stringify(data.cartoes.transacoes));
      return true;
    }
    if (cleanUrl === '/api/v1/cartoes/parcelamentos') {
      res.end(JSON.stringify(data.cartoes.parcelamentos));
      return true;
    }

    // 7. CLIENTES
    if (cleanUrl === '/api/v1/clientes') {
      if (method === 'GET') {
        res.end(JSON.stringify(data.clientes));
        return true;
      }
      if (method === 'POST') {
        const body = await getRequestBody(req);
        const newId = data.clientes.length > 0 ? Math.max(...data.clientes.map(c => c.id)) + 1 : 1;
        const newClient = { id: newId, nome: body.nome || 'Novo Cliente', email: body.email || '', telefone: body.telefone || '', status: 'ativo' };
        data.clientes.push(newClient);
        saveData();
        res.statusCode = 201;
        res.end(JSON.stringify(newClient));
        return true;
      }
    }
    const clienteId = matchId('clientes');
    if (clienteId !== null) {
      const idx = data.clientes.findIndex(c => c.id === clienteId);
      if (idx === -1) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Cliente não encontrado' }));
        return true;
      }
      if (method === 'GET') {
        res.end(JSON.stringify(data.clientes[idx]));
        return true;
      }
      if (method === 'PUT') {
        const body = await getRequestBody(req);
        data.clientes[idx] = { ...data.clientes[idx], ...body, id: clienteId };
        saveData();
        res.end(JSON.stringify(data.clientes[idx]));
        return true;
      }
    }
    if (cleanUrl === '/api/v1/clientes/extrato' || cleanUrl === '/api/v1/clientes/financeiro') {
      res.end(JSON.stringify([
        { id: 1, descricao: "Compra Pedido #9928", valor: 150.00, data: "2026-07-16" }
      ]));
      return true;
    }

    // 8. FORNECEDORES
    if (cleanUrl === '/api/v1/fornecedores') {
      if (method === 'GET') {
        res.end(JSON.stringify(data.fornecedores));
        return true;
      }
      if (method === 'POST') {
        const body = await getRequestBody(req);
        const newId = data.fornecedores.length > 0 ? Math.max(...data.fornecedores.map(f => f.id)) + 1 : 1;
        const newSupplier = { id: newId, nome: body.nome || 'Novo Fornecedor', cnpj: body.cnpj || '', status: 'ativo' };
        data.fornecedores.push(newSupplier);
        saveData();
        res.statusCode = 201;
        res.end(JSON.stringify(newSupplier));
        return true;
      }
    }
    const fornecedorId = matchId('fornecedores');
    if (fornecedorId !== null) {
      const idx = data.fornecedores.findIndex(f => f.id === fornecedorId);
      if (idx === -1) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Fornecedor não encontrado' }));
        return true;
      }
      if (method === 'GET') {
        res.end(JSON.stringify(data.fornecedores[idx]));
        return true;
      }
      if (method === 'PUT') {
        const body = await getRequestBody(req);
        data.fornecedores[idx] = { ...data.fornecedores[idx], ...body, id: fornecedorId };
        saveData();
        res.end(JSON.stringify(data.fornecedores[idx]));
        return true;
      }
    }
    if (cleanUrl === '/api/v1/fornecedores/extrato') {
      res.end(JSON.stringify([
        { id: 1, descricao: "Pagamento Nota Fiscal #100", valor: 4500.00, data: "2026-07-16" }
      ]));
      return true;
    }

    // 9. EVENTOS
    if (cleanUrl === '/api/v1/eventos') {
      res.end(JSON.stringify(data.eventos));
      return true;
    }
    const eventoId = matchId('eventos');
    if (eventoId !== null) {
      const ev = data.eventos.find(e => e.id === eventoId);
      if (ev) {
        res.end(JSON.stringify(ev));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Evento não encontrado' }));
      }
      return true;
    }
    
    // Actions on Event
    const evFinId = matchAction('eventos', 'financeiro');
    if (evFinId !== null) {
      res.end(JSON.stringify({ eventoId: evFinId, receitaTotal: 71976.20, despesasTotais: 12500.00 }));
      return true;
    }
    const evVendId = matchAction('eventos', 'vendas');
    if (evVendId !== null) {
      res.end(JSON.stringify({ eventoId: evVendId, ingressosVendidos: 450, ritmoVendas: 'Estável' }));
      return true;
    }
    const evRepId = matchAction('eventos', 'repasses');
    if (evRepId !== null) {
      res.end(JSON.stringify(data.repasses.filter(r => r.eventoId === evRepId)));
      return true;
    }

    // 10. REPASSES
    if (cleanUrl === '/api/v1/repasses') {
      if (method === 'GET') {
        res.end(JSON.stringify(data.repasses));
        return true;
      }
      if (method === 'POST') {
        const body = await getRequestBody(req);
        const newId = data.repasses.length > 0 ? Math.max(...data.repasses.map(r => r.id)) + 1 : 1;
        const newRepasse = { id: newId, eventoId: body.eventoId || 719, valor: parseFloat(body.valor) || 0, status: 'Pendente', dataSolicitacao: new Date().toISOString().split('T')[0] };
        data.repasses.push(newRepasse);
        saveData();
        res.statusCode = 201;
        res.end(JSON.stringify(newRepasse));
        return true;
      }
    }
    const repApproveId = matchAction('repasses', 'aprovar');
    if (repApproveId !== null) {
      const idx = data.repasses.findIndex(r => r.id === repApproveId);
      if (idx !== -1) {
        data.repasses[idx].status = 'Aprovado';
        saveData();
        res.end(JSON.stringify(data.repasses[idx]));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Repasse não encontrado' }));
      }
      return true;
    }
    const repPayId = matchAction('repasses', 'pagar');
    if (repPayId !== null) {
      const idx = data.repasses.findIndex(r => r.id === repPayId);
      if (idx !== -1) {
        data.repasses[idx].status = 'Pago';
        saveData();
        res.end(JSON.stringify(data.repasses[idx]));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Repasse não encontrado' }));
      }
      return true;
    }
    const repCancelId = matchAction('repasses', 'cancelar');
    if (repCancelId !== null) {
      const idx = data.repasses.findIndex(r => r.id === repCancelId);
      if (idx !== -1) {
        data.repasses[idx].status = 'Cancelado';
        saveData();
        res.end(JSON.stringify(data.repasses[idx]));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Repasse não encontrado' }));
      }
      return true;
    }

    // 11. PLANOCONTAS
    if (cleanUrl === '/api/v1/planocontas') {
      if (method === 'GET') {
        res.end(JSON.stringify(data.planocontas));
        return true;
      }
      if (method === 'POST') {
        const body = await getRequestBody(req);
        const newId = data.planocontas.length > 0 ? Math.max(...data.planocontas.map(p => p.id)) + 1 : 1;
        const newPlan = { id: newId, codigo: body.codigo || '1.00', descricao: body.descricao || 'Nova Conta' };
        data.planocontas.push(newPlan);
        saveData();
        res.statusCode = 201;
        res.end(JSON.stringify(newPlan));
        return true;
      }
    }
    const planoId = matchId('planocontas');
    if (planoId !== null) {
      const idx = data.planocontas.findIndex(p => p.id === planoId);
      if (idx === -1) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Conta não encontrada' }));
        return true;
      }
      if (method === 'PUT') {
        const body = await getRequestBody(req);
        data.planocontas[idx] = { ...data.planocontas[idx], ...body, id: planoId };
        saveData();
        res.end(JSON.stringify(data.planocontas[idx]));
        return true;
      }
      if (method === 'DELETE') {
        const deleted = data.planocontas.splice(idx, 1);
        saveData();
        res.end(JSON.stringify({ success: true, deleted }));
        return true;
      }
    }

    // 12. CENTROCUSTOS
    if (cleanUrl === '/api/v1/centrocustos') {
      if (method === 'GET') {
        res.end(JSON.stringify(data.centrocustos));
        return true;
      }
      if (method === 'POST') {
        const body = await getRequestBody(req);
        const newId = data.centrocustos.length > 0 ? Math.max(...data.centrocustos.map(c => c.id)) + 1 : 1;
        const newCenter = { id: newId, nome: body.nome || 'Novo Centro de Custo' };
        data.centrocustos.push(newCenter);
        saveData();
        res.statusCode = 201;
        res.end(JSON.stringify(newCenter));
        return true;
      }
    }
    const centroId = matchId('centrocustos');
    if (centroId !== null) {
      const idx = data.centrocustos.findIndex(c => c.id === centroId);
      if (idx === -1) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Centro de custo não encontrado' }));
        return true;
      }
      if (method === 'PUT') {
        const body = await getRequestBody(req);
        data.centrocustos[idx] = { ...data.centrocustos[idx], ...body, id: centroId };
        saveData();
        res.end(JSON.stringify(data.centrocustos[idx]));
        return true;
      }
    }

    // 13. DRE
    if (cleanUrl === '/api/v1/dre') {
      res.end(JSON.stringify(data.dre));
      return true;
    }
    if (cleanUrl === '/api/v1/dre/mensal') {
      res.end(JSON.stringify(data.dre.mensal));
      return true;
    }
    if (cleanUrl === '/api/v1/dre/anual') {
      res.end(JSON.stringify(data.dre.anual));
      return true;
    }
    if (cleanUrl === '/api/v1/dre/comparativo') {
      res.end(JSON.stringify(data.dre.comparativo));
      return true;
    }

    // 14. CONCILIACAO
    if (cleanUrl === '/api/v1/conciliacao') {
      if (method === 'GET') {
        res.end(JSON.stringify(data.bancos.conciliacoes));
        return true;
      }
      if (method === 'POST') {
        const body = await getRequestBody(req);
        const newId = Date.now();
        const cnc = { id: newId, ...body, status: 'conciliado' };
        data.bancos.conciliacoes.push(cnc);
        saveData();
        res.statusCode = 201;
        res.end(JSON.stringify(cnc));
        return true;
      }
    }
    if (cleanUrl === '/api/v1/conciliacao/automatica') {
      if (method === 'POST') {
        res.statusCode = 201;
        res.end(JSON.stringify({ success: true, automatedCount: 8, message: 'Conciliação automática concluída com sucesso!' }));
        return true;
      }
    }

    // 15. RELATORIOS
    if (cleanUrl === '/api/v1/relatorios') {
      res.end(JSON.stringify(data.relatorios.list));
      return true;
    }
    if (cleanUrl.startsWith('/api/v1/relatorios/')) {
      const parts = cleanUrl.split('/');
      const reportName = parts[parts.length - 1]; // e.g. dre, fluxocaixa, excel, pdf
      if (reportName === 'excel' || reportName === 'pdf') {
        res.end(JSON.stringify({
          downloadUrl: `https://financeiropdtnovo.web.app/reports/mock-download.${reportName}`,
          generatedAt: new Date().toISOString(),
          format: reportName.toUpperCase()
        }));
      } else {
        res.end(JSON.stringify({
          reportType: reportName,
          generatedAt: new Date().toISOString(),
          data: []
        }));
      }
      return true;
    }

    // 16. USUARIOS
    if (cleanUrl === '/api/v1/usuarios') {
      if (method === 'GET') {
        res.end(JSON.stringify(data.usuarios));
        return true;
      }
      if (method === 'POST') {
        const body = await getRequestBody(req);
        const newId = data.usuarios.length > 0 ? Math.max(...data.usuarios.map(u => u.id)) + 1 : 1;
        const newUser = { id: newId, nome: body.nome || 'Novo Usuário', email: body.email || '', cargo: body.cargo || 'Operador' };
        data.usuarios.push(newUser);
        saveData();
        res.statusCode = 201;
        res.end(JSON.stringify(newUser));
        return true;
      }
    }
    const usuarioId = matchId('usuarios');
    if (usuarioId !== null) {
      const idx = data.usuarios.findIndex(u => u.id === usuarioId);
      if (idx === -1) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Usuário não encontrado' }));
        return true;
      }
      if (method === 'PUT') {
        const body = await getRequestBody(req);
        data.usuarios[idx] = { ...data.usuarios[idx], ...body, id: usuarioId };
        saveData();
        res.end(JSON.stringify(data.usuarios[idx]));
        return true;
      }
      if (method === 'DELETE') {
        const deleted = data.usuarios.splice(idx, 1);
        saveData();
        res.end(JSON.stringify({ success: true, deleted }));
        return true;
      }
    }

    // 17. LOGS
    if (cleanUrl === '/api/v1/logs') {
      res.end(JSON.stringify(data.logs));
      return true;
    }
    if (cleanUrl === '/api/v1/logs/auditoria') {
      res.end(JSON.stringify(data.logs.auditoria));
      return true;
    }
    if (cleanUrl === '/api/v1/logs/login') {
      res.end(JSON.stringify(data.logs.login));
      return true;
    }

    // 18. CONFIG
    if (cleanUrl === '/api/v1/config') {
      if (method === 'GET') {
        res.end(JSON.stringify(data.config));
        return true;
      }
      if (method === 'PUT') {
        const body = await getRequestBody(req);
        data.config = { ...data.config, ...body };
        saveData();
        res.end(JSON.stringify(data.config));
        return true;
      }
    }
    if (cleanUrl === '/api/v1/config/email') {
      res.end(JSON.stringify(data.config.email));
      return true;
    }
    if (cleanUrl === '/api/v1/config/pix') {
      res.end(JSON.stringify(data.config.pix));
      return true;
    }
    if (cleanUrl === '/api/v1/config/bancos') {
      res.end(JSON.stringify(data.config.bancos));
      return true;
    }
    if (cleanUrl === '/api/v1/config/firebase') {
      res.end(JSON.stringify(data.config.firebase));
      return true;
    }

    // 19. UPLOADS
    if (cleanUrl === '/api/v1/upload') {
      if (method === 'POST') {
        const newId = 'upload-' + Date.now();
        const mockFile = {
          id: newId,
          nome: 'arquivo_enviado.pdf',
          url: `https://financeiropdtnovo.web.app/uploads/${newId}.pdf`,
          tamanho: '1.2 MB'
        };
        data.uploads = data.uploads || [];
        data.uploads.push(mockFile);
        saveData();
        res.statusCode = 201;
        res.end(JSON.stringify(mockFile));
        return true;
      }
    }
    const uploadId = matchId('upload');
    if (uploadId !== null) {
      data.uploads = data.uploads || [];
      const idx = data.uploads.findIndex(u => u.id === uploadId);
      if (method === 'GET') {
        if (idx !== -1) {
          res.end(JSON.stringify(data.uploads[idx]));
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Arquivo não encontrado' }));
        }
        return true;
      }
      if (method === 'DELETE') {
        if (idx !== -1) {
          data.uploads.splice(idx, 1);
          saveData();
          res.end(JSON.stringify({ success: true, message: 'Arquivo deletado' }));
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Arquivo não encontrado' }));
        }
        return true;
      }
    }

    // 20. INTEGRACOES
    if (cleanUrl === '/api/v1/integracoes') {
      res.end(JSON.stringify(data.integracoes));
      return true;
    }
    if (cleanUrl.startsWith('/api/v1/integracoes/')) {
      const parts = cleanUrl.split('/');
      const key = parts[parts.length - 1]; // meta, google, asaas, mercadopago, pagarme, stone, cielo
      if (data.integracoes && data.integracoes[key] !== undefined) {
        if (method === 'POST') {
          const body = await getRequestBody(req);
          data.integracoes[key] = {
            ...data.integracoes[key],
            ...body,
            connected: true,
            updatedAt: new Date().toISOString().split('T')[0]
          };
          saveData();
          res.end(JSON.stringify({ success: true, integration: key, data: data.integracoes[key] }));
          return true;
        }
      }
    }

    // 21. ANALYTICS
    if (cleanUrl === '/api/v1/analytics') {
      res.end(JSON.stringify(data.analytics));
      return true;
    }
    if (cleanUrl === '/api/v1/analytics/faturamento') {
      res.end(JSON.stringify(data.analytics.faturamento));
      return true;
    }
    if (cleanUrl === '/api/v1/analytics/receita') {
      res.end(JSON.stringify(data.analytics.receita));
      return true;
    }
    if (cleanUrl === '/api/v1/analytics/despesas') {
      res.end(JSON.stringify(data.analytics.despesas));
      return true;
    }
    if (cleanUrl === '/api/v1/analytics/lucro') {
      res.end(JSON.stringify(data.analytics.lucro));
      return true;
    }
    if (cleanUrl === '/api/v1/analytics/comparativos') {
      res.end(JSON.stringify(data.analytics.comparativos));
      return true;
    }
    if (cleanUrl === '/api/v1/analytics/previsoes') {
      res.end(JSON.stringify(data.analytics.previsoes));
      return true;
    }

    // 22. AUTHENTICATION (From Documentation)
    if (cleanUrl === '/api/v1/auth/login') {
      if (method === 'POST') {
        const body = await getRequestBody(req);
        res.end(JSON.stringify({
          success: true,
          token: "mock-jwt-token-xyz-123456",
          expiresIn: 3600,
          user: {
            uid: "mock-uid-719",
            email: body.email || "vinicius.casagrande@diskingressos.com.br",
            name: "Vinicius Casagrande",
            role: "Administrador Financeiro"
          }
        }));
        return true;
      }
    }
    if (cleanUrl === '/api/v1/auth/logout') {
      if (method === 'POST') {
        res.end(JSON.stringify({ success: true, message: "Logged out successfully" }));
        return true;
      }
    }
    if (cleanUrl === '/api/v1/auth/refresh') {
      if (method === 'POST') {
        res.end(JSON.stringify({
          success: true,
          token: "new-mock-jwt-token-abc-987654",
          expiresIn: 3600
        }));
        return true;
      }
    }
    if (cleanUrl === '/api/v1/auth/register') {
      if (method === 'POST') {
        const body = await getRequestBody(req);
        res.statusCode = 201;
        res.end(JSON.stringify({
          success: true,
          message: "User registered successfully",
          user: {
            uid: "mock-new-uid-" + Date.now(),
            email: body.email,
            name: body.name || "Novo Usuário"
          }
        }));
        return true;
      }
    }
    if (cleanUrl === '/api/v1/auth/reset-password') {
      if (method === 'POST') {
        res.end(JSON.stringify({ success: true, message: "Password reset link sent to your email" }));
        return true;
      }
    }

    // 23. DASHBOARD (From Documentation)
    if (cleanUrl === '/api/v1/dashboard') {
      res.end(JSON.stringify(data.dashboard));
      return true;
    }
    if (cleanUrl === '/api/v1/dashboard/cards') {
      res.end(JSON.stringify(data.cards));
      return true;
    }
    if (cleanUrl === '/api/v1/dashboard/kpis') {
      res.end(JSON.stringify(data.kpis));
      return true;
    }
    if (cleanUrl === '/api/v1/dashboard/graficos') {
      res.end(JSON.stringify(data.graficos));
      return true;
    }
    if (cleanUrl === '/api/v1/dashboard/fluxo-caixa') {
      res.end(JSON.stringify(data['fluxo-caixa']));
      return true;
    }

  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Server error processing mock route', details: error.message }));
    return true;
  }

  return false; // Did not match any mock API routes
}
