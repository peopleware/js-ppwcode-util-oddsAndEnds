define(["dojo/_base/kernel", "dojo/Deferred", "../log/logger!", "module"],
  function(kernel, Deferred, logger, module) {

    var /*Number*/ continuationsWaiting = 0;
    var /*Number*/ maxContinuationsWaiting = 0;
    var /*Number*/ burstStart = null; // millis

    function newContinuation() {
      if (continuationsWaiting === 0) {
        burstStart = Date.now();
      }
      continuationsWaiting++;
      if (continuationsWaiting > maxContinuationsWaiting) {
        maxContinuationsWaiting = continuationsWaiting;
      }
      if (continuationsWaiting % 100 === 0) {
        logger.info("continuations waiting: " + continuationsWaiting);
      }
    }

    function continuationDone() {
      continuationsWaiting--;
      if (continuationsWaiting === 0) {
        var millisElapsed = (Date.now() - burstStart) / 1000;
        logger.info("max continuations waiting during this burst: " + maxContinuationsWaiting + ", duration of burst: " + millisElapsed + "s");
        maxContinuationsWaiting = 0;
        burstStart = null;
      }
    }

    function relent(/*Function*/ continuation) {
      // summary:
      //   This function is called "relent", because "yield" is a JS keyword.
      //   Yield execution to other processes (e.g., user interaction and user feedback),
      //   and continue with `continuation` asap, and returns a Promise for the result of
      //   `continuation`.
      //   `continuation` must be a zero-arg function.

      // description:
      //   This code was based on http://dbaron.org/log/20100309-faster-timeouts. That doesn't work though.
      //   setTimeout is used throughout dojo, so we use that.
      //   With setTimeOut 0, we still have freezes, so we progressively add real timeouts.
      //   In this application, a heavy load without the extra timeouts has maximum around 800 continuations waiting,
      //   which takes 13s on my machine. Adding 2s to 5s to get a more responsive interface (15% to 40%) seems a good
      //   trade-off.

      logger.debug("Call for relented execution.");
      var deferred = new Deferred();
      newContinuation();
      setTimeout(
        function() {
          logger.debug("  starting relented execution of continuation.");
          try {
            var result = continuation();
            logger.debug("  result: ", result);
            /*
             deferred.resolve just resolves its promise to the actual value passed in, also if it is a Promise.
             This is in contrast to the callbacks of Promise.then, which can be a Promise. The then.Promise
             is only fulfilled if the returned Promise is fulfilled too. With deferred.resolve, its Promise
             is fulfilled immediately, even of the argument is a Promise.
             Therefor, we need to wait for result to complete before we resolve deferred. We cannot use
             when either, because it also returns a Promise.
             */
            if (!result.then) { // not a Promise, we are done
              continuationDone();
              deferred.resolve(result);
              return;
            }
            logger.debug("  result is a Promise; waiting for resolution");
            result.then(
              function(resultResult) {
                logger.debug("  resultPromise resolved; resolving relented execution (" + resultResult + ")");
                continuationDone();
                deferred.resolve(resultResult);
              },
              function(resultErr) {
                logger.error("  in relented Promise execution: ", resultErr);
                continuationDone();
                deferred.reject(resultErr);
              }
            );
          }
          catch (err) {
            logger.error("  in relented execution: ", err);
            deferred.reject(err);
          }
        },
        0
      );
      return deferred.promise;
    }

    return relent;
  }
);
