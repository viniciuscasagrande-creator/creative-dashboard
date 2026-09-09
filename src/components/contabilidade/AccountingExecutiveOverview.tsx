import React from "react";
import { AccountingOverview, AccountingOverviewFilter } from "./types";

type MoneyCardProps = {
  title: string;
  value: number;
  subtitle?: string;
  emphasis?: boolean;
};

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function MoneyCard({ title, value, subtitle, emphasis }: MoneyCardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-xl backdrop-blur",
        emphasis ? "ring-1 ring-white/20" : "",
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{brl.format(value)}</p>
      {subtitle ? (
        <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
      ) : null}
    </div>
  );
}

export type AccountingExecutiveOverviewProps = {
  data: AccountingOverview;
  activeFilter?: string;
  onFilterChange?: (period: string) => void;
  onAnalyzeDivergences?: () => void;
};

function BreakdownRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-3 last:border-0">
      <span className={strong ? "font-semibold text-white" : "text-sm text-slate-300"}>
        {label}
      </span>
      <span className={strong ? "font-semibold text-white" : "text-sm font-medium text-slate-200"}>
        {brl.format(value)}
      </span>
    </div>
  );
}

export default function AccountingExecutiveOverview(
  props: AccountingExecutiveOverviewProps
) {
  const {
    data,
    activeFilter = "30d",
    onFilterChange,
    onAnalyzeDivergences,
  } = props;

  const {
    grossTransactionValue,
    thirdPartyFunds,
    diskRevenue,
    financialCosts,
    taxes,
    payouts,
    netRevenue,
    operatingResult,
    reconciliation,
  } = data;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Contabilidade Enterprise
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            Resumo Contábil Executivo
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Separação entre recursos de produtores, receita própria DiskIngressos,
            custos financeiros, tributos e resultado operacional.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: "hoje", label: "Hoje" },
            { id: "7d", label: "7 dias" },
            { id: "30d", label: "30 dias" },
            { id: "mes", label: "Mês" },
            { id: "ano", label: "Ano" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onFilterChange && onFilterChange(item.id)}
              className={[
                "rounded-xl border px-3 py-2 text-xs font-medium transition",
                activeFilter === item.id
                  ? "border-primary bg-primary text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MoneyCard
          title="Receita Bruta Transacionada"
          value={grossTransactionValue}
          subtitle="Volume financeiro movimentado no período"
        />
        <MoneyCard
          title="Valores de Terceiros"
          value={thirdPartyFunds.total}
          subtitle="Recursos pertencentes aos produtores"
          emphasis
        />
        <MoneyCard
          title="Receita DiskIngressos"
          value={diskRevenue.total}
          subtitle="Receita efetivamente apropriável"
          emphasis
        />
        <MoneyCard title="Taxas de Gateway" value={financialCosts.gatewayFees} subtitle="Custos financeiros" />
        <MoneyCard title="Tributos Provisionados" value={taxes.provisioned} subtitle="Obrigações fiscais" />
        <MoneyCard title="Repasse a Produtores" value={payouts.paid + payouts.pending} subtitle="Passivo operacional" />
        <MoneyCard title="Receita Líquida" value={netRevenue} subtitle="Resultado após taxas" />
        <MoneyCard title="Resultado Operacional" value={operatingResult} subtitle="Resultado do período" emphasis />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-xl">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Recursos de Terceiros
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              Obrigações com produtores
            </h2>
          </div>

          <BreakdownRow label="Aguardando liquidação" value={thirdPartyFunds.awaitingSettlement} />
          <BreakdownRow label="Disponível para repasse" value={thirdPartyFunds.availableForPayout} />
          <BreakdownRow label="Repasse programado" value={thirdPartyFunds.scheduledPayout} />
          <BreakdownRow label="Repasse bloqueado" value={thirdPartyFunds.blockedPayout} />
          <BreakdownRow label="Em conciliação" value={thirdPartyFunds.reconciling} />
          <BreakdownRow label="Com divergência" value={thirdPartyFunds.divergent} />
          <BreakdownRow label="Total" value={thirdPartyFunds.total} strong />
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-xl">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Receita Própria
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              Receita DiskIngressos
            </h2>
          </div>

          <BreakdownRow label="Taxa de conveniência" value={diskRevenue.convenienceFee} />
          <BreakdownRow label="Comissão" value={diskRevenue.commission} />
          <BreakdownRow label="Serviços" value={diskRevenue.services} />
          <BreakdownRow label="Outras receitas" value={diskRevenue.other} />
          <BreakdownRow label="Total" value={diskRevenue.total} strong />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Índice de Conciliação
          </p>
          <p className="mt-2 text-4xl font-semibold text-white">
            {reconciliation.rate.toFixed(2)}%
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, reconciliation.rate))}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Divergências
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {reconciliation.divergentItems} registros requerem análise
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Valor financeiro divergente: {brl.format(reconciliation.divergentAmount)}
              </p>
            </div>
            <button
              onClick={() => onAnalyzeDivergences && onAnalyzeDivergences()}
              className="rounded-xl border border-white/10 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Analisar divergências
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
