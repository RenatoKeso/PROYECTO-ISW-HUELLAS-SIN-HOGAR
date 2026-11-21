function Campo({
  etiqueta,
  nombre,
  valor,
  error,
  control = "input",
  opciones = [],
  ancho = false,
  requerido = false,
  opcional = false,
  icono = null,
  opcionalPildora = false,
  ...props
}) {
  const controlElemento =
    control === "select" ? (
      <select
        id={nombre}
        name={nombre}
        value={valor}
        aria-invalid={Boolean(error)}
        aria-required={requerido || undefined}
        {...props}
      >
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.texto}
          </option>
        ))}
      </select>
    ) : control === "textarea" ? (
      <textarea
        id={nombre}
        name={nombre}
        value={valor}
        aria-invalid={Boolean(error)}
        aria-required={requerido || undefined}
        {...props}
      />
    ) : (
      <input
        id={nombre}
        name={nombre}
        value={valor}
        aria-invalid={Boolean(error)}
        aria-required={requerido || undefined}
        {...props}
      />
    );

  return (
    <div className={ancho ? "campo campo-ancho" : "campo"}>
      <label htmlFor={nombre}>
        {etiqueta}
        {requerido && (
          <span className="campo-requerido" aria-hidden="true">
            {" "}
            *
          </span>
        )}
        {opcional &&
          (opcionalPildora ? (
            <span className="campo-opcional campo-opcional-pildora">
              Opcional
            </span>
          ) : (
            <span className="campo-opcional"> (Opcional)</span>
          ))}
      </label>

      {icono ? (
        <div className="campo-control-icono">
          {controlElemento}
          <span
            className="material-symbols-outlined campo-icono"
            aria-hidden="true"
          >
            {icono}
          </span>
        </div>
      ) : (
        controlElemento
      )}

      {error && <span className="campo-error">{error}</span>}
    </div>
  );
}

export default Campo;
