var express = require("express"),
app = express(),
methodOverride = require('method-override'),
bodyParser = require("body-parser"),
morgan = require("morgan"),
sanitizeHtml = require('sanitize-html'),
cheerio = require('cheerio'),
kue = require('kue');

require('dotenv').load();

var queue = kue.createQueue();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(morgan('tiny'));
app.use('/kue', kue.app);

app.get('/', function(req,res){
  res.render('links/index');
});

app.post('/links', function(req, res) {

  
  // TODO: save the link you want to check,
  //       redirect to the results page for that link
  //       and show the results on the results page.
  //       A refresh will be required to show the results.
  //       You will have to use kue to parse the page and
  //       get all the links, then check if the link is a
  //       200 or not.
  res.send("Implement me!");
});

app.get('/results/:id', function(req,res) {

});

app.get('*', function(req,res){
  res.status(404).render('404');
});

app.listen(3000, function(){
  console.log("Server is listening on port 3000");
});