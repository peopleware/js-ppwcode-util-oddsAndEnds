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
