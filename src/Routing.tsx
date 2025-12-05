import { Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import Login from "./home/Login.tsx";
import './styles/theme.css';
import { Register } from "./home/Register.tsx";
import Feedback from "./home/Feedback.tsx";

import AllProductsPage from "./home/AllProducts.tsx";
//import { useEffect, useState } from "react";
import ProductWithVariations from "./home/ProductWithVariations.tsx";
import Contact from "./home/Contact.tsx";
//const BASE_URL = import.meta.env.VITE_API_URL;


export default function Main() {

  // const [products, setProducts] = useState<FullProduct[]>([]);
  
  //   useEffect(() => {
  //     fetch(`${BASE_URL}/products/full`)
  //     .then(res => res.json())
  //     .then((data) => setProducts(data));
  //   }, []);

return (
    <Routes>
      <Route path="/" element={<Feedback />} />
      <Route path="/all" element={<AllProductsPage />} />
      <Route path="/oboereedsetui" element={<ProductWithVariations key={1} id={1} />}/>
      <Route path="/fluteCase" element={<ProductWithVariations key={2} id={2} />}/>
      <Route path="/klarinettreedsetui" element={<ProductWithVariations key={3} id={3} />}/>
      <Route path="/saxophonreedsetui" element={<ProductWithVariations key={4} id={4} />}/>
      <Route path="/piccoloCase" element={<ProductWithVariations key={5} id={5} />}/>
      <Route path="/kontakt" element={<Contact />} />
      <Route path="/kumiko" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

