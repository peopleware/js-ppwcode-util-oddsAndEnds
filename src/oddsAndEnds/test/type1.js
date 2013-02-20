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

window["ppwcode-util-oddsAndEnds-type-2mid-MID"] = "./mockType2Mid";
console.log('window["ppwcode-util-oddsAndEnds-type-2mid-MID"]: ' + window["ppwcode-util-oddsAndEnds-type-2mid-MID"]);

define(["dojo/main", "util/doh/main", "../type"],
  function(dojo, doh, type) {

    doh.register("type 1", [

      function testFindTypeRelative() {
        doh.is(true, true);
      }

    ]);

  }
);
