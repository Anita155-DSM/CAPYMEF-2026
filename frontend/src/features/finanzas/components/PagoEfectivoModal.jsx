import { useState } from "react";
import { toast } from "sonner";
import ModalShell from "@/shared/ui/ModalShell";
import { useBloquearScroll } from "@/shared/hooks/useBloquearScroll";
import { btnCancelarClase, btnGuardarClase, inputClase } from "@/shared/ui/estilos";
import { registrarPagoEfectivo } from "@/services/finanzasServices";
import { formatearMonto, nombreCuota } from "../utils/cuotas";

/** Confirma el cobro en efectivo de una cuota. Renderizar solo cuando está abierto: {cuota && <PagoEfectivoModal … />} */
export default function PagoEfectivoModal({ cuota, onRegistrado, onClose }) {
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  useBloquearScroll();

  const cerrar = () => !guardando && onClose();

  const confirmar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    const resultado = await registrarPagoEfectivo(cuota, observaciones);
    setGuardando(false);

    if (!resultado.exito) return setError(resultado.mensaje || "No se pudo registrar el pago.");
    toast.success("Pago en efectivo registrado.");
    onRegistrado(cuota.id);
    onClose();
  };

  return (
    <ModalShell titulo="Registrar pago en efectivo" onClose={cerrar} ancho="max-w-lg">
      <form onSubmit={confirmar} className="flex flex-col gap-4 p-6">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg bg-surface p-4 text-sm">
          <dt className="font-semibold text-gray-500">Socio</dt>
          <dd className="font-medium text-navy wrap-break-word">{cuota.socio?.razonSocial ?? "Socio eliminado"}</dd>
          <dt className="font-semibold text-gray-500">Cuota</dt>
          <dd className="text-gray-700">{nombreCuota(cuota.mes_anio)}</dd>
          <dt className="font-semibold text-gray-500">Monto</dt>
          <dd className="font-bold text-gray-800">{formatearMonto(cuota.monto)}</dd>
        </dl>

        <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
          Observaciones (opcional)
          <textarea
            rows={3}
            maxLength={300}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Ej: lo abonó en la sede, recibió Tesorería"
            className={`${inputClase} resize-none font-normal`}
          />
        </label>

        <p className="text-xs text-gray-500">
          La cuota quedará como pagada y el socio recibirá el aviso y su comprobante. Esta acción no se puede deshacer desde acá.
        </p>

        {error && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={cerrar} disabled={guardando} className={btnCancelarClase}>Cancelar</button>
          <button type="submit" disabled={guardando} className={btnGuardarClase}>{guardando ? "Registrando..." : "Confirmar pago"}</button>
        </div>
      </form>
    </ModalShell>
  );
}
