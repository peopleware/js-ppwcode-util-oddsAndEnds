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

define(["dojo/_base/declare", "dojo/errors/CancelError", "dojo/_base/lang", "../log/logger!"],
  function(declare, CancelError, lang, logger) {

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
            self.processingPromise = lang.delegate(
              self.processingPromise,
              {
                total: self.processingPromise.then(function() {
                  return newPromise.total; // which might be a Promise
                })
              }
            );
          }
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
