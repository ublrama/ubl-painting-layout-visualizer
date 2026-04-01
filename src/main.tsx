import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { SupabaseAuthProvider } from './components/SupabaseAuthProvider';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SupabaseAuthProvider>
      <App />
    </SupabaseAuthProvider>
  </StrictMode>,
);
