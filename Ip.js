const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var stockSchema = new Schema({
  _id: false,
  stock_name: String,
  like: Number,
});

var ipSchema = new Schema({
  ip_address: {
    type: String,
},
  stocks: [stockSchema],
})

module.exports = mongoose.model('IP', ipSchema);