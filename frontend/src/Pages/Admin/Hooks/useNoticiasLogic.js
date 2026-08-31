import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
// Cambiamos a la función de admin para que traiga todo (borradores y publicados)
import { obtenerNoticiasPublicas, publicarNuevaNoticia } from "../../../services/noticiasService.js";
import { toast } from "sonner";

export function useNoticiasLogic() {
    const [vistaActual, setVistaActual] = useState("lista");
    const [busqueda, setBusqueda] = useState("");
    const [pestañaActiva, setPestañaActiva] = useState("Noticias");

    const [noticias, setNoticias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [estaPublicando, setEstaPublicando] = useState(false);

    const { register, handleSubmit, reset } = useForm({
        defaultValues: { visibilidad: "todos", estado: "publicado" }
    });
    const [imagenPreview, setImagenPreview] = useState(null);
    const [imagenArchivo, setImagenArchivo] = useState(null);

    const cargarNoticias = async () => {
        setCargando(true);
        try {
            // Usamos el endpoint de administración
            const result = await obtenerNoticiasPublicas();
            if (result.exito) {
                setNoticias(result.data);
            } else {
                console.error("Error de base de datos:", result.mensaje);
            }
        } catch (error) {
            console.error("Error en la petición:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarNoticias();
    }, []);

    const handleImagen = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagenArchivo(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagenPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data) => {
        setEstaPublicando(true);
        try {
            const formData = new FormData();
            formData.append("titulo", data.titulo);
            formData.append("contenido", data.contenido);
            formData.append("visibilidad", data.visibilidad);
            formData.append("estado", data.estado);

            if (data.subtitulo) formData.append("subtitulo", data.subtitulo);
            if (imagenArchivo) formData.append("imagen", imagenArchivo);

            const result = await publicarNuevaNoticia(formData);

            if (result.exito) {
                toast.success("¡Noticia publicada con éxito en la base de datos!");
                reset();
                setImagenPreview(null);
                setImagenArchivo(null);
                setVistaActual("lista");
                cargarNoticias();
            } else {
                toast.error("Error al publicar: " + result.mensaje);
            }
        } catch (error) {
            toast.error("Hubo un error al intentar conectarse con el servidor.");
            console.error(error);
        } finally {
            setEstaPublicando(false);
        }
    };

    const noticiasFiltradas = useMemo(() => {
        return noticias.filter((n) => 
            n.titulo?.toLowerCase().includes(busqueda.toLowerCase())
        );
    }, [noticias, busqueda]);

    return {
        vistaActual, setVistaActual,
        busqueda, setBusqueda,
        pestañaActiva, setPestañaActiva,
        noticiasFiltradas, cargando,
        register, handleSubmit, reset,
        imagenPreview, handleImagen,
        onSubmit, estaPublicando,
        recargarNoticias: cargarNoticias // Exportamos esto por si el modal necesita refrescar la grilla al editar
    };
}