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

function logFunction(level) {
  var enabledName = "is" + level.charAt(0).toUpperCase() + level.slice(1) + "Enabled";
  return function(msg) {
    if (this._logger[enabledName]()) {
      var message = typeof msg === "function" ? msg() : msg;
      var args = Array.prototype.slice.call(arguments, 1)
      args.unshift(message)
      this._logger[level].apply(this._logger, args)
    }
  };
}

define(["./main", "module"],
  function(log4javascript, module) {

    var plugin = {
      // summary:
      //   This plugin only returns a log4javascript Logger for the module in which it is called, where the log methods
      //   can take a function that calculates the message only when the level is enabled.
      //   | define(["ppwcode-util-oddsAndEnds/log/delayedLogger!"]
      //
      //   The initial logging level is defined in dojoConfig or the URL query.
      //   See `./main.getInitialLogLevelFor`.

      mid: module.id,

      // dynamic: boolean
      //   Undocumented feature.
      //   Without this, plugin calls with the same text after "!" (id) are only called once.
      dynamic: true,

      load: function(/*String*/ id,       // the string to the right of the !; not used
                     require, // AMD require; usually a context-sensitive require bound to the module
                              // making the plugin request
                     /*Function*/ done) { // the function the plugin should call with the return value once it is done
        var mid = require.module.mid; // the mid of the calling module
        var logger = log4javascript.getLogger(log4javascript.mid2LoggerName(mid));
        var initialLevel = log4javascript.getInitialLogLevelFor(mid);
        if (initialLevel) {
          logger.setLevel(initialLevel); // cannot set null
        }

        var delayedLogger = Object.create(logger);
        delayedLogger._logger = logger;
        ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach(function(l) {
          delayedLogger[l] = logFunction(l);
        });


        done(delayedLogger);
      }

    };

    return plugin;
  }
);
