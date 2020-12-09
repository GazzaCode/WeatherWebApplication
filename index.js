// import our exported modules
var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

// create ‘handle’ object literal
var handle = {};
// using the associative array notation, each array index is an
// object property which points to an appropriate request handler
handle["/reqData"] = requestHandlers.reqData;
handle["/"] = requestHandlers.reqStart;
handle["/style.css"] = requestHandlers.reqCSS;
handle["/indexPage.js"] = requestHandlers.reqIndexJS;
handle["/getAverageJSON"] = requestHandlers.reqAvgJSON;
// pass handle object (and route function) to server
server.startServer(router.route, handle);
