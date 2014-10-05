var db = require(__dirname + '/../database.js');
var dbPosts = db.get('posts');

var Q = require('q');

var fetchPost = function (rectangle) {
  return Q.ninvoke(dbPosts, 'find', {
    geometry: {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates: rectangle
        }
      }
    }
  }, {
    limit: 1,
    sort: { _id: -1 },
    fields: {
      geometry: 1,
      properties: 1,
      type: 1,
      _id: 1
    }
  });
};

/**
 * Fetches posts which are near by the given coordinates
 * @param {Number[]} coordinates - Array of the coordinates. First number is longitude, second is latitude
 * @param {Number} maxDistance - Maximum distance in meters of posts that should be fetched
 * @param {Number} limit - Maximum number of posts that should be returned
 * @param {Function} callback
 */
exports.fetchPostsNearby = function (coordinates, maxDistance, limit, callback) {
  dbPosts.find({
    geometry: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    }
  }, {
    limit: limit,
    sort: { _id: -1 },
    fields: {
      geometry: 1,
      properties: 1,
      type: 1,
      _id: 1
    }
  }, callback);
};

/**
 * Fetches posts within a specified area. The area is specified by the parameter "coordinates", which shall contain
 * a list of two coordinates. Each coordinate is a list of two numbers. The first number is the longitude, the second
 * the latitude. Example:
 * [
 *   [50, 9.2],
 *   [51, 9,5]
 * ]
 *
 * The parameters horizontal_resolution and vertical_resolution define the grid. Only the most relevant post within
 * each grid cell will be returned.
 * Some ASCII art to demonstrate each parameter:
 *
 *         coordinates[0]
 *             X---------+---------+---------+
 *             |         |         |         |
 *             |         |         |         |  <--+
 *             |         |         |         |     |
 *             +---------+---------+---------+     |
 *             |         |         |         |     |
 *             |         |         |         |  <--+
 *             |         |         |         |     |
 *             +---------+---------+---------+     +-- vertical_resolution = 4
 *             |         |         |         |     |
 *             |         |         |         |  <--+
 *             |         |         |         |     |
 *             +---------+---------+---------+     |
 *             |         |         |         |     |
 *             |         |         |         |  <--+
 *             |         |         |         |
 *             +---------+---------+---------X
 *                                     coordinates[1]
 *                  ^         ^         ^
 *                  |---------|---------|---- horizontal_resolution = 3
 *
 * @param {Number[][]} coordinates
 * @param {Number} horizontal_resolution - Number of posts which should be returned for each row
 * @param {Number} vertical_resolution - Number of posts which should be returned for each column
 * @param {Function} callback
 */
exports.FetchPostsWithin = function (coordinates, horizontal_resolution, vertical_resolution, callback) {
  var from_long = coordinates[0][0];
  var to_long = coordinates[1][0];
  var from_lat = coordinates[0][1];
  var to_lat = coordinates[1][1];
  var k = horizontal_resolution;
  var j = vertical_resolution;
  var promises = [];
  for (var col = 0; col < horizontal_resolution; col++) {
    var long = [
        from_long + ((col + 0) / k) * (to_long - from_long),
        from_long + ((col + 1) / k) * (to_long - from_long),
        from_long + ((col + 1) / k) * (to_long - from_long),
        from_long + ((col + 0) / k) * (to_long - from_long),
        from_long + ((col + 0) / k) * (to_long - from_long)
    ];
    for (var row = 0; row < vertical_resolution; row++) {
      var lat = [
          from_lat + ((row + 0) / j) * (to_lat - from_lat),
          from_lat + ((row + 0) / j) * (to_lat - from_lat),
          from_lat + ((row + 1) / j) * (to_lat - from_lat),
          from_lat + ((row + 1) / j) * (to_lat - from_lat),
          from_lat + ((row + 0) / j) * (to_lat - from_lat)
      ];
      var rectangle = [
        [
          [long[0], lat[0]],
          [long[1], lat[1]],
          [long[2], lat[2]],
          [long[3], lat[3]],
          [long[4], lat[4]]
        ]
      ];
      var promise = fetchPost(rectangle);
      promises.push(promise);
    }
  }

  Q.all(promises)
    .then(function () {
      var docs = [];
      for (var promise in promises) {
        var doc = promises[promise][0];
        docs.push(doc);
      }
      callback(null, docs);
    });
};