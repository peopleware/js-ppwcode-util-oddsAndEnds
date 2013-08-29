define([],
  function() {

    var xml = {
      // summary:
      //   Methods to aid with XML.

      escape: function(/*String*/ str, /*Boolean?*/ doNotEscapeSingleQuotes, /*String?*/ missing){
        // summary:
        //	 Adds escape sequences for special characters in XML: `&<>"'`.
        //	 Optionally skips escapes for single quotes.
        //   str is coerced to string with `toString`
        // doNotEscapeSingleQuotes: Boolean?
        //   Do not escape single quotes when this is true.
        // missing: String?
        //   When str is undefined, or null, we return missing. The default is the empty string.
        // description:
        //   Nicked from dijit/_editor/html.
        //   When str is undefined or null, return "".
        //   Actual non-string values are coerced to a string.

        if (!str && str != 0) { // 0 must pass
          return missing || "";
        }
        str = "" + str; // coerce to string
        str = str.replace(/&/gm, "&amp;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/"/gm, "&quot;");
        if(!doNotEscapeSingleQuotes) {
          str = str.replace(/'/gm, "&#39;");
        }
        return str; // string
      }

    };

    return xml;
  }
);
