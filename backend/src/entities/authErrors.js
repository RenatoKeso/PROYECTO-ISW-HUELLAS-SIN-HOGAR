export class AuthError extends Error {
    constructor(message, estadoHttp = 401, codigo = "SESION_INVALIDA") {
    super(message);
    this.name = "AuthError";
    this.estadoHttp = estadoHttp;
    this.codigo = codigo;
    }
}