import React from "react";
import type { EventCashForecast } from "../../services/cashForecast.types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{brl.format(value)}</p>
    </div>
  );
}

export function CashForecastDashboard({
  data,
  onRequestCoverage,
}: {
  data: EventCashForecast;
  onRequestCoverage?: (sourceEventId: string, amount: number) => void;
}) {
  return (
    <main className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Financeiro • Gestão de Saldos
        </p>
        <h1 className="mt-1 text-2xl font-bold">Projeção de Caixa e Repasses</h1>
        <p className="mt-1 text-sm text-slate-500">
          {data.eventName || data.eventId} • Risco: {data.forecast.riskStatus}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Saldo Atual" value={data.current.availableBalance} />
        <Kpi label="Entradas Previstas" value={data.forecast.expectedInflows} />
        <Kpi label="Saídas Previstas" value={data.forecast.expectedOutflows} />
        <Kpi label="Saldo Projetado" value={data.forecast.projectedBalance} />
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="font-semibold">Curva de Caixa</h2>
        <p className="mt-1 text-sm text-slate-500">
          Renderizar gráfico com `data.timeline`.
        </p>
        <div className="mt-5 min-h-72 rounded-xl bg-slate-50" />
      </section>

      {data.coverage.requiredAmount > 0 && (
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="font-semibold">Cobertura recomendada</h2>
          <p className="mt-1 text-sm text-slate-500">
            Necessidade projetada: {brl.format(data.coverage.requiredAmount)}
          </p>

          <div className="mt-4 space-y-2">
            {data.coverage.suggestions.map(item => (
              <div key={item.sourceEventId} className="flex flex-col justify-between gap-3 rounded-xl border p-4 md:flex-row md:items-center">
                <div>
                  <p className="font-medium">{item.sourceEventName}</p>
                  <p className="text-sm text-slate-500">
                    Disponível atual: {brl.format(item.availableBalance)}
                  </p>
                  <p className="text-sm text-slate-500">
                    Sugestão: {brl.format(item.suggestedAmount)}
                  </p>
                </div>

                <button
                  onClick={() => onRequestCoverage?.(item.sourceEventId, item.suggestedAmount)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Solicitar transferência
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
