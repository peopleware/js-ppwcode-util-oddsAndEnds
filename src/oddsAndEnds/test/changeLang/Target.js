define(["dojo/_base/declare", "dojo/Stateful"],
  function (declare, Stateful) {

    var Target = declare([Stateful], {

      aNumber: Math.PI

    });

    return Target;
  }
);
