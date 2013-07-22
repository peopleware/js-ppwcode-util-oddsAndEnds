define(["dojo/_base/lang", "log4javascript/log4javascript", "http://d3eyf2cx8mbems.cloudfront.net/js/loggly-0.2.1.js"],
  function(lang) {

  // log4javascript is not AMD
  // loggly is no AMD

  var LogglyAppender = function(logglyKey) {
    //noinspection JSUnresolvedVariable
    this.castor = new loggly.castor({url: "http://logs.loggly.com/inputs/" + logglyKey, level: "log"});
  };
  LogglyAppender.prototype = new log4javascript.Appender();
  LogglyAppender.prototype.layout = new log4javascript.PatternLayout("%d{dd MMM yyyy HH:mm:ss,SSS} %-5p - %f - %c - %m");
  LogglyAppender.prototype.append = function(loggingEvent) {
    var layout = this.getLayout();
    var formattedMessage = layout.format(loggingEvent);
    if (layout.ignoresThrowable() && loggingEvent.exception) {
      formattedMessage += loggingEvent.getThrowableStrRep();
    }
    if (log4javascript.Level.TRACE.isGreaterOrEqual(loggingEvent.level)) {
      this.castor.log(formattedMessage);
    }
    else if (log4javascript.Level.DEBUG.equals(loggingEvent.level)) {
      this.castor.debug(formattedMessage);
    }
    else if (log4javascript.Level.INFO.equals(loggingEvent.level)) {
      this.castor.info(formattedMessage);
    }
    else if (log4javascript.Level.WARN.equals(loggingEvent.level)) {
      this.castor.warn(formattedMessage);
    }
    else if (loggingEvent.level.isGreaterOrEqual(log4javascript.Level.ERROR)) {
      this.castor.error(formattedMessage);
    }
  };

  LogglyAppender.prototype.toString = function() {
    return "LogglyAppender";
  };


  function getLogger(name) {
    // summary:
    //   Function that returns a configured log4javascript logger for `name`.
    //   Best practice is to use the module.id as name.
    //
    //   The logger has a console appender. All apenders defined on the function
    //   are also added.

    var logger = log4javascript.getLogger(name);
    var layout = new log4javascript.PatternLayout("%d{HH:mm:ss,SSS} %-5p - %c - %m");
    var consoleAppender = new log4javascript.BrowserConsoleAppender();
    consoleAppender.setLayout(layout);
    logger.addAppender(consoleAppender);
    if (getLogger.appenders) {
      getLogger.appenders.forEach(function(appender) {
        logger.addAppender(appender);
      });
    }
    return logger;
  }

  getLogger.appenders = [];
  getLogger.LogglyAppender = LogglyAppender;

  lang.mixin(getLogger, log4javascript);

  return getLogger;
});
