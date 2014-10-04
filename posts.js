var db = require(__dirname + '/database.js');
var dbPosts = db.get('posts');

/**
 * Fetches posts which are near by the given coordinates
 * @param {Number[]} coordinates - Array of the coordinates. First number is longitude, second is latitude
 * @param {Number} maxDistance - Maximum distance in meters of posts that should be fetched
 * @param {Number} limit - Maximum number of posts that should be returned
 * @param {Function} callback
 */
exports.fetch_posts_nearby = function (coordinates, maxDistance, limit, callback) {
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
 *             X-----+-----+-----+-----+-----+
 *             |     |     |     |     |     |
 *             |     |     |     |     |     |  <--+
 *             |     |     |     |     |     |     |
 *             +-----+-----+-----+-----+-----+     |
 *             |     |     |     |     |     |     |
 *             |     |     |     |     |     |  <--+-- vertical_resolution = 3
 *             |     |     |     |     |     |     |
 *             +-----+-----+-----+-----+-----+     |
 *             |     |     |     |     |     |     |
 *             |     |     |     |     |     |  <--+
 *             |     |     |     |     |     |
 *             +-----+-----+-----+-----+-----X
 *                                       coordinates[1]
 *                ^     ^     ^     ^     ^
 *                |-----|-----|-----|-----|---- horizontal_resolution = 5
 *
 * @param {Number[][]} coordinates
 * @param {Number} horizontal_resolution - Number of posts which should be returned for each row
 * @param {Number} vertical_resolution - Number of posts which should be returned for each column
 * @param {Function} callback
 */
exports.fetch_posts_within = function (coordinates, horizontal_resolution, vertical_resolution, callback) {

};