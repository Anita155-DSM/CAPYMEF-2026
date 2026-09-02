import { useState, useEffect } from "react";
import { FaRegSave, FaUserSlash } from "react-icons/fa";
import { toast } from "sonner";
// Importá acá tu servicio para actualizar al socio (tendrás que crearlo en adminServices si no existe)
import { actualizarDatosSocio } from "../../../services/adminServices.js";

export default function ModalEditarSocio({ socio, onClose, onActualizado }) {
    if (!socio) return null;

    const [form, setForm] = useState({
        razonSocial: socio.razonSocial || "",
        cuit: socio.cuit || "",
        email: socio.email || "",
        telefono: socio.telefono || "",
        categoria: socio.categoria || "",
        rubro: socio.rubro || "",
        localidad: socio.localidad || "",
        estado: socio.estado || "aprobado",
    });

    const [procesando, setProcesando] = useState(false);

    // Si la prop 'socio' cambia, reseteamos el formulario
    useEffect(() => {
        if (socio) {
            setForm({
                razonSocial: socio.razonSocial,
                cuit: socio.cuit,
                email: socio.email,
                telefono: socio.telefono,
                categoria: socio.categoria,
                rubro: socio.rubro,
                localidad: socio.localidad,
                estado: socio.estado,
            });
        }
    }, [socio]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // Función para guardar cambios normales
    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcesando(true);
        try {
            // Se asume que tenés una función en adminServices para hacer el PUT/PATCH
            const result = await actualizarDatosSocio(socio.id, form);
            if (result.exito) {
                toast.success("Datos del socio actualizados correctamente.");
                onActualizado(); // Recarga la tabla
                onClose();       // Cierra el modal
            } else {
                toast.error("Error: " + result.mensaje);
            }
        } catch (error) {
            toast.error("Error al intentar conectarse con el servidor.");
        } finally {
            setProcesando(false);
        }
    };

    // Función específica para Inactivar
    const handleInactivar = async () => {
        const confirmar = window.confirm(`¿Estás seguro que deseas INACTIVAR a ${socio.razonSocial}?`);
        if (!confirmar) return;

        setProcesando(true);
        try {
            // Mandamos el mismo formulario pero forzando el estado a 'inactivo'
            const result = await actualizarDatosSocio(socio.id, { ...form, estado: "inactivo" });
            if (result.exito) {
                toast.success(`El socio ${socio.razonSocial} ha sido inactivado.`);
                onActualizado();
                onClose();
            } else {
                toast.error("Error al inactivar: " + result.mensaje);
            }
        } catch (error) {
            toast.error("Error de conexión al inactivar.");
        } finally {
            setProcesando(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden relative">

                <div className="bg-[#132A46] p-4 text-white flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold">Editar Socio: {socio.razonSocial}</h3>
                    <button onClick={onClose} className="text-gray-300 hover:text-white text-2xl font-bold">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-700 text-sm">Razón Social</label>
                            <input type="text" name="razonSocial" value={form.razonSocial} onChange={handleChange} required className="p-2 border rounded-md text-sm focus:border-[#1D7BB6]" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-700 text-sm">CUIT</label>
                            <input type="text" name="cuit" value={form.cuit} onChange={handleChange} required className="p-2 border rounded-md text-sm focus:border-[#1D7BB6]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-700 text-sm">Email</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} required className="p-2 border rounded-md text-sm focus:border-[#1D7BB6]" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-700 text-sm">Teléfono</label>
                            <input type="text" name="telefono" value={form.telefono} onChange={handleChange} required className="p-2 border rounded-md text-sm focus:border-[#1D7BB6]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-700 text-sm">Categoría</label>
                            <select name="categoria" value={form.categoria} onChange={handleChange} className="p-2 border rounded-md text-sm">
                                <option value="activo">Activo</option>
                                <option value="adherente">Adherente</option>
                                <option value="padrino">Padrino</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-700 text-sm">Rubro</label>
                            <select name="rubro" value={form.rubro} onChange={handleChange} className="p-2 border rounded-md text-sm">
                                <option value="Comercio">Comercio</option>
                                <option value="Industria">Industria</option>
                                <option value="Servicios">Servicios</option>
                                <option value="Agropecuario">Agropecuario</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-700 text-sm">Localidad</label>
                            <input type="text" name="localidad" value={form.localidad} onChange={handleChange} required className="p-2 border rounded-md text-sm focus:border-[#1D7BB6]" />
                        </div>
                    </div>

                    {/* Footer con botones */}
                    <div className="pt-6 mt-2 border-t border-gray-200 flex justify-between items-center">
                        {/* Botón de inactivar solo aparece si el socio NO está inactivo */}
                        {form.estado !== "inactivo" ? (
                            <button
                                type="button"
                                onClick={handleInactivar}
                                disabled={procesando}
                                className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white font-semibold rounded-md flex items-center gap-2 text-sm transition-colors"
                            >
                                <FaUserSlash /> Dar de baja (Inactivar)
                            </button>
                        ) : (
                            <span className="text-red-500 font-bold text-sm bg-red-50 px-3 py-1 rounded">Este socio está inactivo</span>
                        )}

                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md text-sm">
                                Cancelar
                            </button>
                            <button type="submit" disabled={procesando} className="px-5 py-2 bg-[#00B859] hover:bg-[#009649] text-white font-semibold rounded-md flex items-center gap-2 text-sm shadow-sm">
                                <FaRegSave /> {procesando ? "Guardando..." : "Guardar Cambios"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}