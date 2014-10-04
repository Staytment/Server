var db = require(__dirname + '/../database.js');
var dbPosts = db.get('posts');
var config = require(__dirname + '/../config.json');
var swagger = require('swagger-node-express');
var errors = swagger.errors;
var posts = require(__dirname + '/../posts.js');

exports.getPostList = {
  spec: {
    description: 'Fetch a list of all posts (just for development purposes, will be removed or changed in future)',
    path: '/posts',
    notes: 'Returns a list of all posts. This method is for development purposes and will be changed or removed in future.',
    summary: 'Fetch a list of all posts (dev only)',
    method: 'GET',
    type: 'array',
    nickname: 'getPostList',
    parameters: [
      swagger.queryParam('limit', 'Limit the response to n posts. Valid range: 1-25, default 25.', 'Number'),
      swagger.queryParam('filter', 'Method of limiting the posts by a criterion. Available values: "rectangle", "point"', 'String'),
      swagger.queryParam('long', 'For method "point": Longitude of the point to get posts nearby', 'Number'),
      swagger.queryParam('lat', 'For method "point": Latitude of the point to get posts nearby', 'Number'),
      swagger.queryParam('distance', 'For method "point": Maximum distance from given point', 'Number'),
      swagger.queryParam('long1', 'For method "rectangle": Longitude of the first coordinate of the rectangle', 'Number'),
      swagger.queryParam('lat1', 'For method "rectangle": Latitude of the first coordinate of the rectangle', 'Number'),
      swagger.queryParam('long2', 'For method "rectangle": Longitude of the second coordinate of the rectangle', 'Number'),
      swagger.queryParam('lat2', 'For method "rectangle": Latitude of the second coordinate of the rectangle', 'Number'),
      swagger.queryParam('long3', 'For method "rectangle": Longitude of the third coordinate of the rectangle', 'Number'),
      swagger.queryParam('lat3', 'For method "rectangle": Latitude of the third coordinate of the rectangle', 'Number'),
      swagger.queryParam('long4', 'For method "rectangle": Longitude of the fourth coordinate of the rectangle', 'Number'),
      swagger.queryParam('lat4', 'For method "rectangle": Latitude of the fourth coordinate of the rectangle', 'Number')
    ],
    items: {
      $ref: 'Post'
    }
  },
  action: function (req, res) {
    var limit = req.param('limit');
    if (limit !== undefined) {
      req.assert('limit').isInt();
      req.sanitize('limit').toInt();
      if (req.validationErrors()) {
        errors.invalid('limit', res);
        return;
      }
    } else {
      limit = 25;
    }
    if (limit < 1 || limit > 25) {
      errors.invalid('limit', res);
      return;
    }
    var criteria = {};
    if (req.param('filter') == 'point') {
      req.assert('long', 'not a valid longitude value').isLong();
      req.assert('lat', 'not a valid latitude value').isLat();
      req.assert('distance', 'not a valid distance').isInt();
      req.sanitize('long').toFloat();
      req.sanitize('lat').toFloat();
      req.sanitize('distance').toInt();
      if (req.validationErrors()) {
        errors.invalid('coordinates', res);
        return;
      }
      criteria = {
        geometry: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [req.param('long'), req.param('lat')]
            },
            $maxDistance: req.param('distance')
          }
        }
      };
    } else if (req.param('filter') == 'rectangle') {
      req.assert('long1', 'not a valid longitude value').notEmpty().isLong();
      req.assert('lat1', 'not a valid latitude value').notEmpty().isLat();
      req.assert('long2', 'not a valid longitude value').notEmpty().isLong();
      req.assert('lat2', 'not a valid latitude value').notEmpty().isLat();
      req.assert('long3', 'not a valid longitude value').notEmpty().isLong();
      req.assert('lat3', 'not a valid latitude value').notEmpty().isLat();
      req.assert('long4', 'not a valid longitude value').notEmpty().isLong();
      req.assert('lat4', 'not a valid latitude value').notEmpty().isLat();
      req.sanitize('long1').toFloat();
      req.sanitize('lat1').toFloat();
      req.sanitize('long2').toFloat();
      req.sanitize('lat2').toFloat();
      req.sanitize('long3').toFloat();
      req.sanitize('lat3').toFloat();
      req.sanitize('long4').toFloat();
      req.sanitize('lat4').toFloat();
      if (req.validationErrors()) {
        errors.invalid('coordinates', res);
        return;
      }

      criteria = {
        geometry: {
          $geoWithin: {
            $geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [req.param('long1'), req.param('lat1')],
                  [req.param('long2'), req.param('lat2')],
                  [req.param('long3'), req.param('lat3')],
                  [req.param('long4'), req.param('lat4')],
                  [req.param('long1'), req.param('lat1')]
                ]
              ]
            }
          }
        }
      };
    }
    dbPosts.find(criteria, {
      limit: limit,
      sort: { _id: -1 },
      fields: {
        geometry: 1,
        properties: 1,
        type: 1,
        _id: 1
      }
    }, function (err, docs) {
      res.send({
        type: 'FeatureCollection',
        features: docs
      });
    });
  }
};

