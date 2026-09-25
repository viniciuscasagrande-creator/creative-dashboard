import MonthlyAccountingClosing from "./components/contabilidade/MonthlyAccountingClosing";

export default function MonthlyAccountingClosingExample() {
  return (
    <main className="min-h-screen bg-slate-900 p-4 md:p-6">
      <MonthlyAccountingClosing
        data={{
          period: "08/2026",
          status: "EM_VALIDACAO",
          progress: 78,
          responsible: "Controladoria",
          dueDate: "10/09/2026",
          totalChecks: 24,
          approvedChecks: 18,
          pendingChecks: 6,
          criticalIssues: 2,
          financialDivergence: 34210,
          accountingDivergence: 4950,
          checks: [
            {
              id: "c1",
              category: "Financeiro",
              label: "Conciliação de gateways",
              severity: "BLOQUEANTE",
              status: "DIVERGENTE",
              source: "Centro de Conciliação",
              amount: 34210,
            },
            {
              id: "c2",
              category: "Produtores",
              label: "Valores de terceiros conferidos",
              severity: "BLOQUEANTE",
              status: "APROVADO",
              source: "Posição Financeira",
            },
            {
              id: "c3",
              category: "Contabilidade",
              label: "Lançamentos contábeis processados",
              severity: "CRITICA",
              status: "APROVADO",
              source: "Livro Diário",
            },
            {
              id: "c4",
              category: "Demonstrações",
              label: "Balanço Patrimonial íntegro",
              severity: "BLOQUEANTE",
              status: "APROVADO",
              source: "Balanço Patrimonial",
            },
            {
              id: "c5",
              category: "Demonstrações",
              label: "DRE validada",
              severity: "CRITICA",
              status: "PENDENTE",
              source: "DRE Gerencial",
            },
          ],
        }}
      />
    </main>
  );
}
