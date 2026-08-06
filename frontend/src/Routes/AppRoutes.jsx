import { Route, Routes, Navigate } from "react-router-dom";
import Login from "../Pages/Login";
import Register from "../Pages/Register";
import PrivateRoutes from "./PrivateRoutes";
import PublicRoutes from "./PublicROutes";
import Home from "../Pages/Home";
import Profile from "../Pages/PRofile";
export default function AppRoutes() {
  return (
    <>
      <Routes>     
           <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />

        <Route element={<PublicRoutes />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to={"/login"} />} />
          <Route path="*" element={<Navigate to={"/login "} />} />
        </Route>
        <Route element={<PrivateRoutes/>}>
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<Navigate to={"/home"} />} />
          <Route path="*" element={<Navigate to={"/home"} />} />
        </Route>
      </Routes>
    </>
  );
}
