import type {
  ProductOptionValue
} from "../../server/node_modules/@prisma/client";

export default function OptionSelector({
  label,
  values,
  selected,
  onSelect
}: {
  label: string;
  values: ProductOptionValue[];
  selected: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ fontWeight: 600 }}>{label}:</label>
      <select
        style={{ marginLeft: "1rem", padding: "0.3rem" }}
        value={selected ?? ""}
        onChange={(e) => onSelect(Number(e.target.value))}
      >
        {values.map(v => (
          <option key={v.id} value={v.id}>{v.value}</option>
        ))}
      </select>
    </div>
  );
}
