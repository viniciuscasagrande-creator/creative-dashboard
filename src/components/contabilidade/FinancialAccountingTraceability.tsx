import React from "react";
import {
  AccountingEntry,
  TimelineEvent,
  TraceabilityData,
} from "../../services/traceability.types";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function MoneyRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2.5 last:border-0">
      <span className={strong ? "font-semibold text-white" : "text-sm text-slate-300"}>{label}</span>
      <span className={strong ? "font-semibold text-white" : "text-sm text-slate-200"}>{brl.format(value)}</span>
    </div>
  );
}

function Timeline({ items }: { items: TimelineEvent[] }) {
  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <div key={item.id} className="relative flex gap-4 pb-6">
          {index < items.length - 1 && (
            <div className="absolute left-[9px] top-5 h-full w-px bg-white/10" />
          )}
          <div className="relative mt-1 h-[19px] w-[19px] shrink-0 rounded-full border border-white/20 bg-slate-900">
            <div className="absolute inset-[5px] rounded-full bg-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <h3 className="font-medium text-white">{item.label}</h3>
              <span className="text-xs text-slate-500">{dateTime.format(new Date(item.occurredAt))}</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {item.source}
              {item.referenceId ? ` • ${item.referenceId}` : ""}
              {item.amount != null ? ` • ${brl.format(item.amount)}` : ""}
            </p>
            {item.description && <p className="mt-1 text-xs text-slate-500">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function AccountingTable({ entries }: { entries: AccountingEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1200px] text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Débito</th>
            <th className="px-4 py-3">Crédito</th>
            <th className="px-4 py-3">Histórico</th>
            <th className="px-4 py-3">Documento</th>
            <th className="px-4 py-3">Centro de custo</th>
            <th className="px-4 py-3">Evento</th>
            <th className="px-4 py-3">Produtor</th>
            <th className="px-4 py-3 text-right">Valor</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-white/5 text-slate-300 last:border-0">
              <td className="px-4 py-3">{dateTime.format(new Date(entry.occurredAt))}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-white">{entry.debitAccount}</div>
                <div className="text-xs text-slate-500">{entry.debitAccountName}</div>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-white">{entry.creditAccount}</div>
                <div className="text-xs text-slate-500">{entry.creditAccountName}</div>
              </td>
              <td className="px-4 py-3">{entry.history}</td>
              <td className="px-4 py-3">{entry.documentReference}</td>
              <td className="px-4 py-3">{entry.costCenter || "—"}</td>
              <td className="px-4 py-3">{entry.eventName || "—"}</td>
              <td className="px-4 py-3">{entry.producerName || "—"}</td>
              <td className="px-4 py-3 text-right font-medium text-white">{brl.format(entry.amount)}</td>
              <td className="px-4 py-3">{entry.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FinancialAccountingTraceability({ data }: { data: TraceabilityData }) {
  const c = data.composition;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Contabilidade Enterprise</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Rastreabilidade Financeiro → Contábil</h1>
          <p className="mt-1 text-sm text-slate-400">Pedido {data.orderId} • {data.eventName}</p>
        </div>

        <div className="flex gap-2">
          <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">Exportar evidências</button>
          <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950">Abrir auditoria</button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <InfoCard label="Pedido" value={data.orderId} />
        <InfoCard label="Evento" value={data.eventName} />
        <InfoCard label="Produtor" value={data.producerName} />
        <InfoCard label="Gateway" value={data.gateway} />
        <InfoCard label="Transação" value={data.transactionId} />
        <InfoCard label="Pagamento" value={data.paymentMethod} />
        <InfoCard label="Status financeiro" value={data.financialStatus} />
        <InfoCard label="Conciliação" value={data.reconciliationStatus} />
        <InfoCard label="Status contábil" value={data.accountingStatus} />
        <InfoCard label="Cliente" value={data.customerName || "Não informado"} />
        <InfoCard label="Data" value={dateTime.format(new Date(data.createdAt))} />
        <InfoCard label="Total pago" value={brl.format(c.totalPaid)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Composição financeira</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Distribuição do pedido</h2>
          <div className="mt-4">
            <MoneyRow label="Valor facial dos ingressos" value={c.ticketFaceValue} />
            <MoneyRow label="Taxa de conveniência" value={c.convenienceFee} />
            <MoneyRow label="Descontos" value={-Math.abs(c.discounts)} />
            <MoneyRow label="Acréscimos" value={c.additions} />
            <MoneyRow label="Total pago" value={c.totalPaid} strong />
            <MoneyRow label="Taxa gateway" value={-Math.abs(c.gatewayFee)} />
            <MoneyRow label="Taxa adquirência" value={-Math.abs(c.acquiringFee)} />
            <MoneyRow label="Antifraude" value={-Math.abs(c.antifraudFee)} />
            <MoneyRow label="Antecipação" value={-Math.abs(c.anticipationFee)} />
            <MoneyRow label="Receita DiskIngressos" value={c.diskRevenue} strong />
            <MoneyRow label="Valor do produtor" value={c.producerAmount} strong />
            <MoneyRow label="Tributos" value={-Math.abs(c.taxes)} />
            <MoneyRow label="Líquido" value={c.netAmount} strong />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Linha do tempo</p>
          <h2 className="mt-1 mb-5 text-lg font-semibold text-white">Ciclo financeiro e contábil</h2>
          <Timeline items={data.timeline} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/70">
        <div className="border-b border-white/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Reflexo contábil</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Lançamentos vinculados ao pedido</h2>
        </div>
        <AccountingTable entries={data.accountingEntries} />
      </div>
    </section>
  );
}
