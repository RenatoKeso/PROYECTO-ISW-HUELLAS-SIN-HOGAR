import { api } from "./api.js";
import {loginSchema,loginRespuestaSchema,sesionRespuestaSchema,logoutRespuestaSchema,} from "../validations/authValidation.js";

function validarRespuesta(schema, datos) {
    const resultado = schema.safeParse(datos);

    if (!resultado.success) {
    throw new Error(
        "El servidor devolvió una respuesta de sesión inválida"
    );
}

    return resultado.data;
}

export async function solicitarLogin(entrada) {
const datos = loginSchema.parse(entrada);

const respuesta = await api.post(
    "/auth/login",
    datos,
    { sinSesion: true }
);

    return validarRespuesta(loginRespuestaSchema, respuesta);
}

export async function consultarSesion() {
const respuesta = await api.get("/auth/me");

    return validarRespuesta(sesionRespuestaSchema, respuesta);
}

export async function solicitarLogout() {
const respuesta = await api.post("/auth/logout", {});

    return validarRespuesta(logoutRespuestaSchema, respuesta);
}