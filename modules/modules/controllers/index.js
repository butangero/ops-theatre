'use strict';

var fs, common, config;

fs     = require('fs');
common = require('../../../lib/common');
config = require('../../../config.json');

module.exports = {
  getAll : getAll,
  get    : get,
  save   : save
};

function getAll(req, res) {
  common.getFileTree(config.modules.dir, function (err, files) {
    if (err) {
      res.status(500);
      res.send(err);
      return;
    }

    res.send(files);
  });
}

function get(req, res) {
  var filename, filepath;

  filename = req.params[0];
  filepath = config.modules.dir + '/' + filename;

  fs.readFile(filepath, 'utf8', function (err, data) {
    if (err) {
      res.status(500);
      res.send(err);
      return;
    }

    res.send(data);
  });
}

function save(req, res) {
  var filename, filepath, data;

  filename = req.params[0];
  filepath = config.modules.dir + '/' + filename;
  data     = req.body.data;

  fs.writeFile(filepath, data, 'utf8', function (err) {
    if (err) {
      res.status(500);
      res.send(err);
      return;
    }

    res.send(200);
  });
}
