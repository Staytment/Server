var validator = require('express-validator');

validator.validator.extend('isLat', function (str) {
  if (!validator.validator.isFloat(str)) {
    return false;
  }
  var value = parseFloat(str);
  return -90 <= value && value <= 90;

});
validator.validator.extend('isLong', function (str) {
  if (!validator.validator.isFloat(str)) {
    return false;
  }
  var value = parseFloat(str);
  return -180 <= value && value <= 180;
});

module.exports = validator;