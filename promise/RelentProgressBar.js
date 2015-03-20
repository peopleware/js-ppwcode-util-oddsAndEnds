/*
  Copyright 2015 by PeopleWare n.v.

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

define(["dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin",
        "dojo/text!./relentProgressBar.html",
        "dojo/dom-class", "dojo/topic",
        "module",

        "dijit/ProgressBar",
        "xstyle/css!./relentProgressBar.css"],
  function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin,
           template,
           domClass, topic,
           module) {

    // compose relentMid, a relative reference to our peer relent module
    var relentMid = module.id.split("/");
    relentMid = relentMid.slice(0, relentMid.length - 1);
    relentMid.push("relent");
    relentMid = relentMid.join("/");

    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
      // summary:
      //   An unobtrusive progress bar, that appears from the bottom of the window during a
      //   ppwcode-util-oddsAndEnds/promise/relent - burst, if it takes longer than 1 second.
      //   There are no properties to set. There is no configuration.

      templateString: template,

      // progressBar: ProgressBar
      _progressBar: null,

      postCreate: function() {
        var self = this;
        this.own(topic.subscribe(relentMid, function(/*relent.Status*/ relentStatus) {
          if (relentStatus.burstBusy) {
            self._progressBar.set({
              maximum: relentStatus.maxContinuationsWaiting,
              value: relentStatus.maxContinuationsWaiting - relentStatus.continuationsWaiting
            });
          }
          else {
            //noinspection MagicNumberJS
            self._progressBar.set({maximum: 1, value: 1});
          }
          domClass.toggle(self.domNode, "relentProgressBarShowing", relentStatus.burstBusy);
        }));

      }

    });
  }
);