exports.getPostListByRectangle = {
  spec: {
    description: 'Fetch a list of posts by rectangle',
    path: '/posts/by-rectangle',
    notes: 'The rectangle will be separated into a grid. For each grid cell, you will receive one post.\
            The default grid size is 3*4 (as seen in the graphic below)\
      <pre>\
      long1, lat1                                                         \n\
          X---------+---------+---------+                                 \n\
          |         |         |         |                                 \n\
          |         |         |         |  <--+                           \n\
          |         |         |         |     |                           \n\
          +---------+---------+---------+     |                           \n\
          |         |         |         |     |                           \n\
          |         |         |         |  <--+                           \n\
          |         |         |         |     |                           \n\
          +---------+---------+---------+     +-- vertical_resolution = 4 \n\
          |         |         |         |     |                           \n\
          |         |         |         |  <--+                           \n\
          |         |         |         |     |                           \n\
          +---------+---------+---------+     |                           \n\
          |         |         |         |     |                           \n\
          |         |         |         |  <--+                           \n\
          |         |         |         |                                 \n\
          +---------+---------+---------X                                 \n\
                                       long2, lat2                        \n\
               ^         ^         ^                                      \n\
               |---------|---------|---- horizontal_resolution = 3        \n\
      </pre>',
    summary: 'Fetch a list of posts by rectangle',
    method: 'GET',
    type: 'array',
    nickname: 'getPostList',
    parameters: [
      swagger.queryParam('long1', 'Longitude of the first coordinate of the rectangle', 'Number'),
      swagger.queryParam('lat1', 'Latitude of the first coordinate of the rectangle', 'Number'),
      swagger.queryParam('long2', 'Longitude of the second coordinate of the rectangle', 'Number'),
      swagger.queryParam('lat2', 'Latitude of the second coordinate of the rectangle', 'Number'),
      swagger.queryParam('horizontal_resolution', 'Horizontal resolution of the grid', 'Number'),
      swagger.queryParam('vertical_resolution', 'Vertical resolution of the grid', 'Number')
    ],
    items: {
      $ref: 'Post'
    }
  },
  action: function (req, res) {
    var limit = req.param('limit');
    if (limit !== undefined) {
      req.assert('limit').isInt();
      req.sanitize('limit').toInt();
      if (req.validationErrors()) {
        errors.invalid('limit', res);
        return;
      }
    } else {
      limit = 25;
    }
    if (limit < 1 || limit > 25) {
      errors.invalid('limit', res);
      return;
    }

    req.assert('long1', 'not a valid longitude value').notEmpty().isLong();
    req.assert('lat1', 'not a valid latitude value').notEmpty().isLat();
    req.assert('long2', 'not a valid longitude value').notEmpty().isLong();
    req.assert('lat2', 'not a valid latitude value').notEmpty().isLat();
    req.assert('long3', 'not a valid longitude value').notEmpty().isLong();
    req.assert('lat3', 'not a valid latitude value').notEmpty().isLat();
    req.assert('long4', 'not a valid longitude value').notEmpty().isLong();
    req.assert('lat4', 'not a valid latitude value').notEmpty().isLat();
    req.sanitize('long1').toFloat();
    req.sanitize('lat1').toFloat();
    req.sanitize('long2').toFloat();
    req.sanitize('lat2').toFloat();
    req.sanitize('long3').toFloat();
    req.sanitize('lat3').toFloat();
    req.sanitize('long4').toFloat();
    req.sanitize('lat4').toFloat();
    if (req.validationErrors()) {
      errors.invalid('coordinates', res);
      return;
    }

    var criteria = {
      geometry: {
        $geoWithin: {
          $geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [req.param('long1'), req.param('lat1')],
                [req.param('long2'), req.param('lat2')],
                [req.param('long3'), req.param('lat3')],
                [req.param('long4'), req.param('lat4')],
                [req.param('long1'), req.param('lat1')]
              ]
            ]
          }
        }
      }
    };
    posts.fetch_posts_within(criteria, limit, function (err, docs) {
      res.send({
        type: 'FeatureCollection',
        features: docs
      });
    });
  }
};

exports.getPostListByPoint = {
  spec: {
    description: 'Fetch a list of posts by point',
    path: '/posts/by-point',
    notes: 'Returns a list of posts.',
    summary: 'Fetch a list of posts by point',
    method: 'GET',
    type: 'array',
    nickname: 'getPostList',
    parameters: [
      swagger.queryParam('limit', 'Limit the response to n posts. Valid range: 1-25, default 25.', 'Number'),
      swagger.queryParam('long', 'For method "point": Longitude of the point to get posts nearby', 'Number'),
      swagger.queryParam('lat', 'For method "point": Latitude of the point to get posts nearby', 'Number'),
      swagger.queryParam('distance', 'For method "point": Maximum distance from given point', 'Number')
    ],
    items: {
      $ref: 'Post'
    }
  },
  action: function (req, res) {
    var limit = req.param('limit');
    if (limit !== undefined) {
      req.assert('limit').isInt();
      req.sanitize('limit').toInt();
      if (req.validationErrors()) {
        errors.invalid('limit', res);
        return;
      }
    } else {
      limit = 25;
    }
    if (limit < 1 || limit > 25) {
      errors.invalid('limit', res);
      return;
    }

    req.assert('long', 'not a valid longitude value').isLong();
    req.assert('lat', 'not a valid latitude value').isLat();
    req.assert('distance', 'not a valid distance').isInt();
    req.sanitize('long').toFloat();
    req.sanitize('lat').toFloat();
    req.sanitize('distance').toInt();
    if (req.validationErrors()) {
      errors.invalid('coordinates', res);
      return;
    }
    var coordinates = [req.param('long'), req.param('lat')];
    var maxDistance = req.param('distance');
    posts.fetch_posts_nearby(coordinates, maxDistance, limit, function (err, docs) {
      res.send({
        type: 'FeatureCollection',
        features: docs
      });
    });
  }
};


