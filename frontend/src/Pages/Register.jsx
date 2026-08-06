import { useNavigate } from "react-router-dom";
import { useForm } from "../hooks/useForm.js";

export default function Register() {
  const navigate = useNavigate();
  const { formState, handleChange } = useForm({
    username: "",
    password: "",
    email: "",
    name: "",
    lastname: "",
  });

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        body: JSON.stringify(formState),
        //Aca rellenamos el campo del body con nuestros datos
        headers: {
          "Content-type": "application/json",
        },
      });
      if (!response.ok) throw new Error();

      const data = await response.json();
      console.log(data)
      alert("Registrado Correctamente");
      navigate("/login");
    } catch (error) {
      throw new Error(error);
    }
  };
  return (
    <>
    <div>
      <div>
        <h1>Register</h1>
      </div>

        <form onSubmit={handleRegister}>
        <p>username</p>
      <input name="username" value={formState.username} onChange={handleChange} />
       <p>password</p>
      <input name="password" value={formState.password} onChange={handleChange} />
       <p>email</p>
      <input  name="email" value={formState.email} onChange={handleChange} />
       <p>name</p>
      <input  name="name" value={formState.name} onChange={handleChange} />
       <p>lastname</p>
      <input  name="lastname" value={formState.lastname} onChange={handleChange} />
      <button type="submit"> BOTON</button>
       </form> 
      </div>
    </>
  );
}
