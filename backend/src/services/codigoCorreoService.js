import { randomInt } from "node:crypto";

const codigos = new Map();

const DIEZ_MINUTOS = 10 * 60 * 1000;

export function crearCodigo(email) {
  const codigo = String(randomInt(0, 1000000)).padStart(6, "0");
  codigos.set(email, { codigo, expira: Date.now() + DIEZ_MINUTOS });
  return codigo;
}

export function codigoEsValido(email, codigo) {
  const guardado = codigos.get(email);

  if (!guardado) return false;
  if (Date.now() > guardado.expira) {
    codigos.delete(email);
    return false;
  }

  return guardado.codigo === codigo;
}

export function borrarCodigo(email) {
  codigos.delete(email);
}