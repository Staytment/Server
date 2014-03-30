var monk = require('monk');
module.exports = monk(process.env.MONGOHQ_URL || 'localhost:27017/frozen-forest');