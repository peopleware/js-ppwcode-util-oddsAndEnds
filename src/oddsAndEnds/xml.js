define([],
  function() {

    var xml = {
      // summary:
      //   Methods to aid with XML.

      escape: function(/*String*/ str, /*Boolean?*/ noSingleQuotes){
        // summary:
        //	 Adds escape sequences for special characters in XML: `&<>"'`.
        //	 Optionally skips escapes for single quotes.
        // description:
        //   Nicked from dijit/_editor/html.
        //   When str is undefined or null, return "".
        //   Actual non-string values are coerced to a string.
        if (!str && str != 0) { // 0 must pass
          return "";
        }
        str = "" + str; // coerce to string
        str = str.replace(/&/gm, "&amp;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/"/gm, "&quot;");
        if(!noSingleQuotes){
          str = str.replace(/'/gm, "&#39;");
        }
        return str; // string
      }

    };

    return xml;
  }
);
