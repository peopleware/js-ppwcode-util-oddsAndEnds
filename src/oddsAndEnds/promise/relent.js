define(["dojo/_base/kernel", "dojo/Deferred", "../log/logger!", "module"],
  function(kernel, Deferred, logger, module) {

    var messageName = module.mid + " message";
    var continuations = [];

    function relent(/*Function*/ continuation) {
      // summary:
      //   This function is called "relent", because "yield" is a JS keyword.
      //   Yield execution to other processes (e.g., user interaction and user feedback),
      //   and continue with `continuation` asap, and returns a Promise for the result of
      //   `continuation`.
      //   `continuation` must be a zero-arg function.
      // description:
      //   This code is based on http://dbaron.org/log/20100309-faster-timeouts

      logger.debug("Call for relented execution. Storing and posting message. (stored continuations: " + continuations.length + ")");
      var deferred = new Deferred();
      continuations.push({continuation: continuation, deferred: deferred});
      kernel.global.postMessage(messageName, "*");
      return deferred.promise;
    }

    kernel.global.addEventListener(
      "message",
      function(event) {
        if (event.source == kernel.global && event.data === messageName) {
          event.stopPropagation();
          var continuationsCopy = continuations;
          continuations = []; // prepare for next batch
          logger.debug("Starting continuations of relented executions (" + continuationsCopy.length + ")");
          continuationsCopy.forEach(function(todo, index) {
            logger.debug("  starting relented execution of continuation " + index);
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
          });
        }
      },
      true
    );

    return relent;
  }
);
