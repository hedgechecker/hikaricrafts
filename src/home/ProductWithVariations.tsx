import { useState, useEffect, useMemo } from "react";
import type { FullProduct } from "./AllProducts";
import ProductTemplate from "./ProductTemplate";
import OptionSquares from "./OptionSquares";

const BASE_URL = import.meta.env.VITE_API_URL;

interface Props { 
  id: number;
}

export default function ProductWithVariations({ id }: Props) {
  const [product, setProduct] = useState<FullProduct | null>(null);
  const [selected, setSelected] = useState<Record<string, number | null>>({});

  // -----------------------------------------------------
  // 1) Fetch product
  // -----------------------------------------------------
  useEffect(() => {
    setProduct(null); // reset when id changes

    fetch(`${BASE_URL}/products/${id}`)
      .then(res => res.json())
      .then((data: FullProduct) => {
        setProduct(data);

        // initialize selected values (AFTER product is loaded)
        const initial = Object.fromEntries(
          data.productOptions.map(po => {
            const valid = po.option.values.map(v => v.id);
            return [po.option.name, valid[0] ?? null];
          })
        );
        setSelected(initial);
      });
  }, [id]);

  // guard — fetch not done yet

  // -----------------------------------------------------
  // 2) Valid values per option (global)
  // -----------------------------------------------------
  const validValuesPerOption = useMemo(() => {
    if(!product)return;
    const map: Record<string, Set<number>> = {};

    for (const po of product.productOptions) {
      map[po.option.name] = new Set();
    }

    for (const variation of product.variations) {
      for (const ov of variation.optionValues) {
        map[ov.optionValue.option.name].add(ov.optionValueId);
      }
    }

    return map;
  }, [product]);

  // -----------------------------------------------------
  // 3) Auto-correct invalid selections
  // -----------------------------------------------------
  useEffect(() => {
    // skip until product is loaded
    if (!product || !validValuesPerOption) return;

    const selectedIds = new Set(Object.values(selected));

    const match = product.variations.find(v =>
      v.optionValues.every(ov => selectedIds.has(ov.optionValueId))
    );

    if (match) return; // valid combination

    // adjust ONE value
    for (const po of product.productOptions) {
      const valid = [...validValuesPerOption[po.option.name]];

      if (!valid.includes(selected[po.option.name]!)) {
        setSelected(prev => ({ ...prev, [po.option.name]: valid[0] ?? null }));
        break;
      }
    }
  }, [selected, validValuesPerOption, product]);

  // -----------------------------------------------------
  // 4) Currently valid options for a specific attribute
  // -----------------------------------------------------
  function getCurrentlyValidValues(optionName: string) {
    if(!product)return new Set<number>;
    const otherSelected = { ...selected };
    delete otherSelected[optionName];

    const otherIds = new Set(Object.values(otherSelected));

    const matchingVariations = product.variations.filter(v =>
      v.optionValues
        .filter(ov => ov.optionValue.option.name !== optionName)
        .every(ov => otherIds.has(ov.optionValueId))
    );

    return new Set(
      matchingVariations.flatMap(v =>
        v.optionValues
          .filter(ov => ov.optionValue.option.name === optionName)
          .map(ov => ov.optionValueId)
      )
    );
  }

  // -----------------------------------------------------
  // 5) Find active variation
  // -----------------------------------------------------
  const selectedVariation = useMemo(() => {
    if(!product)return;
    const ids = new Set(Object.values(selected));
    return product.variations.find(v =>
      v.optionValues.every(ov => ids.has(ov.optionValueId))
    );
  }, [selected, product]);

  if (!product||!validValuesPerOption) return <div></div>;
  if (!selectedVariation) return <div>No matching variation</div>;

  const materialVal = selectedVariation.optionValues.find(
    ov => ov.optionValue.option.name.toLowerCase() === "holz"
  )?.optionValue.value;

  const finishVal = selectedVariation.optionValues.find(
    ov => ov.optionValue.option.name.toLowerCase() === "oberfläche"
  )?.optionValue.value;


  // -----------------------------------------------------
  // 6) Render
  // -----------------------------------------------------
  return (
    <ProductTemplate
      id={product.id}
      images={selectedVariation.images?.map(i => i.path) ?? []}
      title={product.name}
      price={selectedVariation.priceCents / 100}
      available={selectedVariation.stock}
      dimensions={[
        selectedVariation.height ?? 0,
        selectedVariation.width ?? 0,
        selectedVariation.depth ?? 0,
      ]}
      weightGrams={selectedVariation.weightGrams ?? 0}
      material={materialVal ?? ""}
      surfaceFinish={finishVal ?? ""}
      warranty={product.warranty ?? ""}
      series={product.series ?? ""}
    >
      {product.productOptions.map(po => {
        const allValidValues = po.option.values.filter(v =>
          validValuesPerOption[po.option.name].has(v.id)
        );

        const currentlyValid = getCurrentlyValidValues(po.option.name);

        return (
          <OptionSquares
            key={po.option.name}
            label={po.option.name}
            values={allValidValues}
            selected={selected[po.option.name]}
            disabledValues={currentlyValid}
            onSelect={value => setSelected(prev => ({ ...prev, [po.option.name]: value }))}
          />
        );
      })}
    </ProductTemplate>
  );
}
