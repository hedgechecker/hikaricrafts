import { useEffect, useRef, useState } from "react";
import styles from "./styles/ImageGallery.module.css";


interface ProductGalleryProps {
  images: string[];
}

export function ImageGallery({ images = [] }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

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

    if (!leftDiv || !mainDiv || !topArrow || !bottomArrow || !leftArrow || !rightArrow)
      return;
    
    if (images.length <= 1) {
      rightArrow.style.cursor = "default";
      leftArrow.style.cursor = "default";
    }else{
      rightArrow.style.cursor = "pointer";
      leftArrow.style.cursor = "pointer";  
    }

    function updateThumbnailArrows() {
      if(!leftDiv || !topArrow ||!bottomArrow )return;
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

    function updateMainArrows() {
      if(!leftArrow ||!rightArrow )return;
      const show = images.length > 1 ? "1" : "0";
      leftArrow.style.opacity = show;
      rightArrow.style.opacity = show;
      
    }

    leftDiv.addEventListener("mouseenter", updateThumbnailArrows);
    leftDiv.addEventListener("mouseleave", () => {
      topArrow.style.opacity = "0";
      bottomArrow.style.opacity = "0";
    });
    leftDiv.addEventListener("scroll", updateThumbnailArrows);

    mainDiv.addEventListener("mouseenter", updateMainArrows);
    mainDiv.addEventListener("mouseleave", () => {
      leftArrow.style.opacity = "0";
      rightArrow.style.opacity = "0";
    });

    return () => {
      leftDiv.removeEventListener("mouseenter", updateThumbnailArrows);
      leftDiv.removeEventListener("mouseleave", () => {
        topArrow.style.opacity = "0";
        bottomArrow.style.opacity = "0";
      });
      leftDiv.removeEventListener("scroll", updateThumbnailArrows);

      mainDiv.removeEventListener("mouseenter", updateMainArrows);
      mainDiv.removeEventListener("mouseleave", () => {
        leftArrow.style.opacity = "0";
        rightArrow.style.opacity = "0";
      });
    };
  }, [images]);

  // ------------------------------
  // Arrow click handlers
  // ------------------------------
  function goLeft() {
    setCurrentIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  }

  function goRight() {
    setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  }

  // Scroll selected thumbnail into view
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
              src={img}
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

      {/* MAIN IMAGE */}
      <div className={styles.center} ref={mainDivRef}>
        <img src={selectedImage} className={styles.mainImage} />

        <div
          className={`${styles.left} ${styles.arrow}`}
          ref={leftArrowRef}
          onClick={goLeft}
          tabIndex={0}
          onKeyDown={goLeft}
        >
          <img src="\icons\arrow-simple.svg" className={styles.arrowImg} />
        </div>

        <div
          className={`${styles.right} ${styles.arrow}`}
          ref={rightArrowRef}
          onClick={goRight}
          tabIndex={0}
          onKeyDown={goRight}
        >
          <img
            src="\icons\arrow-simple.svg"
            className={styles.arrowImg}
            style={{ transform: "rotate(180deg)" }}
          />
        </div>
      </div>
    </div>
  );
}
