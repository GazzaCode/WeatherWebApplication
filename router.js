"use strict";

function route(handle, pathname, request, response) {

    console.log("About to route a request for " + pathname);
    if (typeof handle[pathname] === 'function') {
        handle[pathname](request, response);
    } else {
        console.log("No request handler found for " + pathname);
        response.writeHead(404, { "Content-Type": "text/plain" });
        response.write("Resource not found!");
        response.end();
    }
}

exports.route = route;