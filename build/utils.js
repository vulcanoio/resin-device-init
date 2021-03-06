
/*
Copyright 2016 Resin.io

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
var Promise, _, imagefs, path, resin, rindle, stringToStream;

Promise = require('bluebird');

rindle = Promise.promisifyAll(require('rindle'));

_ = require('lodash');

path = require('path');

stringToStream = require('string-to-stream');

imagefs = require('resin-image-fs');

resin = require('resin-sdk');


/**
 * @summary Get device type manifest by a device type name
 * @function
 * @protected
 *
 * @param {String} image - path to image
 * @param {String} deviceType - device type slug
 * @returns {Promise<Object>} device type manifest
 *
 * @example
 * utils.getManifestByDeviceType('path/to/image.img', 'raspberry-pi').then (manifest) ->
 * 	console.log(manifest)
 */

exports.getManifestByDeviceType = function(image, deviceType) {
  return imagefs.read({
    image: image,
    partition: {
      primary: 1
    },
    path: '/device-type.json'
  }).then(rindle.extractAsync).then(JSON.parse)["catch"](function() {
    return resin.models.device.getManifestBySlug(deviceType);
  });
};


/**
 * @summary Write config.json to image
 * @function
 * @protected
 *
 * @param {String} image - image path
 * @param {Object} config - config.json object
 * @param {Object} definition - write definition
 *
 * @returns {Promise}
 *
 * @example
 * utils.writeConfigJSON 'my/rpi.img',
 * 	hello: 'world'
 * ,
 * 	partition:
 * 		primary: 4
 * 		logical: 1
 * 	path: '/config.json'
 */

exports.writeConfigJSON = function(image, config, definition) {
  config = JSON.stringify(config);
  if (definition.partition == null) {
    definition.image = path.join(image, definition.image);
  } else {
    if (definition.image == null) {
      definition.image = image;
    }
  }
  return new Promise(function(resolve, reject) {
    return imagefs.write(definition, stringToStream(config)).then(function(stream) {
      stream.on('error', reject);
      return stream.on('close', resolve);
    });
  });
};
