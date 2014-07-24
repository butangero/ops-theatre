'use strict';

// needed for some in-house modules and libraries
require('sugar');

var path = require('path');
var loopback = require('loopback');
var resources = require('./lib/resources');
var passport = require('./lib/passport');
var app = module.exports = loopback();

// Configure LoopBack models and datasources
// Read more at http://apidocs.strongloop.com/loopback#appbootoptions
app.boot(__dirname);

// Configure request preprocessing
// LoopBack support all express-compatible middleware.
app.use(loopback.favicon());
app.use(loopback.logger(app.get('env') === 'development' ? 'dev' : 'default'));
app.use(loopback.cookieParser(app.get('cookieSecret')));
app.use(loopback.token({model: app.models.accessToken}));
app.use(loopback.bodyParser());
app.use(loopback.methodOverride());

//Setup request handlers.
// automate resource injection
resources.autoload(app, function (err) {
  if (err) {
    // TODO: handle this error
    throw err;
  }

  // LoopBack REST interface
  app.use(app.get('restApiRoot'), loopback.rest());

  // API explorer (if present)
  // TODO: enable this only in debug mode?
  try {
    var explorer = require('loopback-explorer')(app);
    app.use('/explorer', explorer);
    app.once('started', function(baseUrl) {
      console.log('Browse your REST API at %s%s', baseUrl, explorer.route);
    });
  } catch(e){
    console.log(
      'Run `npm install loopback-explorer` to enable the LoopBack explorer'
    );
  }

  // Enable http session
  app.use(loopback.session({ secret: 'keyboard cat' }));

  // setup loopback-passport
  passport(app);

  // Let express routes handle requests that were not handled
  // by any of the middleware registered above.
  // This way LoopBack REST and API Explorer take precedence over
  // express routes.
  app.use(app.router);

  // The static file server should come after all other routes
  // Every request that goes through the static middleware hits
  // the file system to check if a file exists.
  app.use(loopback.static(path.join(__dirname, 'public')));

  // Requests that get this far won't be handled
  // by any middleware. Convert them into a 404 error
  // that will be handled later down the chain.
  app.use(loopback.urlNotFound());

  // The ultimate error handler.
  app.use(loopback.errorHandler());

  // Add a basic application status route at the root `/`.
  // app.get('/', loopback.status());

  // Enable access control and token based authentication.
  var swaggerRemote = app.remotes().exports.swagger;
  if (swaggerRemote) swaggerRemote.requireToken = false;

  app.enableAuth();

  // Optionally start the server
  // (only if this module is the main module)
  app.start = function() {
    return app.listen(function() {
      var baseUrl = 'http://' + app.get('host') + ':' + app.get('port');
      app.emit('started', baseUrl);
      console.log('LoopBack server listening @ %s%s', baseUrl, '/');
    });
  };

  if(require.main === module) {
    app.start();
  }
});
