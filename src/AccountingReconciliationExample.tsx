import ReconciliationCenter from "./components/contabilidade/ReconciliationCenter";

export default function AccountingReconciliationExample() {
  return (
    <main className="min-h-screen bg-slate-900 p-4 md:p-6">
      <ReconciliationCenter
        overview={{
          reconciliationRate: 98.73,
          totalProcessed: 1842500,
          totalReconciled: 1779200,
          totalPending: 29100,
          totalDivergent: 34200,
          divergentAmount: 34210,
          chargebacks: 7,
          refunds: 18,
          duplicates: 4,
          notFound: 9,
          gatewayFeeDifferences: 12,
          payoutDifferences: 6,
        }}
        items={[
          {
            id: "rec-001",
            orderId: "#123456",
            eventName: "Festival Exemplo",
            producerName: "Produtor Exemplo",
            gateway: "Gateway A",
            transactionId: "TRX-928183",
            expectedAmount: 165,
            settledAmount: 160.05,
            differenceAmount: 4.95,
            status: "DIVERGENTE",
            divergenceType: "TAXA_GATEWAY",
            occurredAt: new Date().toISOString(),
          }
        ]}
      />
    </main>
  );
}
