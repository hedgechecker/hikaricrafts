import { useState, useEffect } from "react";
import type { FullProduct } from "../../../server/types";
import ProductLayout from "../../features/products/ProductLayout";
const BASE_URL = import.meta.env.VITE_API_URL;

interface Props {
  id: number;
}

export default function SingleProduct({ id }: Props) {
  const [product, setProduct] = useState<FullProduct | null>(null);
  useEffect(() => {
    setProduct(null);

    fetch(`${BASE_URL}/products/${id}`)
      .then((res) => res.json())
      .then((data: FullProduct) => {
        setProduct(data);
      });
  }, [id]);

  if (!product) return <div>Diese Produkt konnte nicht gefunden werden</div>;
  return <ProductLayout productId={product.id} product={product} />;
}
