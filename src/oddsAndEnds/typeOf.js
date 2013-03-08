define([],
  function() {

    function toType(obj) {
      // summary:
      //   A better type then Object.toString() or typeof.
      // description:
      //      toType(undefined); //"undefined"
      //      toType(new); //"null"
      //      toType({a: 4}); //"object"
      //      toType([1, 2, 3]); //"array"
      //      (function() {console.log(toType(arguments))})(); //arguments
      //      toType(new ReferenceError); //"error"
      //      toType(new Date); //"date"
      //      toType(/a-z/); //"regexp"
      //      toType(Math); //"math"
      //      toType(JSON); //"json"
      //      toType(new Number(4)); //"number"
      //      toType(new String("abc")); //"string"
      //      toType(new Boolean(true)); //"boolean"

      /* based on
       http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
       */

      var result = Object.prototype.toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
      // on some browsers, the main window returns as "global" (WebKit) or "window" (FF), but this is an object too
      if (result === "global" || result == "window") {
        result = "object";
      }
      return result; // return String
    }

    return toType;
  }
);
