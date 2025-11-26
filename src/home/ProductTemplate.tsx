import NavBar from './NavBar';
import { ImageGallery } from './ImageGallery';
import { ProductDescription } from './ProductDescription';
import { ProductDetails } from './ProductDetails';
import { CustomerReviews } from './Reviews';
import { type ReactNode } from "react";


interface ProductTemplateProps {
  images: string[];

  title: string;
  price: number;
  available: number;

  children?: ReactNode;

  dimensions: number[];
  weightGrams: number;
  material: string;
  surfaceFinish: string;
  warranty: string;
  series: string;
}


export default function ProductTemplate(props:ProductTemplateProps) {

  return (
    <div style={{backgroundColor: 'var(--color-background)', color: '#2E2E2E', minHeight: '100vh'}}>
      <NavBar selected={1}></NavBar>
      <div style={{display: 'flex', flexDirection: 'column', paddingLeft:'1rem', paddingRight: '1rem'}}>
        <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap'}}>      

          <ImageGallery 
            images={props.images}
          ></ImageGallery>
        <ProductDescription 
          title={props.title}
          price={props.price}
          available={props.available}
          >
            <div style={{ marginBottom: "20px" }}>
              {props.children}
            </div>

        </ProductDescription>
        </div>
          <div>
            <ProductDetails 
              dimensions={props.dimensions}
              weightGrams={props.weightGrams}
              material={props.material}
              surfaceFinish={props.surfaceFinish}
              warranty={props.warranty}
              series={props.series}
              >
            </ProductDetails>
          <CustomerReviews productId={1}></CustomerReviews>
          </div>
      </div>
    </div>
  );
}
