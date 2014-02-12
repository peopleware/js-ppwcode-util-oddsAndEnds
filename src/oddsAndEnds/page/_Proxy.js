/*
 Copyright 2012 - $Date $ by PeopleWare n.v.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

define(["dojo/_base/declare", "dojo/_base/config", "dojo/Deferred", "./_sharedKeys",
        "ppwcode-util-oddsAndEnds/log/logger!", "module"],
  function (declare, config, Deferred, _sharedKeys,
            logger, module) {

    var LOAD_TIMEOUT =  30000;

    var PageProxy = declare([], {
      // summary:
      // description:
      //   Every function must return a Promise, because the page we are proxy for might not yet
      //   be loaded.

      // _name: String
      //   Used as window.name of the window we are proxy for.
      _name: null,

      // _href: String
      //   Exact URL of the proxied page.
      _href: null,

      constructor: function(/*Definition*/ definition) {
        if (!definition) {
          throw "ERROR: _Proxy needs a definition";
        }
        this._name = definition.getName();
        if (!this._name) {
          throw "ERROR: definition did not provide a sensible name";
        }
        this._href = definition.getHref();
        if (!this._href) {
          throw "ERROR: definition did not provide a sensible location";
        }
        logger.info("Window[" + this._name + "] constructed with location  = " + this._href);
      },

      _getPage: function () {
        // summary:
        //   Promise for the proxied Page object.
        //   If the window is not yet open, or closed again, we open it and let it load and initialize
        //   before we resolve the Promise. Otherwise, we return a resolved Promise.

        var self = this;
        var deferred = new Deferred();
        var windowReference = window.open("", this._name);
        // Returns a reference to the existing window with name _name,
        // or opens a new one with that name if none exists yet.
        // The location of the window is empty for a new one, and does not change
        // for an existing one. Returns falsy if opening fails. The window is not closed.
        // Open also brings the window to the front. // MUDO
        if (!windowReference) {
          logger.error("Window[" + self._name + "] failed to open");
          deferred.reject("WINDOW COULD NOT BE OPENED");
        }
        else if (windowReference.location.href === this._href && windowReference[_sharedKeys.PAGE_PROPERTY_NAME]) {
          deferred.resolve(windowReference[_sharedKeys.PAGE_PROPERTY_NAME]);
        }
        else {
          // the page is not yet loaded or initialized, or refers to another location,
          // If the found window does not yet have the content we want,
          // load it. This will take some time. Furthermore, we are on a timeout.
          // Even if the found window has the desired location, we are here because
          // we had no windowReference[_sharedKeys.PAGE_PROPERTY_NAME] yet, meaning it is not completely initialized yet.
          // TODO POSSIBLE RACE CONDITION HERE
          var timeout;

          function removeListeners() {
            if (timeout) {
              clearTimeout(timeout);
            }
            windowReference.removeEventListener("message", messageHandler);
          }

          function failure(msg, rejection) {
            removeListeners();
            logger.error("Window[" + self._name + "] " + msg);
            deferred.reject(rejection);
          }

          function messageHandler(event) {
            logger.info("Message from remote window received: ", event);
            if (self._href.indexOf(event.origin) !== 0 || event.source !== windowReference) {
              return;
            }
            var key = event.data && event.data.key;
            if (key === _sharedKeys.LOADED) {
              removeListeners();
              logger.info("Window[" + self._name + "] brought loaded");
              deferred.resolve(windowReference[_sharedKeys.PAGE_PROPERTY_NAME]);
            }
            else if (key === _sharedKeys.LOAD_ERROR) {
              failure("failed to open", event.data.exception);
            }
            else {
              logger.warn("Window[" + self._name + "] unexpected message");
            }
          }

          windowReference.addEventListener("message", messageHandler, false);

          if (windowReference.location.href !== this._href) { // actually start loading the url
            timeout = setTimeout(
              function() {failure("loading timed-out.", "LOADING WINDOW TIMED OUT");},
              LOAD_TIMEOUT
            );
            logger.info("Starting load into window");
            windowReference.location = this._href;
            // MUDO BUT WE MIGHT WANT TO GIVE FOCUS EARLY
          }
        }
        return deferred.promise;
      },

      focus: function () {
        var self = this;
        var openedAndLoaded = self._getPage();
        var focused = openedAndLoaded.then(
          function(page) { // MUDO this is the page, not the window
            page.focus();
          }
        );
        return focused;
      },

      call: function(name, args) {
        // summary:
        //   Call the function with name `name`, registered on the Page object this is a _Proxy for,
        //   with arguments `args`.
        // description:
        //   Returns a Promise for the result of the function call. If the page this is a _Proxy for
        //   is not open yet, opens that page, waits until it is loaded and initialized, and then calls
        //   the function. If the page this is a _Proxy for is open, the function is called immediately,
        //   but still a Promise is returned, which is probably resolved already.
        //   Thus, reported errors can both be errors from loading the page and from the function itself.

        var self = this;
        var pageOpenedLoadedAndInitialized = self._getPage();
        var calledAndReturned = pageOpenedLoadedAndInitialized.then(
          function(page) {
            try {
              var remoteResult = page.registeredFunctions[name].apply(null, args);
              logger.info("Remote call of " + self._name + "." + name + " returned nominally: ", remoteResult);
              return remoteResult;
            }
            catch (err) {
              logger.error("ERROR during remote call of " + self._name + "." + name + ": ", err);
              throw err;
            }
          }
        );
        return calledAndReturned;
      }

    });

    PageProxy.mid = module.id;
    return PageProxy;
  }
)
;
