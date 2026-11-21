export default function PaginacionSanitaria({
pagina,
hayMas,
cambiar,
etiqueta,
bloqueada = false,
}) {
if (pagina === 1 && !hayMas) return null;

return (
    <nav className="salud-paginas" aria-label={etiqueta}>
        <button
        type="button"
        disabled={bloqueada || pagina === 1}
        onClick={() => cambiar(pagina - 1)}
    >
        Anterior
        </button>
        <span>Página {pagina}</span>
        <button
        type="button"
        disabled={bloqueada || !hayMas}
        onClick={() => cambiar(pagina + 1)}
    >
        Siguiente
        </button>
    </nav>
);
}