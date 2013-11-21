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

define(["dojo/_base/declare", "dojo/Stateful", "./js", "module", "ppwcode-util-oddsAndEnds/log/logger!"],
  function (declare, Stateful, js, module, logger) {

    // IDEA note that derivation, delegation and propagation turn out to be 3 separate mechanisms

    // lang.getObject and lang.setObject don't use get and set
    function getProp(context, /*String[]*/ nameChain) {
      return nameChain.reduce(
        function(acc, name) {return acc ? (acc.get ? acc.get(name) : acc[name]) : undefined;},
        context
      )
    }

    /* =====
    var PropagateEntryKwarg = {
      // path: String
      path: null,

      // map: Function?
      map: null,

      // exec: Boolean?
      exec: false
    }
    ===== */

    var PropagateEntry = declare([], {

      // lastContext: String[]
      //   Path to the last context before the property to delegate to. We need to
      //   set a property of this object.
      lastContext: null,

      // lastName: String
      //   Name of the property of the object pointed to by lastContext to set.
      lastName: null,

      // map: Function
      //   Mapping function applied to the actual value before it is applied to the
      //   `lastName` property of the `lastContext` object.
      map: function(v) {
        return v;
      },

      // exec: Boolean
      //   If true, we don't set `lastName`, but expect it to be a function
      //   that takes the mapped value, and call it in the context of the last context.
      exec: false,

      constructor: function(/*String|PropagateEntryKwarg*/ arg) {
        var argIsString = (js.typeOf(arg) === "string");
        var pStr = argIsString ? arg : arg.path;
        var split = pStr.split(".");
        this.lastContext = split;
        this.lastName = split.pop();
        if (!argIsString) {
          if (arg.map) {
            this.map = arg.map;
          }
          if (arg.exec) {
            this.exec = true;
          }
        }
      },

      propagate: function(/*Stateful*/ from, /*String*/ propName) {
        var lastContext = getProp(from, this.lastContext);
        if (!lastContext) {
          logger.debug("Could not propagate '" + this + "' for '" + propName + "', since '" + this.lastContext + "' doesn't exist");
          return;
        }
        if (lastContext === from && this.lastName === propName) {
          throw "ERROR: propagating to same property - infinite loop";
        }
        var baseValue = from.get(propName);
        var propagationValue = this.map.call(from, baseValue);
        logger.debug("Propagating value '" + propagationValue + "' for '" + propName + "' to " + lastContext + "[" + this + "] from " + from);
        if (this.exec) {
          lastContext[this.lastName].call(lastContext, propagationValue, from);
        }
        else if (lastContext.set) {
          lastContext.set(this.lastName, propagationValue);
        }
        else {
          lastContext[this.lastName] = propagationValue;
        }
      },

      toString: function() {
        return this.lastContext.join(".") + ":" + this.lastName;
      }

    });

    function getPropagateEntries(Constructor, /*String*/ propName) {
      if (!Constructor["-propagateCache-"]) {
        logger.trace("getPropagateEntries - no cache yet - creating cache for " + Constructor.mid);
        Constructor["-propagateCache-"] = {};
      }
      if (!Constructor["-propagateCache-"][propName] && Constructor["-propagateCache-"][propName] !== null) {
        logger.trace("getPropagateEntries - no entry in cache of " + Constructor.mid + " for '" + propName + "' yet - creating");
        var bases = Constructor._meta.bases;
        var propagationStrings = bases.reduce(
          function(acc, base) {
            return (base.prototype.hasOwnProperty("-propagate-") && base.prototype["-propagate-"] && base.prototype["-propagate-"][propName]) ?
              acc.concat(base.prototype["-propagate-"][propName]) :
              acc;
          },
          []
        );
        logger.trace("getPropagateEntries - propagation entries for '" + propName + "' to be cached are [" + propagationStrings + "]");
        Constructor["-propagateCache-"][propName] = propagationStrings.length <= 0 ?
          null :
          propagationStrings.map(function(pStr) {return new PropagateEntry(pStr);});
      }
      var result = Constructor["-propagateCache-"][propName];
      logger.trace("getPropagateEntries - returning propagation entries for '" + propName + "': [" + result + "]");
      return result; // return PropagateEntry[]
    }

    var _PropagationMixin = declare([Stateful], {
      // summary:
      //   Mixin that provides declarative propagation to Stateful objects.
      // description:
      //   Add a `"-propagate-"` property to the prototype of your class with syntax
      //
      //   | "-propagate-": {
      //   |   PROPERTYNAME: ["path.to.first.propagationTarget", "path.to.second.propagationTarget", ...],
      //   |   ...
      //   | },
      //
      //   or
      //
      //   | "-propagate-": {
      //   |   PROPERTYNAME: [
      //   |    {path: "path.to.first.propagationTarget", map: function(v) {return v.something;}),
      //   |    "path.to.second.propagationTarget",
      //   |    ...
      //   |   ],
      //   |   ...
      //   | },
      //
      //   or
      //
      //   | "-propagate-": {
      //   |   PROPERTYNAME: [
      //   |    {path: "path.to.first.propagationTarget", exec: true),
      //   |    "path.to.second.propagationTarget",
      //   |    ...
      //   |   ],
      //   |   ...
      //   | },
      //
      //   When PROPERTYNAME is `set`, the new value is propagated to all mentioned propagation targets,
      //   if no `null` or `undefined` are encountered in the mentioned paths. If intermediate objects
      //   are Stateful (i.e., have a `get` method), `get` is used to go down the path. If not, regular
      //   property access is used. If the final intermediate object is Stateful (i.e., has a `set` method)
      //   `set` is used to set the propagation target. Otherwise, regular property access is used.
      //
      //   Propagation is done after the regular `set` semantics of this is executed.
      //   The actual value propagated is retrieved from this with `get`, to take into account possible
      //   changes we made with `set`.
      //
      //   When the propagation entry is a String, the value set on the propagation target
      //   is the value with which PROPERTYNAME is `set`. If it is an object, it can have
      //   an optional `map` function. In that case, the value set on the propagation target
      //   is `map(value, this)`. If it is an object, it can have an optional `exec` property.
      //   If this is try, the path should resolve to a void function, which is then executed
      //   in the context of the last context, with the mapped value and this as argument:
      //   | lastContext.lastContext[lastName](map(value, this), this))
      //
      //   For a given instance, the consolidation is made of all `"-propagate-"` declarations in
      //   the prototypes of all base classes, including this class. The `"-propagate-"` declaration
      //   of this object itself is not used.
      //
      //   Note that, in contrast to bidirectional binding, propagation is one way, from this
      //   to the targets. If the propagation targets are changed outside this mechanism, there is no reaction.
      //   Often, propagation is done to realize the invariant
      //   | this.get("PROPERTYNAME") === this.get("path").get("to").get("first").get("propagationTarget")
      //   This mechanism does, one way. If our PROPERTYNAME is changed, the propagation target is changed
      //   to. But the invariant is not guaranteed automatically the other way around.
      //   This mechanism is only useful therefor if all intermediate objects are wholly owned (private)
      //   by the previous object in the path, or at leas when the graph is wholly owned (private)
      //   by this. When this is so, nobody else can reach the propagation target, and therefor nobody
      //   but this can change it.
      //
      //   You can propagate also to another property of this, but take care not to create loops.
      //
      //   As a performance measure, the consolidated declarative definition is cached in a Constructor
      //   property `"-propagateCache-"`. This property is to be considered private for this implementation.

// IDEA move caching prep to postscript, and do first update here
//      postscript: function() {
//        this.inherited(arguments);
//      },

      set: function(/*String*/ propName, value) {
        var self = this;
        // always do the local thing too
        var oldValue = this.get(propName);
        var result = self.inherited(arguments);
        if (oldValue !== value) {
          // propagate some properties
          var propagateEntry = getPropagateEntries(self.constructor, propName);
          if (propagateEntry) {
            propagateEntry.forEach(function(ppChain) {ppChain.propagate(self, propName);});
          }
        }
        return result; // although a setter should not return a result
      }

    });

    _PropagationMixin.mid = module.id;
    return _PropagationMixin;
  }
);
