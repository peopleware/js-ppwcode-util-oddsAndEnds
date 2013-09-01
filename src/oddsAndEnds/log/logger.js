define(["./main", "module"],
  function(log4javascript, module) {

    var plugin = {
      // summary:
      //   This plugin returns a Logger for the module in which it is called.
      //   | define(["ppwcode.oddsAndEnds/log/logger!#"]
      //   At least one character (any character) is needed after "!". It is not used, but otherwise
      //   the loader function is not triggered.
      //
      //   The initial logging level is defined in dojoConfig or the URL query.
      //   See `./main.getInitialLogLevelFor`.

      mid: module.id,

      // dynamic: boolean
      //   Undocumented feature.
      //   Without this, plugin calls with the same text after "!" (id) are only called once.
      dynamic: true,

      load: function(/*String*/ id,       // the string to the right of the !; not used
                     require,             // AMD require; usually a context-sensitive require bound to the module making the plugin request
                     /*Function*/ done) { // the function the plugin should call with the return value once it is done
        var mid = require.module.mid; // the mid of the calling module
        var logger = log4javascript.getLogger(log4javascript.mid2LoggerName(mid));
        var initialLevel = log4javascript.getInitialLogLevelFor(mid);
        if (initialLevel) {
          logger.setLevel(initialLevel); // cannot set null
        }
        done(logger);
      }

    };

    return plugin;
  }
);
