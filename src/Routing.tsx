import { Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import WoodenCasesSite from "./home/home.tsx";
import Login from "./home/Login.tsx";
import './styles/theme.css';
import { Register } from "./home/Register.tsx";


export default function Main() {
return (
    <Routes>
      <Route path="/" element={<WoodenCasesSite />} />
      <Route path="/kumiko" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

