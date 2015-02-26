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

define(["dojo/Deferred", "dojo/topic", "../log/logger!", "module"],
  function(Deferred, topic, logger, module) {

    var counter = 0;
    var continuations = [];
    var burstStarted = null;
    var lastReportingTime = null;
    var lastPublishTime = null;

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

      logger.debug("Call for relented execution. Storing with id " + counter + ". (stored continuations: " +
                   continuations.length + ")");
      var deferred = new Deferred();
      continuations.push({id: counter, continuation: continuation, deferred: deferred});
      counter++;
      if (continuations.length > maxContinuationsWaiting) {
        maxContinuationsWaiting = continuations.length;
      }
      if (!burstStarted) {
        burstStarted = Date.now();
        lastReportingTime = burstStarted;
        lastPublishTime = burstStarted;
        logger.debug("burstStarted now true; starting continuations of relented executions (" +
                     continuations.length + ")");
        handleContinuations();
      }
      return deferred.promise;
    }

    function handleContinuations() {
      logger.debug("  starting execution of continuation on next tick");
      setTimeout(
        function() {
          var now = Date.now();
          var millisElapsed = now - burstStarted;
          var elapsedSinceLastReport = now - lastReportingTime;
          //noinspection MagicNumberJS
          if (elapsedSinceLastReport > 1000) {
            lastReportingTime = now;
            logger.info("continuations waiting: " + continuations.length);
          }
          var elapsedSinceLastPublish = now - lastPublishTime;
          //noinspection MagicNumberJS
          if (elapsedSinceLastReport > 200) {
            lastPublishTime = now;
            topic.publish(
              module.id,
              {
                burstBusy: true,
                burstStarted: burstStarted,
                millisElapsed: millisElapsed,
                continuationsWaiting: continuations.length,
                maxContinuationsWaiting: maxContinuationsWaiting,
                counter: counter
              }
            );
          }
          logger.debug("  waking up; is there a continuation waiting?");
          var todo = continuations.shift(); // FIFO
          if (!todo) {
            logger.debug("  no continuations left; burst done (burstStarted will be set to null)");
            //noinspection MagicNumberJS
            logger.info("max continuations waiting during this burst: " + maxContinuationsWaiting +
                        ", duration of burst: " + (millisElapsed / 1000) + "s");
            topic.publish(
              module.id,
              {
                burstBusy: false,
                burstStarted: burstStarted,
                millisElapsed: millisElapsed,
                continuationsWaiting: continuations.length,
                maxContinuationsWaiting: maxContinuationsWaiting,
                counter: counter
              }
            );
            lastReportingTime = null;
            lastPublishTime = null;
            burstStarted = null;
            maxContinuationsWaiting = 0;
            return;
          }
          logger.debug("  there is a continuation waiting (id: " + todo.id + "); executing");
          try {
            var result = todo.continuation();
            logger.debug("  result of continuation " + todo.id + ": ", result);
            /*
              deferred.resolve just resolves its promise to the actual value passed in, also if it is a Promise.
              This is in contrast to the callbacks of Promise.then, which can be a Promise. The then.Promise
              is only fulfilled if the returned Promise is fulfilled too. With deferred.resolve, its Promise
              is fulfilled immediately, even if the argument is a Promise.
              Therefor, we need to wait for result to complete before we resolve deferred. We cannot use
              when either, because it also returns a Promise.
             */
            logger.debug("  continuation " + todo.id + " execution done; are there more?");
            // we start the next continuation now; this one might have returned a Promise, and its resolution might be
            // relented too
            handleContinuations();
            if (!result || !result.then) { // not a Promise, we are done
              todo.deferred.resolve(result);
              return;
            }
            logger.debug("  result of continuation " + todo.id + " is a Promise; waiting for resolution");
            result.then(
              function(resultResult) {
                logger.debug("  resultPromise of continuation " + todo.id +
                             " resolved; resolving relented execution (" + resultResult + ")");
                todo.deferred.resolve(resultResult);
              },
              function(resultErr) {
                logger.error("  in relented Promise execution (id: " + todo.id + "): ", resultErr);
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

    /*=====
    var Status = {

      // burstBusy: Boolean
      //   True while the burst is busy, false for the last event reporting about the burst.
      burstBusy: false,

      // burstBusy: Number
      //   Milliseconds since Epoch, when the burst started.
      burstStarted: burstStarted,

      // millisElapsed: Number
      //   Milliseconds elapsed since the burst started.
      millisElapsed: millisElapsed,

      // continuationsWaiting: Number
      //   The number of continuations still waiting in the queue.
      continuationsWaiting: continuations.length,

      // maxContinuationsWaiting: Number
      //   The maximum number of continuations that were waiting in the queue during this burst.
      maxContinuationsWaiting: maxContinuationsWaiting,

      // counter: Number
      //   The number of continuations relent has handled since the application started.
      counter: counter
    };

    relent.Status = Status;
    =====*/

    return relent;
  }
);
