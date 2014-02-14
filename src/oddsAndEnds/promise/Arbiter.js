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

define(["dojo/_base/declare", "dojo/errors/CancelError", "dojo/Deferred", "dojo/_base/lang", "../log/logger!"],
  function(declare, CancelError, Deferred, lang, logger) {

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

      guard: function(arg, /*Function*/ promiseFunction, /*Boolean?*/ reprocess) {
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

        /* If the guard function is called again during this tick with the same
           arg, we should return the same Promise in all cases. This means we need
           to remember it at least until the end of this tick.
           If the guard function is called again during this tick with a different
           arg, we should cancel the first Promise, and create a new Promise. We should
           for the earlier Promise, and remember the new one.
           In that case, whether the fulfillment of the earlier Promise happens during
           this tick or later, it should not wipe our memory indiscriminately, because
           we now remember the newest Promise, not the earlier one being fulfilled.

           It is certainly an invariant that a new Promise will be remembered at least
           as long as it is not fulfilled (baring cancellation, but we can see
           cancellation as immediate). We may remember it longer. We cannot guarantee
           that the Promise that we remember is not fulfilled yet, for one because
           reacting to fulfillment happens in random order, and we might not be first.

           Forgetting a remembered Promise must happen on fulfillment.
           If a new Promise is fulfilled immediately, normal then-execution happens
           immediately. If we immediately "forget" the Promise, first we must take
           care that we do not remember it after we forgot it (bug in earlier version),
           but in general it makes not much sense to not at least remember it during
           this tick. A next call with the same argument cannot sensibly require a
           new request to the server. It might be interesting to pass out the resolved
           Promise as a result of a call, but on the other hand it does not hurt semantics
           to return a Promise that will not resolve but on the next tick (arguably a
           better semantics for a Promise in any case).

           It must be a postcondition that, when a returned Promise resolves, we have
           forgotten about it. Otherwise, it would be impossible or non-deterministic
           to do follow-up calls with the same argument in call-backs.

           The 2 together, the need to forget a Promise before we signal it resolved,
           and the need to remember a Promise we return at least during this tick,
           results in the need for the returned Promise never to be resolved during this
           tick. */
        /* IDEA another approach might be to remember the Promise also after it is
           resolved, and forget it on a call with another argument, or on a call with
           the same argument if reprocess is true and the Promise is fulfilled. This
           would however keep all Promise results in memory for an indefinite time. */

        var self = this;

        function newPromise() {
          logger.debug("Calling worker function (will return a Promise).");

          var newPromise = promiseFunction(arg);
          var deferred = new Deferred();
          var cleanedUpPromise = deferred.promise;

          function createCleanerAndFulfillerPromise() {

            function promiseFulfilled() {
              // summary:
              //   Forget the Promise we remember, if it is `promise`.

              logger.debug("Promise for " + arg + " fulfilled. Forgetting the Promise.");
              if (self.processingPromise === cleanedUpPromise) {
                logger.debug("The fullfilled promise is the one in memory. Forgetting it.");
                self.processingPromise = null;
              }
              else {
                logger.debug("The fullfiled promise is an old one. We forgot it already.");
              }
            }

            newPromise.then(
              function(promiseResult) {
                logger.debug("The worker function Promise resolved. Cleaning up.");
                promiseFulfilled();
                deferred.resolve(promiseResult);
                // Due to the semantics of then, promiseResult is never a Promise (in contrast
                // to what we needed to do in relent.js)
              },
              function(err) {
                logger.debug("The worker function Promise was rejected. Cleaning up. ", err);
                promiseFulfilled();
                deferred.reject(err);
              }
            );
          }

          /* If this Promise is already fulfilled, then would execute immediately,
             and that would make it try to forget the Promise before we remembered
             it. Furthermore, cleanedUpPromise is still undefined at that time.
             The Promise we will actually return and remember may only resolve
             during the next tick, even if the newPromise is resolved immediately. */
          if (newPromise.isFulfilled()) {
            logger.debug("The worker function Promise was immediately fulfilled. Waiting on next tick to resolve our result.");
            setTimeout(createCleanerAndFulfillerPromise, 0);
          }
          else {
            logger.debug("The worker function Promise was not immediately fulfilled. Will cleanup when it is.");
            /* if the newPromise is not fulfilled now, it will not be fulfilled during
               this tick. JavaScript is single-threaded. */
            createCleanerAndFulfillerPromise();
          }
          logger.debug("Worker function done. Will doctor returned Promise with total if needed, and return.");
           /*
             Workaround for strange Store / QueryResult behavior.
             The query from a paging should add a "total" property to the result passed to QueryResult.
             In an async store, this is a promise for an array. If `promiseFunction` delivers such a Promise,
             it might have an added "total" property, which is also a Promise.
             By wrapping the Promise returned by `promiseFunction` in another Promise with `then` above, we hide
             that "total" property from the recipient.
             The code below makes it visible again.

             Furthermore, a Promise returned by `then` is frozen, so we cannot add it to the object directly.
             With a delegate, we can do this.
           */
          if (newPromise.total) {
            cleanedUpPromise = lang.delegate(
              cleanedUpPromise,
              {
                total: cleanedUpPromise.then(function() {
                  return newPromise.total; // which might be a Promise
                })
              }
            );
          }

          self.processingPromise = cleanedUpPromise;
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
            // self.processingPromise will be overridden by newPromise()
          }
          logger.debug("Starting processing and returning process Promise.");
          newPromise();
        }
        return self.processingPromise;
      }

    });

  }
);
