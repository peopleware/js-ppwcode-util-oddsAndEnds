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

define(["dojo/dom", "dojo/_base/fx", "dojo/fx", "dojo/dom-class", "dojo/dom-style", "dojo/dom-construct", "../log/logger!"],
  function(dom, baseFx, fx, domClass, domStyle, domConstruct, logger) {

    var preloaderId = "preloader";

    function dissolvePreloader(realContentId) {
      // summary:
      //   A function that returns an Animation that will dissolve a preloader defined in the page, and
      //   expose the real content of a page.
      //   The user has to call `play()` on the result.
      // description:
      //   Due to the nature of a preloader, we cannot define it completely in a widget. The preloader
      //   must be there immediately in the HTML, _before_ dojo is loaded.
      //
      //   Users should include the accompanying css style sheet directly in the HTML page, and the
      //   first body-element should be
      //   | <div id="preloader"><div></div></div>
      //   The id of the first div must be "preloader".
      //   The function argument is the id of the main real content element.
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
         *     a large second jump (the body is to large)
         *   Safari:
         *     a large second jump (the body is to large), and furthermore the AllDocuments is too large too
         * There is no problem in portrait.
       */

      logger.debug("Roles set and most recent items loaded. Visualising.");
      var preloader = dom.byId(preloaderId);
      domClass.add(preloader, "rightBorder");
      var realContent = dom.byId(realContentId);
      domStyle.set(realContent, "opacity", 0);
      logger.debug("preloader and real content found");
      logger.debug("going to build transition");
      var showAppAnimation = fx.combine([
        fx.chain([
          baseFx.animateProperty({
            node: preloader,
            properties: {
              opacity: 0.7
            },
            duration: 500
          }),
          baseFx.animateProperty({
            node: preloader,
            properties: {
              width: 0
            },
            duration: 1000
          })
        ]),
        baseFx.animateProperty({
          node: realContent,
          properties: {
            opacity: 1
          },
          duration: 2000
        })
      ]);
      showAppAnimation.onEnd = function () {
        logger.debug("transition done; destroying preloader");
        domConstruct.destroy("preloader");
        logger.debug("Preloader gone. Ready for operation.");
      };
      return showAppAnimation;
    }

    return dissolvePreloader;
  }
);
