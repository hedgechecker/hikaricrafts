import { useEffect, useState } from "react";
import styles from "./styles/NavBar.module.css";
import { Link } from "react-router-dom";
interface NavBarProps {
  selected: "etuis" | "cases" | "wallArt" | "contact" | "login" | "basket" | "";
}

export default function NavBar({ selected }: NavBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const divList = ["koffer", "wallArt", "etuis"];
    divList.forEach((name) => {
      const div = document.getElementById(name);
      const dropdown = document.getElementById(name + "Dropdown");

      if (!div || !dropdown) return;
      dropdown.addEventListener("focusin", () => {
        div.style.display = "flex";
      });

      dropdown.addEventListener("focusout", () => {
        div.style.display = "none";
      });
    });
  }, []);

  const handleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeMobile = () => {
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("token");
    closeMobile();
    window.location.reload();
  };

  return (
    <>
      {/* BACKDROP */}
      {mobileOpen && <div className={styles.backdrop} onClick={closeMobile} />}

      <nav className={styles.bar} role="navigation">
        <Link to="/" onClick={closeMobile} className={`${styles.logo}`}>
          HikariCrafts
        </Link>
        <Link to="/basket" onClick={closeMobile}>
          <img
            src="./icons/shopping-box.svg"
            className={styles.cart}
            alt="Einkaufskorb"
          />
        </Link>

        {/* HAMBURGER BUTTON */}
        <button
          className={`${styles.hamburger} ${mobileOpen ? styles.open : ""}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          name="Menü zur weiteren Navigation"
          id="hamburgerButton"
          title="Menü zur weiteren Navigation"
        >
          <span />
          <span />
          <span />
        </button>

        {/* MAIN NAV */}
        <div
          className={`${styles.links} ${mobileOpen ? styles.showMobile : ""}`}
        >
          {/* Etuis Dropdown */}
          <div
            className={`${styles.elem} ${selected === "etuis" ? styles.selected : ""} ${styles.dropdown}`}
            onClick={() => handleDropdown("etuis")}
            tabIndex={0}
            id="etuisDropdown"
          >
            Etuis
            <div className={styles.dropdownContent} id="etuis">
              <Link to="/oboereedsetui" onClick={closeMobile}>
                Rohretui für Oboe
              </Link>
              <Link to="/klarinettreedsetui" onClick={closeMobile}>
                Klarinettenblättchen Etui
              </Link>
              <Link to="/saxophonreedsetui" onClick={closeMobile}>
                Saxophonblättchen Etui
              </Link>
            </div>
          </div>

          {/* Koffer Dropdown */}
          <div
            className={`${styles.elem} ${selected === "cases" ? styles.selected : ""} ${styles.dropdown}`}
            onClick={() => handleDropdown("koffer")}
            tabIndex={0}
            id="kofferDropdown"
          >
            Koffer
            <div className={styles.dropdownContent} id="koffer">
              <Link to="/piccoloCase" onClick={closeMobile}>
                Piccolo Koffer
              </Link>
              <Link to="/fluteCase" onClick={closeMobile}>
                Querflöten Koffer
              </Link>
            </div>
          </div>

          {/* WallArt Dropdown */}
          <div
            className={`${styles.elem} ${selected === "wallArt" ? styles.selected : ""} ${styles.dropdown}`}
            onClick={() => handleDropdown("wallArt")}
            tabIndex={0}
            id="wallArtDropdown"
          >
            Wandkunst
            <div className={styles.dropdownContent} id="wallArt">
              <Link to="/wireArt" onClick={closeMobile}>
                Geometrische Kunst
              </Link>
              <Link to="/kumiko" onClick={closeMobile}>
                Kumiko(experimentell)
              </Link>
            </div>
          </div>

          <a
            href="/kontakt"
            onClick={closeMobile}
            className={`${styles.elem} ${selected === "contact" ? styles.selected : ""}`}
          >
            Kontakt
          </a>

          {isLoggedIn ? (
            <div
              onClick={handleLogout}
              // onKeyDown={handleLogout}
              className={styles.elem}
              tabIndex={0}
            >
              Logout
            </div>
          ) : (
            <Link
              to="/login"
              onClick={closeMobile}
              className={`${styles.elem} ${selected === "login" ? styles.selected : ""}`}
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
