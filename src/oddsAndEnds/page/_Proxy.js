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

    var LOAD_TIMEOUT = 30000;
    var POLL_INTERVAL = 200;
    var MAX_POLLS = 150; // 30 seconds at least

    function randomName() {
      // summary:
      //   Returns a random string, to be used as a random window name.
      return "random" + Date.now();
    }

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

      // _proxiedWindow: Window
      //   A reference to the proxied window, if we opened it before.
      //   This window might be closed again, however.
      _proxiedWindow: null,

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

      _proxyHasCorrectUrlAndName: function() {
        if (!this._proxiedWindow || (this._proxiedWindow.name !== this._name)) {
          return false;
        }
        var noHashHrefCurrent = this._proxiedWindow && this._proxiedWindow.location.href.split("#")[0];
        var noHashHrefDefinition = this._href && this._href.split("#")[0];
        return noHashHrefCurrent === noHashHrefDefinition;
      },

      _proxyHasCorrectNameAndIsBlank: function() {
        return this._proxiedWindow &&
               (this._proxiedWindow.name === this._name) &&
               this._proxiedWindow.location.href === "about:blank";
      },

      _waitForPage: function waitForPage(/*Deferred*/ deferred, /*Number*/ counter) {
        // summary:
        //   When we have the correct window reference, it might still be loading.
        //   The only solution without a race condition is to poll now and again
        //   for the "sentinel": is the Page object there?

        var page = self._proxiedWindow[_sharedKeys.PAGE_PROPERTY_NAME];
        if (page) {
          deferred.resolve(page);
          return;
        }
        if (counter > MAX_POLLS) {
          deferred.reject("LOAD DID NOT COMPLETE");
          return;
        }
        setTimeout(
          function() {
            waitForPage(deferred, counter + 1);
          },
          POLL_INTERVAL
        );
      },

      focus: function () {
        // summary:
        //   Finds or creates the proxied window, and try to bring it to the front.
        //   Returns a Promise for the proxied Page object. If the window is not yet open,
        //   or closed again, we open it and let it load and initialize before we resolve
        //   the Promise. Otherwise, we return a resolved Promise.
        //   In all cases in all browsers, the window will be there, and start to load
        //   if it wasn't loaded yet; but we cannot guarantee that it will be brought
        //   to the front in IE and FF.
        // description:
        //   In webkit, this function will always bring the proxied page to the front if nothing
        //   goes wrong, and probably will if something does go wrong.
        //   In IE and FF, this function will bring the proxied page to the front if it doesn't
        //   exist yet, or it is the "visible" tab in another window (even if it is minimized /
        //   in the dock). If the exists already, and is a tab that isn't "visible", in any
        //   window, it is not brought to the front. There doesn't seem to be any way to do that.
        //   If something goes wrong, all bets are off.

        var self = this;
        var deferred = new Deferred();
        if (self._proxiedWindow) {
          /* We opened the window earlier. But,
             - it might be closed already;
             - it might have a different name now;
             - it might now contain a different URL;
             - or it might be open still, have the correct name, and contain the correct URL

             If it is still open, and has the correct name and URL, we just want to return the
             existing reference. We cannot guarantee to bring it to the front in IE and FF.

             If it is closed already, we want to discard our old reference, open a new window,
             and load the correct URL in that window. It will be brought to the front.

             If it is there still, but contains a different URL, we want to reload the correct
             URL. It would not be brought to the front.
             If it contains the correct URL but has a different name, we might re-appropriate it,
             but we will not. This should not happen, and this would be confusing.
             We might be more consistent in this case by closing the window, and reopening it
             (it then becomes the second case, where it is brought to the front). However,
             closing the window can only be done with windows that where opened by a script.
             An "original" window cannot be changed like that. In that case, we might
             change the name of the original window, and still open a new one. The window
             is no longer "ours" anyway. And it can stay open. */
          if (!self._proxiedWindow.closed && self._proxyHasCorrectUrlAndName()) {
            self._proxiedWindow.focus(); // will not always work in FF and IE
            self._waitForPage(deferred, 0);
            return deferred.promise;
          }
          // closed or not the correct URL or wrong name
          if (!self._proxiedWindow.closed) {
            // not the correct URL or wrong name
            // rename the window and discard the reference
            self._proxiedWindow.name = randomName();
            /* NOTE: This might not work if the URL is another origin.
               If this fails silently, we will get a reference to the same
               window again in 2 lines, and again after the check there.
               We will then reload the correct URL in this window,
               which might or might not work. Potentially, this results
               in a time out.
               There doesn't seem anything we can do about this case. */
          }
          // in any case, discard and load again now
          self._proxiedWindow = null;
        }
        // The window we want might already be open. Lets see if we can find it by name.
        self._proxiedWindow = window.open("", this._name);
        /* Returns a reference to the existing window with name _name,
           or opens a new one with that name if none exists yet.
           The location of the window is empty for a new one, and does not change
           for an existing one. Returns falsy if opening fails.
           The window is not closed, but might still have the correct URL,
           an different URL, or be blank. */
        if (self._proxyHasCorrectUrlAndName()) {
          self._proxiedWindow.focus(); // will not always work in FF and IE
          self._waitForPage(deferred, 0);
          return deferred.promise;
        }
        if (!self._proxiedWindow) {
          logger.error("Window[" + self._name + "] failed to open");
          deferred.reject("WINDOW COULD NOT BE OPENED");
        }
        // not the correct URL or blank, or wrong name; can also be blank with the wrong name
        if (!self._proxyHasCorrectNameAndIsBlank()) {
          // not the correct URL or wrong name
          // rename the window and discard the reference
          self._proxiedWindow.name = randomName();
          self._proxiedWindow = window.open("", this._name);
        }
        /* ProxiedWindow now is blank and has the correct name;
           Load it, and wait for it to finish initialization; then
           report success or failure.
           The Page in the window will call a success or failure callback in this window.
           This is the only way that works in all browsers (postMessage cannot be used, because
           listeners cannot reliably be registered before the page is loaded. This creates
           a race condition. */

        var timeout;

        function removeCallBacks() {
          if (timeout) {
            clearTimeout(timeout);
          }
          delete window[_sharedKeys.SUCCESS_CALLBACK_NAME + "_" + self._name];
          delete window[_sharedKeys.ERROR_CALLBACK_NAME + "_" + self._name];
        }

        function failure(msg, rejection) {
          removeCallBacks();
          logger.error("Window[" + self._name + "] " + msg);
          deferred.reject(rejection);
        }

        window[_sharedKeys.SUCCESS_CALLBACK_NAME + "_" + self._name] = function(/*Page*/ page) {
          removeCallBacks();
          logger.info("Window[" + self._name + "] loaded");
          deferred.resolve(page);
        };

        window[_sharedKeys.ERROR_CALLBACK_NAME + "_" + self._name] = function(errMsg) {
          failure("failed to open", errMsg);
        };

        timeout = setTimeout(
          function() {
            failure("loading timed-out.", "LOADING WINDOW TIMED OUT");
          },
          LOAD_TIMEOUT
        );
        logger.info("Starting load into window");
        self._proxiedWindow.location.replace(this._href);

        return deferred.promise;
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
        //   We try to focus on the proxied page early for all calls (but this will often not work
        //   in FF and IE).

        var self = this;
        var pageOpenedLoadedAndInitialized = self.focus();
        var calledAndReturned = pageOpenedLoadedAndInitialized.then(
          function(page) {
            if (!page) {
              throw "ERROR: could not find proxied Page object";
            }
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
