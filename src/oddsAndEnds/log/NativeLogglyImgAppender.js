define(["./LogglyAppender", "dojo/_base/kernel", "./main",
        "https://d3eyf2cx8mbems.cloudfront.net/js/loggly-0.2.1.js"],
  function(LogglyAppender, kernel, log4javascript) {

    //noinspection JSUnresolvedVariable
    var loggly = kernel.global.loggly;
    //noinspection JSUnresolvedVariable
    delete kernel.global.loggly;

    var layout = new log4javascript.PatternLayout("%d{dd MMM yyyy HH:mm:ss,SSS} %-5p - %f - %c - %m");

    var LogglyImgAppender = function(logglyKey) {
      // summary:
      //   This log appender logs to a Loggly account with the given key,
      //   using the "standard" way offered by Loggly, "castor", which is via an img tag.
      //   The script provided by Loggly is used, straight from the source.
      //   Levels are mapped (castor does not have a FATAL level).

      LogglyAppender.call(this, logglyKey);
      //noinspection JSUnresolvedVariable
      this.castor = new loggly.castor({url: "https://http-logs.loggly.com/inputs/" + this.key, level: "log"});
    };

//    https://http-logs.loggly.com/inputs/<guid>.gif?key=value&anotherkey=anothervalue

    LogglyImgAppender.prototype = new LogglyAppender();

    LogglyImgAppender.prototype.setLayout(layout);

    LogglyImgAppender.prototype.send2Loggly = function(/*log4javascript.Level*/ level, /*Object*/ formattedMsg) {
      if (log4javascript.Level.TRACE.isGreaterOrEqual(level)) {
        this.castor.log(formattedMsg);
      }
      else if (log4javascript.Level.DEBUG.equals(level)) {
        this.castor.debug(formattedMsg);
      }
      else if (log4javascript.Level.INFO.equals(level)) {
        this.castor.info(formattedMsg);
      }
      else if (log4javascript.Level.WARN.equals(level)) {
        this.castor.warn(formattedMsg);
      }
      else if (level.isGreaterOrEqual(log4javascript.Level.ERROR)) {
        this.castor.error(formattedMsg);
      }
    };

    LogglyImgAppender.prototype.toString = function() {
      return "LogglyImgAppender";
    };

    return LogglyImgAppender;
  }
);
