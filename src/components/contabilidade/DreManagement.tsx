import React from "react";
import { DreLine, DreOverview } from "../../services/dre.types";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const pct = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function Kpi({
  title,
  value,
  suffix,
}: {
  title: string;
  value: number;
  suffix?: "percent";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">
        {suffix === "percent" ? pct.format(value) : brl.format(value)}
      </p>
    </div>
  );
}

function variance(real: number, base: number) {
  if (!base) return 0;
  return (real - base) / Math.abs(base);
}

function DreRow({ line, level = 0 }: { line: DreLine; level?: number }) {
  const budgetVar = line.real - line.budget;
  const previousVar = line.real - line.previousYear;

  return (
    <>
      <tr className="border-b border-white/5 text-slate-300">
        <td className="px-4 py-3">
          <div style={{ paddingLeft: `${level * 18}px` }}>
            <div className={level === 0 ? "font-semibold text-white" : "text-sm text-slate-300"}>
              {line.label}
            </div>
            <div className="text-[11px] text-slate-600">{line.code}</div>
          </div>
        </td>
        <td className="px-4 py-3 text-right font-medium text-white">{brl.format(line.real)}</td>
        <td className="px-4 py-3 text-right">{brl.format(line.budget)}</td>
        <td className="px-4 py-3 text-right">{brl.format(budgetVar)}</td>
        <td className="px-4 py-3 text-right">{pct.format(variance(line.real, line.budget))}</td>
        <td className="px-4 py-3 text-right">{brl.format(line.previousYear)}</td>
        <td className="px-4 py-3 text-right">{brl.format(previousVar)}</td>
        <td className="px-4 py-3 text-right">{pct.format(variance(line.real, line.previousYear))}</td>
      </tr>
      {line.children?.map((child) => (
        <DreRow key={child.code} line={child} level={level + 1} />
      ))}
    </>
  );
}

export default function DreManagement({ data }: { data: DreOverview }) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Contabilidade Enterprise
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            DRE Gerencial
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Resultado econômico da operação com comparativo Real × Orçado × Ano anterior.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {["Mês", "Trimestre", "Ano", "Personalizado"].map((item) => (
            <button
              key={item}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300"
            >
              {item}
            </button>
          ))}
          <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            Exportar
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Kpi title="Receita Líquida" value={data.netRevenue} />
        <Kpi title="EBITDA" value={data.ebitda} />
        <Kpi title="Margem EBITDA" value={data.ebitdaMargin} suffix="percent" />
        <Kpi title="Resultado Líquido" value={data.netIncome} />
        <Kpi title="Margem Líquida" value={data.netMargin} suffix="percent" />
        <Kpi title="Crescimento YoY" value={data.yoyGrowth} suffix="percent" />
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <select className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
          <option>Todos os produtores</option>
        </select>
        <select className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
          <option>Todos os eventos</option>
        </select>
        <select className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
          <option>Todos os centros de custo</option>
        </select>
        <select className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
          <option>Todos os canais de venda</option>
        </select>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/70">
        <div className="border-b border-white/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Demonstração do Resultado
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            Real × Orçado × Ano anterior
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Conta</th>
                <th className="px-4 py-3 text-right">Real</th>
                <th className="px-4 py-3 text-right">Orçado</th>
                <th className="px-4 py-3 text-right">Var. R$</th>
                <th className="px-4 py-3 text-right">Var. %</th>
                <th className="px-4 py-3 text-right">Ano anterior</th>
                <th className="px-4 py-3 text-right">Var. YoY R$</th>
                <th className="px-4 py-3 text-right">Var. YoY %</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line) => (
                <DreRow key={line.code} line={line} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
