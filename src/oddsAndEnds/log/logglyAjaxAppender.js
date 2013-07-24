define(["./main"],
  function(log4javascript) {

    var sessionId = Math.floor(Math.random() * 9007199254740992); // random number to identify a page app instance run

    var layout = new log4javascript.JsonLayout(false, false);
    layout.setCustomField("logger", function(layout, loggingEvent) {
      return loggingEvent.logger.name;
    });

    function logglyAjaxAppenderFactory(logglyKey) {
      // summary:
      //   A factory for log4javascript.AjaxAppenders talking JSON to Loggly.
      // description:
      //   We do not extend LogglyAppender, since we do not have multiple inheritance here,
      //   and there is little to gain. We cannot extend AjaxAppender, since it is implemented
      //   with a non-null parameter url.

      var instance = new log4javascript.AjaxAppender("http://logs.loggly.com/inputs/" + logglyKey);
      instance.setLayout(layout);
      instance.setSessionId(sessionId);
      instance.setSendAllOnUnload(true);
      instance.toString = function() {
        return "LogglyAjaxAppender";
      };
      return instance;
    }

    return logglyAjaxAppenderFactory;
  }
);
