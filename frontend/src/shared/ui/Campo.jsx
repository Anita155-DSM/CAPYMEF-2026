/**
 * Etiqueta + control de formulario.
 *   <Campo label="Título *"><input className={inputClase} … /></Campo>
 */
export default function Campo({ label, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="font-bold text-gray-700 text-sm">{label}</label>
      {children}
    </div>
  );
}
