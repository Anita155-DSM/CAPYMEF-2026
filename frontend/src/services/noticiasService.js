const API_URL = "http://localhost:3000/api/noticias";

export const publicarNuevaNoticia = async (formData) => {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/admin`, {
            method: "POST",
            headers: {
                // MANDAMOS EL TOKEN PARA DEMOSTRAR QUE SOMOS ADMIN
                "Authorization": `Bearer ${token}`
                // No ponemos un content-type porque sino no se sube la imagen, formdata lo hace solo
            },
            body: formData, // Le pasamos el paquete de datos tal cual
        });

        return await response.json();
    } catch (error) {
        console.error("Error al publicar la noticia:", error);
        throw new Error("Error de conexión con el servidor");
    }
};