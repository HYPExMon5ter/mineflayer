module.exports = { tradePrice }

// Vanilla MerchantOffer.getModifiedCostCount: demand raises the first cost by a float
// multiple of its count, specialPrice adds reputation and discounts (often negative), and
// the result is clamped to [1, max stack size].
function tradePrice (count, stackSize, { demand, priceMultiplier, specialPrice }) {
  const demandDiff = Math.max(0, Math.floor(Math.fround(Math.fround(count * demand) * priceMultiplier)))
  return Math.min(Math.max(count + demandDiff + specialPrice, 1), stackSize)
}
