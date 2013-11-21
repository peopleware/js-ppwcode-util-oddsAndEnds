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

define(["dojo/_base/declare", "dojo/Stateful", "ppwcode-util-oddsAndEnds/bindingChains", "module", "ppwcode-util-oddsAndEnds/log/logger!"],
  function (declare, Stateful, bindingChains, module, logger) {

    // IDEA note that derivation, delegation and propagation turn out to be 3 separate mechanisms

    var _DerivedMixin = declare([Stateful], {
      // summary:
      //   Mixin that provides support for declarative definition of derived properties.
      // description:
      //   Add a `"-derived-"` property to the prototype of your class with syntax
      //
      //   | "-derived-": {
      //   |   PROPERTYNAME: ["path.to.first.derivationSource", "path.to.second.derivationSource", ...],
      //   |   ...
      //   | },
      //
      //   This will create bindingChains (you can use that complete syntax) for a "virtual" derived property
      //   PROPERTYNAME. Outside users will get events if this derived property changes.
      //
      //   To define the semantics of the derived property, add a regular Stateful `_PROPRETYNAMEGetter`.
      //
      //   Note that derived properties can be based on any other property of any reachable object, also
      //   of this, and also on other derived properties.
      //
      //   Most often, derived properties are read only. This is certainly true for properties that
      //   depend on more than one other property. It is however possible to also add a setter, if this is
      //   appropriate. An example of the latter is when this mechanism is used to alias a property.
      //
      //   "-derived-" definitions for an instance are gathered over the entire inheritance chain.
      //   Deeper definitions for a PROPERTYNAME have precedence.
      //
      //   The events can be temporarily stopped and restarted with `stopDerivedEvents` and `startDerivedEvents`.

      postscript: function() {
        var self = this;
        self.inherited(arguments);

        function dependentPropertyChanged(dependentPropertyName) {
          var previousValue = self.get(dependentPropertyName);
          /* IDEA In general, for more complex, derived properties, we need to store the previousValue
           to be able to send events. Now, we are doing our best NOT to have this "property" data,
           which in simple delegation cases is redundant, in our object. But here we see we have
           it anyway. So, what is the sense in hiding it here. It would probably be much
           simpler to just have it in the object itself, and keep it up-to-date with _set.
           We have it anyway!
           In the case of a read-only property, this is better, since the property cannot be
           set. We should add a defense against that. Most, if not all, complex derived properties are
           read-only: the calculated value based on 2 or more other properties cannot be set
           in a sensible way.
           What is left are read-write properties, of which most, if not all, are simple delegation
           to another property (most often of a nested, owned object). For those, having
           redundant data in this object is less desirable, and not needed. Storing the previousValue
           for them is not necessary, since the sole basis property's value is the one we are
           reflecting too, and the event we receive from the sole basis property contains the previous
           value. So, simple delegation is another mechanism, which could also benefit from bindingChains,
           but has different semantics. Events are just propagated, and both getter and setter just
           delegate to the basis property.
           In some cases, we still might have a redundant copy in this object though. But that seems to
           be bad code.
           */
          return function() {
            if(self._watchCallbacks) {
              var newValue = self.get(dependentPropertyName);
              if (newValue !== previousValue) { // IDEA compare?
                self._watchCallbacks(dependentPropertyName, previousValue, newValue);
                previousValue = newValue;
              }
            }
          }
        }

        self["-derived-"] = self.constructor._meta.bases.reduceRight(
          function(acc, base) {
            var dependencies = base.prototype["-derived-"];
            if (dependencies) {
              for (var dependencyPropName in dependencies) {
                //noinspection JSUnfilteredForInLoop
                acc[dependencyPropName] = dependencies[dependencyPropName];
                //noinspection JSUnfilteredForInLoop
                acc[dependencyPropName].changed = dependentPropertyChanged(dependencyPropName);
                //noinspection JSUnfilteredForInLoop
                acc[dependencyPropName].chain = bindingChains(
                  self,
                  acc[dependencyPropName],
                  //noinspection JSUnfilteredForInLoop
                  acc[dependencyPropName].changed
                );
              }
            }
            return acc;
          },
          {}
        );
        logger.debug("derived properties initialized");
      },

      stopDerivedEvents: function() {
        logger.debug("Stopping derived events");
        for (var dependencyPropName in this["-derived-"]) {
          //noinspection JSUnfilteredForInLoop
          if (this["-derived-"][dependencyPropName].chain) {
            // TODO for some unclear reason, chain sometimes doesn't exist
            //      this is a workaround, but it means that maybe the chain is added later? and the started?
            //noinspection JSUnfilteredForInLoop
            this["-derived-"][dependencyPropName].chain.stop();
          }
        }
      },

      startDerivedEvents: function() {
        logger.debug("Starting derived events");
        for (var dependencyPropName in this["-derived-"]) {
          //noinspection JSUnfilteredForInLoop
          this["-derived-"][dependencyPropName].changed();
          //noinspection JSUnfilteredForInLoop
          this["-derived-"][dependencyPropName].chain.start();
        }
      },

      destroy: function() {
        if (!this._destroyingDerivedEventListeners) {
          this._destroyingDerivedEventListeners = true;
          this.stopDerivedEvents();
          for (var dependencyPropName in this["-derived-"]) {
            //noinspection JSUnfilteredForInLoop
            delete this["-derived-"][dependencyPropName].chain;
            //noinspection JSUnfilteredForInLoop
            delete this["-derived-"][dependencyPropName];
          }
          delete this["-derived-"];
        }
        this.inherited(arguments);
      }

    });

    _DerivedMixin.mid = module.id;
    return _DerivedMixin;
  }
);
