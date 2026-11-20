export class DonacionError extends Error {
constructor(
    mensaje,
    estadoHttp = 400,
    codigo = "DONACION_INVALIDA"
) {
    super(mensaje);
    this.name = "DonacionError";
    this.estadoHttp = estadoHttp;
    this.codigo = codigo;
    }
}