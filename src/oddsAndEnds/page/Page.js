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

define(["dojo/_base/declare", "dojo/_base/config", "ppwcode-util-oddsAndEnds/log/logger!", "module"],
  function (declare, config, logger, module) {

    var Page = declare([], {
      // summary:
      // description:

      constructor: function(key) {
        var windowProperties = config.pageDefinitions[key];
        window.name = windowProperties.name;
        logger.info("Page[" + window.name + "] Constructed");
        this._loadAllFunctions();
      },

      loadComplete: function() {
        logger.info("Page["+window.name+"] LoadComplete called");
        if (window.opener) {
          window.opener.postMessage("WINDOW_LOADED", "*");
          logger.info("Page["+window.name+"] message posted to Window[" + window.opener.name + "]");
        }
      },

      registerFunction: function(/*String*/ name, /*Function*/ func) {
        // summary:
        //   Sets the property `name`to `func`.
        // description:
        //  If there already is a value for `name`, it is overridden.
        //  `func`will be called in the global scope, so it should probably
        //  be hitched. Since the intention of this code is to be able to call
        // `func` from other pages, and in interwindow-communication all arguments
        // are passed by value (copied), this function should take that into account.

        this[name] = func;
        logger.info("Page[" + window.name + "] registered function[" + name + "]");
        proxies.forEach(function(proxy) {
          proxy._registerFunction(name);
        });
      },

      loadError: function() {

      },

      _loadAllFunctions: function() {
        var self = this;
        for (var member in self) {
          if (self.hasOwnProperty(member) && typeof(self[member]) === "function") {
            self.registerFunction(member, self[member]);
          }
        }
      }

    });

    Page.mid = module.id;
    return Page;
  }
)
;
