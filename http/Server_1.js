var net = require('net');

// Server constructor
function Server(requestListener) {
  if (!(this instanceof Server)) return new Server(requestListener);
  net.Server.call(this, { allowHalfOpen: true });

  //http://nodejs.org/docs/latest/api/http.html#http_http_createserver_requestlistener
  //The requestListener is a funciton which is auto added to the `request` event.
  if (requestListener) {
    this.addListener('request', requestListener);
  }

  // Similar option to this. Too lazy to write my own docs.
  // http://www.squid-cache.org/Doc/config/half_closed_clients/
  // http://wiki.squid-cache.org/SquidFaq/InnerWorkings#What_is_a_half-closed_filedescriptor.3F
  this.httpAllowHalfOpen = false;

  //When a net TCP stream is established. socket is connectionListener's argument.
  this.addListener('connection', connectionListener);

  this.addListener('clientError', function(err, conn) {
    conn.destroy(err);
  });

  //By default, the Server's timeout value is 2 minutes.
  //and sockets are destroyed automatically if they time out
  this.timeout = 2 * 60 * 1000;
}
util.inherits(Server, net.Server);

//if you assign a callback to the Server's 'timeout' event, then you are responsible for handling socket timeouts.
Server.prototype.setTimeout = function(msecs, callback) {
  this.timeout = msecs;
  if (callback) {
    this.on('timeout', callback);
  }
};

exports.Server = Server;


function connectionListener(socket) {
  var self = this;
  var outgoing = [];
  var incoming = [];

  function abortIncoming() {
    while(incoming.length) {
      var req = incoming.shift();
      req.emit('aborted');
      req.emit('close');
    }
    //abort socket._httpMessage ?
  }

  function serverSocketCloseListener() {
    debug('server socket close');
    //mark this parser as resuable
    if (this.parser) {
      freeParser(this.parser);
    }

    abortIncoming();
  }

  debug('SERVER new http connection');

  httpSocketSetup(socket);

  if (self.timeout) {
    socket.setTimeout(self.timeout);
  }

  socket.on('timeout', function() {

  });
}
