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

define(["dojo/_base/declare", "require", "module"],
  function (declare, require, module) {

    var dotdotPattern = /[^\.\/]+?\/\.\.\//;

    var Definition = declare([], {
      // summary:
      //   Defines a Page for _Page and _Proxy instances.
      //   Pages have a name, to be used as window.name, and a location, i.e.,
      //   the URL to be loaded. A Definition can calculate those.
      // description:
      //   Any code here must be able to operate correctly both in the defined page,
      //   as in other pages using the _Proxy.

      getName: function() {
        // summary:
        //   Returns a unique name for the page being defined.
        //   Should contain only alphanumeric characters and "_" (use removeDiacritics).

        // ABSTRACT
        return null;
      },

      getHref: function() {
        // summary:
        //   Returns the URL to open the page being defined. There might be several pages
        //   with the same location.

        // ABSTRACT
        return null;
      },

      removeDiacritics: function(text) {
        // summary:
        //   Diacritics are replaced by "_".

        var result = text.replace(/[^A-Za-z0-9]/, "_");
      },

      toUrl: function(path) {
        // summary:
        //   Helper function. Turns a path relative to dojo.js into a regular URL.
        return require.toUrl(path).split("?")[0]; // remove the cache-bust part
      },

      normalize: function(url) {
        // summary:
        //   Helper function. Remove "./" and "../" in the middle of the URL

        var result = url.replace(/\.\/g/, "");
        while(dotdotPattern.test(result)) {
          result = result.replace(dotdotPattern, "");
        }
        return result;
      },

      absolutePageDir: function () {
        var url = window.location.href;
        var parts = url.split("/");
        parts.pop();
        return parts.join("/") + "/";
      },

      absoluteDojoDir: function () {
        return this.absolutePageDir() + this.toUrl("dojo") + "/";
      }

    });

    Definition.mid = module.id;
    return Definition;
  }
)
;
