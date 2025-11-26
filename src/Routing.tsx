import { Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import ProductTemplate from "./home/ProductTemplate.tsx";
import Login from "./home/Login.tsx";
import './styles/theme.css';
import { Register } from "./home/Register.tsx";
import Feedback from "./home/Feedback.tsx";
function VariationDropdown() {
  return (
    <select value={"small"} onChange={(e) => console.log(e.target.value)}>
      <option value="small">Klein</option>
      <option value="medium">Mittel</option>
      <option value="large">Groß</option>
    </select>
  );
}

export default function Main() {
return (
    <Routes>
      <Route path="/" element={<Feedback />} />
      <Route path="/etui" element={
        <ProductTemplate
        title="Oboenrohr Etui"
        price={35}
        available={12}
            
        images= {[
          "./src/assets/eiche.jpg",
          "/src/assets/douglasie.jpg",
          "./src/assets/eiche.jpg"
        ]}
      
        dimensions={[90, 90, 20]}
        weightGrams={150}
        material="Holz"
        surfaceFinish="geölt"
        warranty="10 Jahre"
        series="ob2et5"
      > <VariationDropdown></VariationDropdown></ProductTemplate>
      
      } />
      <Route path="/kumiko" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

