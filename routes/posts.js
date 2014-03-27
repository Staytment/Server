exports.list = function (req, res) {
  res.send({
      "lat": 5.552,
      "long": 2.342,
      "message": "Bong!",
      "tags": ["Lifestyle", "Restaurant", "YOLO"],
      "relevance": 1337,
      "user": 42
    });
};