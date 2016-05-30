var mongoose = require('mongoose');

var UserPollSchema = new mongoose.Schema({
  question: String,
  answer: String,
  user: String,
  postId : { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
});


mongoose.model('UserPoll', UserPollSchema);