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

define(["./_Page"],
  function (_Page) {

    var currentPage;

    var loader = function (/*String*/ key, // the string to the right of the !;
                           require,      // AMD require; usually a context-sensitive require bound to the module making the plugin request
                           done) {       // the function the plugin should call with the return value once it is done

      if (currentPage) {
        done(currentPage);
        return;
      }

      require([key], function(definition) {
        currentPage = new _Page(definition);
        done(currentPage);
      });

    };

    var plugin = {
      // summary:
      //    A plugin to load PageProxy's on require.
      // description:
      //    Instantiates a PageProxy for the given page.

      dynamic: false,
      load: loader
    };

    return plugin;
  }
);
