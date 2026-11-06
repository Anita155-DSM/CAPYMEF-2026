import { useState, useEffect } from "react";
import { FaRegSave, FaUserSlash } from "react-icons/fa";
import { toast } from "sonner";
import { actualizarDatosSocio } from "../../../services/adminServices.js"; 

export default function ModalEditarSocio({ socio, onClose, onActualizado }) {
    if (!socio) return null;

    // El estado AHORA SOLO TIENE los 4 campos permitidos por el backend
    const [form, setForm] = useState({
        categoria: socio.categoria || "",
        rubro: socio.rubro || "",
        localidad: socio.localidad || "",
        estado: socio.estado || "aprobado",
    });

    const [procesando, setProcesando] = useState(false);

    useEffect(() => {
        if (socio) {
            setForm({
                categoria: socio.categoria,
                rubro: socio.rubro,
                localidad: socio.localidad,
                estado: socio.estado,
            });
        }
    }, [socio]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcesando(true);
        try {
            const result = await actualizarDatosSocio(socio.id, form);
            if (result.exito) {
                toast.success("Datos del socio actualizados correctamente.");
                onActualizado(); 
                onClose();       
            } else {
                toast.error("Error: " + result.mensaje);
            }
        } catch (error) {
            toast.error("Error al intentar conectarse con el servidor.");
        } finally {
            setProcesando(false);
        }
    };

    const handleInactivar = async () => {
        const confirmar = window.confirm(`¿Estás seguro que deseas INACTIVAR a ${socio.razonSocial}?`);
        if (!confirmar) return;

        setProcesando(true);
        try {
            // Mandamos los mismos datos, pero forzamos el estado a 'inactivo'
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

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-6">
                    
                    {/* Tarjeta de información (Solo Lectura) */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">Información de contacto (No editable)</p>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                            <p><strong>CUIT:</strong> {socio.cuit}</p>
                            <p><strong>Email:</strong> {socio.email}</p>
                            <p><strong>Teléfono:</strong> {socio.telefono}</p>
                        </div>
                    </div>

                    {/* Campos Editables */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-700 text-sm">Categoría</label>
                            <select name="categoria" value={form.categoria} onChange={handleChange} className="p-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:border-[#1D7BB6]">
                                <option value="activo">Activo</option>
                                <option value="adherente">Adherente</option>
                                <option value="padrino">Padrino</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-700 text-sm">Rubro</label>
                            <select name="rubro" value={form.rubro} onChange={handleChange} className="p-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:border-[#1D7BB6]">
                                <option value="Comercio">Comercio</option>
                                <option value="Industria">Industria</option>
                                <option value="Servicios">Servicios</option>
                                <option value="Agropecuario">Agropecuario</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-700 text-sm">Localidad</label>
                            <input type="text" name="localidad" value={form.localidad} onChange={handleChange} required className="p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#1D7BB6]" />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="font-bold text-gray-700 text-sm">Estado del Socio</label>
                            <select name="estado" value={form.estado} onChange={handleChange} className="p-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:border-[#1D7BB6]">
                                <option value="aprobado">Aprobado (Activo)</option>
                                <option value="inactivo">Inactivo (Suspendido)</option>
                            </select>
                        </div>
                    </div>

                    {/* Footer con botones */}
                    <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                        {form.estado !== "inactivo" ? (
                            <button 
                                type="button" 
                                onClick={handleInactivar} 
                                disabled={procesando}
                                className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white font-semibold rounded-md flex items-center gap-2 text-sm transition-colors"
                            >
                                <FaUserSlash /> Dar de baja
                            </button>
                        ) : (
                            <span className="text-red-500 font-bold text-sm bg-red-50 px-3 py-1 rounded">Este socio está dado de baja</span>
                        )}

                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md text-sm transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" disabled={procesando} className="px-5 py-2 bg-[#00B859] hover:bg-[#009649] text-white font-semibold rounded-md flex items-center gap-2 text-sm shadow-sm transition-colors">
                                <FaRegSave /> {procesando ? "Guardando..." : "Guardar Cambios"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}