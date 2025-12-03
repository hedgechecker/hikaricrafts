import { useEffect, useState } from "react";
import type {
  Product,
  ProductOption,
  Option,
  OptionValue,
  ProductVariation,
  ProductVariationOptionValue,
  Image,
} from "../../server/node_modules/@prisma/client";
import ProductWithVariations from "./ProductWithVariations";

const BASE_URL = import.meta.env.VITE_API_URL;

export interface FullProduct extends Product {
  // Each product has ProductOption rows linking it to global Options
  productOptions: (ProductOption & {
    option: Option & {
      values: OptionValue[];
    };
  })[];
  variations: (ProductVariation & {
    images: Image[];
    optionValues: (ProductVariationOptionValue & {
      optionValue: OptionValue & {
        option: Option;
      };
    })[];
  })[];
}

export default function AllProductsPage() {
  const [products, setProducts] = useState<FullProduct[]>([]);

  useEffect(() => {
    fetch(`${BASE_URL}/products/full`)
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  if (products.length === 0) return <div>Loading...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
      {products.map((product) => (
        <ProductWithVariations key={product.id} product={product} />
      ))}
    </div>
  );
}
