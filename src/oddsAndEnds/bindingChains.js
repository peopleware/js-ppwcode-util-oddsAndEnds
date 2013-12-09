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

define(["./js", "./log/logger!"],
  function(js, logger) {

    function isStateful(/*Stateful*/ s) {
      return s && s.get && s.watch && js.typeOf(s.get) === "function" && js.typeOf(s.watch) === "function" && s.watch !== Object.prototype.watch;
      // the last check protects against FF, where everything has a watch method
    }

    function isObservableStore(/*Observable*/ s) {
      return s && s.get && s.query && js.typeOf(s.get) === "function" && js.typeOf(s.query) === "function";
    }

    function _getValue(context, propertyName) {
      logger.trace("    getting value '" + propertyName + "' from " + context);
      var result;
      if (propertyName === "@" || propertyName === "@^") {
        logger.trace("    propertyName is '@'; this means we just came through a store");
        if (!isStateful(context) || context.get("lastReloaded")) {
          logger.trace("        the value is the store");
          result = context;
        }
        else {
          logger.trace("        the value is lastReloaded, which is undefined; this implies we are not going deeper");
          // NOP
        }
      }
      else {
        var get = context.get;
        if (get) {
          logger.trace("      there is a 'get' function; executing");
          result = context.get(propertyName);
        }
        else {
          logger.trace("      there is no 'get' function; reading property directly");
          result = context[propertyName];
        }
        logger.trace("      result is '" + result + "'");
      }
      return result;
    }

    function _bChain(/*String*/ contextExpression, /*Stateful|Object|Array|Observable*/ context, /*Array*/ chain, /*Function*/ pingSomethingInThePathChanged) {
      // summary:
      //   Call callback when anything in chain changes
      //   (context[chain[0]], context[chain[0]][chain[1]], context[chain[0]][chain[1]][chain[2]], ...
      //   Values in the chain can be Stateful, a regular object, an array, or an ObservableStore.
      //   If a value is a Store or an array, and the next element in the chain is "#", the second next element
      //   is applied to all its values. If a value is a Store, and the next element in the chain is
      //   not "#", it is used as an id in get().
      if (js.typeOf(contextExpression) !== "string") {
        throw "ERROR: contextExpression must be a string"
      }
      if (context === null || context === undefined) {
        throw "ERROR: context must be something with properties (Stateful, a regular object, ...), an array, " +
              "or an ObservableStore, and not null or undefined";
      }
      if (!((js.typeOf(chain) === "array") && chain.length > 0 && chain.every(function(pn) {return js.typeOf(pn) === "string";}))) {
        throw "ERROR: chain must be an array of Strings of length at least 1";
      }
      if (js.typeOf(pingSomethingInThePathChanged) !== "function") {
        throw "ERROR: must provide a callback function";
      }

      var restChain = chain.slice(0);
      var first = restChain.shift();
      var firstCallback = (first.charAt(first.length - 1) !== "!");
      if (!firstCallback) {
        first = first.substring(0, first.length - 1);
      }
      var firstWatcher;
      var firstExpression = contextExpression ? contextExpression + "." + first : first;
      var stopDeeperWatchers; /*Function*/

      function passThroughCollection() {
        // we are asked to handle all elements of a store or array
        // context must be a Store or an array

        logger.debug("      Handling collection " + context);
        var array;
        if (isObservableStore(context)) {
          array = context.query();
        }
        else if (js.typeOf(context) === "array") {
          array = context;
        }
        else {
          throw "ERROR: the context of '#' must be an array or an Observable Store";
        }
        logger.debug("      Array is " + context + " (length: " + array.length + ")");
        var stoppers = array.
          filter(function(el) {return el !== null && el !== undefined;}).
          map(function(el) {
            return _bChain(firstExpression, el, restChain, pingSomethingInThePathChanged);
          });
        return function() {
          stoppers.forEach(function(stopper) {
            stopper();
          });
        }
      }

      function watchFirst() {
        if (isObservableStore(context)) {
          var queryResult;
          if (first === "@" || first === "@^") {
            if (!isStateful(context) || context.get("lastReloaded")) {
              logger.debug("Starting observe on " + firstExpression + " (elements in the store)");
              queryResult = context.query();
              firstWatcher = queryResult.observe(pingFirstChanged, first !== "@^");
            }
            else {
              logger.debug("Store is Stateful, and lastReloaded is not set. Watching lastReloaded, and not going deeper yet.");
              firstWatcher = context.watch("lastReloaded", function(propName, oldValue, newValue) {
                logger.debug("lastReloaded on Store changed. Stop watching it, watch the Store, and send an event.");
                firstWatcher.remove();
                watchFirst();
                pingFirstChanged();
              });
            }
          }
          else {
            logger.debug("Starting observe on " + firstExpression + " (one element of the store)");
            queryResult = context.query(function(el) {
              return context.getIdentity(el) === first;
            }); // complex way of doing context.get(first), but we need the QueryResult
            firstWatcher = queryResult.observe(pingFirstChanged, false);
          }
        }
        else if (isStateful(context)) {
          /*
           IMPORTANT NOTE:
           A major bug turned out to be that, in FireFox, all Objects have a watch function (native code)!
           So, if we test for context.watch first, all contexts will fall in the first category!
           Also, we do not want to depend on this browser specific behavior. The FireFox watch is somewhat like the
           Stateful watch, but only allows for 1 listener.
           What we actually want is a real Stateful watch, but not necessarily the Stateful class. Duck-typing
           is what we want. So we test for a context.watch, that is different from Object.prototype.watch.
           */
          logger.debug("  Starting watch on " + firstExpression);
          firstWatcher = context.watch(first, pingFirstChanged);
        }
        // else regular object; we cannot watch context; just passing through
      }

      function watchDeeper() {
        logger.trace("  Considering to watch deeper (restChain is '" + restChain + "', currentFirstValue is '" + currentFirstValue + "')");
        if ((restChain.length > 0) && currentFirstValue) {
          // there is more; we aren't really looking for context[first], but context[first][myChain];
          // context[first] is just a stepping stone;
          // but if it is null, we cannot go deeper now
          logger.trace("    Going deeper.");
          stopDeeperWatchers = _bChain(firstExpression, currentFirstValue, restChain, pingSomethingInThePathChanged);
        }
        else {
          logger.trace("    Not going deeper.");
        }
      }

      function stopMe() {
        // somebody higher up said we are no longer relevant
        // we must now
        // - stop listening to context[first], if we were
        // - stop listening deeper in the chain, if we were; we are listening to dependents
        //   of the previous value of context[first]

        if (firstWatcher) {
          logger.debug("  Stopping watch or observe on " + firstExpression);
          firstWatcher.remove();
          firstWatcher = null;
        }
        if (stopDeeperWatchers) {
          stopDeeperWatchers();
        }
      }

      function pingFirstChanged() {
        // watcher said that the value of context[first] has changed
        // we must now:
        // - adjust currentFirstValue
        // - stop listening deeper in the chain; we are listening to dependents
        //   of the previous value of context[first],
        // - and we should be listening to the dependents of the new value of
        //   context[first]; do that
        // - call the callback: the chain has changed
        // we must not stop watching context[first] ourselves!

        logger.debug("Callback from " + firstExpression);
        var oldValue = currentFirstValue;
        currentFirstValue = _getValue(context, first);
        if (stopDeeperWatchers) {
          stopDeeperWatchers();
        }
        watchDeeper();
        if (firstCallback) {
          logger.trace("Executing callback for " + firstExpression);
          pingSomethingInThePathChanged(firstExpression, oldValue, currentFirstValue); // different semantics from regular callback!
        }
        else {
          logger.debug("Found '!'; not executing callback for " + firstExpression);
        }
      }



      // main routine
      logger.debug("Processing " + firstExpression);
      if (first === "#") {
        return passThroughCollection(); // returns aggregate stopper
      }

      // first is a regular property
      if (js.typeOf(context) === "array") {
        throw "ERROR: an array must be followed by '#', to apply a selector to all its elements";
      }
      watchFirst();
      var currentFirstValue = _getValue(context, first);
      watchDeeper();
      return stopMe;
    }

    function bindingChains(/*Stateful|Object|Array|Observable*/ context, /*Array*/ dotExpressions, /*Function*/ pingSomethingInThePathChanged) {
      // summary:
      //   Call callback when anything in chains changes.
      // context: Stateful|Object|Array|Observable
      //   dotExpressions start from here
      // dotExpressions: Array
      //   dotExpressions is an array of string dot-expressions. Changes in any property on each path
      //   result in a call of callback.
      // pingSomethingInThePathChanged: Function (dotExpression, oldValue, newValue)
      // description:
      //   Values in the dotExpressions can be Stateful, a regular object, an array, or an ObservableStore.
      //   If a value is a Store or an array, and the next element in the chain is "#", the second next element
      //   is applied to all its values. If a value is a Store, and the next element in the chain is
      //   not "#" or "@", it is used as an id in get(). An array must be followed by "#" before anything else.
      //   If a value is a Store, and the next element in the chain is "@", we observe the Store itself for any
      //   changes, i.e., elements added or removed, and elements changed. "@^" listens to elements added or removed,
      //   but not to elements changed. "@.#" is allowed. "#.@" makes sense if the elements of the first Store are
      //   Stores themselves. If the Store has the `watch` function, we look for the `lastReloaded` property.
      //   If it is falsy, we interpret that as the Store never being loaded, and we won't pass deeper.
      //   We watch that property however, and when it becomes set, we send one event, and connect deeper.
      //   If an element ends with "!" (e.g. "something.other!.foo"), we still watch it to keep the chain in order, but
      //   don't call callback when changes happen.
      //   An element of the path can contain spaces. When the context of the element has a get-method, it is
      //   used. Otherwise, we try direct property access.
      // return:
      //   Returns a function that, when called, stops all watching.
      if (context === null || context === undefined) {
        throw "ERROR: context must be something with properties (Stateful, a regular object, ...), an array, " +
              "or an ObservableStore, and not null or undefined";
      }
      if (!((js.typeOf(dotExpressions) === "array") && dotExpressions.length > 0 && dotExpressions.every(function(pn) {return js.typeOf(pn) === "string";}))) {
        throw "ERROR: dotExpressions must be an array of Strings of length at least 1";
      }
      if (js.typeOf(pingSomethingInThePathChanged) !== "function") {
        throw "ERROR: must provide a callback function to ping a change";
      }


      var result = {
        _stoppers: null,
        start: function() {
          if (!this._stoppers) { // we were inactive, and are asked to resume
            this._stoppers = dotExpressions.map(function(expression) {
              var chain = expression.split(".");
              return _bChain("", context, chain, pingSomethingInThePathChanged);
            });
          }
          // else, no change
        },
        stop: function() {
          if (this._stoppers) {
            this._stoppers.forEach(function(stop) {
              stop();
            });
            this._stoppers = null;
          }
        }
      };
      result.remove = result.stop; // this is here for compatibility with Destroyable
      result.start();
      return result;
    }

    bindingChains.isStateful = isStateful;
    bindingChains.isObservableStore = isObservableStore;

    return bindingChains;
  }
);
