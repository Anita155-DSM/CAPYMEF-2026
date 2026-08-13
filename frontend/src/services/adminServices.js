// import dotenv from "dotenv"
// dotenv.config()
// const API_URL = process.env.API_URL
const API_URL = "http://localhost:3000/api/admin"
export const obtenerTodosLosUsuarios = async () => {
    try {
        const token = localStorage.getItem("token");

        // Acá cambiamos a la nueva ruta /usuarios
        const response = await fetch(`${API_URL}/usuarios`, {
            method: "GET",
            headers: {
                "Content-type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        return await response.json();
    } catch (error) {
        console.error("Error obteniendo usuarios:", error);
        throw new Error("Error de conexión con el servidor");
    }
};