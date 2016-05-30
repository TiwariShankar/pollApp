/*reference https://thinkster.io/mean-stack-tutorial*/

var app = angular.module('PollApp', ['ui.router' , 'ui.bootstrap']); 

app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

	$stateProvider.state('create', {
		url : '/create',
		templateUrl : '/create.html',
		controller : 'CreateCtrl'

	}).state('home', {
		url : '/home',
		templateUrl : '/home.html',
		controller : 'HomeCtrl',
		resolve : {
			post : ['posts',
			function(posts) {
				return posts.getAll();
			}]
		}
	}).state('login', {
		url : '/login',
		templateUrl : '/login.html',
		controller : 'AuthCtrl',
		onEnter : ['$state', 'auth',
		function($state, auth) {
			if (auth.isLoggedIn()) {
				$state.go('home');
			}
		}]

	}).state('register', {
		url : '/register',
		templateUrl : '/register.html',
		controller : 'AuthCtrl',
		onEnter : ['$state', 'auth',
		function($state, auth) {
			if (auth.isLoggedIn()) {
				$state.go('home');
			}
		}]

	});

	$urlRouterProvider.otherwise('login');

}]);


//defining post array and its behaviour so it can be accesible in other parts
app.factory('posts', ['$http', 'auth', function($http, auth) {
	var o = { posts : [] };

	//gets all polls
	o.getAll = function() {
		return $http.get('/posts').success(function(data) {
			angular.copy(data, o.posts);
		});
	};

	//creates a polls
	o.create = function(post) {
	    return $http.post('/posts', post, {
	       headers: {Authorization: 'Bearer '+auth.getToken()}
		}).success(function(data){
		    o.posts.push(data);
	    });
	};

	//submits a poll from users
	o.submit = function(post) {
	  return $http.post('/polls', post, {
	    headers: {Authorization: 'Bearer '+auth.getToken()}
		});	
	};

	//get all votes
	o.getTotalVotes = function(postId){
		return $http.get('/getVotes/' + postId);
	};

	//get all votes
	o.getTotalVotesChoice = function(postId, choice1){
		return $http.get('/getVotesChoices',{params:{"postId": postId, "choice1": choice1}});
	};	

	//
	o.checkUserPoll = function(post){
		return $http.post('/filterPollUser', post, {
	      headers: {Authorization: 'Bearer '+auth.getToken()}
		});
	};

	return o;

}]);


