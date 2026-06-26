import { describe, expect, it } from "vitest";
import { calcularStatus } from "../src/models/produto";

describe("calcularStatus", () => {
  it("retorna esgotado quando quantidade é zero", () => {
    expect(calcularStatus(0, 10)).toBe("esgotado");
  });

  it("retorna esgotado quando quantidade é negativa", () => {
    expect(calcularStatus(-1, 10)).toBe("esgotado");
  });

  it("retorna baixo quando quantidade está no mínimo", () => {
    expect(calcularStatus(10, 10)).toBe("baixo");
  });

  it("retorna baixo quando quantidade está abaixo do mínimo", () => {
    expect(calcularStatus(3, 10)).toBe("baixo");
  });

  it("retorna ok quando quantidade está acima do mínimo", () => {
    expect(calcularStatus(11, 10)).toBe("ok");
  });
});
