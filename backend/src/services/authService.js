import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { AuthError } from "../entities/authErrors.js";
import { loginSchema } from "../validations/authValidation.js";
import * as repositorio from "../repositories/usuarioRepository.js";

const opcionesJWT = {
    algorithm: "HS256",
    issuer: "huellas-backend",
    audience: "huellas-frontend",
};

const claimsSchema = z.object({
    sub: z.string().regex(/^[1-9]\d*$/),
    version: z.number().int().nonnegative(),
    exp: z.number().int(),
});

function obtenerSecreto() {
    const secreto = process.env.JWT_SECRET;

if (!secreto || Buffer.byteLength(secreto) < 32) {
    throw new Error(
        "Configura JWT_SECRET con al menos 32 bytes aleatorios"
    );
}

    return secreto;
}   

export function usuarioPublico(usuario) {
    return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    voluntarioId: usuario.voluntarioId,
    };
}

export function crearAuthService({
    repo = repositorio,
    secreto = obtenerSecreto,
} = {}) {
    let hashDummy;

  // También compara un hash cuando el correo no existe.
const obtenerHashDummy = () =>
    (hashDummy ??= bcrypt.hash("comparacion-interna-sin-cuenta", 12));

    return {
    async login(entrada) {
        const { email, password } = loginSchema.parse(entrada);
        const clave = secreto();
        const usuario = await repo.buscarUsuarioPorEmail(email);
        const hash =usuario?.passwordHash ?? (await obtenerHashDummy());
        const coincide = await bcrypt.compare(password, hash);

    if (
        !usuario ||
        !coincide ||
        !usuario.activo ||
        bcrypt.truncates(password)
    ) {
        throw new AuthError(
            "Correo o contraseña incorrectos",
            401,
            "CREDENCIALES_INVALIDAS"
        );
    }

        const token = jwt.sign(
        { version: usuario.tokenVersion },
        clave,
        {
            ...opcionesJWT,
            subject: String(usuario.id),
            expiresIn: "15m",
        }
    );

        return {
        token,
        usuario: usuarioPublico(usuario),
    };
},

    async autenticar(token) {
        const clave = secreto();
        let claims;

    try {
        const contenido = jwt.verify(token, clave, {
            algorithms: ["HS256"],
            issuer: opcionesJWT.issuer,
            audience: opcionesJWT.audience,
        });

        claims = claimsSchema.parse(contenido);
    } catch {
        throw new AuthError("Inicia sesión nuevamente");
    }

        const id = Number(claims.sub);

    if (!Number.isSafeInteger(id)) {
        throw new AuthError("Sesión inválida");
    }

    const usuario = await repo.buscarUsuarioPorId(id);

    if (
        !usuario?.activo ||
        usuario.tokenVersion !== claims.version
    ) {
        throw new AuthError("Inicia sesión nuevamente");
    }

        return usuario;
    },

    async logout(id) {
        await repo.invalidarSesiones(id);
        },
    };
}

export default crearAuthService();