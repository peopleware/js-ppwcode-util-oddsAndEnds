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

define(["dojo/has", "dojo/_base/lang", "require"],
  function(has, lang, require1) {

    var type2MidMidConfigName = "ppwcode-util-oddsAndEnds-type-2mid-MID";

    function trace(msg) {
      var traceMsg = "type loader: " + msg;
      console.debug(traceMsg);
    }

    function error(msg) {
      var errMsg = "ERROR: " + msg;
      console.error(errMsg);
      throw errMsg;
    }

    function loaderError(mid) {
      return function(error){
        error("problem loading module '" + mid + "'");
        console.log(error.src, error.id);
      };
    }

    var type2MidCache = null;

    trace("initializing");
    var type2MidConfig = require1.rawConfig[type2MidMidConfigName];
    if (!type2MidConfig && has("dojo-debug-messages")) {
      // for testing, we try to read from the global variable type2MidMidConfigName
      type2MidConfig = this[type2MidMidConfigName];
    }
    if (!type2MidConfig) {
        error("could not find a MID name for the type2mid module to be used. " +
        "This should be specified in dojoConfig." + type2MidMidConfigName + ".");
    }
    trace("type2MidConfig is '" + type2MidConfig + "'");
    if (lang.isFunction(type2MidConfig)) {
      type2MidCache = type2MidConfig;
    }
    trace("initialization done")

    function requireType2Mid(loadRequire, continuation) {
      if (type2MidCache) {
        continuation(type2MidCache);
      }
      else {
        trace("loading '" + type2MidConfig + "'");
        loadRequire.on("error", loaderError(type2MidConfig));
        loadRequire([type2MidConfig], function(type2Mid) {
          trace("loaded '" + type2MidConfig + "' (" + type2Mid + ")");
          type2MidCache =  type2Mid;
          continuation(type2MidCache);
        });
      }
    }

    function convertType2Mid(type2Mid, serverTypeIdentifier) {
      var typeMid = null;
      try {
        trace("converting '" + serverTypeIdentifier + "'");
        typeMid = type2Mid(serverTypeIdentifier);
        trace("resulting MID: '" + typeMid + "'");
      }
      catch (e) {
        error("could not convert server type identifier '" + serverTypeIdentifier +
          "' to MID using " + type2MidConfig + "(" + e + ")");
      }
      return typeMid;
    }

    function requireType(loadRequire, type2Mid, serverTypeIdentifier, continuation) {
      var typeMid = convertType2Mid(type2Mid, serverTypeIdentifier);
      trace("loading '" + typeMid + "'");
      loadRequire.on("error", loaderError(typeMid));
      loadRequire([typeMid], function(type) {
        // the type is now loaded (it should be a constructor); we are ready
        trace("loaded '" + typeMid + "' (" + type + ")");
        continuation(type);
      });
    }

    var load = function(serverTypeIdentifier, // the string to the right of the !
                        loadRequire,    // AMD require; usually a context-sensitive require bound to the module making the plugin request
                        callback) { // the function the plugin should call with the return value once it is done
      trace("load requested: " + serverTypeIdentifier);
      requireType2Mid(loadRequire, function(type2Mid) {
        requireType(loadRequire, type2Mid, serverTypeIdentifier, callback);
      });
    };

    return {
      // summary:
      //    Require plugin to load modules that define types after converting an identification
      //    to a MID. This resolves issues with
      //    * syncing types defined on the server with types defined in the client
      //    * loading classes when polymorph results are received.
      // description:
      //    The main issue that is de raison d'être for this module is the observation
      //    that in a RESTful JSON API might return a more specialized type of object than
      //    requested.
      //    E.g., consider a case where there is a type `Person`, with 2 subtypes, `Male`
      //    and `Female`. When asking the server for a spouse, the resulting object is
      //    not a `Person` (which is abstract), but either a `Male` or a `Female`, and
      //    we don't know in advance which. Suppose we ask the server for relatives,
      //    we would receive a collection of `Person` instances, and again, we can't
      //    know ourselves which of these is `Male`, and which is a `Female`. The server
      //    has to tell us.
      //
      //    We make abstraction of how the server tells us. When we use, e.g., JSON.net
      //    (http://james.newtonking.com/projects/json-net.aspx) on the server, the type
      //    of the object can be included in the serialized JSON representation as a
      //    property `"$type"`. Other mechanisms might do this in another way.
      //
      //    This leads to the second goal of this plugin. The way the type is represented
      //    in a JSON object we receive from the server is not only abstract in "how", but
      //    also in "what". In the example of JSON.net, the `"$type"` property will contain
      //    the fully qualified class name, the .net way (including the name of the DLL,
      //    and optionally, the version of the DLL, etc.:
      //    `"MyProject.Foo.Bar.ANiceType, MyProject.Foo, Version=3.4.2.0, Culture=neutral, PublicKeyToken=null"`).
      //    What we actually need to load the correct module, of course, is a MID.
      //    This means we need to map these `"$type"`-values to a MID. Using a map comes to
      //    mind, but we know that this is prone to change (e.g., during refactorings).
      //    Of course, we could do the mapping in the server, but we believe it is better to
      //    let the server be authoritative, and to have the client follow.
      //
      //    How this mapping is done is abstract in this function, but we suggest that you take
      //    an approach of "convention over configuration", possibly overridden for some extreme
      //    cases with explicit mapping.
      //
      //    The server-type information should be passed to the plugin as an argument:
      //
      //    example:
      //	  | define(
      //    |   ["ppwcode/util/type!MyProject.Foo.Bar.ANiceType, MyProject.Foo, Version=3.4.2.0, Culture=neutral, PublicKeyToken=null", ...],
      //    |   function(AConstructor, ...) {
      //    |   }
      //    | );
      //
      //    Although what is loaded in a plugin is in general not automatically stored in the loader cache,
      //    in this case it is. This means that modules loaded this way can still be loaded in the regular way
      //    elsewhere too:
      //
      //    example:
      //	  | define(
      //    |   ["Bar/ANiceType", ...],
      //    |   function(TheNiceTypeConstructor, ...) {
      //    |   }
      //    | );
      //
      //    What is left is a way to specify the type-description-to-MID-mapping.
      //    It would be unwieldy to have users specify this mapping with each use of the plugin. Most of the time,
      //    there will be one overall mapping for a given project. Therefor, the mapping is specified in the
      //    configuration `dojoConfig`.
      //    Since `dojoConfig` must be specified before dojo is loaded, and we do not want to keep you from using
      //    dojo in the definition of the mapping, the configuration can contain the MID of a module that
      //    defines the application mapper, or a function.
      //    The name of the configuration parameter is `ppwcode-util-oddsAndEnds-type-2mid`.
      //
      //    example:
      //    | <script>
      //    | var dojoConfig = {
      //    |   async: true,
      //    |   parseOnLoad: false,
      //    |   ppwcode-util-oddsAndEnds-type-2mid: function(serverTypeIdentifier) {
      //    |     return serverTypeIdentifier;
      //    |   },
      //    |   has: {
      //    |     "dojo-debug-messages": true,
      //    |     "mvc-bindings-log-api": true
      //    |   }
      //    | };
      //    | </script>

      //    example:
      //    | <script>
      //    | var dojoConfig = {
      //    |   async: true,
      //    |   parseOnLoad: false,
      //    |   ppwcode-util-oddsAndEnds-type-2mid: "MyProject/UI/type2mid",
      //    |   has: {
      //    |     "dojo-debug-messages": true,
      //    |     "mvc-bindings-log-api": true
      //    |   }
      //    | };
      //    | </script>
      //
      //    The `ppwcode-util-oddsAndEnds-type-2mid-MID` module should return a function, that accepts a
      //    string type identified (as defined by the server), and returns the mapped MID.

      load: load
    };
  }
);
