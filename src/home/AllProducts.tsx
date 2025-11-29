import { useEffect, useState } from "react";
//import ProductTemplate from "./ProductTemplate";
//import { prisma } from "../lib/prisma";

// Types you get from Prisma
import type {
  Product,
  ProductOption,
  ProductOptionValue,
  ProductVariation,
  ProductVariationOptionValue
} from "../../server/node_modules/@prisma/client";
import ProductWithVariations from "./ProductWithVariations";
const BASE_URL = import.meta.env.VITE_API_URL;



export interface FullProduct extends Product {
  options: (ProductOption & { values: ProductOptionValue[] })[];
  variations: (ProductVariation & {
    optionValues: (ProductVariationOptionValue & {
      optionValue: ProductOptionValue & {
        option: ProductOption;
      };
    })[];
  })[];
}

export default function AllProductsPage() {
  const [products, setProducts] = useState<FullProduct[]>([]);

  useEffect(() => {
    fetch(`${BASE_URL}/products/full`)
    .then(res => res.json())
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
