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

define(["dojo/main", "util/doh/main", "require"],
  function(dojo, doh, require) {

    var serverTypeIdentifier = "MyProject.Foo.Bar.ANiceType, MyProject.Foo, Version=3.4.2.0, Culture=neutral, PublicKeyToken=null";
    var typeMid = "ding/dong/bar/ANiceType";

    function type2MidFunction(sti) {
      var result1 = sti.replace(
        /^(?:MyProject\.Foo\.(.*?)),.*$/g,
        "$1");
      var parts = result1.split(".");
      for (var i = 0; i < parts.length; i++) {
        if (i < parts.length - 1) {
          parts[i] = parts[i].charAt(0).toLowerCase() + parts[i].slice(1);
        }
        // else, leave it alone
      }
      var result2 = "ding/dong/" + parts.join("/");
      return result2;
    }

    doh.register("type 2", [

      function testLoad() {
        window["ppwcode-util-oddsAndEnds-type-2mid"] = "./mockType2Mid";
        console.log('window["ppwcode-util-oddsAndEnds-type-2mid"]: ' + window["ppwcode-util-oddsAndEnds-type-2mid"]);
        var deferred = new doh.Deferred();
        console.log(require);
        require(["../type"], function(type) {
          deferred.callback(type);
        });
        return deferred;
      },

      function testLoadMockType2MidRelative() {
        console.log("running");
        window["ppwcode-util-oddsAndEnds-type-2mid"] = "./mockType2Mid";
        console.log('window["ppwcode-util-oddsAndEnds-type-2mid"]: ' + window["ppwcode-util-oddsAndEnds-type-2mid"]);
        var deferred = new doh.Deferred();
        console.log(require);
        require(["../type!./Mock"], function(Mock) {
          if (!require.modules || !require.modules["oddsAndEnds/test/mockType2Mid"] ||
            !require.modules["oddsAndEnds/test/mockType2Mid"].result) {
            deferred.errback("resulting type2Mid is not in cache, or it is another module");
            return;
          }
          if (!Mock) {
            deferred.errback("require result is " + Mock);
            return;
          }
          var mock = new Mock();
          if (!mock) {
            deferred.errback("construction failed");
            return;
          }
          if (! mock.test === "TEST2") {
            deferred.errback("something fishy");
            return;
          }
          if (!require.modules || !require.modules["oddsAndEnds/test/Mock"] ||
                require.modules["oddsAndEnds/test/Mock"].result != Mock) {
            deferred.errback("resulting module is not in cache, or it is another module");
            return;
          }
          deferred.callback(Mock);
        });
        return deferred;
      },

      function testLoadMockType2MidAbsolute() {
        console.log("running");
        window["ppwcode-util-oddsAndEnds-type-2mid"] = "./mockType2Mid";
        console.log('window["ppwcode-util-oddsAndEnds-type-2mid"]: ' + window["ppwcode-util-oddsAndEnds-type-2mid"]);
        var deferred = new doh.Deferred();
        console.log(require);
        require(["../type!oddsAndEnds/test/Mock"], function(Mock) {
          if (!require.modules || !require.modules["oddsAndEnds/test/mockType2Mid"] ||
            !require.modules["oddsAndEnds/test/mockType2Mid"].result) {
            deferred.errback("resulting type2Mid is not in cache, or it is another module");
            return;
          }
          if (!Mock) {
            deferred.errback("require result is " + Mock);
            return;
          }
          var mock = new Mock();
          if (!mock) {
            deferred.errback("construction failed");
            return;
          }
          if (! mock.test === "TEST2") {
            deferred.errback("something fishy");
            return;
          }
          if (!require.modules || !require.modules["oddsAndEnds/test/Mock"] ||
            require.modules["oddsAndEnds/test/Mock"].result != Mock) {
            deferred.errback("resulting module is not in cache, or it is another module");
            return;
          }
          deferred.callback(Mock);
        });
        return deferred;
      },

      function testLoadFunctionType2MidAbsolute() {
        console.log("running");
        window["ppwcode-util-oddsAndEnds-type-2mid"] = function(serverTypeIdentifier) {
          return serverTypeIdentifier;
        };
        console.log('window["ppwcode-util-oddsAndEnds-type-2mid"]: ' + window["ppwcode-util-oddsAndEnds-type-2mid"]);
        var deferred = new doh.Deferred();
        console.log(require);
        require(["../type!oddsAndEnds/test/Mock"], function(Mock) {
          if (!require.modules || !require.modules["oddsAndEnds/test/mockType2Mid"] ||
            !require.modules["oddsAndEnds/test/mockType2Mid"].result) {
            deferred.errback("resulting type2Mid is not in cache, or it is another module");
            return;
          }
          if (!Mock) {
            deferred.errback("require result is " + Mock);
            return;
          }
          var mock = new Mock();
          if (!mock) {
            deferred.errback("construction failed");
            return;
          }
          if (! mock.test === "TEST2") {
            deferred.errback("something fishy");
            return;
          }
          if (!require.modules || !require.modules["oddsAndEnds/test/Mock"] ||
            require.modules["oddsAndEnds/test/Mock"].result != Mock) {
            deferred.errback("resulting module is not in cache, or it is another module");
            return;
          }
          deferred.callback(Mock);
        });
        return deferred;
      },

      function testGrep() {
        console.log("serverTypeIdentifier: " + serverTypeIdentifier);
        var result = type2MidFunction(serverTypeIdentifier);
        console.log("result: " + result);
        doh.is(typeMid, result);
      }

    ]);

  }
);
