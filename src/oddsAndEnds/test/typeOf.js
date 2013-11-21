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

define(["ppwcode-util-contracts/doh", "../typeOf"],
  function(doh, typeOf) {

    doh.register("typeOf", [

      function testUndefined1() {
        var test = undefined;
        var result = typeOf(test);
        doh.is("undefined", result);
        console.log("undefined: " + Object.prototype.toString.call(test));
      },

      function testUndefined2() {
        var test = { someProperty : "a value"}["anotherProperty"];
        var result = typeOf(test);
        doh.is("undefined", result);
        console.log("undefined: " + Object.prototype.toString.call(test));
      },

      function testNull() {
        var test = null;
        var result = typeOf(test);
        doh.is("null", result);
        console.log("null: " + Object.prototype.toString.call(test));
      },

      function testObject() {
        var test = { someProperty : "a value"};
        var result = typeOf(test);
        doh.is("object", result);
        console.log("object: " + Object.prototype.toString.call(test));
      },

      function testArray() {
        var test = [1, 2, 3];
        var result = typeOf(test);
        doh.is("array", result);
        console.log("array: " + Object.prototype.toString.call(test));
      },

      function testArray() {
        var test =  (function() { return arguments; })() ;
        var result = typeOf(test);
        doh.is("arguments", result);
        console.log("arguments: " + Object.prototype.toString.call(test));
      },

      function testError() {
        var test =  new ReferenceError() ;
        var result = typeOf(test);
        doh.is("error", result);
        console.log("error: " + Object.prototype.toString.call(test));
      },

      function testDate() {
        var test =  new Date() ;
        var result = typeOf(test);
        doh.is("date", result);
        console.log("date: " + Object.prototype.toString.call(test));
      },

      function testRegExp() {
        var test =  /123/g ;
        var result = typeOf(test);
        doh.is("regexp", result);
        console.log("regexp: " + Object.prototype.toString.call(test));
      },

      function testMath() {
        var test =  Math ;
        var result = typeOf(test);
        doh.is("math", result);
        console.log("math: " + Object.prototype.toString.call(test));
      },

      function testJSON() {
        var test =  JSON ;
        var result = typeOf(test);
        doh.is("json", result);
        console.log("json: " + Object.prototype.toString.call(test));
      },

      function testNumber1() {
        var test = 4;
        var result = typeOf(test);
        doh.is("number", result);
        console.log("number: " + Object.prototype.toString.call(test));
      },

      function testNumber2() {
        var test = 0;
        var result = typeOf(test);
        doh.is("number", result);
        console.log("number: " + Object.prototype.toString.call(test));
      },

      function testNumber3() {
        var test =  new Number() ;
        var result = typeOf(test);
        doh.is("number", result);
        console.log("number: " + Object.prototype.toString.call(test));
      },

      function testString1() {
        var test =  "lknl vpwjg" ;
        var result = typeOf(test);
        doh.is("string", result);
        console.log("string: " + Object.prototype.toString.call(test));
      },

      function testString2() {
        var test =  "" ;
        var result = typeOf(test);
        doh.is("string", result);
        console.log("string: " + Object.prototype.toString.call(test));
      },

      function testString3() {
        var test =  new String() ;
        var result = typeOf(test);
        doh.is("string", result);
        console.log("string: " + Object.prototype.toString.call(test));
      },

      function testBoolean1() {
        var test =  true ;
        var result = typeOf(test);
        doh.is("boolean", result);
        console.log("boolean: " + Object.prototype.toString.call(test));
      },

      function testBoolean2() {
        var test =  false ;
        var result = typeOf(test);
        doh.is("boolean", result);
        console.log("boolean: " + Object.prototype.toString.call(test));
      },

      function testBoolean3() {
        var test =  new Boolean() ;
        var result = typeOf(test);
        doh.is("boolean", result);
        console.log("boolean: " + Object.prototype.toString.call(test));
      },

      function testFunction() {
        var test =  function() {} ;
        var result = typeOf(test);
        doh.is("function", result);
        console.log("function: " + Object.prototype.toString.call(test));
      },

      function testConstructorObject() {
        function Constructor(a) {
          this._a = a;
        }

        var test = new Constructor(4);
        var result = typeOf(test);
        doh.is("object", result);
        console.log("constructor object: " + Object.prototype.toString.call(test));
      }

    ]);

  }
);
