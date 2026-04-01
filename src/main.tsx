import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import { ClerkAuthProvider } from './components/ClerkAuthProvider';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY — running without auth');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <ClerkAuthProvider>
          <App />
        </ClerkAuthProvider>
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
);
