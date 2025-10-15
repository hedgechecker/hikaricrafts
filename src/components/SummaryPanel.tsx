import Card from "./Card";
import Button from "./Button";
import styles from "./styles/SummaryPanel.module.css";

const fillSpace ={
  height: '15px'
}

export default function SummaryPanel() {
  return (
    <Card title="Summary" padding foldable>
      <div className={styles.label}>
        <span>Dimensions</span>
        <span>30x30 cm</span>
      </div>

      <div className={styles.label}>
        <span>Cells filled</span>
        <span>0</span>
      </div>

      <div className={styles.label}>
        <span>Estimated Price</span>
        <span>€99.99</span>
      </div>

      

      <div style={fillSpace}></div>

      <Button title="Add to Cart"></Button>
    </Card>
  );
}
