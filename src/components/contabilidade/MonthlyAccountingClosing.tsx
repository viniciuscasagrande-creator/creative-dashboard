import React, { useMemo, useState } from "react";
import {
  AccountingClosing,
  CheckSeverity,
  CheckStatus,
} from "../../services/accountingClosing.types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const statusText: Record<CheckStatus, string> = {
  PENDENTE: "Pendente",
  VALIDANDO: "Validando",
  APROVADO: "Aprovado",
  DIVERGENTE: "Divergente",
  JUSTIFICADO: "Justificado",
};

const severityText: Record<CheckSeverity, string> = {
  INFORMATIVA: "Informativa",
  ATENCAO: "Atenção",
  CRITICA: "Crítica",
  BLOQUEANTE: "Bloqueante",
};

function Kpi({ label, value, money=false }: { label:string; value:number; money?:boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">
        {money ? brl.format(value) : value.toLocaleString("pt-BR")}
      </p>
    </div>
  );
}

export default function MonthlyAccountingClosing({
  data,
  onRunValidation,
  onSubmitApproval,
  onClosePeriod,
}: {
  data: AccountingClosing;
  onRunValidation?: () => void;
  onSubmitApproval?: () => void;
  onClosePeriod?: () => void;
}) {
  const [category, setCategory] = useState("TODAS");

  const categories = useMemo(
    () => ["TODAS", ...Array.from(new Set(data.checks.map(x => x.category)))],
    [data.checks]
  );

  const visible = category === "TODAS"
    ? data.checks
    : data.checks.filter(x => x.category === category);

  const blocking = data.checks.filter(
    x => x.severity === "BLOQUEANTE" && x.status !== "APROVADO" && x.status !== "JUSTIFICADO"
  ).length;

  const canClose = blocking === 0 && data.pendingChecks === 0;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Contabilidade Enterprise
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            Fechamento Contábil Mensal
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Competência {data.period} • {data.status.replaceAll("_", " ")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={onRunValidation}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            Executar validações
          </button>
          <button onClick={onSubmitApproval}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            Enviar para aprovação
          </button>
          <button disabled={!canClose} onClick={onClosePeriod}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-30">
            Fechar competência
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Progresso do fechamento</p>
            <p className="mt-1 text-4xl font-semibold text-white">{data.progress.toFixed(0)}%</p>
          </div>
          <div className="text-right text-sm text-slate-400">
            <p>Responsável: <span className="text-white">{data.responsible}</span></p>
            {data.dueDate && <p>Prazo: <span className="text-white">{data.dueDate}</span></p>}
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-white" style={{width:`${Math.max(0,Math.min(100,data.progress))}%`}} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Kpi label="Verificações" value={data.totalChecks}/>
        <Kpi label="Aprovadas" value={data.approvedChecks}/>
        <Kpi label="Pendentes" value={data.pendingChecks}/>
        <Kpi label="Críticas" value={data.criticalIssues}/>
        <Kpi label="Divergência Financeira" value={data.financialDivergence} money/>
        <Kpi label="Divergência Contábil" value={data.accountingDivergence} money/>
      </div>

      {blocking > 0 && (
        <div className="rounded-2xl border border-white/20 bg-white/[0.06] p-4">
          <p className="font-semibold text-white">
            Fechamento bloqueado: {blocking} verificação(ões) bloqueante(s) pendente(s).
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Resolva ou justifique formalmente as pendências antes de fechar a competência.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {categories.map(item => (
          <button key={item} onClick={()=>setCategory(item)}
            className={`rounded-xl border px-3 py-2 text-xs font-medium ${
              category === item
                ? "border-white bg-white text-slate-950"
                : "border-white/10 bg-white/5 text-slate-300"
            }`}>
            {item === "TODAS" ? "Todas" : item}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-950/70">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white">Checklist de fechamento</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Verificação</th>
                <th className="px-4 py-3">Severidade</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(check => (
                <tr key={check.id} className="border-b border-white/5 text-slate-300 last:border-0">
                  <td className="px-4 py-3">{check.category}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{check.label}</p>
                    {check.description && <p className="mt-1 text-xs text-slate-500">{check.description}</p>}
                  </td>
                  <td className="px-4 py-3">{severityText[check.severity]}</td>
                  <td className="px-4 py-3">{check.source || "—"}</td>
                  <td className="px-4 py-3 text-right">{check.amount != null ? brl.format(check.amount) : "—"}</td>
                  <td className="px-4 py-3">{statusText[check.status]}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white">
                      Analisar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
