import React, { useEffect, useState } from "react";

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    console.log('🔧 InstallButton component mounted');
    
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isInStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;
      
      console.log('📱 Install status check:', {
        isStandalone,
        isIOS,
        isInStandaloneMode,
        userAgent: navigator.userAgent
      });

      if (isStandalone || (isIOS && isInStandaloneMode)) {
        console.log('✅ App already installed');
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkInstalled()) {
      setDebugInfo('App already installed');
      return;
    }

    // Handle beforeinstallprompt event
    const handler = (e) => {
      console.log('🎯 beforeinstallprompt event fired!', e);
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
      setDebugInfo('Install prompt available');
    };

    // Handle app installed event
    const handleInstalled = () => {
      console.log('🎉 App was installed');
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
      setDebugInfo('App installed successfully');
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", handleInstalled);

    // Check PWA criteria
    const checkPWACriteria = () => {
      const criteria = {
        hasServiceWorker: 'serviceWorker' in navigator,
        hasManifest: document.querySelector('link[rel="manifest"]') !== null,
        isHTTPS: location.protocol === 'https:' || location.hostname === 'localhost',
        hasIcons: true // Assume icons are present
      };
      
      console.log('🔍 PWA Criteria:', criteria);
      setDebugInfo(`SW:${criteria.hasServiceWorker}, Manifest:${criteria.hasManifest}, HTTPS:${criteria.isHTTPS}`);
      
      return Object.values(criteria).every(Boolean);
    };

    // Show button for testing in development or after timeout
    const testTimer = setTimeout(() => {
      if (!deferredPrompt && !isInstalled) {
        const meetsCriteria = checkPWACriteria();
        console.log('⏰ Timeout reached. PWA criteria met:', meetsCriteria);
        
        if (meetsCriteria) {
          console.log('🧪 Showing install button for testing');
          setShowButton(true);
          setDebugInfo('Test mode - PWA installable');
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleInstalled);
      clearTimeout(testTimer);
    };
  }, []);

  const handleInstall = async () => {
    console.log('🚀 Install button clicked', { deferredPrompt });
    
    if (!deferredPrompt) {
      console.log('⚠️ No deferred prompt available');
      
      // Show manual install instructions
      const instructions = `
        Untuk menginstall aplikasi Sayur YuNur:
        
        📱 Android Chrome:
        • Tap menu ⋮ (3 titik)
        • Pilih "Install app" atau "Add to Home screen"
        
        🍎 iPhone Safari:
        • Tap tombol Share 📤
        • Pilih "Add to Home Screen"
        
        💻 Desktop Chrome:
        • Klik ⋮ di pojok kanan atas
        • Pilih "Install Sayur YuNur"
      `;
      
      alert(instructions.trim());
      return;
    }

    try {
      console.log('📲 Showing install prompt...');
      const result = await deferredPrompt.prompt();
      console.log('📝 Prompt result:', result);

      const { outcome } = await deferredPrompt.userChoice;
      console.log('👤 User choice:', outcome);

      if (outcome === 'accepted') {
        console.log('✅ User accepted install');
        setDebugInfo('Install accepted');
      } else {
        console.log('❌ User dismissed install');
        setDebugInfo('Install dismissed');
      }

      setDeferredPrompt(null);
      setShowButton(false);
    } catch (error) {
      console.error('💥 Install failed:', error);
      setDebugInfo('Install error: ' + error.message);
    }
  };

  // Always show button in development for testing
  const isDev = import.meta.env.DEV;
  const shouldShow = showButton || (isDev && !isInstalled);

  console.log('🎨 Render decision:', { 
    isInstalled, 
    showButton, 
    shouldShow, 
    isDev,
    debugInfo 
  });

  if (isInstalled) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Debug info - only in development */}
      {isDev && (
        <div className="mb-2 p-2 bg-black bg-opacity-75 text-white text-xs rounded max-w-xs">
          Debug: {debugInfo || 'Waiting for install prompt...'}
        </div>
      )}
      
      {/* Install button */}
      {shouldShow && (
        <button
          onClick={handleInstall}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 text-sm font-medium animate-pulse"
          title="Install aplikasi Sayur YuNur"
        >
          <span className="text-base">📱</span>
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
      )}
    </div>
  );
};

export default InstallButton;
