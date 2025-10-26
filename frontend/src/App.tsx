import { useEffect, useState } from 'react';
import { StarfieldBackground } from './components/StarfieldBackground';
import { HeroSection } from './components/HeroSection';
import { AuthPage } from './components/AuthPage';
import { CreateCapsule } from './components/CreateCapsule';
import { CapsuleViewer } from './components/CapsuleViewer';
import { CommunityCapsules } from './components/CommunityCapsules';
import { FriendsPlanets } from './components/FriendsPlanets';

type Page = 'auth' | 'home' | 'create' | 'viewer' | 'community' | 'planets';

const API_BASE = import.meta.env.VITE_HOSTED_BACKEND_URL || 'http://localhost:5000';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('auth');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // check session on load
  useEffect(() => {
    let mounted = true;
    async function checkSession() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          method: 'GET',
          credentials: 'include', // critical to send cookie
        });
        if (!mounted) return;
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        if (!mounted) return;
        setIsAuthenticated(false);
      }
    }
    checkSession();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    setCurrentPage('home');
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen relative">
      <StarfieldBackground />
      
      {!isAuthenticated ? (
        <AuthPage onAuthenticated={handleAuthenticated} />
      ) : (
        <>
          {currentPage === 'home' && (
            <HeroSection onNavigate={handleNavigate} />
          )}
          
          {currentPage === 'create' && (
            <CreateCapsule onBack={() => handleNavigate('home')} />
          )}
          
          {currentPage === 'viewer' && (
            <CapsuleViewer onBack={() => handleNavigate('home')} />
          )}
          
          {currentPage === 'community' && (
            <CommunityCapsules onBack={() => handleNavigate('home')} />
          )}
          
          {currentPage === 'planets' && (
            <FriendsPlanets onBack={() => handleNavigate('home')} />
          )}
        </>
      )}
    </div>
  );
}
