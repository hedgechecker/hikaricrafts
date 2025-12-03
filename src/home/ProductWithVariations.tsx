import { useState, useEffect, useMemo } from "react";
import type { FullProduct } from "./AllProducts";
import ProductTemplate from "./ProductTemplate";
import OptionSquares from "./OptionSquares";

interface Props {
  product: FullProduct;
}

export default function ProductWithVariations({ product }: Props) {
  const validValuesPerOption = useMemo(() => {
    const map: Record<string, Set<number>> = {};
    
    for (const po of product.productOptions) {
      map[po.option.name] = new Set();
    }

    for (const variation of product.variations) {
      for (const ov of variation.optionValues) {
        map[ov.optionValue.option.name].add(ov.optionValueId);
      }
    }

    return map; // e.g. { wood: Set([1,2]), finish: Set([10,11]) }
  }, [product]);



  // -----------------------------------------------------
  // 1. Store ALL selected option values in one object
  // -----------------------------------------------------
  const [selected, setSelected] = useState(() =>
  Object.fromEntries(
    product.productOptions.map(po => {
      const valid = [...validValuesPerOption[po.option.name]];
      return [po.option.name, valid[0] ?? null];
    })
  )
  );


  // -----------------------------------------------------
  // 2. AUTO-FIX: always ensure a valid variation exists
  // -----------------------------------------------------
  useEffect(() => {
  const selectedIds = new Set(Object.values(selected));

  const match = product.variations.find(v =>
    v.optionValues.every(ov => selectedIds.has(ov.optionValueId))
  );

  if (match) return; // valid combo

  // if invalid → fix by adjusting ONE option
  for (const po of product.productOptions) {
    const validValues = [...validValuesPerOption[po.option.name]];

    const newValue = validValues[0]; // choose first valid

    if (newValue !== selected[po.option.name]) {
      setSelected(prev => ({ ...prev, [po.option.name]: newValue }));
      return;
    }
  }
}, [selected, validValuesPerOption, product]);

function getCurrentlyValidValues(optionName: string) {
  // all other selected options
  const otherSelected = { ...selected };
  delete otherSelected[optionName];

  const otherIds = new Set(Object.values(otherSelected));

  // variations that match all other selections
  const matchingVariations = product.variations.filter(v =>
    v.optionValues
      .filter(ov => ov.optionValue.option.name !== optionName)
      .every(ov => otherIds.has(ov.optionValueId))
  );

  // IDs of values valid for THIS option given the current selection
  return new Set(
    matchingVariations.flatMap(v =>
      v.optionValues
        .filter(ov => ov.optionValue.option.name === optionName)
        .map(ov => ov.optionValueId)
    )
  );
}


  // -----------------------------------------------------
  // 3. Find the currently selected variation (guaranteed valid)
  // -----------------------------------------------------
  const selectedVariation = useMemo(() => {
    const ids = new Set(Object.values(selected));
    return product.variations.find(v =>
      v.optionValues.every(ov => ids.has(ov.optionValueId))
    );
  }, [selected, product.variations]);

  if (!selectedVariation) return <div>No matching variation</div>;

  // -----------------------------------------------------
  // 4. Extract material + finish display values
  // -----------------------------------------------------
  const materialVal = selectedVariation.optionValues.find(
    ov => ov.optionValue.option.name.toLowerCase() === "holz"
  )?.optionValue.value;

  const finishVal = selectedVariation.optionValues.find(
    ov => ov.optionValue.option.name.toLowerCase() === "oberfläche"
  )?.optionValue.value;

  // -----------------------------------------------------
  // 5. Render Template + Auto-filtered Selectors
  // -----------------------------------------------------
  console.log(selectedVariation.images);
  return (
    <ProductTemplate
      images={selectedVariation?.images?.map(i => i.path) ?? []}
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
      {/* Render selectors dynamically */}
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
