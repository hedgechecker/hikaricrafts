import NavBar from './NavBar';
import { ImageGallery } from './ImageGallery';
import { ProductDescription } from './ProductDescription';
import { ProductDetails } from './ProductDetails';
import { CustomerReviews } from './Reviews';
import { BuyInformation } from './BuyInformation';


export default function WoodenCasesSite() {

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#F5F3EF', color: '#2E2E2E', minHeight: '100vh'}}>
      <NavBar selected={1}></NavBar>
      <div style={{display: 'flex', flexDirection: 'column', paddingLeft:'2rem', paddingRight: '2rem'}}>
        <div style={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap'}}>      
          <ImageGallery 
            images={["./src/assets/eiche.jpg","./src/assets/douglasie.jpg","./src/assets/douglasie.jpg","./src/assets/douglasie.jpg","./src/assets/douglasie.jpg","./src/assets/douglasie.jpg","./src/assets/douglasie.jpg" ]}
          ></ImageGallery>
        <ProductDescription 
          title='Oboenrohr Etui' 
          price={35}
          available
          //description='Ein Etui für 6 Oboen rohre, gefertigt aus Eichenholz'
          >
          <div style={{width: '100%'}}>VARIATIONEN
            <div style={{height: '20px'}}></div>
            <BuyInformation available></BuyInformation>
          </div>
        </ProductDescription>
        </div>
          <div>
            <ProductDetails 
              dimensions={[90,90,20]}
              weightGrams={150}
              material='Eichenholz'
              surfaceFinish='geölt'
              warranty='10 Jahre'
              series='"ob2et5"'
              >
            </ProductDetails>
          <CustomerReviews productId={1}></CustomerReviews>
          </div>
      </div>
      {/* Footer */}
      <footer id="contact" style={{ backgroundColor: '#2E2E2E', color: '#F5F3EF', textAlign: 'center', padding: '2rem' }}>
        <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Stay Connected</p>
        <input type="email" placeholder="Enter your email" style={{ padding: '0.5rem', borderRadius: '4px', border: 'none', marginRight: '0.5rem' }} />
        <button style={{ backgroundColor: '#3E6B48', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Subscribe</button>
        <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>© 2025 Oak & Grain. All rights reserved.</div>
      </footer>
    </div>
  );
}
