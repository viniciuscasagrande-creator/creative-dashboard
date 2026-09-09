export interface DreLine {
  code: string;
  label: string;
  real: number;
  budget: number;
  previousYear: number;
  children?: DreLine[];
}

export interface DreOverview {
  netRevenue: number;
  ebitda: number;
  ebitdaMargin: number;
  netIncome: number;
  netMargin: number;
  yoyGrowth: number;
  lines: DreLine[];
}
