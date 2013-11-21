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

define(["ppwcode-util-contracts/doh", "require"],
  function(doh, require) {

    var nonExistingMid = "./DoesNotExist";

    function startTrace() {
      require.trace.set({
        "loader-inject":1,
        "loader-define":1,
        "loader-exec-module":1,
        "loader-run-factory":1,
        "loader-finish-exec":1,
        "loader-define-module":1,
        "loader-circular-dependency":1
      });
      require.trace.on = false; // SWITCH TO TRUE TO SEE TRACING
    }

    function stopTrace() {
      require.trace.on = false;
    }

    doh.register("test of require error handling", [

      {
        name: "require callback",
        timeout: 2000,
        setUp: function() {
          startTrace();
        },
        runTest: function() {
          var deferred = new doh.Deferred();
          require(["./Mock"], function(Mock) {
            try {
              var result = new Mock();
              doh.t(result);
              console.log(result);
              deferred.callback(result);
            }
            catch(e) {
              deferred.errback(e);
            }
          });
          return deferred;
        },
        tearDown: function() {
          stopTrace();
        }
      },

      // TEST FAILS: THERE IS NO ERRBACK IN DOJO
//      {
//        name: "require errback",
//        /*
//         http://requirejs.org/docs/api.html#errbacks
//         require should have an errback
//         */
//        timeout: 2000,
//        runTest: function() {
//          var deferred = new doh.Deferred();
//          require(
//            [nonExistingMid],
//            function(doesNotExist) {
//              deferred.errback(nonExistingMid + " SHOULD NOT BE FOUND (" + doesNotExist + ")");
//            },
//            function(error) {
//              try {
//                doh.t(error);
//                console.log(error);
//                deferred.callback(error);
//              }
//              catch (e) {
//                deferred.errback(e);
//              }
//            }
//          );
//          return deferred;
//        }
//      },

      {
        name: "require error listener",
        /*
         http://dojotoolkit.org/reference-guide/1.8/loader/amd.html#error-reporting
         */
        timeout: 2000,
        setUp: function() {
          console.log("YOU WILL SEE EXPECTED ERRORS IN THE LOG");
          startTrace();
        },
        runTest: function() {
          var thisTest = this;

          function handleError(error){
            try {
              doh.t(error);
              console.log("error: " + error.toString());
// What is documented doesn't work
//              doh.t(error.src);
//              doh.t(error.id);
//              console.log(error.src, error.id);
              console.log("error.src: " + error.src);
              console.log("error.info: " + error.info);
              console.log("error.info[0]: " + error.info[0]);
              console.log("error.info[1] (the error, irrelevant): " + error.info[1]);
              thisTest.errorHandle.remove();
              delete thisTest.errorHandle;
              deferred.callback(true); // don't callback with an error, even if it is expected; doh still sees it as an error
            }
            catch (e) {
              deferred.errback(e);
            }
          }

          var deferred = new doh.Deferred();
          this.errorHandle = require.on("error", handleError);
          require([nonExistingMid], function(doesNotExist) {
            deferred.errback(nonExistingMid + " SHOULD NOT BE FOUND (" + doesNotExist + ")");
          });
          return deferred;
        },
        tearDown: function() {
          if (this.errorHandle) {
            this.errorHandle.remove();
          }
          stopTrace();
        }
      }

    ]);

  }
);
