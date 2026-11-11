import { useEffect, useState } from "react";
import { EVENTO_SESION_EXPIRADA,guardarToken,obtenerToken,} from "../services/api.js";
import {consultarSesion,solicitarLogin,solicitarLogout,} from "../services/authService.js";

export default function useSesion() {
    const [usuario, setUsuario] = useState(null);
    const [cargandoSesion, setCargandoSesion] = useState(true);
    const [cerrandoSesion, setCerrandoSesion] = useState(false);
    const [mensajeSesion, setMensajeSesion] = useState("");

useEffect(() => {
    let vigente = true;

    function alExpirar() {
        if (!vigente) return;

        setUsuario(null);
        setMensajeSesion(
        "Tu sesión dejó de ser válida. Inicia sesión nuevamente."
    );
}

    window.addEventListener(
        EVENTO_SESION_EXPIRADA,
        alExpirar
    );

    async function recuperarSesion() {
        try {
            const respuesta = obtenerToken()
            ? await consultarSesion()
            : null;

        if (vigente) {
            setUsuario(respuesta?.usuario ?? null);
        }
    } catch {
        if (vigente) {
            guardarToken(null);
            setUsuario(null);
            setMensajeSesion(
            "No se pudo recuperar tu sesión. Inicia sesión nuevamente."
        );
    }
        } finally {
            if (vigente) {
                setCargandoSesion(false);
        }
    }
    
}

    Promise.resolve().then(recuperarSesion);

    return () => {
        vigente = false;
        window.removeEventListener(
        EVENTO_SESION_EXPIRADA,
        alExpirar
        );
    };
}, []);

async function iniciarSesion(datos) {
    setMensajeSesion("");

    const respuesta = await solicitarLogin(datos);

    guardarToken(respuesta.token);
    setUsuario(respuesta.usuario);
    }

async function cerrarSesion() {
    if (cerrandoSesion) return;

    setCerrandoSesion(true);
    setMensajeSesion("");

    try {
        await solicitarLogout();
    } catch {
        setMensajeSesion(
        "Cerraste la sesión en esta pestaña, pero no se pudo confirmar su invalidación en el servidor."
    );
} finally {
        guardarToken(null);
        setUsuario(null);
        setCerrandoSesion(false);
    }
}

return {
    usuario,
    cargandoSesion,
    cerrandoSesion,
    mensajeSesion,
    iniciarSesion,
    cerrarSesion,
    };
}