import { useNavigate } from "react-router-dom";
import styles from "./Basket.module.css";
import type { FullOrderItem } from "../../../server/types";
import { useEffect, useState } from "react";
import { showDialog } from "../../features/global/useDialog";
import { logError } from "../../utils/error/errorHandler";
const BASE_URL = import.meta.env.VITE_API_URL;

export default function Basket() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FullOrderItem[] | null>(null);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  useEffect(() => {
    const data = localStorage.getItem("Basket");
    const loaditems: FullOrderItem[] = (() => {
      if (!data) return [];
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    setItems(loaditems);

    if (loaditems.length > 0) {
      let newTotalPrice = loaditems.reduce(
        (sum, item) => sum + item.variation.priceCents * item.quantity,
        0,
      );
      setTotalPrice(newTotalPrice);
    }
  }, []);

  function removeItem(id: number) {
    if (!items) return;
    const newItems = items.filter((_it, i) => i != id);
    setItems(newItems);
    if (newItems.length > 0) {
      let newTotalPrice = newItems.reduce(
        (sum, item) => sum + item.variation.priceCents * item.quantity,
        0,
      );
      setTotalPrice(newTotalPrice);
    } else {
      setTotalPrice(0);
    }
    localStorage.setItem("Basket", JSON.stringify(newItems));
  }

  async function inquireProducts() {
    if (items?.length == 0) {
      await showDialog({
        type: "alert",
        message:
          "Bitte legen Sie Produkte in den Warenkorb, oder nutzen Sie das Kontakt-Formular",
      });
      return;
    }
    const result = await showDialog({
      type: "prompt",
      message:
        "Geben Sie hier eine Möglichkeit an, wie ich Sie kontaktieren soll/kann, für das weitere Vorgehen ",
      confirmText: "Anfrage absenden",
    });
    if (!result) {
      return;
    }

    const response = await fetch(`${BASE_URL}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Random Product Inquiry",
        email: result,
        subject: "I am Inquireolosdino",
        message: JSON.stringify(items),
      }),
    });

    if (!response.ok) {
      logError("Something went wrong", {
        res: response,
      });
      await showDialog({
        type: "alert",
        message: "Anfrage fehlgeschlagen",
      });
      return;
    }

    await showDialog({
      type: "alert",
      message:
        "Anfrage erfolgreich gesendet, falls Sie keine Rückmeldung in wenigen Tagen erhalten, überprüfen Sie bitte nochmals, ob ihre Kontaktangaben korrekt sind",
    });
    navigate("/");
  }

  return (
    <div className={styles.page}>
      <main className={styles.container} role="main">
        <h2 className={styles.title}>Dein Warenkorb</h2>

        <div className={styles.grid}>
          {items &&
            items.length > 0 &&
            items.map((item, id) => (
              <div key={Math.random() * 1000} className={styles.card}>
                <div className={styles.itemRow}>
                  <div className={styles.imagecontainer}>
                    <img
                      src={`${item.image.path}`}
                      alt={
                        item.variation.description
                          ? item.variation.description
                          : ""
                      }
                      className={styles.image}
                    />
                  </div>

                  <div className={styles.detailsContainer}>
                    <h3 className={styles.itemTitle}>{item.variation.sku}</h3>
                    <p className={styles.description}>
                      {item.variation.description}
                    </p>
                    <div className={styles.priceQuantityRow}>
                      <span>Menge: {item.quantity}</span>
                      <span className={styles.price}>
                        {(item.variation.priceCents / 100).toFixed(2)} €
                      </span>
                    </div>

                    <button
                      className={styles.secondaryButton}
                      style={{ padding: 0 }}
                      onClick={() => removeItem(id)}
                    >
                      Entfernen
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <hr className={styles.divider} />

        <div className={styles.summaryContainer}>
          <div className={styles.totalRow}>
            <span>Gesamtsumme:</span>
            <strong>{(totalPrice / 100).toFixed(2)} €</strong>
          </div>
        </div>

        <div className={styles.buttoncontainer}>
          <button
            className={styles.secondaryButton}
            onClick={() => navigate("/")}
            title="Zurück zum Start"
          >
            Weiterstöbern
          </button>

          <button
            className={styles.button}
            onClick={() => inquireProducts()}
            title="Zur Kasse gehen"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#ffffff"
              style={{ marginRight: "var(--space-xs)" }}
            >
              <path d="M240-160q-33 0-56.5-23.5T160-200v-400q0-33 23.5-56.5T240-680h80v-80q0-50 35-85t85-35h80q50 0 85 35t35 85v80h80q33 0 56.5 23.5T800-600v400q0 33-23.5 56.5T760-160H240Zm160-520h160v-80q0-17-11.5-28.5T520-800h-80q-17 0-28.5 11.5T400-760v80Z" />
            </svg>
            Produkte anfragen
          </button>
        </div>
      </main>
    </div>
  );
}
