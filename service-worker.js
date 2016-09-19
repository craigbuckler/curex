// CurEx service worker
var
	version = '1.0.0',
	appCache = 'curex-' + version,
	dataCache = 'curexdata-' + version,
	installFiles = [
		'/',
		'/index.html',
		'/manifest.json',
		'/css/app.css',
		'/js/app.js',
		'/favicon.ico',
		'/images/curex-76.png',
		'/images/curex-152.png',
		'/images/curex-192.png',
		'/images/curex-256.png',
		'/images/curex-152.png'
	];


// application installation: cache app shell files
self.addEventListener('install', function(e) {

  console.log('service worker: installation');

	e.waitUntil(
		// open cache
    caches.open(appCache).then(function(cache) {
      console.log('service worker: app shell cached');
			// add installation files
      return cache
				.addAll(installFiles)
				.then(function() {
					// jump to activation stage
					self.skipWaiting();
				});
    })
  );

});


// application activated: remove old cached files
self.addEventListener('activate', function(e) {

  console.log('service worker: activate');

	e.waitUntil(
		// loop cache keys
		caches.keys().then(function(keyList) {
			return Promise.all(keyList.map(function(key) {
				if (key !== appCache && key !== dataCache) {
					// delete old cache keys
					console.log('service worker: remove old cache', key);
					return caches.delete(key);
				}
			}));
		})
	);

	// start controlling all open clients
	return self.clients.claim();

});


// application fetch network data
self.addEventListener('fetch', function(e) {

  console.log('service worker: fetch', e.request.url);

  var dataUrl = 'https://api.';
  if (e.request.url.indexOf(dataUrl) > -1) {

		// Ajax data request to API started
		console.log('service worker: data request');

    e.respondWith(
      caches.open(dataCache).then(function(cache) {
        return fetch(e.request).then(function(response) {
					// store reponse in cache
          cache.put(e.request.url, response.clone());
          return response;
        });
      })
    );

  }
	else {

		// returned cached app shell files
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );

  }
});
