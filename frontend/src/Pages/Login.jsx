import { useForm } from "../Hooks/useForm.js";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const { formState, handleChange } = useForm({
    username: "",
    password: "",
  });
  const handleLogin = async (e) => {
    e.preventDefault();
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      body: JSON.stringify(formState),
      headers: {
        "Content-type": "application/json",
      },
      credentials: "include",
    });
    const data = await response.json();
    alert("Logueado");
    navigate("/home");
  };
  return (
    <>
      <div>
        <h1>Login</h1>
      </div>
      <div>

      <form onSubmit={handleLogin}>
        <input type="text" name="username" value={formState.username} onChange={handleChange}/>
        <input type="text" name="password" value={formState.password} onChange={handleChange}/>
        <button type="submit">LOGUEARSE</button>
      </form>
      </div>
    </>
  );
}
