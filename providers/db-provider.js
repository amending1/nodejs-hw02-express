const mongoose = require('mongoose');
const { uri } = require('../.env');

const connection = mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = {connection};