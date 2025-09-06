// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// Context Providers
import { CartProvider } from './context/CartContext';

// Components
import BottomNavigation from './components/BottomNavigation';
import AdminLogin from './components/AdminLogin';
import InstallButton from './components/InstallButton';

// Pages
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import OrdersPage from './pages/OrdersPage';
import AdminPage from './pages/AdminPage';

// Loading Component
const LoadingScreen = () => (
  <div className="fixed inset-0 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center z-50">
    <div className="text-center text-white">
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <span className="text-3xl">🥬</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Sayur YuNur</h1>
        <p className="text-green-100">Sayur segar langsung dari petani</p>
      </div>
      
      {/* Loading Animation */}
      <div className="flex justify-center space-x-1">
        <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce animation-delay-100"></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce animation-delay-200"></div>
      </div>
    </div>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-800 mb-2">
                Oops! Terjadi Kesalahan
              </h1>
              <p className="text-gray-600 mb-4">
                Aplikasi mengalami masalah. Silakan refresh halaman atau hubungi admin.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Refresh Halaman
              </button>
              
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Detail Error (Dev Mode)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded text-red-600 overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected Route Component untuk Admin
const ProtectedAdminRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <AdminLogin 
        onLoginSuccess={(user) => {
          setUser(user);
          window.location.reload(); // Refresh untuk memastikan state terupdate
        }} 
      />
    );
  }

  return React.cloneElement(children, { user, onLogout: () => setUser(null) });
};

// Main App Component dengan State (tanpa router)
const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulasi loading awal (bisa digunakan untuk setup Firebase, dll)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check saved page from localStorage
        const savedPage = localStorage.getItem('sayur-yunur-current-page');
        if (savedPage && ['home', 'cart', 'orders'].includes(savedPage)) {
          setCurrentPage(savedPage);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save current page to localStorage
  useEffect(() => {
    localStorage.setItem('sayur-yunur-current-page', currentPage);
  }, [currentPage]);

  // Handle page navigation
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Offline Banner Component
  const OfflineBanner = () => (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 px-4 z-40">
      <span className="text-sm font-medium">
        📶 Tidak ada koneksi internet. Beberapa fitur mungkin tidak tersedia.
      </span>
    </div>
  );

  // Render current page based on state
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'cart':
        return <CartPage />;
      case 'orders':
        return <OrdersPage />;
      default:
        return <HomePage />;
    }
  };

  // Show loading screen
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Offline Banner */}
          {!isOnline && <OfflineBanner />}
          
          {/* Main Content */}
          <main className={`${!isOnline ? 'pt-10' : ''}`}>
            {renderCurrentPage()}
          </main>

          {/* Bottom Navigation */}
          <BottomNavigation 
            currentPage={currentPage} 
            setCurrentPage={handlePageChange} 
          />
        </div>
      </CartProvider>
    </ErrorBoundary>
  );
};

// App Component dengan React Router (RECOMMENDED)
export const AppWithRouter = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const initializeApp = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsLoading(false);
    };
    initializeApp();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <InstallButton/>
            {/* Offline Banner */}
            {!isOnline && (
              <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 px-4 z-40">
                <span className="text-sm font-medium">
                  📶 Tidak ada koneksi internet. Beberapa fitur mungkin tidak tersedia.
                </span>
              </div>
            )}
            
            {/* Routes */}
            <main className={`${!isOnline ? 'pt-10' : ''}`}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                
                {/* Admin Routes */}
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedAdminRoute>
                      <AdminPage />
                    </ProtectedAdminRoute>
                  } 
                />
                <Route path="/admin/login" element={<Navigate to="/admin" replace />} />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Bottom Navigation - hanya tampil di halaman user, tidak di admin */}
            <ConditionalBottomNavigation />
          </div>
        </Router>
      </CartProvider>
    </ErrorBoundary>
  );
};

// Conditional Bottom Navigation - tidak tampil di halaman admin
const ConditionalBottomNavigation = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    // Listen for both popstate and pushstate events
    window.addEventListener('popstate', handleLocationChange);
    
    // Override pushState to trigger our handler
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handleLocationChange();
    };
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
    };
  }, []);

  // Don't show bottom navigation on admin pages
  if (currentPath.startsWith('/admin')) {
    return null;
  }

  const handlePageChange = (page) => {
    let path = '/';
    switch (page) {
      case 'home': path = '/'; break;
      case 'cart': path = '/cart'; break;
      case 'orders': path = '/orders'; break;
    }
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const getCurrentPage = () => {
    switch (currentPath) {
      case '/': return 'home';
      case '/cart': return 'cart';
      case '/orders': return 'orders';
      default: return 'home';
    }
  };

  return (
    <BottomNavigation 
      currentPage={getCurrentPage()} 
      setCurrentPage={handlePageChange} 
    />
  );
};

// Export default dengan router (RECOMMENDED)
export default AppWithRouter;

// Alternative tanpa router (uncomment jika tidak ingin menggunakan router)
// export default App;