define(["dojo/_base/declare", "./main"],
  function(declare, log4javascript) {

    // runId: Number
    //   random number to identify a page app instance run
    var runId = Math.floor(Math.random() * 9007199254740992);

    var Appender = declare([log4javascript.Appender], {
      // summary:
      //   Extended super class for Appenders.
      //   We add a custom field "run" that contains a random number to identify a page app instance run
      //   to each added layout.

      setLayout: function(/*log4javascript.Layout*/ layout) {
        layout.setCustomField("run", runId);
        this.inherited(arguments);
      }

    });

    return Appender;
  }
);