exports.getPost = {
  spec: {
    description: 'Fetches a single post by id',
    path: '/posts/{postId}',
    notes: 'Uses the passed postId parameter to search for a post. The postId must be a valid MongoDB ID, i.e. it needs to be a hex number.',
    summary: 'Fetches a single post',
    method: 'GET',
    type: 'Post',
    nickname: 'getPost',
    parameters: [swagger.pathParam('postId', 'ID of the post that should be fetched', 'hex')],
    responseMessages: [errors.notFound('Post'), errors.invalid('postId')]
  },
  action: function (req, res) {
    req.assert('postId').isHexadecimal();
    req.sanitize('postId').toString();
    if (req.validationErrors()) {
      errors.invalid('postId', res);
      return;
    }
    dbPosts.findOne({_id: req.param('postId')}, {fields: {geometry: 1, properties: 1, type: 1, _id: 1}}, function (err, doc) {
      if (!doc) {
        errors.notFound('Post', res);
        return;
      }
      res.json(doc);
    });
  }
};

exports.createPost = {
  spec: {
    description: 'Create a new post',
    path: '/posts/',
    notes: 'You need to give the message of the post and the coordinates. The user will be automatically assigned and a unique id will be generated and given to you in the response.',
    summary: 'Create a new post. API key required.',
    method: 'POST',
    type: 'Post',
    nickname: 'createPost',
    parameters: [
      swagger.bodyParam('post', 'JSON with the keys "coordinates" and "message". Coordinates is an array with the values for "longitude" and "latitude", e.g. "[50, 9]"', 'Post')
    ],
    responseMessages: [
      errors.invalid('coordinates'),
      errors.invalid('message')
    ]
  },
  action: function (req, res) {
    if (req.user.readOnly) {
      errors.forbidden(res);
      return;
    }

    req.assert(['coordinates', 0], 'not a valid longitude value').isLong();
    req.assert(['coordinates', 1], 'not a valid latitude value').isLat();

    req.assert('message', 'required').notEmpty();
    req.sanitize('coordinates[0]').toFloat();
    req.sanitize('coordinates[1]').toFloat();
    req.sanitize('message').toString();

    var validationErrors = req.validationErrors();
    if (validationErrors) {
      if (validationErrors[0].param == 'coordinates.0') {
        errors.invalid('coordinates', res);
      } else if (validationErrors[0].param == 'coordinates.1') {
        errors.invalid('coordinates', res);
      } else if (validationErrors[0].param == 'message') {
        errors.invalid('message', res);
      }
      return;
    }
    if (req.param('coordinates').length != 2) {
      errors.invalid('coordinates', res);
      return;
    }
    var post = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: req.param('coordinates')
      },
      properties: {
        message: req.param('message'),
        tags: [],
        relevance: 100,
        user: {
          _id: req.user._id,
          name: req.user.name
        }
      }
    };
    dbPosts.insert(post);
    res.json(post);
  }
};

exports.deletePost = {
  spec: {
    description: 'Deletes a post',
    path: '/posts/{postId}',
    notes: 'Deletes the post with the passed postId. The postId must be a valid MongoDB ID, i.e. it needs to be a hex number. Will return "204 - No Content" on success. You may only delete posts your own posts.',
    summary: 'Deletes a post. API key required.',
    method: 'DELETE',
    type: 'void',
    nickname: 'deletePost',
    parameters: [swagger.pathParam('postId', 'ID of the post that should be deleted', 'hex')],
    responseMessages: [errors.notFound('Post'), errors.invalid('postId'), errors.forbidden()]
  },
  action: function (req, res) {
    if (req.user.readOnly) {
      errors.forbidden(res);
      return;
    }
    req.assert('postId').isHexadecimal();
    req.sanitize('postId').toString();
    if (req.validationErrors()) {
      errors.invalid('postId', res);
      return;
    }
    dbPosts.findOne({_id: req.param('postId')}, function (err, doc) {
      if (!doc) {
        errors.notFound('Post', res);
        return;
      }
      if (!doc.properties.user._id.equals(req.user._id)) {
        errors.forbidden(res);
        return;
      }
      dbPosts.findAndModify({_id: req.param('postId'), 'properties.user._id': req.user._id}, {}, {remove: true}, function (err, doc) {
        res.send(err || 204);
      });
    });
  }
};
