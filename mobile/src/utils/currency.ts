export function formatCurrency(amount: number, currency?: string) {
  if (currency === "EUR") return `€${amount}`;
  return `${amount} MKD`;
}
