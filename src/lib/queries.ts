import { q } from "./db";

const EARN_VAULT = "0x44abc1d6ccff2696d98890b92e2157af242179c2";

// pg returns numerics as strings and dates as Date objects — normalise to number / "YYYY-MM-DD"
const num = (r: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(r).map(([k, v]) => [
      k,
      v instanceof Date ? v.toISOString().slice(0, 10)
      : typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v) ? Number(v)
      : v,
    ]),
  );

// ---- Interactive SYRUP model: today's measured inputs (all from the pipeline, refreshed daily) ----
export type ModelInputs = {
  asOf: string; stablecoins: number; deposits: number; syrupOnEarn: number; earnTvl: number;
  ttmOnchain: number; ttmOffchain: number; ttmRevenue: number; takeRateQ: number; offchainMonthlyQ: number;
  coreShare2025: number; mcap: number; price: number; supply: number; psMedian: number;
};
export async function modelInputs(): Promise<ModelInputs> {
  const [r] = await q(`
    WITH full_months AS (SELECT * FROM monthly_revenue WHERE month < date_trunc('month', now())),
    last3 AS (SELECT * FROM full_months ORDER BY month DESC LIMIT 3),
    last12 AS (SELECT * FROM full_months ORDER BY month DESC LIMIT 12),
    dep AS (SELECT date_trunc('month', month_end)::date AS month, sum(aum_usd) AS deposits FROM aum_monthly GROUP BY 1)
    SELECT
      (SELECT max(day) FROM stablecoin_supply)::text AS as_of,
      (SELECT supply_usd FROM stablecoin_supply ORDER BY day DESC LIMIT 1) AS stablecoins,
      (SELECT deposits FROM dep WHERE month = (SELECT max(month) FROM last3)) AS deposits,
      (SELECT s.supply * p.exch_rate FROM rh_stable_supply s
         JOIN LATERAL (SELECT exch_rate FROM pool_state WHERE pool = 'syrupUSDG' AND day <= s.day ORDER BY day DESC LIMIT 1) p ON true
         WHERE s.token = 'syrupUSDG' ORDER BY s.day DESC LIMIT 1) AS syrup_on_earn,
      (SELECT sum(CASE WHEN f.kind = 'supply' THEN f.assets ELSE -f.assets END) FROM morpho_flows f WHERE f.on_behalf = $1) AS earn_tvl,
      (SELECT sum(onchain_revenue) FROM last12) AS ttm_onchain,
      (SELECT sum(offchain_revenue) FROM last12) AS ttm_offchain,
      (SELECT avg(l.onchain_revenue * 12 / d.deposits) FROM last3 l JOIN dep d USING (month)) AS take_rate_q,
      (SELECT avg(offchain_revenue) FROM last3) AS offchain_monthly_q,
      (SELECT d.deposits / s.supply_usd FROM dep d, stablecoin_supply s WHERE d.month = '2025-12-01' AND s.day = '2025-12-31') AS core_share_2025,
      (SELECT mcap_usd FROM syrup_price ORDER BY day DESC LIMIT 1) AS mcap,
      (SELECT price_usd FROM syrup_price ORDER BY day DESC LIMIT 1) AS price,
      (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY ps_ttm) FROM monthly_model WHERE ps_ttm IS NOT NULL) AS ps_median`, [EARN_VAULT]);
  const x = num(r) as Record<string, number>;
  return {
    asOf: String(r.as_of).slice(0, 10), stablecoins: x.stablecoins, deposits: x.deposits, syrupOnEarn: x.syrup_on_earn, earnTvl: x.earn_tvl,
    ttmOnchain: x.ttm_onchain, ttmOffchain: x.ttm_offchain, ttmRevenue: x.ttm_onchain + x.ttm_offchain,
    takeRateQ: x.take_rate_q, offchainMonthlyQ: x.offchain_monthly_q, coreShare2025: x.core_share_2025,
    mcap: x.mcap, price: x.price, supply: x.mcap / x.price, psMedian: x.ps_median,
  };
}
