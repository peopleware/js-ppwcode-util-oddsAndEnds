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

define(["dojo/_base/declare", "dojo/Deferred", "dojo/_base/lang", "./_sharedKeys",
        "ppwcode-util-oddsAndEnds/log/logger!", "module"],
  function (declare, Deferred, lang, _sharedKeys,
            logger, module) {

    var Page = declare([], {
      // summary:
      //   Instances represent a loaded page, for access by proxies.
      // description:
      //   There can be only 1 instance in a window / page.
      //   The "page" is identified by the window.name, which might change.

      // registeredFunctions: String[]
      //   Array of the names of the registered functions.
      registeredFunctions: {},

      constructor: function(/*Definition*/ definition) {
        if (!definition) {
          throw "ERROR: Page needs a definition.";
        }
        this.registeredFunctions = {};
        window.name = definition.getName();
        if (!window.name) {
          throw "ERROR: definition did not return a sensible name";
        }
        logger.info("Page[" + window.name + "] object constructed.");
      },

      loadComplete: function() {
        window[_sharedKeys.PAGE_PROPERTY_NAME] = this;
        logger.info("Page[" + window.name + "] _loadComplete. Page object registered under '" + _sharedKeys.PAGE_PROPERTY_NAME + "'. Sending completion message.");
        opener[_sharedKeys.SUCCESS_CALLBACK_NAME + "_" + window.name](this);
      },

      loadError: function(err) {
        logger.error("Page[" + window.name + "] _loadError (sending error message): ", err);
        var errText = typeof err === "string" ? err : (err.message || err.toString()); // Error objects cannot be copied to another window
        opener[_sharedKeys.ERROR_CALLBACK_NAME + "_" + self._name](errText);
        return err;
      },

      registerFunction: function(/*String*/ name, /*Function*/ func) {
        // summary:
        //   Sets the property `name` to `func`.
        // description:
        //  If there already is a value for `name`, it is overridden.
        //  `func`will be called in the global scope, so it should probably
        //  be hitched. Since the intention of this code is to be able to call
        // `func` from other pages, and in interwindow-communication all arguments
        //  are passed by value (copied), this function should take that into account.

        this.registeredFunctions[name] = func;
        logger.info("Page[" + window.name + "] registered function " + name);
      },

      focus: function() {
        window.focus();
      }

    });

    Page.mid = module.id;
    return Page;
  }
)
;
