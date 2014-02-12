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

define(["dojo/_base/declare", "./Definition", "module"],
  function (declare, Definition, module) {

    var SimpleDefinition = declare([Definition], {
      // summary:
      //   Simple definition of a page, with a static name and location.

      // name: String
      //   Static name of the page.
      name: null,

      // href: String
      //   Static location of the page, relative to dojo.js
      href: null,

      constructor: function(kwargs) {
        if (kwargs) {
          this.name = kwargs.name;
          this.href = kwargs.href;
        }
      },

      getName: function() {
        return this.name;
      },

      getHref: function() {
        return this.normalize(this.absoluteDojoDir() + this.href);
      }

    });

    SimpleDefinition.mid = module.id;
    return SimpleDefinition;
  }
);
