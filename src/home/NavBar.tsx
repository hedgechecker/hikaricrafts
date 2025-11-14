import { useState } from "react";
import styles from "./styles/NavBar.module.css";

interface NavBarProps {
  selected: number;
}

export default function NavBar({ selected }: NavBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <nav className={styles.bar}>
      <div className={styles.logo}>HikariCraft</div>

      <div className={styles.links}>
        {/* Etuis Dropdown */}
        <div
          className={`${styles.elem} ${
            selected === 1 ? styles.selected : ""
          } ${styles.dropdown}`}
          onMouseEnter={() => handleDropdown("etuis")}
          onMouseLeave={() => handleDropdown("")}
        >
          Etuis ▾
          {openDropdown === "etuis" && (
            <div className={styles.dropdownContent}>
              <a href="#etuis-oboe">Rohretui für Oboe</a>
              <a href="#etuis-klar">Klarinettenblättchen Etui</a>
              <a href="#etuis-saxo">Saxophonblättchen Etui</a>
            </div>
          )}
        </div>

        {/* Koffer Dropdown */}
        <div
          className={`${styles.elem} ${
            selected === 2 ? styles.selected : ""
          } ${styles.dropdown}`}
          onMouseEnter={() => handleDropdown("koffer")}
          onMouseLeave={() => handleDropdown("")}
        >
          Koffer ▾
          {openDropdown === "koffer" && (
            <div className={styles.dropdownContent}>
              <a href="#case-picc">Piccolo Koffer</a>
              <a href="#case-flute">Querflöten Koffer</a>
            </div>
          )}
        </div>

        {/* Regular Links */}
        <a
          href="#kumiko"
          className={`${styles.elem} ${selected === 3 ? styles.selected : ""}`}
        >
          Kumiko (experimentell)
        </a>
        <a
          href="#contact"
          className={`${styles.elem} ${selected === 4 ? styles.selected : ""}`}
        >
          Kontakt
        </a>
      </div>
    </nav>
  );
}
