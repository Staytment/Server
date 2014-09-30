var db = require(__dirname + '/database.js');
var dbPosts = db.get('posts');

exports.fetch_posts = function (criteria, limit, callback) {
  dbPosts.find(criteria, {
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