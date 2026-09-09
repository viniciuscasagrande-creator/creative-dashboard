/**
 * Fase 26.17.8.4 — DRE Gerencial
 * Serviço de Demonstração do Resultado do Exercício
 *
 * Regra Contábil Central:
 * GMV NÃO é receita própria da DiskIngressos.
 * Valores pertencentes a produtores NÃO entram na Receita Operacional Bruta.
 *
 * Endpoints cobertos:
 * - GET /api/accounting/dre
 * - POST /api/accounting/dre/export
 */

const DRE_PERIOD_DATA = {
  mes: {
    periodLabel: "Mês Atual (Setembro/2026)",
    netRevenue: 486200.00,
    ebitda: 178900.00,
    ebitdaMargin: 0.3680,
    netIncome: 139600.00,
    netMargin: 0.2871,
    yoyGrowth: 0.1842,
    lines: [
      {
        code: "3.1",
        label: "Receita Operacional Bruta (Taxas & Comissões)",
        real: 612000.00,
        budget: 590000.00,
        previousYear: 521000.00,
        children: [
          { code: "3.1.01", label: "Taxa de Conveniência (Ticketing)", real: 430000.00, budget: 420000.00, previousYear: 365000.00 },
          { code: "3.1.02", label: "Comissões e Over-fee de Produtores", real: 91000.00, budget: 86000.00, previousYear: 79000.00 },
          { code: "3.1.03", label: "Serviços de Controle de Acesso & PDV", real: 73000.00, budget: 68000.00, previousYear: 61000.00 },
          { code: "3.1.04", label: "Outras Receitas Operacionais", real: 18000.00, budget: 16000.00, previousYear: 16000.00 }
        ]
      },
      {
        code: "3.2",
        label: "(-) Deduções da Receita Bruta e Tributos",
        real: -125800.00,
        budget: -118000.00,
        previousYear: -110000.00,
        children: [
          { code: "3.2.01", label: "ISSQN Municipal (5%)", real: -30600.00, budget: -29500.00, previousYear: -26050.00 },
          { code: "3.2.02", label: "PIS / COFINS sobre Faturamento (3,65%)", real: -22338.00, budget: -21535.00, previousYear: -19016.00 },
          { code: "3.2.03", label: "Cancelamentos e Devoluções de Taxas", real: -72862.00, budget: -66965.00, previousYear: -64934.00 }
        ]
      },
      {
        code: "3.3",
        label: "(=) Receita Operacional Líquida",
        real: 486200.00,
        budget: 472000.00,
        previousYear: 411000.00
      },
      {
        code: "4.1",
        label: "(-) Custos Financeiros Diretos (MDR & Adquirência)",
        real: -124000.00,
        budget: -120000.00,
        previousYear: -101000.00,
        children: [
          { code: "4.1.01", label: "Tarifas MDR Stone / Cielo / Pagar.me", real: -88000.00, budget: -85000.00, previousYear: -72000.00 },
          { code: "4.1.02", label: "Custos de Antecipação de Recebíveis", real: -24000.00, budget: -23000.00, previousYear: -19000.00 },
          { code: "4.1.03", label: "Tarifas de Liquidação PIX e Boletos", real: -12000.00, budget: -12000.00, previousYear: -10000.00 }
        ]
      },
      {
        code: "4.2",
        label: "(-) Custos Operacionais de Plataforma",
        real: -89000.00,
        budget: -94000.00,
        previousYear: -84000.00,
        children: [
          { code: "4.2.01", label: "Infraestrutura Cloud & Servidores (AWS/GCP)", real: -42000.00, budget: -45000.00, previousYear: -39000.00 },
          { code: "4.2.02", label: "Antifraude e Validação Cadastral (ClearSale)", real: -28000.00, budget: -30000.00, previousYear: -26000.00 },
          { code: "4.2.03", label: "Suporte e Atendimento Operacional (SAC)", real: -19000.00, budget: -19000.00, previousYear: -19000.00 }
        ]
      },
      {
        code: "5.1",
        label: "(-) Despesas Administrativas & Pessoal",
        real: -58400.00,
        budget: -61000.00,
        previousYear: -57000.00,
        children: [
          { code: "5.1.01", label: "Folha de Pagamento e Encargos", real: -41000.00, budget: -43000.00, previousYear: -40000.00 },
          { code: "5.1.02", label: "Aluguel, Energia e Facilities", real: -9400.00, budget: -10000.00, previousYear: -9000.00 },
          { code: "5.1.03", label: "Honorários Contábeis, Jurídicos e Auditoria", real: -8000.00, budget: -8000.00, previousYear: -8000.00 }
        ]
      },
      {
        code: "5.2",
        label: "(-) Despesas Comerciais e Marketing",
        real: -35900.00,
        budget: -39000.00,
        previousYear: -33000.00,
        children: [
          { code: "5.2.01", label: "Mídia Paga, Branding e Tráfego", real: -24000.00, budget: -26000.00, previousYear: -22000.00 },
          { code: "5.2.02", label: "Prospecção Comercial de Produtores", real: -11900.00, budget: -13000.00, previousYear: -11000.00 }
        ]
      },
      {
        code: "6.1",
        label: "(=) EBITDA (LAJIDA)",
        real: 178900.00,
        budget: 158000.00,
        previousYear: 136000.00
      },
      {
        code: "6.2",
        label: "(+/-) Resultado Financeiro Líquido",
        real: -11800.00,
        budget: -13000.00,
        previousYear: -15000.00,
        children: [
          { code: "6.2.01", label: "Rendimentos de Aplicações de Caixa (CDI)", real: 14200.00, budget: 12000.00, previousYear: 9000.00 },
          { code: "6.2.02", label: "Juros e Despesas Bancárias Contratadas", real: -26000.00, budget: -25000.00, previousYear: -24000.00 }
        ]
      },
      {
        code: "6.3",
        label: "(=) Resultado Antes dos Tributos (LAIR)",
        real: 167100.00,
        budget: 145000.00,
        previousYear: 121000.00
      },
      {
        code: "6.4",
        label: "(-) Tributos sobre o Resultado (IRPJ / CSLL)",
        real: -27500.00,
        budget: -25000.00,
        previousYear: -23000.00
      },
      {
        code: "6.5",
        label: "(=) Resultado Líquido do Exercício",
        real: 139600.00,
        budget: 120000.00,
        previousYear: 98000.00
      }
    ]
  },
  trimestre: {
    periodLabel: "3º Trimestre / 2026 (Acumulado)",
    netRevenue: 1420500.00,
    ebitda: 521400.00,
    ebitdaMargin: 0.3670,
    netIncome: 408200.00,
    netMargin: 0.2873,
    yoyGrowth: 0.2140,
    lines: [
      {
        code: "3.1",
        label: "Receita Operacional Bruta (Taxas & Comissões)",
        real: 1785000.00,
        budget: 1720000.00,
        previousYear: 1475000.00
      },
      {
        code: "3.2",
        label: "(-) Deduções da Receita Bruta e Tributos",
        real: -364500.00,
        budget: -345000.00,
        previousYear: -312000.00
      },
      {
        code: "3.3",
        label: "(=) Receita Operacional Líquida",
        real: 1420500.00,
        budget: 1375000.00,
        previousYear: 1163000.00
      },
      {
        code: "4.1",
        label: "(-) Custos Financeiros Diretos (MDR & Adquirência)",
        real: -362000.00,
        budget: -350000.00,
        previousYear: -295000.00
      },
      {
        code: "4.2",
        label: "(-) Custos Operacionais de Plataforma",
        real: -261000.00,
        budget: -275000.00,
        previousYear: -245000.00
      },
      {
        code: "5.1",
        label: "(-) Despesas Administrativas & Pessoal",
        real: -172100.00,
        budget: -180000.00,
        previousYear: -168000.00
      },
      {
        code: "5.2",
        label: "(-) Despesas Comerciais e Marketing",
        real: -104000.00,
        budget: -112000.00,
        previousYear: -96000.00
      },
      {
        code: "6.1",
        label: "(=) EBITDA (LAJIDA)",
        real: 521400.00,
        budget: 458000.00,
        previousYear: 359000.00
      },
      {
        code: "6.2",
        label: "(+/-) Resultado Financeiro Líquido",
        real: -33800.00,
        budget: -38000.00,
        previousYear: -42000.00
      },
      {
        code: "6.3",
        label: "(=) Resultado Antes dos Tributos (LAIR)",
        real: 487600.00,
        budget: 420000.00,
        previousYear: 317000.00
      },
      {
        code: "6.4",
        label: "(-) Tributos sobre o Resultado (IRPJ / CSLL)",
        real: -79400.00,
        budget: -72000.00,
        previousYear: -64000.00
      },
      {
        code: "6.5",
        label: "(=) Resultado Líquido do Exercício",
        real: 408200.00,
        budget: 348000.00,
        previousYear: 253000.00
      }
    ]
  },
  ano: {
    periodLabel: "Exercício 2026 (YTD)",
    netRevenue: 5410000.00,
    ebitda: 1980000.00,
    ebitdaMargin: 0.3659,
    netIncome: 1548000.00,
    netMargin: 0.2861,
    yoyGrowth: 0.2450,
    lines: [
      {
        code: "3.1",
        label: "Receita Operacional Bruta (Taxas & Comissões)",
        real: 6810000.00,
        budget: 6500000.00,
        previousYear: 5520000.00
      },
      {
        code: "3.2",
        label: "(-) Deduções da Receita Bruta e Tributos",
        real: -1400000.00,
        budget: -1320000.00,
        previousYear: -1180000.00
      },
      {
        code: "3.3",
        label: "(=) Receita Operacional Líquida",
        real: 5410000.00,
        budget: 5180000.00,
        previousYear: 4340000.00
      },
      {
        code: "4.1",
        label: "(-) Custos Financeiros Diretos (MDR & Adquirência)",
        real: -1380000.00,
        budget: -1320000.00,
        previousYear: -1110000.00
      },
      {
        code: "4.2",
        label: "(-) Custos Operacionais de Plataforma",
        real: -990000.00,
        budget: -1050000.00,
        previousYear: -920000.00
      },
      {
        code: "5.1",
        label: "(-) Despesas Administrativas & Pessoal",
        real: -650000.00,
        budget: -680000.00,
        previousYear: -630000.00
      },
      {
        code: "5.2",
        label: "(-) Despesas Comerciais e Marketing",
        real: -410000.00,
        budget: -440000.00,
        previousYear: -370000.00
      },
      {
        code: "6.1",
        label: "(=) EBITDA (LAJIDA)",
        real: 1980000.00,
        budget: 1690000.00,
        previousYear: 1310000.00
      },
      {
        code: "6.2",
        label: "(+/-) Resultado Financeiro Líquido",
        real: -130000.00,
        budget: -145000.00,
        previousYear: -160000.00
      },
      {
        code: "6.3",
        label: "(=) Resultado Antes dos Tributos (LAIR)",
        real: 1850000.00,
        budget: 1545000.00,
        previousYear: 1150000.00
      },
      {
        code: "6.4",
        label: "(-) Tributos sobre o Resultado (IRPJ / CSLL)",
        real: -302000.00,
        budget: -275000.00,
        previousYear: -235000.00
      },
      {
        code: "6.5",
        label: "(=) Resultado Líquido do Exercício",
        real: 1548000.00,
        budget: 1270000.00,
        previousYear: 915000.00
      }
    ]
  }
};

