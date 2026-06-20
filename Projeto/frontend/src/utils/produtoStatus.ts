export type ProdutoStatus = "ok" | "baixo" | "esgotado";

export function calcularStatusProduto(
  quantidade: number,
  quantidadeMinima: number,
): ProdutoStatus {
  if (quantidade <= 0) {
    return "esgotado";
  }
  if (quantidade <= quantidadeMinima) {
    return "baixo";
  }
  return "ok";
}

export const statusPillStyles: Record<
  ProdutoStatus,
  { bg: string; text: string; label: string }
> = {
  ok: { bg: "#DCFCE7", text: "#166534", label: "OK" },
  baixo: { bg: "#FFEDD5", text: "#C2410C", label: "Baixo" },
  esgotado: { bg: "#FEE2E2", text: "#B91C1C", label: "Esgotado" },
};

export function formatPreco(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
