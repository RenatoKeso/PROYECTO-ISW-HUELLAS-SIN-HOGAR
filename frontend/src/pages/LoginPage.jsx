import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { loginSchema } from "../validations/authValidation.js";
import "../styles/login.css";

const CLAVE_CORREO = "huellas.correo-recordado";

function leerCorreo() {
  try {
    const resultado = loginSchema.shape.email.safeParse(
      localStorage.getItem(CLAVE_CORREO)
    );

    return resultado.success ? resultado.data : "";
  } catch {
    return "";
  }
}

function recordarCorreo(correo) {
  try {
    if (correo) {
      localStorage.setItem(CLAVE_CORREO, correo);
    } else {
      localStorage.removeItem(CLAVE_CORREO);
    }
  } catch {
    // Recordar el correo es opcional si el navegador
    // bloquea el almacenamiento.
  }
}

function IconoOjo({ visible }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {visible && <path d="m3 3 18 18" />}
    </svg>
  );
}

export default function LoginPage({
  onLogin,
  mensajeSesion = "",
}) {
  const [email, setEmail] = useState(leerCorreo);
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(
    () => Boolean(leerCorreo())
  );
  const [mostrarPassword, setMostrarPassword] =
    useState(false);
  const [mayusculas, setMayusculas] = useState(false);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const correoRef = useRef(null);
  const passwordRef = useRef(null);

  function cambiar(campo, valor) {
    if (campo === "email") {
      setEmail(valor);
    } else {
      setPassword(valor);
    }

    setErrores((actuales) => ({
      ...actuales,
      [campo]: "",
    }));
    setError("");
  }

  async function enviar(evento) {
    evento.preventDefault();

    if (enviando) return;

    setError("");
    setErrores({});

    const validacion = loginSchema.safeParse({
      email,
      password,
    });

    if (!validacion.success) {
      setErrores(
        Object.fromEntries(
          validacion.error.issues.map((issue) => [
            issue.path[0],
            issue.message,
          ])
        )
      );

      const referencia =
        validacion.error.issues[0].path[0] === "email"
          ? correoRef
          : passwordRef;

      referencia.current?.focus();
      return;
    }

    setEnviando(true);

    try {
      await onLogin(validacion.data);

      recordarCorreo(
        recordar ? validacion.data.email : ""
      );
    } catch (errorLogin) {
      setError(
        errorLogin instanceof TypeError
          ? "No se pudo contactar con el servidor. Intenta nuevamente."
          : errorLogin.message ||
              "No se pudo iniciar sesión."
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section
      className="login-pagina"
      aria-labelledby="login-marca"
    >
      <div className="login-contenedor">
        <header className="login-marca">
          <span className="login-logo" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="currentColor">
              <ellipse
                cx="15"
                cy="25"
                rx="6"
                ry="8"
                transform="rotate(-25 15 25)"
              />
              <ellipse
                cx="27"
                cy="16"
                rx="6"
                ry="8"
                transform="rotate(-8 27 16)"
              />
              <ellipse
                cx="40"
                cy="17"
                rx="6"
                ry="8"
                transform="rotate(12 40 17)"
              />
              <ellipse
                cx="51"
                cy="27"
                rx="6"
                ry="8"
                transform="rotate(28 51 27)"
              />
              <path d="M32 29c-7 0-10 7-15 13-7 9-1 17 7 14 6-3 10-3 16 0 9 4 16-5 9-14-5-6-9-13-17-13Z" />
            </svg>
          </span>

          <h1 id="login-marca">Huellas Sin Hogar</h1>
          <p>Acceso del equipo del refugio</p>
        </header>

        <div className="login-tarjeta">
          <h2 id="login-titulo">Iniciar sesión</h2>

          <p className="login-introduccion">
            Ingresa con tu cuenta del refugio.
          </p>

          {mensajeSesion && (
            <p className="login-notificacion" role="status">
              {mensajeSesion}
            </p>
          )}

          <form
            onSubmit={enviar}
            noValidate
            aria-labelledby="login-titulo"
            aria-busy={enviando}
          >
            <fieldset
              className="login-campos"
              disabled={enviando}
            >
              <legend className="login-solo-lectores">
                Datos de acceso
              </legend>

              <div className="login-campo">
                <label htmlFor="login-email">
                  Correo electrónico
                </label>

                <input
                  ref={correoRef}
                  id="login-email"
                  name="email"
                  type="email"
                  className="login-input"
                  placeholder="nombre@ejemplo.cl"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={254}
                  value={email}
                  autoFocus
                  required
                  aria-invalid={Boolean(errores.email)}
                  aria-describedby={
                    errores.email
                      ? "login-error-email"
                      : undefined
                  }
                  onChange={(e) =>
                    cambiar("email", e.target.value)
                  }
                />

                {errores.email && (
                  <p
                    id="login-error-email"
                    className="login-error-campo"
                    role="alert"
                  >
                    {errores.email}
                  </p>
                )}
              </div>

              <div className="login-campo">
                <label htmlFor="login-password">
                  Contraseña
                </label>

                <div className="login-password">
                  <input
                    ref={passwordRef}
                    id="login-password"
                    name="password"
                    type={
                      mostrarPassword
                        ? "text"
                        : "password"
                    }
                    className="login-input"
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    maxLength={256}
                    value={password}
                    required
                    aria-invalid={Boolean(
                      errores.password
                    )}
                    aria-describedby={
                      [
                        errores.password
                          ? "login-error-password"
                          : "",
                        mayusculas
                          ? "login-mayusculas"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                    onChange={(e) =>
                      cambiar("password", e.target.value)
                    }
                    onKeyDown={(e) =>
                      setMayusculas(
                        e.getModifierState("CapsLock")
                      )
                    }
                    onKeyUp={(e) =>
                      setMayusculas(
                        e.getModifierState("CapsLock")
                      )
                    }
                    onBlur={() => setMayusculas(false)}
                  />

                  <button
                    className="login-ojo"
                    type="button"
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    aria-pressed={mostrarPassword}
                    aria-controls="login-password"
                    onClick={() =>
                      setMostrarPassword(
                        (actual) => !actual
                      )
                    }
                  >
                    <IconoOjo visible={mostrarPassword} />
                  </button>
                </div>

                {errores.password && (
                  <p
                    id="login-error-password"
                    className="login-error-campo"
                    role="alert"
                  >
                    {errores.password}
                  </p>
                )}

                {mayusculas && (
                  <p
                    id="login-mayusculas"
                    className="login-aviso"
                    role="status"
                  >
                    Bloq Mayús está activado.
                  </p>
                )}
              </div>

              <label className="login-recordar">
                <input
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) => {
                    setRecordar(e.target.checked);

                    if (!e.target.checked) {
                      recordarCorreo("");
                    }
                  }}
                />
                <span>Recordar mi correo</span>
              </label>

              {error && (
                <p
                  className="login-notificacion login-notificacion-error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                className="login-enviar"
                type="submit"
              >
                {enviando && (
                  <span
                    className="login-cargando"
                    aria-hidden="true"
                  />
                )}

                {enviando
                  ? "Ingresando..."
                  : "Iniciar sesión"}
              </button>
            </fieldset>
          </form>

          <details className="login-ayuda">
            <summary>
              ¿Necesitas ayuda para ingresar?
            </summary>

            <p>
              Si olvidaste tu contraseña o tu cuenta está
              desactivada, solicita ayuda a la directora
              del refugio.
            </p>
          </details>
        </div>

        <Link className="login-volver" to="/">
          ← Volver al inicio
        </Link>
      </div>
    </section>
  );
}