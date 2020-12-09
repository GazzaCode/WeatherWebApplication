"use strict";

var http = require("http");
var url = require("url");

function startServer(route, handle) {
    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        console.log("Request for " + pathname + " received.");
        route(handle, pathname, request, response);
    }
    http.createServer(onRequest).listen(40350);
    console.log("Server has started.");
}
exports.startServer = startServer;