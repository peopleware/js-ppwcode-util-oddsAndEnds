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

define(["dojo/dom", "dojo/query", "dojo/dom-class", "dojo/dom-construct", "dojo/Deferred",
        "../log/logger!"],
  function(dom, query, domClass, domConstruct, Deferred, logger) {

    var preloaderId = "preloader";

    function dissolvePreloader(/*String*/ preloaderId) {
      // summary:
      //   A function that dissolves a preloader defined in the page, and
      //   expose the real content of a page. Returns a Promise for the end of the transition, with `preloaderId`
      //   as resolution.
      // description:
      //   Due to the nature of a preloader, we cannot define it completely in a widget. The preloader
      //   must be there immediately in the HTML, _before_ dojo is loaded.
      //
      //   Users should include the accompanying css style sheet directly in the HTML page, and the
      //   first body-element should be
      //   | <div id="preloader"><div class="progress"><div></div></div></div>
      //   The function argument is the id of the preloader content element.
      //   | dissolvePreloader("preloader");
      //
      //   An applicable logo can be added by extending the #preloader style with a background-image:
      //   | #preloader {
      //   |   background-image: url('../img/myLogo.png');
      //   | }

      /* TODO
         We have:
         * a slight jump during parse
         * on iPad, in landscape
         *   Chrome:
         *     a large second jump (the body is too large)
         *   Safari:
         *     a large second jump (the body is too large), and furthermore the AllDocuments is too large too
         * There is no problem in portrait.
       */

      var deferred = new Deferred();
      logger.debug("Prepping preloader.");
      var preloader = dom.byId(preloaderId);
      var spinner = query(".progress", preloader)[0];
      logger.debug("preloader and real content found, starting transition");
      preloader.addEventListener(
        "transitionend",
        function() {
          logger.debug("transition done; destroying preloader");
          domConstruct.destroy("preloader");
          logger.debug("Preloader gone. Ready for operation.");
          deferred.resolve(preloaderId);
        },
        true
      );
      domClass.add(preloader, "dissolved");
      return deferred.promise;
    }

    return dissolvePreloader;
  }
);
