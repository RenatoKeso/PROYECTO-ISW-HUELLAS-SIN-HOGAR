import { useState } from "react";
import { loginSchema } from "../validations/authValidation.js";

export default function LoginPage({
    onLogin,
    mensajeSesion = "",
}) {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [enviando, setEnviando] = useState(false);

async function enviar(evento) {
    evento.preventDefault();

    if (enviando) return;

    setError("");

    const validacion = loginSchema.safeParse({
        email,
        password,
    });

    if (!validacion.success) {
        setError(validacion.error.issues[0].message);
        return;
    }

    setEnviando(true);

    try {
        await onLogin(validacion.data);
    } catch (errorLogin) {
        setError(
        errorLogin instanceof TypeError
            ? "No se pudo contactar con el servidor."
            : errorLogin.message || "No se pudo iniciar sesión."
    );
} finally {
        setEnviando(false);
    }
}

    return (
    <section className="bloque">
        <h2>Iniciar sesión</h2>
        <p>Ingresa con tu cuenta de Huellas Sin Hogar.</p>

    {mensajeSesion && (
        <p role="status">{mensajeSesion}</p>
        )}

    <form
        className="formulario"
        onSubmit={enviar}
        noValidate
    >
        <fieldset disabled={enviando}>
            <legend>Datos de acceso</legend>

            <div>
            <label htmlFor="login-email">Correo electrónico</label>
            <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                required
            />
        </div>

        <div>
            <label htmlFor="login-password">Contraseña</label>
            <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(evento) =>
                setPassword(evento.target.value)
            }
                required
            />
        </div>

            <button className="boton" type="submit">
            {enviando ? "Ingresando..." : "Iniciar sesión"}
        </button>
        </fieldset>

        {error && (
            <p className="mensaje mensaje-error" role="alert">
            {error}
        </p>
        )}
    </form>
    </section>
);
}