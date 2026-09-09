import React, { useState } from "react";
import { BalanceSheetData, BalanceSheetGroup, FinancialPosition } from "../../services/balanceSheet.types";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function Kpi({ label, value, emphasis=false }: { label:string; value:number; emphasis?:boolean }) {
  return (
    <div className={`rounded-2xl border p-4 shadow-lg ${emphasis ? "border-white/20 bg-white/[0.07]" : "border-white/10 bg-slate-950/70"}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{brl.format(value)}</p>
    </div>
  );
}

function GroupRow({ row, level=0 }: { row:BalanceSheetGroup; level?:number }) {
  const variation = row.current - row.previous;
  return (
    <>
      <tr className="border-b border-white/5">
        <td className="px-4 py-3" style={{paddingLeft: `${16 + level*20}px`}}>
          <span className={level===0 ? "font-semibold text-white" : "text-slate-300"}>{row.label}</span>
          <span className="ml-2 text-[11px] text-slate-600">{row.code}</span>
        </td>
        <td className="px-4 py-3 text-right font-medium text-white">{brl.format(row.current)}</td>
        <td className="px-4 py-3 text-right text-slate-400">{brl.format(row.previous)}</td>
        <td className="px-4 py-3 text-right text-slate-300">{brl.format(variation)}</td>
      </tr>
      {row.children?.map(child => <GroupRow key={child.code} row={child} level={level+1}/>)}
    </>
  );
}

export default function FinancialPositionBalanceSheet({
  position, balance
}: { position:FinancialPosition; balance:BalanceSheetData }) {
  const [view, setView] = useState<"position"|"balance">("position");
  const equationDifference = balance.totalAssets - (balance.totalLiabilities + balance.totalEquity);
  const balanced = Math.abs(equationDifference) < 0.01;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Contabilidade Enterprise</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Balanço Patrimonial & Posição Financeira</h1>
          <p className="mt-1 text-sm text-slate-400">Visão corporativa da DiskIngressos com segregação de recursos próprios e de produtores.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setView("position")} className={`rounded-xl px-4 py-2 text-sm ${view==="position" ? "bg-white font-semibold text-slate-950":"border border-white/10 bg-white/5 text-slate-300"}`}>Posição Financeira</button>
          <button onClick={()=>setView("balance")} className={`rounded-xl px-4 py-2 text-sm ${view==="balance" ? "bg-white font-semibold text-slate-950":"border border-white/10 bg-white/5 text-slate-300"}`}>Balanço Patrimonial</button>
        </div>
      </div>

      {view === "position" ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Caixa e Bancos" value={position.cashAndBanks}/>
            <Kpi label="Gateway a Receber" value={position.gatewayReceivables}/>
            <Kpi label="Disponibilidades" value={position.totalAvailability}/>
            <Kpi label="Valores de Terceiros" value={position.thirdPartyFunds} emphasis/>
            <Kpi label="Repasses Pendentes" value={position.pendingPayouts}/>
            <Kpi label="Tributos a Recolher" value={position.taxesPayable}/>
            <Kpi label="Outras Obrigações" value={position.otherLiabilities}/>
            <Kpi label="Posição Financeira Líquida" value={position.netFinancialPosition} emphasis/>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Segregação</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Recursos de terceiros</h2>
              <p className="mt-3 text-3xl font-semibold text-white">{brl.format(position.thirdPartyFunds)}</p>
              <p className="mt-2 text-sm text-slate-400">Valores pertencentes aos produtores e não classificados como receita própria da DiskIngressos.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Cobertura</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Disponibilidades × Obrigações</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between text-slate-300"><span>Disponibilidades</span><strong className="text-white">{brl.format(position.totalAvailability)}</strong></div>
                <div className="flex justify-between text-slate-300"><span>Repasses pendentes</span><strong className="text-white">{brl.format(position.pendingPayouts)}</strong></div>
                <div className="flex justify-between text-slate-300"><span>Tributos</span><strong className="text-white">{brl.format(position.taxesPayable)}</strong></div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={`rounded-2xl border p-4 ${balanced ? "border-white/10 bg-white/[0.03]" : "border-white/30 bg-white/[0.08]"}`}>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Equação patrimonial</p>
                <p className="mt-1 font-semibold text-white">Ativo = Passivo + Patrimônio Líquido</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{balanced ? "Balanço íntegro" : "Diferença encontrada"}</p>
                <p className="text-xs text-slate-400">Diferença: {brl.format(equationDifference)}</p>
              </div>
            </div>
          </div>

          {[
            ["ATIVO", balance.assets],
            ["PASSIVO", balance.liabilities],
            ["PATRIMÔNIO LÍQUIDO", balance.equity],
          ].map(([title, rows]) => (
            <div key={title as string} className="rounded-2xl border border-white/10 bg-slate-950/70">
              <div className="border-b border-white/10 p-5"><h2 className="text-lg font-semibold text-white">{title as string}</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
                    <tr><th className="px-4 py-3 text-left">Conta</th><th className="px-4 py-3 text-right">Atual</th><th className="px-4 py-3 text-right">Anterior</th><th className="px-4 py-3 text-right">Variação</th></tr>
                  </thead>
                  <tbody>{(rows as BalanceSheetGroup[]).map(row => <GroupRow key={row.code} row={row}/>)}</tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
