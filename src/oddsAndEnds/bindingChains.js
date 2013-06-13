define(["dojo/_base/declare", "./js"],
  function(declare, js) {

    function isStateful(/*Stateful*/ s) {
      return s && s.get && s.watch && js.typeOf(s.get) === "function" && js.typeOf(s.watch) === "function";
    }

    function isObservableStore(/*Observable*/ s) {
      return s && s.get && s.query && js.typeOf(s.get) === "function" && js.typeOf(s.query) === "function";
    }

    function _getValue(context, propertyName) {
      return context.get ? context.get(propertyName) /* works for Stateful and Store */ : context[propertyName];
    }

    function _bChain(/*String*/ contextExpression, /*Stateful|Object|Array|Observable*/ context, /*Array*/ chain, /*Function*/ callback) {
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
      if (!(isStateful(context) || isObservableStore(context) || (js.typeOf(context) === "object") || (js.typeOf(context) === "array"))) {
        throw "ERROR: context must be Stateful, a regular object, an array, or an ObservableStore";
      }
      if (!((js.typeOf(chain) === "array") && chain.length > 0 && chain.every(function(pn) {return js.typeOf(pn) === "string";}))) {
        throw "ERROR: chain must be an array of Strings of length at least 1";
      }
      if (js.typeOf(callback) !== "function") {
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
        var stoppers = array.map(function(el) {
          _bChain(firstExpression, el, restChain, callback);
        });
        return function stopMe() {
          stoppers.forEach(function(stopper) {
            stopper();
          });
        }
      }

      function watchFirst() {
        if (context.watch) {
          firstWatcher = context.watch(first, nodeCallBack);
        }
        else if (context.query) {
          var queryResult;
          if (first === "@") {
            queryResult = context.query();
          }
          else {
            queryResult = context.query(function(el) {
              return context.getIdentity(el) === first;
            }); // complex way of doing context.get(first), but we need the QueryResult
          }
          firstWatcher = queryResult.observe(nodeCallBack);
        }
        // else regular object; we cannot watch context; just passing through
      }

      function watchDeeper() {
        if ((restChain.length > 0) && currentFirstValue) {
          // there is more; we aren't really looking for context[first], but context[first][myChain];
          // context[first] is just a stepping stone;
          // but if it is null, we cannot go deeper now
          stopDeeperWatchers = _bChain(firstExpression, currentFirstValue, restChain, callback);
        }
      }

      function stopMe() {
        // somebody higher up said we are no longer relevant
        // we must now
        // - stop listening to context[first], if we were
        // - stop listening deeper in the chain, if we were; we are listening to dependents
        //   of the previous value of context[first]

        if (firstWatcher) {
          firstWatcher.remove();
          firstWatcher = null;
        }
        if (stopDeeperWatchers) {
          stopDeeperWatchers();
        }
      }

      function nodeCallBack() {
        // watcher said that the value of context[first] has changed
        // we must now:
        // - adjust currentFirstValue
        // - stop listening deeper in the chain; we are listening to dependents
        //   of the previous value of context[first],
        // - and we should be listening to the dependents of the new value of
        //   context[first]; do that
        // - call the callback: the chain has changed
        // we must not stop watching context[first] ourselves!

        var oldValue = currentFirstValue;
        currentFirstValue = _getValue(context, first);
        if (stopDeeperWatchers) {
          stopDeeperWatchers();
        }
        watchDeeper();
        if (firstCallback) {
          callback(firstExpression, oldValue, currentFirstValue); // different semantics from regular callback!
        }
      }



      // main routine
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

    function bindingChains(/*Stateful|Object|Array|Observable*/ context, /*Array*/ dotExpressions, /*Function*/ callback) {
      // summary:
      //   Call callback when anything in chains changes.
      // context: Stateful|Object|Array|Observable
      //   dotExpressions start from here
      // dotExpressions: Array
      //   dotExpressions is an array of string dot-expressions. Changes in any property on each path
      //   result in a call of callback.
      // callback: Function (dotExpression, oldValue, newValue)
      // description:
      //   Values in the dotExpressions can be Stateful, a regular object, an array, or an ObservableStore.
      //   If a value is a Store or an array, and the next element in the chain is "#", the second next element
      //   is applied to all its values. If a value is a Store, and the next element in the chain is
      //   not "#" or "@", it is used as an id in get(). An array must be followed by "#" before anything else.
      //   If a value is a Store, and the next element in the chain is "@", we observe the Store itself for any
      //   changes. "@.#" is allowed. "#.@" makes sense if the elements of the first Store are Stores themselves.
      //   If an element ends with "!" (e.g. "something.other!.foo"), we still watch it to keep the chain in order, but
      //   don't call callback when changes happen.
      //   An element of the path can contain spaces. When the context of the element has a get-method, it is
      //   used. Otherwise, we try direct property access.
      // return:
      //   Returns a function that, when called, stops all watching.
      if (!(isStateful(context) || isObservableStore(context) || (js.typeOf(context) === "object") || (js.typeOf(context) === "array"))) {
        throw "ERROR: context must be Stateful, a regular object, an array, or an ObservableStore";
      }
      if (!((js.typeOf(dotExpressions) === "array") && dotExpressions.length > 0 && dotExpressions.every(function(pn) {return js.typeOf(pn) === "string";}))) {
        throw "ERROR: dotExpressions must be an array of Strings of length at least 1";
      }
      if (js.typeOf(callback) !== "function") {
        throw "ERROR: must provide a callback function";
      }

      var stoppers = dotExpressions.map(function(expression) {
        var chain = expression.split(".");
        return _bChain("", context, chain, callback);
      });
      return function stopAll() {
        stoppers.forEach(function(stop) {
          stop();
        });
      }
    }

    bindingChains.isStateful = isStateful;
    bindingChains.isObservableStore = isObservableStore;

    return bindingChains;
  }
);
