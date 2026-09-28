function Campo({
  etiqueta,
  nombre,
  valor,
  error,
  control = "input",
  opciones = [],
  ancho = false,
  ...props
}) {
  return (
    <div className={ancho ? "campo campo-ancho" : "campo"}>
      <label htmlFor={nombre}>{etiqueta}</label>

      {control === "select" ? (
        <select
          id={nombre}
          name={nombre}
          value={valor}
          aria-invalid={Boolean(error)}
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
          {...props}
        />
      ) : (
        <input
          id={nombre}
          name={nombre}
          value={valor}
          aria-invalid={Boolean(error)}
          {...props}
        />
      )}

      {error && <span className="campo-error">{error}</span>}
    </div>
  );
}

export default Campo;
