var express = require('express');
var app = express();
var kue = require('kue');
var uuid = require('node-uuid');
var queue = kue.createQueue();

// Mounts the kue monitoring app on the path /kue
// so that you can see the status of the jobs.
app.use('/kue', kue.app);

function createJob() {
  var title = uuid.v4();
  var job = queue.create('test', {
      title: title
  }).save(function(err) {
     if(err) { console.log("error: ", err); }
  });  
}

setInterval(createJob, 5000);

queue.process('test', 2, function(job, done){
  console.log(job.data.title);
  setTimeout(function() {done()}, 3000);
});

app.listen(3000);