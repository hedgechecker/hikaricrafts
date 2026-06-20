import { Routes, Route } from "react-router-dom";
import Login from "./pages/Authentication/Login.tsx";
import "./theme.css";
import { Register } from "./pages/Authentication/Register.tsx";
import Feedback from "./pages/Contact/Feedback.tsx";
import AllProductsPage from "./features/products/AllProducts.tsx";
import SingleProduct from "./pages/Product/SingleProduct.tsx";
import Contact from "./pages/Contact/Contact.tsx";
import { useDialog } from "./features/global/useDialog.tsx";
import { lazy, Suspense } from "react";

const EditorPage = lazy(() => import("./pages/KumikoEditor/KumikoEditor.tsx"));
const Overview = lazy(
  () => import("./features/WireArtEditor/components/Overview.tsx"),
);
const WireArtEditor = lazy(
  () => import("./pages/WireArtEditor/WireArtEditor.tsx"),
);

export default function Routing() {
  const { dialogComponent } = useDialog();

  return (
    <>
      <div id="tooltip-root"></div>
      {dialogComponent}

      <Suspense
        fallback={<div className="loading-spinner">Loading page...</div>}
      >
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
          <Route
            path="/piccoloCase"
            element={<SingleProduct key={5} id={5} />}
          />
          <Route path="/kontakt" element={<Contact />} />
          <Route path="/kumiko" element={<EditorPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/wireart" element={<Overview />} />
          <Route path="/wirearteditor" element={<WireArtEditor />} />
        </Routes>
      </Suspense>
    </>
  );
}
