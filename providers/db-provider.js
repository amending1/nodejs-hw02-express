const mongoose = require('mongoose');
const { MONGODB_URI } = require('../.env');

const connection = mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = {connection};