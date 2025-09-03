// service-worker.js

const CACHE_VERSION = 'v5'; // Bumped version for update
const STATIC_CACHE_NAME = `pharmalix-ai-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `pharmalix-ai-dynamic-${CACHE_VERSION}`;
const VENDOR_CACHE_NAME = `pharmalix-ai-vendor-${CACHE_VERSION}`;
const FONT_CACHE_NAME = `pharmalix-ai-fonts-${CACHE_VERSION}`; // New cache for fonts

// Expanded list of core files for a more robust offline experience.
const APP_SHELL_URLS = [
  // Core App Structure
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  
  // Libraries & Utilities
  '/lib/supabaseClient.ts',
  '/lib/utils.ts',
  '/lib/newsData.ts',
  
  // Contexts & Hooks
  '/contexts/SettingsContext.tsx',
  '/hooks/useAuth.ts',
  '/hooks/useSessionTimeout.ts',
  '/hooks/useVoiceRecognition.ts',
  
  // Core UI Components
  '/components/LoadingSpinner.tsx',
  '/components/SuspenseLoading.tsx',
  '/components/ErrorBoundary.tsx',
  '/components/ErrorState.tsx',
  '/components/Sidebar.tsx',
  '/components/Header.tsx',
  '/components/NewsTicker.tsx',
  '/components/Modal.tsx',
  '/components/EmergencyModal.tsx',
  '/components/SessionTimeoutModal.tsx',
  '/components/Tooltip.tsx',
  '/components/Notification.tsx',
  '/components/VoiceInputButton.tsx',

  // Reusable UI Primitives
  '/components/ui/Button.tsx',
  '/components/ui/Card.tsx',
  '/components/ui/Input.tsx',
  '/components/ui/Label.tsx',

  // Auth Flow
  '/components/auth/Auth.tsx',
  '/components/auth/Login.tsx',
  '/components/auth/SignUp.tsx',
  '/components/auth/DnaModel.tsx',
  
  // Role-specific Shells & Main Dashboard
  '/components/doctor/DoctorSidebar.tsx',
  '/components/admin/AdminSidebar.tsx',
  '/components/Dashboard.tsx',
];

// Install: Cache the app shell for offline availability.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching App Shell and essential resources');
        return cache.addAll(APP_SHELL_URLS).catch(error => {
          console.error('Failed to cache app shell:', error);
          // Don't fail the entire install if one file is missing, but log it.
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches to save space and avoid version conflicts.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith('pharmalix-ai-') && !cacheName.endsWith(CACHE_VERSION)) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Implements caching strategies to provide a fast, offline-first experience.
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy 1: Cache First for esm.sh vendor libraries. These are versioned and immutable.
  if (url.hostname === 'esm.sh') {
    event.respondWith(
      caches.open(VENDOR_CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }
  
  // Strategy 2: Stale-While-Revalidate for Google Fonts.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Strategy 3: Network First for navigation requests.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        // Fallback to the cached index.html for any navigation request.
        return caches.match('/', { cacheName: STATIC_CACHE_NAME });
      })
    );
    return;
  }

  // Strategy 4: Network Only for Supabase API calls.
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(fetch(request)); // Always fetch from network
    return;
  }

  // Strategy 5: Stale-While-Revalidate for all other assets (e.g., dynamic components, images).
  event.respondWith(
    caches.open(DYNAMIC_CACHE_NAME).then(cache => {
      return cache.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            // If network fails, the cachedResponse will be used if it exists.
            console.warn(`Service Worker: Fetch failed for ${request.url}`, err);
        });
        
        return cachedResponse || fetchPromise;
      });
    })
  );
});