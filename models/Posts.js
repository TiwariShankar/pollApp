var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  question: String,
  choice1: String,
  choice2: String,
  choice3: {type : String, default : ''},
  choice4: {type : String, default : ''},
  user: String,
  LastDateUpdated: Date
});


mongoose.model('Post', PostSchema);