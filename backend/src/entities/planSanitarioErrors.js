export class PlanSanitarioError extends Error {
  constructor(
    mensaje,
    estadoHttp = 409,
    codigo = "PLAN_SANITARIO_CONFLICTO"
  ) {
    super(mensaje);
    this.name = "PlanSanitarioError";
    this.estadoHttp = estadoHttp;
    this.codigo = codigo;
  }
}