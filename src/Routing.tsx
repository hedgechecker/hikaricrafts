import { Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import Login from "./home/Login.tsx";
import './styles/theme.css';
import { Register } from "./home/Register.tsx";
import Feedback from "./home/Feedback.tsx";

import AllProductsPage, { type FullProduct } from "./home/AllProducts.tsx";
import { useEffect, useState } from "react";
import ProductWithVariations from "./home/ProductWithVariations.tsx";
import Contact from "./home/Contact.tsx";
const BASE_URL = import.meta.env.VITE_API_URL;


export default function Main() {

  const [products, setProducts] = useState<FullProduct[]>([]);
  
    useEffect(() => {
      fetch(`${BASE_URL}/products/full`)
      .then(res => res.json())
      .then((data) => setProducts(data));
    }, []);

return (
    <Routes>
      <Route path="/" element={<Feedback />} />
      <Route path="/all" element={<AllProductsPage />} />
      <Route path="/etui" element={<ProductWithVariations key={1} product={products[0]} />}/>
      <Route path="/fluteCase" element={<ProductWithVariations key={2} product={products[1]} />}/>
      <Route path="/kontakt" element={<Contact />} />
      <Route path="/kumiko" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

