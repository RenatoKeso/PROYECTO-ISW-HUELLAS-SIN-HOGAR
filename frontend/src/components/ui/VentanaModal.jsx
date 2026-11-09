import { useEffect, useRef } from "react";

function VentanaModal({
  titulo,
  ariaLabel,
  alCerrar,
  children,
  className = "",
}) {
  const cerrarRef = useRef(null);

  useEffect(() => {
    const elementoAnterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    cerrarRef.current?.focus();

    function manejarTecla(evento) {
      if (evento.key === "Escape") alCerrar();
    }

    document.addEventListener("keydown", manejarTecla);

    return () => {
      document.removeEventListener("keydown", manejarTecla);
      document.body.style.overflow = overflowAnterior;
      elementoAnterior?.focus?.();
    };
  }, [alCerrar]);

  return (
    <div className="ventana-fondo" onClick={alCerrar}>
      <div
        className={`ventana-contenido ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? titulo}
        onClick={(evento) => evento.stopPropagation()}
      >
        <button
          ref={cerrarRef}
          type="button"
          className="ventana-cerrar"
          onClick={alCerrar}
          aria-label="Cerrar ventana"
        >
          ✕
        </button>

        {titulo && <h2 className="ventana-titulo">{titulo}</h2>}

        <div className="ventana-cuerpo">{children}</div>
      </div>
    </div>
  );
}

export default VentanaModal;
