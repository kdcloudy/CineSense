var express = require("express");
var mongoose = require("mongoose"),
    passport = require("passport"),
    flash = require("connect-flash"),
    bodyParser = require("body-parser"),
    User = require("./models/user"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose")

    
// mongoose.connect("mongodb://localhost:27017/cinesense",{useNewUrlParser: true, useUnifiedTopology: true }); -> FOR LOCALLY HOSTED DATABASE
var dbaddress = 'INSERT MONGODB ATLAS' // REPLACE STRING WITH MONGODB CLUSTER ADDRESS, SET TO PUBLIC 0.0.0.0
mongoose.connect(dbaddress,{useNewUrlParser: true, useUnifiedTopology: true });


var app = express();
var app = express();

const API = 'INSERT API KEY'
const APIWatch = 'INSERT API KEY';
const APITech = 'INSERT API KEY';;
var request = require("request");

app.set("view engine", "ejs");
app.use(express.static(__dirname + '/views'));

app.use(flash());


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
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
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
            req.flash("error", "User Already Exists!");
            return res.render('register');
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "You are now Registered Successfully!!");
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
    req.flash("success", "Log Out Successful!!");
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
    request("http://www.omdbapi.com/?apikey="+ API + "&s=" + search,function(error,response,body){
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

    request("http://www.omdbapi.com/?i="+movID+"&apikey="+API,function(error,response,body){
        if(!error && response.statusCode == 200)
        {
            var picture = JSON.parse(body);
            //res.send(body);
            res.render("movie",{data : picture});
        }
    })
})

//4)Testing favfilms thingy
app.post("/favs/add/:ID", isLoggedIn, function(req, res){
    var movID = req.params.ID;
    var uname = req.user.username;
    User.updateOne({ username: uname }, { $push: { favfilms:[movID] } }, function(err,result) {
        if (err) {
          console.log(err);
          req.flash("error", "There was a problem with the database!!");
          res.redirect("/movie/"+movID)
        } else {
          console.log(result);
          req.flash("success", "Movie Added Successfully!!");
          res.redirect("/movie/"+movID)
        }
     } );

})

//5) Favourited films
    app.post("/favs/remove/:ID", isLoggedIn, function(req, res){
    var movID = req.params.ID;
    var uname = req.user.username;
    User.updateOne({ username: uname }, { $pullAll: { favfilms:[movID] } }, function(err,result) {
        if (err) {
          console.log(err);
          req.flash("error", "There was a problem with the database!!");
          res.redirect("/movie/"+movID)
        } else {
          console.log(result);
          req.flash("error", "Movie Removed!!");
          res.redirect("/movie/"+movID)
        }
     } );

})


app.get("/favs", isLoggedIn, function(req, res){
  res.render("favs")
});

//6) Watch feature
app.get("/movie/watch/:name", function (req, res){
    var moviename = req.params.name;
    var options = {
        method: 'GET',
        url: 'https://utelly-tv-shows-and-movies-availability-v1.p.rapidapi.com/lookup',
        qs: {term: moviename, country: 'in'},
        headers: {
          'x-rapidapi-host': 'utelly-tv-shows-and-movies-availability-v1.p.rapidapi.com',
          'x-rapidapi-key': APIWatch
        }
      };
      
      request(options, function (error, response, body) {
          if (error) throw new Error(error);
            var watchinfo = JSON.parse(body)
            console.log(watchinfo);
            // if(watchinfo && watchinfo.length)
            // {
                res.render("watch", {data: watchinfo});
            // }
            // // else{
            //     res.render("err1");
          //  }
            //res.send(body);
            
            
      });
});
//7) ABOUT PAGE

app.get("/about", function(req, res){
    res.render("about");
});

//8) TECH SPECS (LONGSHOT)
app.get("/movie/tech/:ID", function (req, res){
    var movieID = req.params.ID;
    //console.log(movieID)
    var options = {
        method: 'GET',
        url: 'https://imdb-internet-movie-database-unofficial.p.rapidapi.com/film/'+movieID,
        headers: {
          'x-rapidapi-host': 'imdb-internet-movie-database-unofficial.p.rapidapi.com',
          'x-rapidapi-key': APITech,
          useQueryString: true
        }
      };
      
      request(options, function (error, response, body) {
          if (error) throw new Error(error);
            var techspecs = JSON.parse(body);
            //res.send(techspecs);
            res.render("techspecs", {data: techspecs});
      });
});

//END OF ROUTES


//MIDDLEWARES
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to Login First!!");
    res.redirect("/login")
}



let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function(req, res){
    console.log("Server has started!")
});

mongoose.connection.on('connected',() =>{
    console.log("Connected to database!")

})