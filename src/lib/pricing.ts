// Single source of truth for what we charge. List prices are pre-GST; every
// transaction adds 18% GST on top.
export const GST_RATE = 0.18

/** Pre-GST list prices, in paise. */
export const BLUE_PILL_BASE_PAISE = 49900 // per month
export const RED_PILL_BASE_PAISE = 299900 // one-time

export const gstOn = (basePaise: number) => Math.round(basePaise * GST_RATE)
export const withGst = (basePaise: number) => basePaise + gstOn(basePaise)

export const BLUE_PILL_TOTAL_PAISE = withGst(BLUE_PILL_BASE_PAISE)
export const RED_PILL_TOTAL_PAISE = withGst(RED_PILL_BASE_PAISE)

/** ₹2,999 / ₹588.82 — drops the decimals when the amount is whole rupees. */
export function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}
