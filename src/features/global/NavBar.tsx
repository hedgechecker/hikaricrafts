import { useState } from "react";
import styles from "./styles/NavBar.module.css";
import { Link } from "react-router-dom";
interface NavBarProps {
  selected: "etuis" | "cases" | "wallArt" | "contact" | "login" | "";
}

export default function NavBar({ selected }: NavBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  const handleDropdown = (name: string) => {
    console.log(name)
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

      <nav className={styles.bar}>
        <Link to="/" onClick={closeMobile} className={`${styles.logo}`}>
          HikariCraft
        </Link>
        <img src="./icons/shopping-box.svg" className={styles.cart} />

        {/* HAMBURGER BUTTON */}
        <button
          className={`${styles.hamburger} ${mobileOpen ? styles.open : ""}`}
          onClick={() => setMobileOpen(!mobileOpen)}
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
          >
            Etuis
            <div className={styles.dropdownContent}>
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
          >
            Koffer
            <div className={styles.dropdownContent}>
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
          >
            Wandkunst
            <div className={styles.dropdownContent} id="wallart">
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
            <div onClick={handleLogout} className={styles.elem}>
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
