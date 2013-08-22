define([],
  function() {

    function typeOf(obj) {
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

    function getPrototypeChain(/*Object*/ obj) {
      // summary:
      //   Returns an array where result[i] is the prototype
      //   of result[i-1], with obj === result[0]. result[length]
      //   is thus Object.prototype.

      function recursive(acc, o) {
        if (!o) {
          return acc;
        }
        else {
          acc.push(o);
          return recursive(acc, Object.getPrototypeOf(o));
        }
      }

      return recursive([], obj);
    }

    function getAllKeys(/*Object*/ obj) {
      // summary:
      //   Returns an array containing the names of all given objects enumerable properties.
      //   Like keys, but for the entire prototype chain. The array starts with the properties
      //   of Object.prototype, and works down the chain.

      return getPrototypeChain(obj).reduceRight(
        function(acc, proto) {
          return acc.concat(Object.keys(proto));
        },
        []
      );
    }

    function isInt(/*Number*/ n) {
      // summary:
      //   True if n is an integer.
      //   n must be a number.

      return n % 1 === 0;
    }

    function nub(/*Array*/ array, /*Boolean?*/ removeNull) {
      // summary:
      //   Returns an array that has all the elements of `array`, in order, but with later duplicates removed.
      //   If `removeNull` is given and thruthy, nulls and undefineds are removed too.

      if (!array) {
        return array;
      }
      var result = array.reduce(
        function(acc, el) {
          if ((!removeNull || el) && acc.indexOf(el) < 0) {
            acc.push(el);
          }
          return acc;
        },
        []
      );
      return result;
    }

    function substitute(/*String*/ str, /*Object*/ context) {
      // summary:
      //  All occurrences of "${...}$" in `str` are replaced by the result of the
      //  execution of what is between the curly brackets as JavaScript, with `context`
      //  as `this`.

      //   Like dojo/string.substitute, but evals full code.
      //   No formatting (yet).
      return str.replace( // return String
        /\$\{(.+?)\}\$/gm,
        function(match, pattern) {
          var value;
          try {
            var executor = new Function("return (" + pattern + ");");
            value = executor.call(context);
          }
          catch (err) {
            logger.error("Executing pattern substitution of ${" + pattern + "}$ in '" + str + "' with context " + context, err);
            return "?? ${" + pattern  + "}$ -- " + (err.message || err) + " ??";
          }
          return value ? value.toString() : "?" + pattern  + "?";
        }
      );
    }

    var js = {
      // summary:
      //   Methods to aid with the JavaScript language.
      typeOf: typeOf,
      getPrototypeChain: getPrototypeChain,
      getAllKeys: getAllKeys,
      isInt: isInt,
      nub: nub,
      substitute: substitute
    };

    return js;
  }
);
