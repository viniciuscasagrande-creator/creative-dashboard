import React, { useState } from "react";
import { AccountingDashboardData } from "../../services/accountingDashboard.types";

const brl = new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" });
const pct = new Intl.NumberFormat("pt-BR", { style:"percent", minimumFractionDigits:1, maximumFractionDigits:1 });

function Kpi({title,value,subtitle}:{title:string;value:number;subtitle:string}) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-medium text-slate-500">{title}</p>
    <p className="mt-2 text-xl font-bold text-slate-900">{brl.format(value)}</p>
    <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
  </div>;
}

function Progress({value}:{value:number}) {
  return <div className="h-2 overflow-hidden rounded-full bg-slate-100">
    <div className="h-full rounded-full bg-slate-900" style={{width:`${Math.min(100,Math.max(0,value))}%`}} />
  </div>;
}

export default function AccountingEnterpriseDashboard({
  data,
  onNavigate,
}:{
  data:AccountingDashboardData;
  onNavigate?:(target:string,id?:string)=>void;
}) {
  const [mode,setMode] = useState<"standard"|"advanced"|"expert">("advanced");
  const maxEvolution = Math.max(1,...data.evolution.flatMap(x=>[
    x.diskRevenue,x.producerPayouts,x.gatewayFees,x.taxes,Math.abs(x.result)
  ]));

  return <section className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-6">
    <div className="mx-auto max-w-[1700px] space-y-4">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Contabilidade • Visão Geral</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard Contábil</h1>
          <p className="mt-1 text-sm text-slate-500">Visão completa da operação financeira e contábil da DiskIngressos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["standard","advanced","expert"] as const).map(m=><button key={m} onClick={()=>setMode(m)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold ${mode===m?"bg-slate-900 text-white":"border border-slate-200 bg-white text-slate-600"}`}>
            {m==="standard"?"Standard":m==="advanced"?"Advanced":"Expert"}
          </button>)}
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold">Este mês</button>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white">Atualizar</button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        <Kpi title="Receita Bruta Transacionada (GMV)" value={data.kpis.gmv} subtitle="Volume de ingressos vendidos"/>
        <Kpi title="Valores de Terceiros" value={data.kpis.thirdPartyFunds} subtitle="Recursos dos produtores"/>
        <Kpi title="Receita DiskIngressos" value={data.kpis.diskRevenue} subtitle="Taxas, comissões e serviços"/>
        <Kpi title="Taxas de Gateway" value={data.kpis.gatewayFees} subtitle="Custos financeiros"/>
        <Kpi title="Tributos Provisionados" value={data.kpis.provisionedTaxes} subtitle="Impostos e contribuições"/>
        <Kpi title="Repasse a Produtores" value={data.kpis.producerPayouts} subtitle="Valores pagos no período"/>
        <Kpi title="Resultado Operacional" value={data.kpis.operatingResult} subtitle="Após taxas e despesas"/>
        <Kpi title="Caixa e Bancos" value={data.kpis.cashAndBanks} subtitle="Saldo disponível"/>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_.85fr_.75fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Evolução Financeira e Resultado</h2>
            <button onClick={()=>onNavigate?.("dre")} className="text-xs font-semibold text-slate-500">Abrir DRE →</button>
          </div>
          <div className="mt-6 flex h-64 items-end gap-2">
            {data.evolution.map((p,i)=><div key={i} className="flex min-w-0 flex-1 items-end justify-center gap-[2px]">
              {[p.diskRevenue,p.producerPayouts,p.gatewayFees,p.taxes].map((v,j)=>
                <div key={j} className="w-1/5 rounded-t bg-slate-900" style={{height:`${Math.max(3,(v/maxEvolution)*210)}px`,opacity:.95-j*.18}}/>
              )}
            </div>)}
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-slate-400">
            {data.evolution.map((p,i)=><span key={i}>{p.label}</span>)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between"><h2 className="font-bold">Recursos de Terceiros</h2>
            <button onClick={()=>onNavigate?.("financial-position")} className="text-xs text-slate-500">Detalhes →</button>
          </div>
          <p className="mt-3 text-3xl font-bold">{brl.format(data.thirdPartyFunds.total)}</p>
          <div className="mt-4 space-y-3 text-sm">
            {[
              ["Aguardando liquidação",data.thirdPartyFunds.awaitingSettlement],
              ["Disponível para repasse",data.thirdPartyFunds.availableForPayout],
              ["Repasse programado",data.thirdPartyFunds.scheduledPayout],
              ["Repasse bloqueado",data.thirdPartyFunds.blocked],
              ["Em conciliação",data.thirdPartyFunds.inReconciliation],
              ["Divergência",data.thirdPartyFunds.divergent],
            ].map(([l,v])=><div key={l as string} className="flex justify-between gap-3 border-b border-slate-100 pb-2">
              <span className="text-slate-500">{l as string}</span><strong>{brl.format(v as number)}</strong>
            </div>)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Índice de Conciliação</h2>
          <div className="mx-auto mt-6 flex h-36 w-36 items-center justify-center rounded-full border-[14px] border-slate-900">
            <div className="text-center"><p className="text-2xl font-bold">{pct.format(data.reconciliation.rate)}</p><p className="text-[10px] text-slate-400">conciliado</p></div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <span>Conciliadas</span><strong className="text-right text-slate-900">{data.reconciliation.reconciled}</strong>
            <span>Pendentes</span><strong className="text-right text-slate-900">{data.reconciliation.pending}</strong>
            <span>Divergentes</span><strong className="text-right text-slate-900">{data.reconciliation.divergent}</strong>
            <span>Chargebacks</span><strong className="text-right text-slate-900">{data.reconciliation.chargebacks}</strong>
          </div>
          <button onClick={()=>onNavigate?.("reconciliation")} className="mt-5 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Analisar divergências</button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Receita DiskIngressos por Origem</h2>
          <div className="mt-4 space-y-4">{data.revenueOrigins.map(x=><div key={x.label}>
            <div className="mb-1 flex justify-between text-sm"><span>{x.label}</span><strong>{brl.format(x.amount)}</strong></div>
            <Progress value={x.percentage*100}/>
          </div>)}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold">Receita por Gateway</h2>
          <div className="mt-4 space-y-4">{data.gateways.map(x=><div key={x.name}>
            <div className="mb-1 flex justify-between text-sm"><span>{x.name}</span><strong>{brl.format(x.amount)}</strong></div>
            <Progress value={x.percentage*100}/>
          </div>)}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between"><h2 className="font-bold">Próximos Repasses</h2><button onClick={()=>onNavigate?.("payouts")} className="text-xs text-slate-500">Ver todos</button></div>
          <div className="mt-3 divide-y divide-slate-100">{data.upcomingPayouts.map(x=><button key={x.id} onClick={()=>onNavigate?.("payout",x.id)} className="flex w-full justify-between gap-4 py-3 text-left">
            <div><p className="text-sm font-semibold">{x.eventName}</p><p className="text-xs text-slate-400">{x.producerName}</p></div>
            <div className="text-right"><p className="text-sm font-bold">{brl.format(x.amount)}</p><p className="text-xs text-slate-400">{x.date}</p></div>
          </button>)}</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[.9fr_1.6fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex justify-between"><h2 className="font-bold">Inteligência Contábil</h2><button onClick={()=>onNavigate?.("intelligence")} className="text-xs text-slate-500">Ver todas</button></div>
          <div className="mt-3 divide-y divide-slate-100">{data.intelligence.map(i=><button key={i.id} onClick={()=>onNavigate?.("insight",i.id)} className="w-full py-3 text-left">
            <span className="text-[10px] font-bold uppercase text-slate-400">{i.type}</span>
            <p className="mt-1 text-sm font-medium">{i.title}</p>
          </button>)}</div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex justify-between p-5"><h2 className="font-bold">Eventos em Destaque</h2><button onClick={()=>onNavigate?.("traceability")} className="text-xs text-slate-500">Rastreabilidade →</button></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500"><tr>
                <th className="px-4 py-2 text-left">Evento</th><th className="px-4 py-2 text-left">Produtor</th>
                <th className="px-4 py-2 text-right">GMV</th><th className="px-4 py-2 text-right">Receita Disk</th>
                <th className="px-4 py-2 text-right">Repasse</th><th className="px-4 py-2 text-right">Conciliação</th><th className="px-4 py-2 text-left">Status</th>
              </tr></thead>
              <tbody>{data.featuredEvents.map(e=><tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{e.eventName}</td><td className="px-4 py-3 text-slate-500">{e.producerName}</td>
                <td className="px-4 py-3 text-right">{brl.format(e.gmv)}</td><td className="px-4 py-3 text-right">{brl.format(e.diskRevenue)}</td>
                <td className="px-4 py-3 text-right">{brl.format(e.payout)}</td><td className="px-4 py-3 text-right">{pct.format(e.reconciliationRate)}</td>
                <td className="px-4 py-3">{e.status}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <button onClick={()=>onNavigate?.("intelligence")} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"><p className="text-xs text-slate-500">Saúde Contábil</p><p className="mt-1 text-2xl font-bold">{data.health.score}/100</p></button>
        <button onClick={()=>onNavigate?.("closing")} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"><p className="text-xs text-slate-500">Fechamento Mensal</p><p className="mt-1 text-2xl font-bold">{data.health.closingProgress}%</p></button>
        <button onClick={()=>onNavigate?.("balance")} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"><p className="text-xs text-slate-500">Balanço</p><p className="mt-1 text-lg font-bold">{data.health.balanceIntegrity?"Íntegro":"Revisar"}</p></button>
        <button onClick={()=>onNavigate?.("audit")} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"><p className="text-xs text-slate-500">Pendências Críticas</p><p className="mt-1 text-2xl font-bold">{data.health.criticalIssues}</p></button>
        <button onClick={()=>onNavigate?.("compliance")} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm"><p className="text-xs text-slate-500">Compliance</p><p className="mt-1 text-2xl font-bold">{data.health.complianceScore}%</p></button>
      </div>
    </div>
  </section>;
}
