import React, { useState } from "react";
import type { FinancialRuleEvaluation } from "../../services/financialRules.types";

export function FinancialRulesSimulator({ onSimulate }: {
  onSimulate: (input: any) => Promise<FinancialRuleEvaluation>
}) {
  const [producerId, setProducerId] = useState("");
  const [eventId, setEventId] = useState("");
  const [amount, setAmount] = useState(0);
  const [operationType, setOperationType] = useState("PAYOUT");
  const [result, setResult] = useState<FinancialRuleEvaluation | null>(null);

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">Simulador de Regras Financeiras</h2>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <select value={operationType} onChange={e => setOperationType(e.target.value)}
          className="rounded-xl border p-3">
          <option value="PAYOUT">Repasse</option>
          <option value="EVENT_TRANSFER">Transferência entre eventos</option>
          <option value="ADVANCE">Antecipação</option>
          <option value="EXPENSE">Despesa</option>
          <option value="REVERSAL">Estorno</option>
        </select>

        <input className="rounded-xl border p-3" placeholder="Produtor"
          value={producerId} onChange={e => setProducerId(e.target.value)} />

        <input className="rounded-xl border p-3" placeholder="Evento"
          value={eventId} onChange={e => setEventId(e.target.value)} />

        <input className="rounded-xl border p-3" type="number" placeholder="Valor"
          value={amount} onChange={e => setAmount(Number(e.target.value))} />
      </div>

      <button className="mt-4 rounded-lg bg-slate-900 px-5 py-3 text-white"
        onClick={async () => setResult(await onSimulate({ operationType, producerId, eventId, amount }))}>
        Simular operação
      </button>

      {result && (
        <div className="mt-5 rounded-xl border p-4">
          <div className="text-sm text-slate-500">Decisão</div>
          <div className="text-2xl font-bold">{result.decision}</div>
          <div className="mt-2">Máximo permitido: {result.maxAllowedAmount}</div>
          <div>Reserva: {result.reserveAmount}</div>
          {result.blockedReasons.length > 0 && (
            <ul className="mt-3 list-disc pl-5">
              {result.blockedReasons.map(x => <li key={x}>{x}</li>)}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
