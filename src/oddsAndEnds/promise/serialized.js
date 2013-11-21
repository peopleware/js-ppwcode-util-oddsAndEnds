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

define(["dojo/Deferred", "dojo/when", "../log/logger!"],
  function(Deferred, when, logger) {

    var emptyResolved = new Deferred();
    emptyResolved.resolve([]);

    function serialized(/*Array*/ array, /*Function*/ mapper) {
      // summary:
      //   Returns a Promise that resolves when all elements in `array` are handled by
      //   `mapper`, like `all`, but now the array elements are handled in order, a next element
      //   is not handled before a previous element has completed.
      //   `mapper` is a Function that gets each element of `array` one by one, and returns a Promise
      //   that resolves if the array element is handled.
      //   The resulting overall Promise resolves to an array of the resolutions of each
      //   element promise.


      if (!array) {
        logger.debug("There is no array; returning no Promise");
        return array; // undefined or null
      }
      if (array.length <= 0) {
        logger.debug("Array is empty; returning promise that is resolved to []");
        return emptyResolved.promise;
      }
      logger.debug("Creating promise for " + array[0]);
      var firstPromise = mapper(array[0]);
      return when(
        firstPromise,
        function(firstResult) {
          logger.debug("Promise for " + array[0] + " resolved with result " + firstResult + ". Going to next element in array ...");
          var restPromise = serialized(array.slice(1), mapper);
          return restPromise.then(
            function(restResult) {
              logger.debug("Promise for rest resolved with result " + restResult + ". Done for " + array[0] + " and rest.");
              restResult.unshift(firstResult); // add firstResult to the start of the array
              return restResult;
            }
          );
        }
        // first error stops chain and propagates up
      );
    }

    return serialized;
  }
);
