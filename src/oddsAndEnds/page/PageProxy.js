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

define(["dojo/_base/declare", "dojo/_base/config", "dojo/Deferred", "ppwcode-util-oddsAndEnds/log/logger!", "require", "module"],
  function (declare, config, Deferred, logger, require, module) {

    function toUrl(path) {
      return require.toUrl(path).split("?")[0]; // remove the cache-bust part
    }

    var PageProxy = declare([], {
      // summary:
      // description:
      //   Every function must return a Promise because inter window communication is asynchronous.

      windowId: null,
      _windowName: null,
      _windowLocation: null,
      _windowReference: null,

      constructor: function(key) {
        this.windowId = key;
        var windowProperties = config.pageDefinitions[this.windowId];
        this._windowName = windowProperties.name;
        this._windowLocation = toUrl("dojo/dojo") + "../../" + windowProperties.url;
        if (!window.PAGE_PROXIES) {
          window.PAGE_PROXIES = {};
        }
        window.PAGE_PROXIES[this._windowName] = this;
        logger.info("Window[" + this._windowName + "] Constructed with location  = " + this._windowLocation);
      },

      close: function () {
        if (this._windowReference && !this._windowReference.closed) {
          this._windowReference.close();
        }
      },

      doSomething: function (/*String*/ functionName) {
        this.bringToFront();
        if (this._windowReference && !this._windowReference.closed) {
          logger.info("Window[" + this._windowReference.name + "] Executing function " + functionName);
          this._windowReference[functionName]();
        }
      },

      _registerFunction: function(name) {
        // summary:
        //   Register that the Page we are a Proxy for, has a function `name`that can be called
        //   inter-window.

        // TODO also need to remove?

        var self = this;
        self[name] = function() {
          var deferred = new Deferred();
          try {
            if (!open){
            open // Promise
          }

          var result = self._windowReference._PAGENAME[name].call(null, arguments);
          deferred.resolve(result);
        }
        catch(err) {
          deferred.reject(err);
        }

          return deferred.promise;
        }
      },

      bringToFront: function () {
        var self = this;
        var deferred = new Deferred();
// TODO enable timeout
//        var timeout = setTimeout(
//          function() {
//            clearTimeout(timeout);
//            logger.info("Window[" + self._windowName + "] Failed to open (time-out)");
//            deferred.reject("timeout");
//          },
//          10000
//        );
        self._windowReference = window.open("", this._windowName);
        if (self._windowReference.location == "about:blank") {
          self._windowReference.location = this._windowLocation;
        }
        if (self._windowReference) {
          self._windowReference.addEventListener(
            "WINDOW_LOADED",
            function(event) {
              clearTimeout(timeout);
              deferred.resolve(event);
              logger.info("Window[" + self._windowName + "] Brought to front");
              self._windowReference.focus();
            },
            false
          );
          self._windowReference.addEventListener(
            "WINDOW_NOT_LOADED",
            function(event) {
              clearTimeout(timeout);
              logger.info("Window[" + self._windowName + "] Failed to open");
              deferred.reject(event);
            },
            false
          );
        }
        return deferred.promise;
      }

    });

    PageProxy.mid = module.id;
    return PageProxy;
  }
)
;
