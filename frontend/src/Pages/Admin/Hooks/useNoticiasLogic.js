import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { obtenerNoticiasPublicas, publicarNuevaNoticia } from "../../../services/noticiasService.js";

export function useNoticiasLogic() {
    // Estados de navegación visual
    const [vistaActual, setVistaActual] = useState("lista"); // "lista" o "formulario"
    const [busqueda, setBusqueda] = useState("");
    const [pestañaActiva, setPestañaActiva] = useState("Noticias");

    // Estados de datos
    const [noticias, setNoticias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [estaPublicando, setEstaPublicando] = useState(false);

    // Estados del formulario (React Hook Form + Imágenes)
    const { register, handleSubmit, reset } = useForm({
        defaultValues: { visibilidad: "todos", estado: "publicado" }
    });
    const [imagenPreview, setImagenPreview] = useState(null);
    const [imagenArchivo, setImagenArchivo] = useState(null);

    // Fetch para cargar la tabla
    const cargarNoticias = async () => {
        setCargando(true);
        try {
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

    // Cargamos al montar el componente
    useEffect(() => {
        cargarNoticias();
    }, []);

    // Manejador del archivo de imagen
    const handleImagen = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagenArchivo(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagenPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    // Manejador de la publicación
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
                alert("¡Noticia publicada con éxito en la base de datos!");
                reset();
                setImagenPreview(null);
                setImagenArchivo(null);
                setVistaActual("lista"); // Volvemos al listado visualmente
                cargarNoticias(); // Refrescamos las tarjetas con el nuevo dato
            } else {
                alert("Error al publicar: " + result.mensaje);
            }
        } catch (error) {
            alert("Hubo un error al intentar conectarse con el servidor.");
            console.error(error);
        } finally {
            setEstaPublicando(false);
        }
    };

    // Buscador en memoria ultra rápido
    const noticiasFiltradas = useMemo(() => {
        return noticias.filter((n) => 
            n.titulo?.toLowerCase().includes(busqueda.toLowerCase())
        );
    }, [noticias, busqueda]);

    // Retornamos todas las variables y funciones que la vista necesita
    return {
        vistaActual, setVistaActual,
        busqueda, setBusqueda,
        pestañaActiva, setPestañaActiva,
        noticiasFiltradas, cargando,
        register, handleSubmit, reset,
        imagenPreview, handleImagen,
        onSubmit, estaPublicando
    };
}