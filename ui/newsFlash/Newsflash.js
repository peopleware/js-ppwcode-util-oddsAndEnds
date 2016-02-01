/*
Copyright 2016 - $Date $ by PeopleWare n.v.

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

define(["dojo/_base/declare", "dijit/_WidgetBase",
        "dojo/topic", "dojo/_base/lang", "dojo/on",
        "dojo/dom-style", "dojo/dom-class", "dojo/dom-construct",
        "module",

        "xstyle/css!./newsFlash.css"],
  function(declare, _WidgetBase,
           topic, lang, on,
           domStyle, domClass, domConstruct,
           module) {

    var baseClassName = "ppwcode-util-oddsAndEnds_ui_NewsFlash";

    var MessageLevel = {

      // CONFIRMATION: String
      //   The user initiated an action, and we want to let the user know the action
      //   completed successfully.
      //   Don't overdo this. This should probably only be used with actions that change
      //   state on the server, of which the outcome is not sure or not trivially clear.
      //   Can also be used to unobtrusively show a repeating action was executed successfully.
      //   The message has a dull style.
      //   The message can be clicked away, but it goes away by itself after a small delay.
      CONFIRMATION: "confirmation",

      // NOTIFICATION: String
      //   We want to notify the user of something that was not the nominal effect of an
      //   action the user initiated, or of a relevant, non-trivial effect of a repeating action,
      //   but there is nothing the user can or should do.
      //   The important difference with a `CONFIRMATION` is that we really want the user to
      //   be aware of this message. The important difference with an `ADVISE`
      //   is that we there is no action the user can or should take.
      //   Since we want to be sure the user has seen the message,
      //   it does not go away by itself, but must be clicked away, and it has an
      //   eye-catching style.
      NOTIFICATION: "notification",

      // NOTIFICATION: String
      //   Advise the user to do something (or not). User interaction is required or
      //   advised.
      //   This is not blocking in itself. The rest of the user interface should make
      //   clear if interaction is required or advised, and where the interaction should
      //   take place.
      //   The message can be clicked away, but it goes away by itself after a small delay.
      //   The style of the message gets the attention.
      ADVISE: "advise",

      // WARNING: String
      //   Red alert.
      //   Since we want to be sure the user has seen the message,
      //   it does not go away by itself, but must be clicked away, and it has an
      //   eye-catching style.
      // TODO this doesn't belong here. Use an alert, and reload the page.
      WARNING: "warning"
    };

    /*=====
    var Message = {

      // level: MessageLevel
      level: null,

      // html: String
      //   HTML fragment
      html: ""
    };
    =====*/

    var NewsFlash = declare([_WidgetBase], {
      // summary:
      //   Abstract widget that, placed anywhere in a screen (but probably best at the top level)
      //   shows flash messages to the user based on events seen on a topic.
      //
      //   Events are read from a topic, and translated into i18n-ed messages through
      //   a translation function. The function returns an object that has the message HTML to be shown,
      //   and the message level. `message.html` should be a HTML fragment that can
      //   be used in a `div` element. It can be just a text.
      //
      //   The message level is `CONFIRMATION`, `NOTIFICATION`, `INTERACTION_REQUIRED`, or `WARNING`.
      //
      //   What is show to the user is a `div`, with a bunch of classes.
      //   The actual message returned by the translation function is added as `innerHtml` to the `div`.
      //
      //   The widget itself is an empty, invisible element. Actually, there is no need for it to be a
      //   widget. We just need a method to put this in a page.

      // topics: String[]
      //   The topics we are listening too.
      topics: null,

      // translate: Function Object -> Message?
      //   Events received from the `topics` are fed into this function. It should return an optional
      //   Message instance for each event.
      translate: null,

      // _topicHandles: {remove: /*Function*/}[]
      _topicsHandles: null,

      constructor: function() {
        this.topics = [];
        this._topicsHandles = [];
      },

      postCreate: function() {
        if (this.domNode) {
          domClass.add(this.domNode, baseClassName + "-widget");
        }
      },

      _getTopicsAttr: function() {
        return this.topics.slice();
      },

      _setTopicsAttr: function(/*String[]*/ topics) {
        var self = this;
        this._topicsHandles.forEach(function(listener) {listener.remove();});
        this._set("topics", topics.slice());
        var listener = lang.hitch(this, this._listener);
        this._topicListeners = this.topics.map(function(topicName) {
          var handle = topic.subscribe(topicName, lang.hitch(self, listener));
          self.own(handle);
          return handle;
        });
      },

      _listener: function(/*Object*/ event) {
        if (event) {
          var /*Message*/ message = this.translate(event);
          if (message) {
            var element = domConstruct.create(
              "div",
              {
                className: [baseClassName + "-message", baseClassName + "-level-" + message.level].join(" "),
                innerHTML: message.html
              },
              document.body
            );
            var disappear = lang.hitch(this, this._makeItDisappear, element);
            var handle = on(element, "click", disappear);
            this.own(handle);
            var goAway = message.level === MessageLevel.CONFIRMATION ? 3500 : // it takes 1s to appear
                         message.level === MessageLevel.ADVISE ? 8000 :
                         0;
            if (goAway) {
              element.goAway = setTimeout(disappear, goAway);
            }
            // transition
            setTimeout(function() {domClass.add(element, baseClassName + "-displayed");}, 50);
          }
        }
        // NOP silently
      },

      _makeItDisappear: function(/*DomNode*/ element) {
        clearTimeout(element.goAway);
        domConstruct.destroy(element);
      }

    });

    NewsFlash.Level = MessageLevel;
    /*=====
    NewsFlash.Message = Message;
    =====*/
    NewsFlash.mid = module.id;

    return NewsFlash;
  }
);
