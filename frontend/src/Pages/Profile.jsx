import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/profile", {
        credentials: "include",
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.log(error);
      navigate("/login");
    }
  };
  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <>
      <div>
        <h1>Profile</h1>
        {user ? (
          <div>
            <h1>
              El id de tu user es: {user.id} y su nombre es: {user.name}
            </h1>
          </div>
        ) : (
          <h1>Cargando...</h1>
        )}
      </div>
    </>
  );
}
