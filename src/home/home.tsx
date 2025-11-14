import NavBar from './NavBar';
import { ImageGallery } from './ImageGallery';


export default function WoodenCasesSite() {

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#F5F3EF', color: '#2E2E2E', minHeight: '100vh' }}>
      <NavBar selected={1}></NavBar>      
      <ImageGallery 
        images={["./src/assets/eiche.jpg","./src/assets/douglasie.jpg","./src/assets/douglasie.jpg","./src/assets/douglasie.jpg","./src/assets/douglasie.jpg","./src/assets/douglasie.jpg","./src/assets/douglasie.jpg" ]}
        title = "Oboenrohr Etui"
      ></ImageGallery>
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
