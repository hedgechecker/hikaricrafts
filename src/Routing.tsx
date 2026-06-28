import "./theme.css";
import { Routes, Route } from "react-router-dom";
import { useDialog } from "./features/global/useDialog.tsx";
import { lazy, Suspense } from "react";
import NavBar from "./features/global/NavBar.tsx";
import Feedback from "./pages/Contact/Feedback.tsx";
import Reviews from "./features/products/Review.tsx";

const SingleProduct = lazy(() => import("./pages/Product/SingleProduct.tsx"));
const Login = lazy(() => import("./pages/Authentication/Login.tsx"));
const Register = lazy(() => import("./pages/Authentication/Register.tsx"));
const Contact = lazy(() => import("./pages/Contact/Contact.tsx"));
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
          <Route
            path="/"
            element={
              <>
                <NavBar selected="" />
                <Feedback />
              </>
            }
          />
          <Route
            path="/oboereedsetui"
            element={
              <>
                <NavBar selected="etuis"></NavBar>
                <SingleProduct key={1} id={1} />
              </>
            }
          />
          <Route
            path="/fluteCase"
            element={
              <>
                <NavBar selected="cases"></NavBar>
                <SingleProduct key={2} id={2} />
              </>
            }
          />
          <Route
            path="/klarinettreedsetui"
            element={
              <>
                <NavBar selected="etuis"></NavBar>
                <SingleProduct key={3} id={3} />
              </>
            }
          />
          <Route
            path="/saxophonreedsetui"
            element={
              <>
                <NavBar selected="etuis"></NavBar>
                <SingleProduct key={4} id={4} />
              </>
            }
          />
          <Route
            path="/piccoloCase"
            element={
              <>
                <NavBar selected="cases"></NavBar>
                <SingleProduct key={5} id={5} />
              </>
            }
          />
          <Route
            path="/kontakt"
            element={
              <>
                <NavBar selected="contact"></NavBar>
                <Contact />
              </>
            }
          />
          <Route path="/test" element={<Reviews productId={1} />} />
          <Route path="/kumiko" element={<EditorPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/wireart"
            element={
              <>
                <NavBar selected="wallArt" />
                <Overview />
              </>
            }
          />
          <Route path="/wirearteditor" element={<WireArtEditor />} />
        </Routes>
      </Suspense>
    </>
  );
}
