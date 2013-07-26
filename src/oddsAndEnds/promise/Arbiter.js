define(["dojo/_base/declare", "dojo/errors/CancelError", "../log/logger!"],
  function(declare, CancelError, logger) {

    return declare([], {
      // summary:
      //   Instances offer a function `guard(arg, promiseFunction)`
      //   that makes sure that promiseFunction is not called needlessly in parallel.

      // currentArg: any
      //   The last arg processed. Initially null.
      //   Changes if guard is called with another arg.
      currentArg: null,

      // processingPromise: Promise
      //   The Promise currently being processed for self.currentArg.
      processingPromise: null,

      guard: function(/*any*/ arg, /*Function*/ promiseFunction, /*Boolean?*/ reprocess) {
        // summary:
        //   Guards against calling promiseFunction in parallel multiple
        //   times for the same arg.
        // promiseFunction: Function
        //   promiseFunction is called with arg as argument, and returns a Promise
        // description:
        //   If guard is called with arg === self.currentArg, and there
        //   is a self.processingPromise, we return self.processingPromise.
        //   If there is no pending self.processingPromise, we restart
        //   promiseFunction, and return its result, if reprocess === true. Otherwise
        //   we return null.
        //   If guard is called with arg !== self.currentArg, and there is a
        //   a self.processingPromise, we cancel it. In any case, we start
        //   promiseFunction, and return its result;

        var self = this;

        function promiseFulfilled() {
          logger.debug("Promise for " + arg + " fulfilled. Forgetting the Promise");
          self.processingPromise = null;
        }

        function newPromise() {
          var newPromise = promiseFunction(arg);
          self.processingPromise = newPromise.then(
            function(promiseResult) {
              promiseFulfilled();
              return promiseResult;
            },
            function(err) {
              promiseFulfilled();
              throw err;
            }
          );
          return self.processingPromise;
        }


        logger.trace("Request to process " + arg);
        if (arg === self.currentArg) {
          logger.trace("Requested arg is current arg.");
          if (self.processingPromise) {
            logger.debug("Currently processing arg. Returning current processing Promise.");
          }
          else if (reprocess) {
            logger.debug("Not currently processing arg. Starting reprocessing and returning reprocess Promise.");
            newPromise();
          }
          else {
            logger.debug("Not currently processing arg. No reprocessing requested. Returning null.");
          }
        }
        else {
          logger.debug("Requested arg is different from current arg. New call takes precedence.");
          self.currentArg = arg;
          if (self.processingPromise) {
            logger.debug("There is a pending Promise. Cancelling.");
            self.processingPromise.cancel(new CancelError("USER CANCELLED"));
          }
          logger.debug("Starting processing and returning process Promise.");
          newPromise();
        }
        return self.processingPromise;
      }

    });

  }
);
