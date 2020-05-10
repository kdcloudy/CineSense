var express = require("express");
var mongoose = require("mongoose"),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    User = require("./models/user"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose")

//mongoose.connect("mongodb://localhost:27017/cinesense",{useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect("mongodb+srv://cinesenseweb:marlboro123@cluster0-tf8ri.mongodb.net/test?retryWrites=true&w=majority",{useNewUrlParser: true, useUnifiedTopology: true });
var app = express();
var app = express();
var request= require("request");

app.set("view engine", "ejs");
app.use(express.static(__dirname + '/views'));


app.use(bodyParser.urlencoded({extended: true}));

app.use(require("express-session")({
    secret: "kdcloudyrox",
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});


//START OF ROUTES

//HOMEPAGE
app.get("/", function(req,res){
    res.render("index")
});

//AUTH ROUTES

//1) REGISTER
app.get("/register", function(req,res)
{
    res.render("register");
})

app.post("/register", function(req,res){
    req.body.username
    req.body.password

    console.log("New user:" + req.body.username, "password:" + req.body.password)
    User.register(new User({username:req.body.username}), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render('register');
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/search"); //CHANGE
        });
    });
});


//2) LOGIN
app.get("/login", function(req, res)
{
    res.render("login");
});

app.post("/login",passport.authenticate("local", {
    successRedirect: "/search",
    failureRedirect: "/login" 
}), function(req, res){

});


//3) LOGOUT
app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});


//MOVIE ROUTES

//1) SEARCHPAGE LUL
app.get("/search", isLoggedIn, function(req, res){
    res.render("search")
})

//2) RESULTS
app.get("/results", isLoggedIn,function(req,res){
    var search= req.query.searchText
    console.log(search, req.user.username);
    request("http://www.omdbapi.com/?apikey=5b7a0834&s="+ search,function(error,response,body){
        if(!error && response.statusCode == 200)
        {
            var lol= JSON.parse(body);
            res.render("results",{data : lol});
        }
    })
})

//3) MOVIE PAGE ROUTE CUSTOM PARAMS
app.get("/movie/:ID", isLoggedIn,function(req,res){
    console.log(req.params, req.user.username);
    var movID = req.params.ID;
    //res.send("movie page hai ye")

    request("http://www.omdbapi.com/?i="+movID+"&apikey=5b7a0834",function(error,response,body){
        if(!error && response.statusCode == 200)
        {
            var picture = JSON.parse(body);
            //res.send(body);
            res.render("movie",{data : picture});
        }
    })
})

//testing favfilms thingy
app.post("/favs/add/:ID", isLoggedIn, function(req, res){
    var movID = req.params.ID;
    var uname = req.user.username;
    User.updateOne({ username: uname }, { $push: { favfilms:[movID] } }, function(err,result) {
        if (err) {
          console.log(err);
        } else {
          console.log(result);
          res.redirect("/movie/"+movID)
        }
     } );

})

app.post("/favs/remove/:ID", isLoggedIn, function(req, res){
    var movID = req.params.ID;
    var uname = req.user.username;
    User.updateOne({ username: uname }, { $pullAll: { favfilms:[movID] } }, function(err,result) {
        if (err) {
          console.log(err);
        } else {
          console.log(result);
          res.redirect("/movie/"+movID)
        }
     } );

})


app.get("/favs", isLoggedIn, function(req, res){
  res.render("favs")
});


app.get("/movies/watch/:name", function (req, res){
    var moviename = req.params.name;
    var options = {
        method: 'GET',
        url: 'https://utelly-tv-shows-and-movies-availability-v1.p.rapidapi.com/lookup',
        qs: {term: moviename, country: 'in'},
        headers: {
          'x-rapidapi-host': 'utelly-tv-shows-and-movies-availability-v1.p.rapidapi.com',
          'x-rapidapi-key': '1d4916ee62msha2ec3d649c2e787p1e61f3jsneb7bc93466de'
        }
      };
      
      request(options, function (error, response, body) {
          if (error) throw new Error(error);
            var watchinfo = JSON.parse(body)
            //res.send(body);
            res.render("watch", {data: watchinfo});
      });
});

//END OF ROUTES


//4) MIDDLEWARES
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login")
}



let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);
