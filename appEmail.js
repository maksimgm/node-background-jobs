var express = require("express"),
app = express(),
methodOverride = require('method-override'),
bodyParser = require("body-parser"),
morgan = require("morgan"),
sanitizeHtml = require('sanitize-html'),
kue = require('kue'),
nodemailer = require('nodemailer');
require('dotenv').load();

var queue = kue.createQueue();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(morgan('tiny'));
app.use('/kue', kue.app);

var smtpConfig = {
  host: 'smtp.mailgun.org',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

var transporter = nodemailer.createTransport(smtpConfig);

queue.process('email', function(job, done){
  email(job.data, done);
});

function email(emailData, done) {
  var mailOptions = {
    from: emailData.from,
    to: emailData.to,
    subject: emailData.subject,
    text: emailData.body,
    html: emailData.body
  };

  transporter.sendMail(mailOptions, function(error, info){
    if(error) {
      console.log(error);
      return done(error);
    }
    console.log('Message sent: ' + info.response);
    done();
    
  });
}

app.post('/email', function(req, res) {
  var from = sanitizeHtml(req.body.email.from);
  var body = sanitizeHtml(req.body.email.body);

  console.log("From:", from, " body: ", body);
 
  queue.create('email', {
    title: 'Get rich quick email scheme',
    subject: 'Get rich quick email scheme',
    to: 'elie.schoppik@galvanize.com',
    from: from,
    body: body
  }).attempts(3).save(); 
  res.redirect('/sent');

});

app.get('/', function(req,res){
  res.redirect('/contact');
});

app.get('/contact', function(req,res){
  res.render("email/index");
});

app.get('/sent', function(req, res) {
  res.render('email/sent');
})

app.get('*', function(req,res){
  res.status(404).render('404');
});

app.listen(3000, function(){
  console.log("Server is listening on port 3000");
});
