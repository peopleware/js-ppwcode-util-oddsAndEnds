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

define(["ppwcode-util-contracts/doh", "../js"],
  function(doh, js) {

    doh.register("js", [

      function testUndefined1_typeOf() {
        var test = undefined;
        var result = js.typeOf(test);
        doh.is("undefined", result);
        console.log("undefined: " + Object.prototype.toString.call(test));
      },

      function testUndefined2_typeOf() {
        var test = { someProperty : "a value"}["anotherProperty"];
        var result = js.typeOf(test);
        doh.is("undefined", result);
        console.log("undefined: " + Object.prototype.toString.call(test));
      },

      function testNull_typeOf() {
        var test = null;
        var result = js.typeOf(test);
        doh.is("null", result);
        console.log("null: " + Object.prototype.toString.call(test));
      },

      function testObject_typeOf() {
        var test = { someProperty : "a value"};
        var result = js.typeOf(test);
        doh.is("object", result);
        console.log("object: " + Object.prototype.toString.call(test));
      },

      function testArray_typeOf() {
        var test = [1, 2, 3];
        var result = js.typeOf(test);
        doh.is("array", result);
        console.log("array: " + Object.prototype.toString.call(test));
      },

      function testArray_typeOf() {
        var test =  (function() { return arguments; })() ;
        var result = js.typeOf(test);
        doh.is("arguments", result);
        console.log("arguments: " + Object.prototype.toString.call(test));
      },

      function testError_typeOf() {
        var test =  new ReferenceError() ;
        var result = js.typeOf(test);
        doh.is("error", result);
        console.log("error: " + Object.prototype.toString.call(test));
      },

      function testDate_typeOf() {
        var test =  new Date() ;
        var result = js.typeOf(test);
        doh.is("date", result);
        console.log("date: " + Object.prototype.toString.call(test));
      },

      function testRegExp_typeOf() {
        var test =  /123/g ;
        var result = js.typeOf(test);
        doh.is("regexp", result);
        console.log("regexp: " + Object.prototype.toString.call(test));
      },

      function testMath_typeOf() {
        var test =  Math ;
        var result = js.typeOf(test);
        doh.is("math", result);
        console.log("math: " + Object.prototype.toString.call(test));
      },

      function testJSON_typeOf() {
        var test =  JSON ;
        var result = js.typeOf(test);
        doh.is("json", result);
        console.log("json: " + Object.prototype.toString.call(test));
      },

      function testNumber1_typeOf() {
        var test = 4;
        var result = js.typeOf(test);
        doh.is("number", result);
        console.log("number: " + Object.prototype.toString.call(test));
      },

      function testNumber2_typeOf() {
        var test = 0;
        var result = js.typeOf(test);
        doh.is("number", result);
        console.log("number: " + Object.prototype.toString.call(test));
      },

      function testNumber3_typeOf() {
        var test =  new Number() ;
        var result = js.typeOf(test);
        doh.is("number", result);
        console.log("number: " + Object.prototype.toString.call(test));
      },

      function testString1_typeOf() {
        var test =  "lknl vpwjg" ;
        var result = js.typeOf(test);
        doh.is("string", result);
        console.log("string: " + Object.prototype.toString.call(test));
      },

      function testString2_typeOf() {
        var test =  "" ;
        var result = js.typeOf(test);
        doh.is("string", result);
        console.log("string: " + Object.prototype.toString.call(test));
      },

      function testString3_typeOf() {
        var test =  new String() ;
        var result = js.typeOf(test);
        doh.is("string", result);
        console.log("string: " + Object.prototype.toString.call(test));
      },

      function testBoolean1_typeOf() {
        var test =  true ;
        var result = js.typeOf(test);
        doh.is("boolean", result);
        console.log("boolean: " + Object.prototype.toString.call(test));
      },

      function testBoolean2_typeOf() {
        var test =  false ;
        var result = js.typeOf(test);
        doh.is("boolean", result);
        console.log("boolean: " + Object.prototype.toString.call(test));
      },

      function testBoolean3_typeOf() {
        var test =  new Boolean() ;
        var result = js.typeOf(test);
        doh.is("boolean", result);
        console.log("boolean: " + Object.prototype.toString.call(test));
      },

      function testFunction_typeOf() {
        var test =  function() {} ;
        var result = js.typeOf(test);
        doh.is("function", result);
        console.log("function: " + Object.prototype.toString.call(test));
      },

      function testConstructorObject_typeOf() {
        function Constructor(a) {
          this._a = a;
        }

        var test = new Constructor(4);
        var result = js.typeOf(test);
        doh.is("object", result);
        console.log("constructor object: " + Object.prototype.toString.call(test));
      }

      // TODO tests getPrototypeChain
      // TODO tests getAllKeys

    ]);

  }
);
