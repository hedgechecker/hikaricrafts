

interface ButtonProps {
  title?: string;
  color?: string;
}

const buttonStyle = {
    padding: '8px',
    border: 'none',
    borderRadius: '5px',
    color: 'white',
    fontSize: '0.875rem',
    cursor: 'pointer',
    width: '100%',
};

export default function Button({ title, color = 'black'}: ButtonProps) {
  return (
    <button style={{ ...buttonStyle, backgroundColor: color }}>
      {title}
    </button>
  );
}