define(["../../dojo/_base/declare", "dojo/Stateful", "module", "ppwcode/oddsAndEnds/log/logger!"],
  function (declare, Stateful, module, logger) {

    // IDEA note that derivation, delegation and propagation turn out to be 3 separate mechanisms

    // lang.getObject and lang.setObject don't use get and set
    function getProp(context, /*String[]*/ nameChain) {
      return nameChain.reduce(
        function(acc, name) {return acc ? (acc.get ? acc.get(name) : acc[name]) : undefined;},
        context
      )
    }

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

      constructor: function(/*String*/ path) {
        var split = path.split(".");
        this.lastContext = split;
        this.lastName = split.pop();
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
        var propagationValue = this.map(baseValue);
        logger.debug("Propagating value '" + propagationValue + "' for '" + propName + "' to " + lastContext + "[" + this + "] from " + from);
        if (lastContext.set) {
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
      //   is `map(value)`.
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

      postscript: function() {
        this.inherited(arguments);
        // TODO move caching prep to postscript, and do first update here
      },

      set: function(/*String*/ propName, value) {
        var self = this;
        // always do the local thing too
        var result = self.inherited(arguments);
        // propagate some properties
        var propagateEntry = getPropagateEntries(self.constructor, propName);
        if (propagateEntry) {
          propagateEntry.forEach(function(ppChain) {ppChain.propagate(self, propName);});
        }
        return result; // although a setter should not return a result
      }

    });

    _PropagationMixin.mid = module.id;
    return _PropagationMixin;
  }
);
