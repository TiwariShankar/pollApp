var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');

var Post = mongoose.model('Post');
var UserPoll = mongoose.model('UserPoll');
var User = mongoose.model('User');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


// gets all polls
router.get('/posts', function(req, res, next) {
  Post.find(function(err, posts){
    if(err){ 
      return next(err);
    }

    res.json(posts);
  });
});


// post data polls
router.post('/posts', auth, function(req, res, next){
  var post = new Post();
  var dt = new Date();
 
  //console.log(poll);

  post.question = req.body.question;
  post.choice1 = req.body.choice1;
  post.choice2 = req.body.choice2;
  post.choice3 = req.body.choice3;
  post.choice4 = req.body.choice4;
  post.user = req.payload.username;
  post.LastDateUpdated = dt;

  post.save(function(err, post){
    if(err){ return next(err); }
    res.json(post);
  });

});


// post user polls
router.post('/polls', auth, function(req, res, next){
  var post = new UserPoll();
  
  post.question = req.body.question;
  post.answer = req.body.anwser;
  post.user = req.payload.username;
  post.postId = req.body.postId;
  
  post.save(function(err, totalVotes){
    if(err){ return next(err); }
  });
   
  var query = UserPoll.find({ postId:req.body.postId}).count(); 
  //var ansChoice1 = UserPoll.find({ $and: [ {postId:req.body.postId}, {answer:choice1} ] }).count();  

  query.exec(function (err, totalVotes){
  if (err) { return next(err); }
  if (!totalVotes) { return next(new Error("can't find post")); }
    res.json(totalVotes);
  });
  
});


//gets total Votes for a poll
router.get('/getVotes/:postId', function(req, res, next){
  var postId = req.params.postId;
  var query = UserPoll.find({ postId: postId}).count();
    
  query.exec(function (err, totalVotes){
    if (err) { return next(err); }
    //if (!totalVotes) { return next(new Error("can't find post")); }
    res.json(totalVotes);
  });

});


//gets total Votes for a different choices
router.get('/getVotesChoices', function(req, res, next){
  var postId = req.query.postId;
  var choice1 = req.query.choice1;

  var ansChoice1 = UserPoll.find({ $and: [ {postId:postId}, {answer:choice1} ] }).count();

  ansChoice1.exec(function (err, totalVotes){
    if (err) { return next(err); }
    //if (!totalVotes) { res.json(totalVotes); }
    res.json(totalVotes);
  });

});


//filters a post
router.post('/filterPollUser', auth, function(req, res, next){
  var postId = req.body.postId;
  var username = req.payload.username;

  var queryChoice = UserPoll.find({ $and: [{postId:postId}, {user:username}] }, {answer: 1, _id: 0});
  queryChoice.exec(function (err, answerChoice){
    if (err) { return next(err); }
    if (!answerChoice) { return next(new Error("can't find answer")); }
    res.json(answerChoice);
  });

});


// register users
router.post('/register', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  
  /*if(user){ 
      return res.status(400).json({message: 'User already present'});
  }*/

  //checking for similar username
  User.findOne({ username: req.body.username }, function (err, user) {
      if (err) { return done(err); }

      if (!user) {

        var user = new User();
        user.username = req.body.username;
        user.setPassword(req.body.password)

        user.save(function (err){
          if(err){ return next(err); }

          return res.json({token: user.generateJWT()})
        });
      }else{
        return res.status(400).json({message: 'User already present'});
      }
  }); 

});


// login for user
router.post('/login', function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).json({message: 'Please fill out all fields'});
  }

  passport.authenticate('local', function(err, user, info){
    if(err){ return next(err); }

    if(user){
      return res.json({token: user.generateJWT()});
    } else {
      return res.status(401).json(info);
    }
  })(req, res, next);

});

module.exports = router;
