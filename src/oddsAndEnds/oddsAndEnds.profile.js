var profile = (function () {
  return {
    resourceTags: {
      test: function (filename, mid) {
        return filename.indexOf("test/") >= 0;
      },

      copyOnly: function (filename, mid) {
        return filename.indexOf("log4javascript_uncompressed.js") >= 0;
      },

      amd: function (filename, mid) {
        return false;
//        return filename.indexOf(".js") >= 0
//          && filename.indexOf("log4javascript_uncompressed.js") < 0
//          && filename.indexOf(".profile.js") < 0
//          && filename.indexOf("test/") < 0;
      }
    }
  };
})();
