import { ImageGallery } from "./ImageGallery";
import { TechnicalInfo } from "./TechnicalInfo";
import Reviews from "./Review";
import type { FullProduct, FullVariation } from "../../../server/types";
import styles from "./styles/ProductLayout.module.css";
import { ProductDescription } from "./ProductDescription";
import { useState } from "react";

interface ProductLayoutProps {
  productId: number;
  product: FullProduct;
}

export default function ProductLayout({
  productId,
  product,
}: ProductLayoutProps) {
  const [variation, setVariation] = useState<FullVariation>(product.variations[0]);
  
  const technicalInfo = {
    Abmessungen:
      "(LxBxH) " +
      variation.width +
      " x " +
      variation.depth +
      " x " +
      variation.height,
    Gewicht: variation.weightGrams + "g",
    //sku: variation.sku,
    Info: variation.description,
    ...(variation.technicalSpecs as Record<string, any>),
  };

  return (
    <div className={styles.page}>
      <meta
        name="description"
        content={`Ein Überblick über ${product.name}. Mit allen möglichen Variationen, Technischen Daten und Eigenschaften.`}
      />
      <main role="main">
        <div className={styles.top}>
          <ImageGallery images={variation.images} />
          <ProductDescription product={product} setSelectedVariation={(id) => setVariation(product.variations[id]) } />
        </div>
        <div className={styles.bottom}>
          <TechnicalInfo info={technicalInfo} />
          <Reviews productId={productId} />
        </div>
      </main>
    </div>
  );
}
