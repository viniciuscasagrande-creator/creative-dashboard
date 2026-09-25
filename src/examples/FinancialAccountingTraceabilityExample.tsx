import FinancialAccountingTraceability from "./components/contabilidade/FinancialAccountingTraceability";

export default function FinancialAccountingTraceabilityExample() {
  const now = new Date().toISOString();

  return (
    <main className="min-h-screen bg-slate-900 p-4 md:p-6">
      <FinancialAccountingTraceability
        data={{
          orderId: "#123456",
          createdAt: now,
          eventName: "Festival Exemplo",
          producerName: "Produtor Exemplo",
          customerName: "Cliente Exemplo",
          paymentMethod: "Cartão de crédito",
          gateway: "Gateway A",
          transactionId: "TRX-928183",
          financialStatus: "Pago",
          reconciliationStatus: "Conciliado",
          accountingStatus: "Postado",
          composition: {
            ticketFaceValue: 150,
            convenienceFee: 15,
            discounts: 0,
            additions: 0,
            totalPaid: 165,
            gatewayFee: 4.95,
            acquiringFee: 0,
            antifraudFee: 0,
            anticipationFee: 0,
            diskRevenue: 10.05,
            producerAmount: 150,
            taxes: 1.25,
            netAmount: 158.8,
          },
          timeline: [
            { id: "1", label: "Pedido criado", occurredAt: now, status: "CONCLUIDO", source: "PDT", referenceId: "#123456", amount: 165 },
            { id: "2", label: "Pagamento capturado", occurredAt: now, status: "CONCLUIDO", source: "Gateway A", referenceId: "TRX-928183", amount: 165 },
            { id: "3", label: "Liquidação confirmada", occurredAt: now, status: "CONCLUIDO", source: "Conciliação", amount: 160.05 },
            { id: "4", label: "Split calculado", occurredAt: now, status: "CONCLUIDO", source: "PDT", amount: 160.05 },
            { id: "5", label: "Receita Disk reconhecida", occurredAt: now, status: "CONCLUIDO", source: "Contabilidade", amount: 10.05 },
            { id: "6", label: "Repasse programado", occurredAt: now, status: "PROCESSANDO", source: "Financeiro", amount: 150 },
          ],
          accountingEntries: [
            {
              id: "acc-1",
              occurredAt: now,
              debitAccount: "1.1.02",
              debitAccountName: "Valores a Receber - Gateway",
              creditAccount: "2.1.03",
              creditAccountName: "Valores de Terceiros - Produtores",
              history: "Reconhecimento do valor pertencente ao produtor",
              documentReference: "#123456",
              costCenter: "Eventos",
              eventName: "Festival Exemplo",
              producerName: "Produtor Exemplo",
              amount: 150,
              status: "POSTADO",
            },
            {
              id: "acc-2",
              occurredAt: now,
              debitAccount: "1.1.02",
              debitAccountName: "Valores a Receber - Gateway",
              creditAccount: "3.1.01",
              creditAccountName: "Receita de Taxa de Conveniência",
              history: "Reconhecimento da receita DiskIngressos",
              documentReference: "#123456",
              costCenter: "Plataforma",
              eventName: "Festival Exemplo",
              producerName: "Produtor Exemplo",
              amount: 10.05,
              status: "POSTADO",
            },
          ],
        }}
      />
    </main>
  );
}
