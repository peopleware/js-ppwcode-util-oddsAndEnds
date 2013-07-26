define(["dojo/_base/declare", "./main"],
  function(declare, log4javascript) {

    var JsonObjectLayout = declare([log4javascript.Layout], {
      // summary:
      //   A JSON layout that actually returns an object, and does not try to stringify it itself.
      //   When requested to format multiple messages, we return an Array

      constructor: function() {
        this.setKeys();
        this.customFields = [];
      },

      format: function(loggingEvent) {
        var /*String[][]*/ dataValues = this.getDataValues(loggingEvent, this.combineMessages);
        var result = dataValues.reduce( // change Array to Object
          function(acc, entry) {
            acc[entry[0]] = entry[1];
            return acc;
          },
          {}
        );
        return result;
      },

      ignoresThrowable: function() {
        return false;
      },

      toString: function() {
        return "JsonObjectLayout";
      },

      getContentType: function() {
        return "application/json";
      }

    });

    return JsonObjectLayout;
  }
);
