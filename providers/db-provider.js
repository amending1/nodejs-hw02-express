const mongoose = require('mongoose');
const uri = "mongodb+srv://usernew:frania_1010@cluster0.vjulzuh.mongodb.net/Desktop?retryWrites=true&w=majority&appName=Cluster0";

const connection = mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = connection;