import { useEffect, useRef } from "react";

function esVentanaSuperior(contenedor) {
  const ventanas = document.querySelectorAll('.ventana-fondo [role="dialog"]');
  return ventanas.length === 0 || ventanas[ventanas.length - 1] === contenedor;
}

function VentanaModal({
  titulo,
  ariaLabel,
  ariaLabelledby,
  alCerrar,
  children,
  className = "",
  sinBotonCerrar = false,
}) {
  const cerrarRef = useRef(null);
  const contenedorRef = useRef(null);

  useEffect(() => {
    const elementoAnterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    (cerrarRef.current ?? contenedorRef.current)?.focus();

    function manejarTecla(evento) {
      if (evento.key === "Escape" && esVentanaSuperior(contenedorRef.current)) alCerrar();
    }

    document.addEventListener("keydown", manejarTecla);

    return () => {
      document.removeEventListener("keydown", manejarTecla);
      document.body.style.overflow = overflowAnterior;
      elementoAnterior?.focus?.();
    };
  }, [alCerrar]);

  return (
    <div
      className="ventana-fondo"
      onClick={() => {
        if (esVentanaSuperior(contenedorRef.current)) alCerrar();
      }}
    >
      <div
        ref={contenedorRef}
        className={`ventana-contenido ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabelledby ? undefined : (ariaLabel ?? titulo)}
        aria-labelledby={ariaLabelledby}
        tabIndex={-1}
        onClick={(evento) => evento.stopPropagation()}
      >
        {!sinBotonCerrar && (
          <button
            ref={cerrarRef}
            type="button"
            className="ventana-cerrar"
            onClick={alCerrar}
            aria-label="Cerrar ventana"
          >
            ✕
          </button>
        )}

        {titulo && <h2 className="ventana-titulo">{titulo}</h2>}

        <div className="ventana-cuerpo">{children}</div>
      </div>
    </div>
  );
}

export default VentanaModal;
