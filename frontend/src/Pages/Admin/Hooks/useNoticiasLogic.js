import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { obtenerTodasLasNoticiasAdmin, publicarNuevaNoticia } from "../../../services/noticiasService.js";

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
            const result = await obtenerTodasLasNoticiasAdmin();
            if (result.exito) {
                setNoticias(result.data);
            }
        } catch (error) {
            console.error("Error:", error);
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
        const cargarNoticias = async () => {
            setCargando(true);
            try {
                const result = await obtenerTodasLasNoticiasAdmin();
                if (result.exito) {
                    // Si por algún motivo result.data no es un array, le pasamos un array vacío []
                    setNoticias(Array.isArray(result.data) ? result.data : []);
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setCargando(false);
            }
        };
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
        recargarNoticias: cargarNoticias
    };
}