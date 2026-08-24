// Formats a number as Indonesian Rupiah, e.g. formatRupiah(15000) -> "Rp 15.000,-"
export function formatRupiah(amount) {
  const value = Math.round(Number(amount) || 0);
  return `Rp ${value.toLocaleString('id-ID')},-`;
}
