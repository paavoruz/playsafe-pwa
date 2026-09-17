const CACHE_NAME =
  "playsafe-v8";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json"
];


/* =========================================================
   INSTALL
   ========================================================= */

self.addEventListener(
  "install",
  function(event) {

    event.waitUntil(

      caches
        .open(
          CACHE_NAME
        )
        .then(
          function(cache) {

            return cache.addAll(
              APP_FILES
            );
          }
        )
    );

    self.skipWaiting();
  }
);


/* =========================================================
   ACTIVATE
   ========================================================= */

self.addEventListener(
  "activate",
  function(event) {

    event.waitUntil(

      caches
        .keys()
        .then(
          function(keys) {

            return Promise.all(

              keys
                .filter(
                  function(key) {

                    return (
                      key !==
                      CACHE_NAME
                    );
                  }
                )
                .map(
                  function(key) {

                    return caches.delete(
                      key
                    );
                  }
                )
            );
          }
        )
    );

    self.clients.claim();
  }
);


/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener(
  "fetch",
  function(event) {

    const request =
      event.request;


    if (
      request.method !==
      "GET"
    ) {
      return;
    }


    /*
      Lehe avamisel:

      INTERNETIGA:
      proovime kõigepealt GitHubist
      kõige uuemat index.html faili.

      OFFLINE:
      kasutame cache'is olevat
      Playsafe rakendust.
    */

    if (
      request.mode ===
      "navigate"
    ) {

      event.respondWith(

        fetch(
          request
        )
          .then(
            function(response) {

              const copy =
                response.clone();


              caches
                .open(
                  CACHE_NAME
                )
                .then(
                  function(cache) {

                    cache.put(
                      "./index.html",
                      copy
                    );
                  }
                );


              return response;
            }
          )
          .catch(
            function() {

              return caches.match(
                "./index.html"
              );
            }
          )
      );

      return;
    }


    /*
      Muud failid:
      cache kõigepealt,
      internet varuvariandina.
    */

    event.respondWith(

      caches
        .match(
          request
        )
        .then(
          function(cached) {

            if (cached) {
              return cached;
            }


            return fetch(
              request
            )
              .then(
                function(response) {

                  /*
                    Cache'ime ainult
                    meie enda GitHubi
                    origin'i failid.

                    Apps Scripti API
                    JSONP päringuid
                    siia ei salvestata.
                  */

                  const url =
                    new URL(
                      request.url
                    );


                  if (
                    url.origin ===
                    self.location.origin
                  ) {

                    const copy =
                      response.clone();


                    caches
                      .open(
                        CACHE_NAME
                      )
                      .then(
                        function(cache) {

                          cache.put(
                            request,
                            copy
                          );
                        }
                      );
                  }


                  return response;
                }
              );
          }
        )
    );
  }
);
