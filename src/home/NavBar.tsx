import { useState } from "react";
import styles from "./styles/NavBar.module.css";
import { Link } from "react-router-dom";
import shoppingBox from '/src/assets/shopping-box.svg';
interface NavBarProps {
  selected: number;
}

export default function NavBar({ selected }: NavBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeMobile = () => {
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  return (
    <>
      {/* BACKDROP */}
      {mobileOpen && (
        <div className={styles.backdrop} onClick={closeMobile} />
      )}

      <nav className={styles.bar}>
        <Link
            to="/"
            onClick={closeMobile}
            className={`${styles.logo}`}
          >
            HikariCraft
          </Link>
        <img src={shoppingBox} className={styles.cart}/>


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
            className={`${styles.elem} ${
              selected === 1 ? styles.selected : ""
            } ${styles.dropdown}`}
            onClick={() => handleDropdown("etuis")}
          >
            Etuis ▾
            {openDropdown === "etuis" && (
              <div className={styles.dropdownContent}>
                <Link to="/oboereedsetui" onClick={closeMobile}>Rohretui für Oboe</Link>
                <Link to="/klarinettreedsetui" onClick={closeMobile}>Klarinettenblättchen Etui</Link>
                <Link to="/saxophonreedsetui" onClick={closeMobile}>Saxophonblättchen Etui</Link>
              </div>
            )}
          </div>

          {/* Koffer Dropdown */}
          <div
            className={`${styles.elem} ${
              selected === 2 ? styles.selected : ""
            } ${styles.dropdown}`}
            onClick={() => handleDropdown("koffer")}
          >
            Koffer ▾
            {openDropdown === "koffer" && (
              <div className={styles.dropdownContent}>
                <Link to="/piccoloCase" onClick={closeMobile}>Piccolo Koffer</Link>
                <Link to="/fluteCase" onClick={closeMobile}>Querflöten Koffer</Link>
              </div>
            )}
          </div>

          <Link
            to="/kumiko"
            onClick={closeMobile}
            className={`${styles.elem} ${selected === 5 ? styles.selected : ""}`}
          >
            Kumiko(experimentell)
          </Link>

          <a
            href="/kontakt"
            onClick={closeMobile}
            className={`${styles.elem} ${selected === 4 ? styles.selected : ""}`}
          >
            Kontakt
          </a>

          <Link
            to="/login"
            onClick={closeMobile}
            className={`${styles.elem} ${selected === 5 ? styles.selected : ""}`}
          >
            Login
          </Link>
        </div>
      </nav>
    </>
  );
}
