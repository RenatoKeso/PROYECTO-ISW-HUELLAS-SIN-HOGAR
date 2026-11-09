export default function Mensaje({ mensaje }) {
  if (!mensaje) return null;

  return <p className={`mensaje mensaje-${mensaje.tipo}`}>{mensaje.texto}</p>;
}
