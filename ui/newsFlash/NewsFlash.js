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
        "dojo/dom-construct", "dojo/dom-class", "dojo/dom-style", "dojo/dom-geometry", "../../js",
        "module",

        "xstyle/css!./newsFlash.css"],
  function(declare, _WidgetBase,
           topic, lang, on,
           domConstruct, domClass, domStyle, domGeometry, js,
           module) {

    var baseClassName = "ppwcode-util-oddsAndEnds_ui_NewsFlash";
    var widgetClassName = baseClassName + "-widget";
    var messageClassName = baseClassName + "-message";
    var levelClassNameBase = baseClassName + "-level-";
    var displayedClassName = baseClassName + "-displayed";
    var endClassName = baseClassName + "-end";
    var clickToCloseHintClassName = baseClassName + "-clickToCloseHint";
    var timedCloseHintClassName = baseClassName + "-timedCloseHint";

    var firstTop = 5; // top of top message element is this
    var topSpacing = 2; // spacing between message elements
    var minimumHeight = 35; // 10 + 10 padding, and there is at least some text

    // NOTE cannot use EnumerationValue: it is in semantics; that would create a depedency cycle

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
    MessageLevel.values =
      [MessageLevel.CONFIRMATION, MessageLevel.NOTIFICATION, MessageLevel.ADVISE, MessageLevel.WARNING];
    MessageLevel.DEFAULT = MessageLevel.CONFIRMATION;

    /*=====
    var Message = {

      // level: MessageLevel
      level: null,

      // html: String
      //   HTML fragment
      html: ""
    };

    var Handle = {

      // remove: Function
      remove: null

    };

    var MessageElement = {

      // element: DomNode
      element: null,

      // goAwayTimeout: Number?
      goAwayTimeout: null,

      // clickHandle: Handle
      clickHandle: null
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
      //   If the event itself can be duck-typed to a Message (i.e., it has a supported `level`, and a
      //   `html` property that is a string), it is not translated, but used as is.
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

      // _topicHandles: Handle[]
      _topicsHandles: null,

      // _messageElements: MessageElement[]
      _messageElements: null,

      constructor: function() {
        this.topics = [];
        this._topicsHandles = [];
        this._messageElements = [];
      },

      postCreate: function() {
        if (this.domNode) {
          domClass.add(this.domNode, widgetClassName);
        }
      },

      isMessage: function(/*Object?*/ event) {
        return event &&
               MessageLevel.values.indexOf(event.level) >= 0 &&
               js.typeOf(event.html) === "string";
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

      _listener: function(/*Object|Message*/ event) {
        var self = this;
        if (event) {
          var /*Message*/ message = this.isMessage(event) ? event : this.translate(event);
          if (message) {
            var messageElements = this._messageElements;
            var element = domConstruct.create(
              "div",
              {
                className: [messageClassName, levelClassNameBase + message.level].join(" "),
                innerHTML: message.html
              },
              document.body
            );
            domConstruct.create( // does nothing, just a visible hint to the user that a click will close
              "div",
              {
                className: clickToCloseHintClassName
              },
              element
            );
            domConstruct.create("div", {className: timedCloseHintClassName}, element);
            // does nothing, just a visible hint to the user that the message will close automatically
            var goAway = message.level === MessageLevel.CONFIRMATION ? 3500 : // it takes 1s to appear
                         message.level === MessageLevel.ADVISE ? 8000 :
                         0;
            if (goAway) {
              domConstruct.create("div", {className: timedCloseHintClassName}, element);
            }
            // does nothing, just a visible hint to the user that the message will close automatically
            var messageElement = {element: element, clickHandle: null, goAwayTimeout: null};

            function destroy() {
              domConstruct.destroy(element);
              messageElements.splice(messageElements.indexOf(messageElement), 1);
            }

            function endTransitionDone() {
              destroy();
              self._reposition();
            }

            function disappear() {
              if (messageElement.goAwayTimeout) {
                clearTimeout(messageElement.goAwayTimeout);
              }
              messageElement.clickHandle.remove();
              element.addEventListener("transitionend", endTransitionDone, true);
              // start transition
              domClass.add(element, endClassName);
            }

            messageElement.clickHandle = on(element, "click", disappear);
            if (goAway) {
              messageElement.goAwayTimeout = setTimeout(disappear, goAway);
            }
            messageElement.remove = disappear;
            this.own(messageElement);
            messageElements.unshift(messageElement);
            // transition
            setTimeout(
              function() {
                self._reposition(true);
                domClass.add(element, displayedClassName);
              },
              50
            );
          }
        }
        // NOP silently
      },

      _reposition: function(/*Boolean*/ appearing) {
        var everyThingInplace = true;
        this._messageElements.reduce(
          function(top, /*MessageElement*/ me, i) {
            var marginBox = domGeometry.getMarginBox(me.element);
            var height = marginBox.h;
            if (0.5 < Math.abs(top - marginBox.t)) {
              // me is not yet where it is supposed to be
              domStyle.set(me.element, "top", top + "px");
              if (appearing) {
                // If a style is used where me will also still grow in height, the position of the next element is
                // not correct yet! We adjust for a minimum expected height already, but we need to revisit.
                height = Math.max(marginBox.h, minimumHeight);
                everyThingInplace = false;
              }
            }
            return top + height + topSpacing;
          },
          firstTop
        );
        if (!everyThingInplace) {
          setTimeout(lang.hitch(this, this._reposition, true), 50);
        }
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
