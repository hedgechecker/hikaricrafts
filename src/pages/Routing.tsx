import { Routes, Route } from "react-router-dom";
import App from "./KumikoEditor/KumikoEditor.tsx";
import Login from "./Authentication/Login.tsx";
import "../styles/theme.css";
import { Register } from "./Authentication/Register.tsx";
import Feedback from "./Contact/Feedback.tsx";
import AllProductsPage from "../features/products/AllProducts.tsx";
import SingleProduct from "./Product/SingleProduct.tsx";
import Contact from "./Contact/Contact.tsx";
import WireArtEditor from "./WireArtEditor/WireArtEditor.tsx";
import Overview from "../features/WireArtEditor/components/Overview.tsx";
import { setupGlobalErrorHandling } from "../utils/error/errorHandler.ts";
import { useDialog } from "../features/global/useDialog.tsx";

export default function Routing() {
  const { dialogComponent } = useDialog();

  setupGlobalErrorHandling();
  return (
    <>
    {dialogComponent}
      <Routes>
        <Route path="/" element={<Feedback />} />
        <Route path="/all" element={<AllProductsPage />} />
        <Route
          path="/oboereedsetui"
          element={<SingleProduct key={1} id={1} />}
        />
        <Route path="/fluteCase" element={<SingleProduct key={2} id={2} />} />
        <Route
          path="/klarinettreedsetui"
          element={<SingleProduct key={3} id={3} />}
        />
        <Route
          path="/saxophonreedsetui"
          element={<SingleProduct key={4} id={4} />}
        />
        <Route path="/piccoloCase" element={<SingleProduct key={5} id={5} />} />
        <Route path="/kontakt" element={<Contact />} />
        <Route path="/kumiko" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/wireart" element={<Overview />} />
        <Route path="/wirearteditor" element={<WireArtEditor />} />
      </Routes>
    </>
  );
}
