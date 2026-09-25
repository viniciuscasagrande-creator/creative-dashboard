import DreManagement from "./components/contabilidade/DreManagement";

export default function DreManagementExample() {
  return (
    <main className="min-h-screen bg-slate-900 p-4 md:p-6">
      <DreManagement
        data={{
          netRevenue: 486200,
          ebitda: 178900,
          ebitdaMargin: 0.3680,
          netIncome: 139600,
          netMargin: 0.2871,
          yoyGrowth: 0.1842,
          lines: [
            {
              code: "3.1",
              label: "Receita Operacional Bruta",
              real: 612000,
              budget: 590000,
              previousYear: 521000,
              children: [
                { code: "3.1.01", label: "Taxa de conveniência", real: 430000, budget: 420000, previousYear: 365000 },
                { code: "3.1.02", label: "Comissões", real: 91000, budget: 86000, previousYear: 79000 },
                { code: "3.1.03", label: "Serviços", real: 73000, budget: 68000, previousYear: 61000 },
                { code: "3.1.04", label: "Outras receitas", real: 18000, budget: 16000, previousYear: 16000 },
              ],
            },
            {
              code: "3.2",
              label: "Deduções e Tributos",
              real: -125800,
              budget: -118000,
              previousYear: -110000,
            },
            {
              code: "3.3",
              label: "Receita Operacional Líquida",
              real: 486200,
              budget: 472000,
              previousYear: 411000,
            },
            {
              code: "4.1",
              label: "Custos Financeiros",
              real: -124000,
              budget: -120000,
              previousYear: -101000,
            },
            {
              code: "4.2",
              label: "Custos Operacionais",
              real: -89000,
              budget: -94000,
              previousYear: -84000,
            },
            {
              code: "5.1",
              label: "Despesas Administrativas",
              real: -58400,
              budget: -61000,
              previousYear: -57000,
            },
            {
              code: "5.2",
              label: "Despesas Comerciais",
              real: -35900,
              budget: -39000,
              previousYear: -33000,
            },
            {
              code: "6.1",
              label: "EBITDA",
              real: 178900,
              budget: 158000,
              previousYear: 136000,
            },
            {
              code: "6.2",
              label: "Resultado Financeiro",
              real: -11800,
              budget: -13000,
              previousYear: -15000,
            },
            {
              code: "6.3",
              label: "Resultado Antes dos Tributos",
              real: 167100,
              budget: 145000,
              previousYear: 121000,
            },
            {
              code: "6.4",
              label: "Tributos sobre Resultado",
              real: -27500,
              budget: -25000,
              previousYear: -23000,
            },
            {
              code: "6.5",
              label: "Resultado Líquido",
              real: 139600,
              budget: 120000,
              previousYear: 98000,
            },
          ],
        }}
      />
    </main>
  );
}
