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

define(["dojo/_base/kernel", "dojo/Deferred", "../log/logger!", "module"],
  function(kernel, Deferred, logger) {

    var continuations = [];
    var burstStarted = null;

    var /*Number*/ maxContinuationsWaiting = 0;

    function relent(/*Function*/ continuation) {
      // summary:
      //   This function is called "relent", because "yield" is a JS keyword.
      //   Yield execution to other processes (e.g., user interaction and user feedback),
      //   and continue with `continuation` asap, and returns a Promise for the result of
      //   `continuation`.
      //   `continuation` must be a zero-arg function.
      // description:
      //   This code is based on http://dbaron.org/log/20100309-faster-timeouts

      logger.debug("Call for relented execution. Storing. (stored continuations: " + continuations.length + ")");
      var deferred = new Deferred();
      continuations.push({continuation: continuation, deferred: deferred});
      if (continuations.length > maxContinuationsWaiting) {
        maxContinuationsWaiting = continuations.length;
      }
      if (continuations.length % 100 === 0) {
        logger.info("continuations waiting: " + continuations.length);
      }
      if (!burstStarted) {
        burstStarted = Date.now();
        logger.debug("burstStarted now true; starting continuations of relented executions (" + continuations.length + ")");
        handleContinuations();
      }
      return deferred.promise;
    }

    function handleContinuations() {
      logger.debug("  starting execution of continuation on next tick");
      setTimeout(
        function() {
          var todo = continuations.shift(); // FIFO
          if (!todo) {
            var millisElapsed = (Date.now() - burstStarted) / 1000;
            burstStarted = null;
            logger.debug("  no continuations left; burst done (burstStarted set to null)");
            logger.info("max continuations waiting during this burst: " + maxContinuationsWaiting + ", duration of burst: " + millisElapsed + "s");
            maxContinuationsWaiting = 0;
            return;
          }
          try {
            var result = todo.continuation();
            logger.debug("  result: ", result);
            /*
              deferred.resolve just resolves its promise to the actual value passed in, also if it is a Promise.
              This is in contrast to the callbacks of Promise.then, which can be a Promise. The then.Promise
              is only fulfilled if the returned Promise is fulfilled to. With deferred.resolve, its Promise
              is fulfilled immediately, even of the argument is a Promise.
              Therefor, we need to wait for result to complete before we resolve deferred. We cannot use
              when either, because it also returns a Promise.
             */
            logger.debug("  continuation execution done; are there more?");
            // we start the next continuation now; this one might have returned a Promise, and its resolution might be relented too
            handleContinuations();
            if (!result.then) { // not a Promise, we are done
              todo.deferred.resolve(result);
              return;
            }
            logger.debug("  result is a Promise; waiting for resolution");
            result.then(
              function(resultResult) {
                logger.debug("  resultPromise resolved; resolving relented execution (" + resultResult + ")");
                todo.deferred.resolve(resultResult);
              },
              function(resultErr) {
                logger.error("  in relented Promise execution: ", resultErr);
                todo.deferred.reject(resultErr);
              }
            );
          }
          catch (err) {
            logger.error("  in relented execution: ", err);
            todo.deferred.reject(err);
          }
        },
        0
      );
    }

    return relent;
  }
);
