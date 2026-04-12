interface OptionSquaresProps {
  label: string;
  values: { id: number; value: string }[];
  selected: number | null;
  disabledValues: Set<number>;
  onSelect: (id: number) => void;
}

export default function OptionSquares({
  label,
  values,
  selected,
  disabledValues,
  onSelect,
}: OptionSquaresProps) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>{label}</div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {values.map((v) => {
          const isDisabled = !disabledValues.has(v.id);
          const isSelected = v.id === selected;

          return (
            <button
              key={v.id}
              disabled={isDisabled}
              onClick={() => !isDisabled && onSelect(v.id)}
              style={{
                padding: "0.6rem 1rem",
                borderRadius: "6px",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.4 : 1,
                border: isSelected
                  ? "2px solid var(--color-accent)"
                  : "1px solid var(--color-border)",
                background: "var(--color-background)",
                color: "var(--color-primary)",
              }}
            >
              {v.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
