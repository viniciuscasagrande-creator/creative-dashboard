import React, { useMemo, useState } from "react";
import {
  ReconciliationItem,
  ReconciliationOverview,
  ReconciliationStatus,
} from "../../services/reconciliation.types";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type Props = {
  overview: ReconciliationOverview;
  items: ReconciliationItem[];
  onOpenItem?: (item: ReconciliationItem) => void;
};

const statusLabel: Record<ReconciliationStatus, string> = {
  CONCILIADO: "Conciliado",
  PENDENTE: "Pendente",
  DIVERGENTE: "Divergente",
  BLOQUEADO: "Bloqueado",
  EM_ANALISE: "Em análise",
  RESOLVIDO_MANUALMENTE: "Resolvido manualmente",
};

function Kpi({ label, value, money = false }: { label: string; value: number; money?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">
        {money ? brl.format(value) : value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

export default function ReconciliationCenter({ overview, items, onOpenItem }: Props) {
  const [status, setStatus] = useState<"TODOS" | ReconciliationStatus>("TODOS");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => items.filter((item) => {
    const byStatus = status === "TODOS" || item.status === status;
    const term = search.trim().toLowerCase();
    const bySearch = !term ||
      item.orderId.toLowerCase().includes(term) ||
      item.transactionId.toLowerCase().includes(term) ||
      item.eventName.toLowerCase().includes(term) ||
      item.producerName.toLowerCase().includes(term);
    return byStatus && bySearch;
  }), [items, search, status]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Contabilidade Enterprise</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Centro de Conciliação</h1>
          <p className="mt-1 text-sm text-slate-400">Pedido → Gateway → Banco → Split → Repasse → Contabilidade</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">Importar extrato</button>
          <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950">Executar conciliação</button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Processado" value={overview.totalProcessed} money />
        <Kpi label="Conciliado" value={overview.totalReconciled} money />
        <Kpi label="Pendente" value={overview.totalPending} money />
        <Kpi label="Divergente" value={overview.totalDivergent} money />
        <Kpi label="Valor divergente" value={overview.divergentAmount} money />
        <Kpi label="Chargebacks" value={overview.chargebacks} />
        <Kpi label="Estornos" value={overview.refunds} />
        <Kpi label="Duplicidades" value={overview.duplicates} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Índice Geral</p>
          <p className="mt-2 text-5xl font-semibold text-white">{overview.reconciliationRate.toFixed(2)}%</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(0, Math.min(100, overview.reconciliationRate))}%` }} />
          </div>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <div className="flex justify-between"><span>Não localizadas</span><strong className="text-white">{overview.notFound}</strong></div>
            <div className="flex justify-between"><span>Diferenças de taxas</span><strong className="text-white">{overview.gatewayFeeDifferences}</strong></div>
            <div className="flex justify-between"><span>Repasses divergentes</span><strong className="text-white">{overview.payoutDifferences}</strong></div>
          </div>
        </aside>

        <div className="rounded-2xl border border-white/10 bg-slate-950/70">
          <div className="flex flex-col gap-3 border-b border-white/10 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                ["TODOS", "Todos"],
                ["DIVERGENTE", "Divergentes"],
                ["PENDENTE", "Pendentes"],
                ["EM_ANALISE", "Em análise"],
                ["CONCILIADO", "Conciliados"],
              ].map(([value, label]) => (
                <button key={value} onClick={() => setStatus(value as any)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium ${status === value ? "border-white bg-white text-slate-950" : "border-white/10 bg-white/5 text-slate-300"}`}>
                  {label}
                </button>
              ))}
            </div>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Pedido, transação, evento ou produtor..."
              className="min-w-[280px] rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Pedido</th><th className="px-4 py-3">Evento</th><th className="px-4 py-3">Produtor</th>
                  <th className="px-4 py-3">Gateway</th><th className="px-4 py-3">Transação</th>
                  <th className="px-4 py-3 text-right">Esperado</th><th className="px-4 py-3 text-right">Liquidado</th>
                  <th className="px-4 py-3 text-right">Diferença</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 text-slate-300 last:border-0">
                    <td className="px-4 py-3 font-medium text-white">{item.orderId}</td>
                    <td className="px-4 py-3">{item.eventName}</td>
                    <td className="px-4 py-3">{item.producerName}</td>
                    <td className="px-4 py-3">{item.gateway}</td>
                    <td className="px-4 py-3">{item.transactionId}</td>
                    <td className="px-4 py-3 text-right">{brl.format(item.expectedAmount)}</td>
                    <td className="px-4 py-3 text-right">{brl.format(item.settledAmount)}</td>
                    <td className="px-4 py-3 text-right font-medium">{brl.format(item.differenceAmount)}</td>
                    <td className="px-4 py-3">{statusLabel[item.status]}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => onOpenItem?.(item)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white">Analisar</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-500">Nenhuma conciliação encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