// functions related to authentication
app.factory('auth', ['$http', '$window', function($http, $window) {
	var auth = {};

	auth.saveToken = function(token) {
		$window.localStorage['PollApp-token'] = token;
	};

	auth.getToken = function() {
		return $window.localStorage['PollApp-token'];
	}

	auth.isLoggedIn = function() {
		var token = auth.getToken();

		if (token) {
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	auth.currentUser = function() {
		if (auth.isLoggedIn()) {
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	auth.register = function(user) {
		return $http.post('/register', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	auth.logIn = function(user) {
		return $http.post('/login', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};

	auth.logOut = function() {
		$window.localStorage.removeItem('PollApp-token');
	};

	return auth;

}]);


//Handles Home page
app.controller('HomeCtrl', ['$scope', 'posts', 'auth', function($scope, posts, auth) {
		
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.posts = posts.posts;
		
		var quest, postID, opt;
		var optSelected;

		$scope.postFn = function(post){
			var postId = post._id;
			chkUserPoll(post, postId);
		};


		// which option selected 
		$scope.chgImg = function(post, varParam){
			
			if(varParam === 1){
				post.ImageURL1 = "/images/chk.svg";
				post.ImageURL2 = "";
				post.ImageURL3 = "";
				post.ImageURL4 = "";
			
				quest = post.question;
				postID = post._id;
				opt = post.choice1;
				optSelected = 1;
			}

			if(varParam === 2){
				post.ImageURL2 = "/images/chk.svg";
				post.ImageURL1 = "";
				post.ImageURL3 = "";
				post.ImageURL4 = "";
				
				quest = post.question;
				postID = post._id;
				opt = post.choice2;
				optSelected = 2;
			}

			if(varParam === 3){
				post.ImageURL3 = "/images/chk.svg";
				post.ImageURL1 = "";
				post.ImageURL2 = "";
				post.ImageURL4 = "";
				
				quest = post.question;
				postID = post._id;
				opt = post.choice3;
				optSelected = 3;
			}
			
			if(varParam === 4){
				post.ImageURL4 = "/images/chk.svg";
				post.ImageURL1 = "";
				post.ImageURL2 = "";
				post.ImageURL3 = "";
				
				quest = post.question;
				postID = post._id;
				opt = post.choice4;
				optSelected = 4;
			}
    	};


    	//after submit form 
		$scope.submitPoll = function(post) {
    		var choice1, choice2, choice3, choice4;

    		if (opt === undefined ) {
    			alert("Please select an option");
    			return;
			}

    		post.showTheButton = true;
    		
    		posts.submit({
				question : quest,
    			anwser : opt,
    			postId : postID
    		}).success(function(totalVotes) {
    			post.totalVotes = totalVotes;
    			chkUserPoll(post, postID);

    			//for hiding progress bar
    			if(post.choice1.length > 0){post.pb1 = false;}
			 	if(post.choice2.length > 0){post.pb2 = false;}
			 	if(post.choice3.length > 0){post.pb3 = false;}
			 	if(post.choice4.length > 0){post.pb4 = false;}
				
    			calTotalOpt1(post, postID , post.choice1, 1, totalVotes);
    			calTotalOpt1(post, postID , post.choice2, 2, totalVotes);
    			calTotalOpt1(post, postID , post.choice3, 3, totalVotes);
    			calTotalOpt1(post, postID , post.choice4, 4, totalVotes);
    		});
    	};


    	// calculates total votes
 		$scope.calTotal = function(post, id){
 			var postId = id;
 			
			posts.getTotalVotes(postId)
			 .success(function(totalVotes) {
			 	if(totalVotes === 0){ //for hiding progress bar before submission
			 		post.pb1 = true;post.pb2 = true;
			 		post.pb3 = true;post.pb4 = true;
			 	}
			 	if(post.choice3.length === 0){post.pb3 = true;}
			 	if(post.choice4.length === 0){post.pb4 = true;}
				post.totalVotes = totalVotes;
			});
		};


    	//calculates time remaining for poll
		$scope.timediff = function(start, post){
			var d1 = start;
 			var d2 = new Date(d1); // submitted time
 			var d3 = new Date(d2.getTime() + (1) *24*60*60*1000); //(no of days)
 			var currDt = new Date();

 			var miliseconds = d3-currDt;
 			var seconds = miliseconds/1000;
			var minutes = seconds/60;
			var hours = Math.floor(minutes/60);
		
			if(hours < 0){
				post.showTheButton = true;
				post.Hours = true;
				post.ch1 = true;post.ch2 = true;
				post.ch3 = true;post.ch4 = true;
				post.Time = "Final Results"; 
				
				posts.getTotalVotes(post._id)
	 			 .success(function(totalVotes) {
	 				calTotalOpt1(post, post._id, post.choice1, 1, totalVotes);
	 				calTotalOpt1(post, post._id, post.choice2, 2, totalVotes);
	 				calTotalOpt1(post, post._id, post.choice3, 3, totalVotes);
	 				calTotalOpt1(post, post._id, post.choice4, 4, totalVotes);
				});
			}else{
				if(post.choice3 === ""){
					post.ch3 = true;post.ch4 = true;
				}
				post.timeRem = hours;
    			post.Time = "hours left";
    		}
		};

	
		// Hides/shows option button
		function chkUserPoll(post, postId){

			posts.checkUserPoll({
				postId : postId
			}).success(function(answerChoice) {
				if(Object.keys(answerChoice).length === 0 ){
					// hiding progress bar if user hasn't participated in polls
					post.pb1 = true;post.pb2 = true;
			 		post.pb3 = true;post.pb4 = true;
				}
				else{
					post.showTheButton = true;

				 	if(answerChoice[0].answer === post.choice1){
				 		post.ImageURL1 = "/images/chk.svg";
				 		post.ch1 = false;post.ch2 = true;
				 		post.ch3 = true;post.ch4 = true; // for hiding button
				 		post.tr1 = true; // for showing answer submitted by user
				 	}
				 	if(answerChoice[0].answer === post.choice2){
				 		post.ch2 = false;post.ch1 = true;
				 		post.ch3 = true;post.ch4 = true;
				 		post.ImageURL2 = "/images/chk.svg";
				 		post.tr2 = true;

				 	}
				 	if(answerChoice[0].answer === post.choice3){
				 		post.ch3 = false;post.ch1 = true;
				 		post.ch2 = true;post.ch4 = true;
				 		post.ImageURL3 = "/images/chk.svg";
				 		post.tr3 = true;
				 	}
				 	if(answerChoice[0].answer === post.choice4){
				 		post.ch4 = false;post.ch1 = true;
				 		post.ch2 = true;post.ch3 = true;
				 		post.ImageURL4 = "/images/chk.svg";
				 		post.tr4 = true;
				 	}

				 	posts.getTotalVotes(post._id)
		 			 .success(function(totalVotes) {
		 				calTotalOpt1(post, post._id, post.choice1, 1, totalVotes);
		 				calTotalOpt1(post, post._id, post.choice2, 2, totalVotes);
		 				calTotalOpt1(post, post._id, post.choice3, 3, totalVotes);
		 				calTotalOpt1(post, post._id, post.choice4, 4, totalVotes);
					});
		 		}
			 	
			});
		};


		// calculates percenatage of each option within a given poll
 		function calTotalOpt1(post, postId, choice, opT, totalVotes){

 			if(choice){
			    posts.getTotalVotesChoice(postId, choice)
				 .success(function(totalVotesOpt) {
				 	if(opT === 1){
				 		post.totalVotesChoice1 = totalVotesOpt > 0 ? Math.floor(((totalVotesOpt/totalVotes)* 100)) + "%" : 0 + "%";
				 		if(totalVotesOpt === 0) {post.pb1 = true;}
				 	}
				 	if(opT === 2){
				 		post.totalVotesChoice2 = totalVotesOpt > 0 ? Math.floor(((totalVotesOpt/totalVotes)* 100)) + "%" : 0 + "%";
				 		if(totalVotesOpt === 0) {post.pb2 = true;}
				 	}
				 	if(opT === 3){
				 		post.totalVotesChoice3 = totalVotesOpt > 0 ? Math.floor(((totalVotesOpt/totalVotes)* 100)) + "%" : 0 + "%";
				 		if(totalVotesOpt === 0) {post.pb3 = true;}
				 	}
				 	if(opT === 4){
				 		post.totalVotesChoice4 = totalVotesOpt > 0 ? Math.floor(((totalVotesOpt/totalVotes)* 100)) + "%" : 0 + "%";
				 		if(totalVotesOpt === 0) {post.pb4 = true;}
				 	}
				 });
		    }
 		};

}]);	


//Handles create page
app.controller('CreateCtrl', ['$scope', 'posts', 'auth', function($scope, posts, auth) {
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.posts = posts.posts;
		
		$scope.addPoll = function() {
			if ($scope.question === '' || $scope.choice1 === '' || $scope.choice2 === '' 
				|| $scope.choice3 === '' || $scope.choice4 === '') {
				return;
			}
			posts.create({
				question :  $scope.question,
				choice1  :  $scope.choice1,
				choice2  :  $scope.choice2,
				choice3  :  $scope.choice3,
				choice4  :  $scope.choice4
			});
			
			$scope.mess = true;
			$scope.message = "Poll confirmed successfully...Navigate to home to see your poll and keep polling :)";

			//clear the values
			$scope.question  = '';
			$scope.choice1   = '';
			$scope.choice2   = '';
			$scope.choice3 	 = '';
			$scope.choice4 	 = '';
		};

}]);


// Handles registration and login page
app.controller('AuthCtrl', ['$scope', '$state', 'auth', function($scope, $state, auth) {
	$scope.user = {};

	$scope.register = function() {
		auth.register($scope.user).error(function(error) {
			$scope.error = error;
		}).then(function() {
			$state.go('home');
		});
	};

	$scope.logIn = function() {
		auth.logIn($scope.user).error(function(error) {
			$scope.error = error;
		}).then(function() {
			$state.go('home');
		});
	};

}]);

// Handles navigation controller
app.controller('NavCtrl', ['$scope', 'auth', function($scope, auth) {
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.currentUser = auth.currentUser;
	$scope.logOut = auth.logOut;

}]);



