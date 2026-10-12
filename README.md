# maple-model

Interactive SYRUP valuation model. Starting inputs are read from the Postgres tables built by [maple-pipeline](https://github.com/paultimfv/maple-pipeline).

Live: https://maple-model.vercel.app

## Model

```
core deposits      = stablecoin supply × Maple core share
syrupUSDG on Earn  = Robinhood Earn TVL × syrupUSDG share of Earn
revenue            = avg core deposits × core take rate
                   + avg syrupUSDG × 0.746%   (lenders 4.95%, Maple keeps 13.1% of interest)
                   + offchain revenue
buybacks           = revenue × 10% / 20% / 30%  (MIP-021 tiers: monthly revenue < $1.5M / < $2M / above)
market cap         = revenue × P/S
price              = market cap ÷ circulating supply
```

Years: 2026 TTM, 2027E–2030E. 2027 and 2029 stablecoin supply are geometric midpoints of the adjacent years. Earn TVL grows at a constant rate to the 2030 setting.

## Inputs (`src/lib/queries.ts`)

| Input | Table |
|---|---|
| Stablecoin supply | `stablecoin_supply` (DeFiLlama) |
| Maple deposits, latest month-end | `aum_monthly` |
| syrupUSDG on Robinhood Chain | `rh_stable_supply` × `pool_state` exchange rate |
| Robinhood Earn TVL | `morpho_flows` |
| Revenue, TTM and last 3 months | `monthly_revenue` |
| Market cap, price | `syrup_price` (CoinGecko) |
| P/S median | `monthly_model` |

Logic: `src/components/model.tsx`.

## Run

```
npm install
echo "DATABASE_URL=..." > .env.local
npm run dev
```
