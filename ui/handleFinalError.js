/*
Copyright 2016 - $Date $ by PeopleWare n.v.

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

define(["dojo/_base/declare", "../js", "dojo/i18n!./nls/handleFinalError", "ppwcode-util-oddsAndEnds/log/logger!", "module"],
  function(declare, js, messages, logger, module) {

    function err2string(something) {
      // summary:
      //   Best effort to transform any error into a string representation.

      var visited = [];

      function err2stringRecursive(err) {
        if (0 <= visited.indexOf(err)) {
          return "- cycle detected -";
        }
        switch (js.typeOf(err)) {
          case "undefined":
            return "undefined";
          case "null":
            return "null";
          case "string":
          case "date":
          case "regexp":
          case "number":
          case "boolean":
            return "" + err;
          case "math":
            return "Math";
          case "json":
            return "JSON";
          case "array":
          case "arguments":
            visited.push(err);
            return "[" + Array.join.call(Array.map.call(err, function(e) {return err2stringRecursive(e);}), ",") + "]";
          case "error":
          case "object":
            if (err instanceof Error) {
              var result = err.message ? err.message : "- no message - ";
              var more = [];
              more.push(err.name ? err.name : "- no name -");
              //noinspection JSUnresolvedVariable
              if (err.fileName) {
                //noinspection JSUnresolvedVariable
                more.push(err.fileName);
              }
              //noinspection JSUnresolvedVariable
              if (err.lineNumber || err.lineNumber === 0) {
                //noinspection JSUnresolvedVariable
                more.push(err.lineNumber);
              }
              //noinspection JSUnresolvedVariable
              if (err.columnNumber || err.columnNumber === 0) {
                //noinspection JSUnresolvedVariable
                more.push(err.columnNumber);
              }
              //noinspection JSUnresolvedVariable
              if (err.description) {
                //noinspection JSUnresolvedVariable
                more.push(err.description);
              }
              if (err.number || err.number === 0) {
                more.push(err.number);
              }
              return result + "(" + more.join(", ") + ")";
            }
            if (err.message) {
              return err.message;
            }
            if (err.hasOwnProperty("toString")) {
              return err.toString();
            }
            try {
              return JSON.stringify(err);
            }
            catch (ignore) {
              // NOP
            }
            return err.toString();
          default:
            return "- unknown type -";
        }
      }

      return err2stringRecursive(something);
    }

    function handleFinalError(err, notTheFinalCall, retry) {
      // summary:
      //   When the user takes an action, all exceptional behavior should be caught and handled
      //   before the stack and promises wind down.
      //   Any exceptions that still fall through are true errors, and should be fed into
      //   this function.
      //   This function gives the user notice.
      // description:
      //   When this happens, the application is in an undefined state, and should be shut down.
      //
      //   It is possible to do the effort and try to recover. If nothing is really changed,
      //   and the application is guaranteed in a state that is still defined, we can offer the
      //   user the opportunity to retry the operation. This only makes sense for timeouts,
      //   network connection problems, and other transient occurences. Those that can be recognized,
      //   should be triaged and handled before this function is called.
      //
      //   If a `retry` function is given, the user gets the option to retry or not. If the user
      //   chooses not to retry, the page is reloaded.
      //   If a `retry` function is not given, the user gets an alert. The page is reloaded on
      //   acceptance.
      //
      //   A reload is always forced. This might clear the cache.
      //
      //   If `notTheFinalCall` is true, the method just throws err.

      if (notTheFinalCall) {
        throw err;
      }
      var errAsString = err2string(err);
      logger.fatal("An error occured that was not handled by the UI: " + errAsString);
      var apologies = messages["apologies"] + "\n\n";
      if (retry) {
        var response = confirm(apologies + messages["retry"]);
        if (response) {
          return retry();
        }
        apologies = "";
      }
      alert(apologies + messages["reload"]);
      document.location.reload(true);
    }

    return handleFinalError;
  }
);
