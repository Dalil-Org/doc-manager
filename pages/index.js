import { useState, useEffect } from 'react';
import Login from '../components/Login';
import DocumentManager from '../components/DocumentManager';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem('docManagerAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', paddingTop: '50px' }}>Chargement...</div>;
  }

  return (
    <main>
      {!isAuthenticated ? (
        <Login onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <DocumentManager onLogout={() => setIsAuthenticated(false)} />
      )}
    </main>
  );
}
</p>
