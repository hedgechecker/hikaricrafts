import { useEffect, useRef, useState } from "react";
import styles from "./styles/ImageGallery.module.css";

interface ProductGalleryProps {
  images: { path: string; alt: string }[];
}

export function ImageGallery({ images = [] }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullView, setIsFullView] = useState(false);

  const leftDivRef = useRef<HTMLDivElement>(null);
  const mainDivRef = useRef<HTMLDivElement>(null);
  const topArrowRef = useRef<HTMLDivElement>(null);
  const leftArrowRef = useRef<HTMLDivElement>(null);
  const rightArrowRef = useRef<HTMLDivElement>(null);
  const bottomArrowRef = useRef<HTMLDivElement>(null);

  const selectedImage = images[currentIndex];

  // ------------------------------
  // Disable page scroll while scrolling inside the left sidebar
  // ------------------------------
  useEffect(() => {
    const wrapper = leftDivRef.current;
    if (!wrapper) return;

    function lockOnScroll(e: WheelEvent) {
      if (!wrapper) return;
      if (wrapper.scrollHeight > wrapper.clientHeight) {
        e.preventDefault();
        wrapper.scrollTop += e.deltaY;
      }
    }

    wrapper.addEventListener("wheel", lockOnScroll, { passive: false });
    return () => wrapper.removeEventListener("wheel", lockOnScroll);
  }, []);

  // ------------------------------
  // Update arrow visibility
  // ------------------------------
  useEffect(() => {
    setCurrentIndex(0);
    const leftDiv = leftDivRef.current;
    const topArrow = topArrowRef.current;
    const bottomArrow = bottomArrowRef.current;

    const mainDiv = mainDivRef.current;
    const leftArrow = leftArrowRef.current;
    const rightArrow = rightArrowRef.current;

    if (
      !leftDiv ||
      !mainDiv ||
      !topArrow ||
      !bottomArrow ||
      !leftArrow ||
      !rightArrow
    )
      return;

    if (images.length <= 1) {
      rightArrow.style.cursor = "default";
      leftArrow.style.cursor = "default";
      leftArrow.style.display = "none";
      rightArrow.style.display = "none";
    } else {
      rightArrow.style.cursor = "pointer";
      leftArrow.style.cursor = "pointer";
    }

    function updateThumbnailArrows() {
      if (!leftDiv || !topArrow || !bottomArrow) return;
      const scrollable = leftDiv.scrollHeight > leftDiv.clientHeight;

      if (!scrollable) {
        topArrow.style.opacity = "0";
        bottomArrow.style.opacity = "0";
        return;
      }

      const scrollTop = leftDiv.scrollTop;
      const maxScroll = leftDiv.scrollHeight - leftDiv.clientHeight;

      topArrow.style.opacity = scrollTop > 0 ? "1" : "0";
      bottomArrow.style.opacity = scrollTop < maxScroll ? "1" : "0";
    }
    leftDiv.addEventListener("scroll", updateThumbnailArrows);

    return () => {
      leftDiv.removeEventListener("scroll", updateThumbnailArrows);
    };
  }, [images]);

  useEffect(() => {
    const leftDiv = leftDivRef.current;
    if (!leftDiv) return;

    const imgEl = leftDiv.children[currentIndex] as HTMLElement;
    if (imgEl) {
      imgEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [currentIndex]);

  return (
    <div className={styles.layout}>
      {/* LEFT THUMBNAILS */}
      <div className={styles.leftWrapper} tabIndex={-1}>
        <div className={styles.left} ref={leftDivRef} tabIndex={-1}>
          {images.map((img, i) => (
            <img
              key={i}
              src={img.path}
              alt={img.alt}
              className={
                i === currentIndex
                  ? `${styles.image} ${styles.selectedThumb}`
                  : styles.image
              }
              onClick={() => setCurrentIndex(i)}
              onFocus={() => setCurrentIndex(i)}
              tabIndex={0}
            />
          ))}
        </div>

        <div className={`${styles.top} ${styles.arrow}`} ref={topArrowRef}>
          <img
            src="\icons\arrow-simple.svg"
            className={styles.arrowImg}
            style={{ transform: "rotate(90deg)" }}
          />
        </div>
        <div
          className={`${styles.bottom} ${styles.arrow}`}
          ref={bottomArrowRef}
        >
          <img
            src="\icons\arrow-simple.svg"
            className={styles.arrowImg}
            style={{ transform: "rotate(270deg)" }}
          />
        </div>
      </div>

      {/* Conditional rendering for the Full-View Modal */}
      {isFullView && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsFullView(false)}
        >
          <span className={styles.closeButton}>&times;</span>
          <img
            src={selectedImage.path}
            alt={selectedImage.alt}
            className={styles.fullImage}
          />
        </div>
      )}
      {/* MAIN IMAGE */}
      <div className={styles.center} ref={mainDivRef}>
        <img
          src={selectedImage.path}
          alt={selectedImage.alt}
          className={styles.mainImage}
          onClick={() => setIsFullView(true)}
        />

        <div className={styles.imageCount}>{currentIndex+1}/{images.length}</div>

        <div
          className={`${styles.left} ${styles.arrow}`}
          ref={leftArrowRef}
          onPointerDown={() =>
            setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1))
          }
          onKeyDown={() =>
            setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1))
          }
        >
          <img
            src="\icons\arrow-simple.svg"
            className={styles.arrowImg}
            alt="Pfeil nach links"
          />
        </div>

        <div
          className={`${styles.right} ${styles.arrow}`}
          ref={rightArrowRef}
          onPointerDown={() =>
            setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0))
          }
          onKeyDown={() =>
            setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0))
          }
        >
          <img
            src="\icons\arrow-simple.svg"
            className={styles.arrowImg}
            style={{ transform: "rotate(180deg)" }}
            alt="Pfeil nach rechts"
          />
        </div>
      </div>
    </div>
  );
}