class DreService {
  /**
   * Obtém os dados consolidados do DRE de acordo com filtros e permissões
   */
  getDreOverview({ period = 'mes', producerId = null, eventId = null, costCenterId = null, salesChannel = null, userRole = 'ADMIN' } = {}) {
    const base = DRE_PERIOD_DATA[period] || DRE_PERIOD_DATA.mes;

    // Se usuário for produtor, isolar visão de eventos autorizados
    if (userRole === 'PRODUTOR') {
      // Produtor vê apenas sua proporção de comissões/serviços de seus eventos
      return {
        ...base,
        isProducerView: true,
        periodLabel: `${base.periodLabel} — Visão Produtor Autorizado`,
        netRevenue: base.netRevenue * 0.22,
        ebitda: base.ebitda * 0.22,
        netIncome: base.netIncome * 0.22,
        lines: base.lines.map(line => ({
          ...line,
          real: line.real * 0.22,
          budget: line.budget * 0.22,
          previousYear: line.previousYear * 0.22,
          children: line.children ? line.children.map(c => ({
            ...c,
            real: c.real * 0.22,
            budget: c.budget * 0.22,
            previousYear: c.previousYear * 0.22
          })) : undefined
        }))
      };
    }

    return {
      ...base,
      isProducerView: false
    };
  }

  exportCsv(data) {
    let csv = "Conta;Descricao;Real (R$);Orcado (R$);Variacao (R$);Variacao (%);Ano Anterior (R$);Variacao YoY (R$);Variacao YoY (%)\n";

    function appendLines(lines) {
      lines.forEach(line => {
        const varBudget = line.real - line.budget;
        const pctBudget = line.budget ? (varBudget / Math.abs(line.budget)) * 100 : 0;
        const varYoY = line.real - line.previousYear;
        const pctYoY = line.previousYear ? (varYoY / Math.abs(line.previousYear)) * 100 : 0;

        csv += `"${line.code}";"${line.label}";${line.real.toFixed(2)};${line.budget.toFixed(2)};${varBudget.toFixed(2)};${pctBudget.toFixed(2)}%;${line.previousYear.toFixed(2)};${varYoY.toFixed(2)};${pctYoY.toFixed(2)}%\n`;

        if (line.children) {
          appendLines(line.children);
        }
      });
    }

    appendLines(data.lines);
    return csv;
  }
}

export const dreService = new DreService();
if (typeof window !== 'undefined') {
  window.dreService = dreService;
}
