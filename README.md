# NodeJS Background Jobs With Redis And Kue

Often when implementing your server, you may want to execute a task that takes some time (greater about 800ms).  If a task is time intensive, it is usually a bad user experience to wait for the task to be completed before getting a response from the server.  You do not want your front end waiting for minutes or longer with no visual indication of what is going on.  A common way to solve this problem is to create a background job on the server.

## Background jobs

The purpose of a brackground job is to do some longer running task on the server __asynchronously__.  Since the task is asynchronous, the http response that the client is waiting for, does not depend on the result of your background job.

Email is a great example of a task that makes sense as a background job.  The client may sign up with your server to create a user account.  If the server plans to send a confirmation email, there is no need for the user to wait for the server to complete the task.  The server can send a response once the user has been created in the database and a background job has been created to send the email asynchronously.

## Common Technology for Creating Background Jobs

__NodeJS__

* [kue](https://github.com/Automattic/kue) which requires [redis](http://redis.io/)  -- __PREFERRED__
* [node-background-task](https://github.com/Kinvey/node-background-task) also uses [redis](http://redis.io/)

__Ruby on Rails__

* [Sidekiq](https://github.com/mperham/sidekiq) also uses [redis](http://redis.io/) -- __PREFERRED__
* [Resque](https://github.com/resque/resque) also uses [redis](http://redis.io/)
* [Delayed Job](https://github.com/collectiveidea/delayed_job)

## Redis

![Redis](https://acom.azurecomcdn.net/80C57D/cdn/cvt-13f9af988a3bce151b5f3666660fb76825069825048a47e2c3f78ca61c38c685/images/page/services/cache/redis.png)

Since most of the above technologies use redis, it is a good idea to get familiar with it before moving on.

__Redis__ is an in memory data storage system.  What does in memory mean?  Basically that the data you are storing in redis is very fast to access because it is all in your ram rather than stored on the hard drive.  The downside of storing all the data in memory is that if the computer shuts down unexpectedly, you can lose all of your data.  Therefore, redis is not great for saving mission critical information (use something like postgres for very important data), but it's great for saving short lived data that we are less concerned about losing.

Redis has a fairly large set of data types that you can store your data in.  The full list of commands can be found [here](http://redis.io/commands).


### Redis Setup

Install:

```
brew install redis
```

Running:

```
redis-server
```

Interacting with redis server from command line:

```
redis-cli
```

__EXERCISE__

1. Use the `redis-cli` to interact with redis.  Try different commands and see what they do.  Refer to the [redis commands](http://redis.io/commands) in the docs.  What do the following commands do? `GET`, `SET`, `KEYS *`, `LPUSH`, `RPUSH`, `TYPE`, etc.
2. Describe what Redis is in your own words.  How is it different from Postgres or Mongo?

## Kue

As you saw above, there are many possible technologies and servers to use when implementing background jobs.  We are going to focus on [kue](https://github.com/Automattic/kue) for a few reasons:

1. Full feature set
2. Has a very easy to setup UI.
3. Kue is a npm package for NodeJS (Node is what we've been focusing on).


#### appSimple.js

To get started, look at [appSimple.js](appSimple.js).  To get it running locally, do the normal setup:

```
npm install
```

Next, you must make sure redis is started in order to use kue.  In a separate terminal window, type:

```
redis-server
```
and allow the server to run.

Next, run the app with 

```
node appSimple.js
```

There are 4 main parts to using Kue in the simple example:

* Make sure redis is running

* Requiring kue and creating a queue.

```
var kue = require('kue');
var queue = kue.createQueue();
```

* Creating a job to be placed in the queue.  Notice that the first argument to create is a string called `test`.  The name is important.  It must match the name used to process the queue:

```
var job = queue.create('test', {
      title: title
  }).save(function(err) {
     if(err) { console.log("error: ", err); }
  });  
```

* Process the queue (Note the name of the queue to process is also test):

```
queue.process('test', 2, function(job, done){
  console.log(job.data.title);
  setTimeout(function() {done()}, 600);
});
```

Another cool thing to note about this example (but not required for it to work), is the kue app.  The following line mounts the kue app at the path `/kue`

```
app.use('/kue', kue.app);
```

If you go to [http://localhost:3000/kue](http://localhost:3000/kue), you should be able to see what is happening with your kue queue.

#### appEmail.js

A little more complicated example (because it actually does something) is in the [appEmail.js](appEmail.js) file.  The file has the same 3 setps:

1. Make sure redis is running
2. Require kue and create a queue.
3. Create background tasks to be saved to the queue.
4. Process the queue.

One thing to note in the code referenced below is that the task creation takes more parameters than in the first example.  In fact, you can pass any object you want to the queue.  It is generally a good idea to keep the object as simple as possible though.  Also, this task will retry 3 times before it gives up.  Since there are many reasons why email can fail and it is often not too harmful to try again, retries make sense.

```
  queue.create('email', {
    title: 'Get rich quick email scheme',
    subject: 'Get rich quick email scheme',
    to: 'elie.schoppik@galvanize.com',
    from: from,
    body: body
  }).attempts(3).save(); 
```

Also, notice how the queue processing works:

```
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
```

The processing simply calls an email function that does the work.  Since the process method passes all the data to the email function, the email function can get access to all of the parameters defined when the task was created.

__EXERCISE__

1. Read about exponential backoff.  What is it?  Why is it a good idea in many cases?  How can you change your email sending code to use exponential backoff?
2. It is a common practice with big websites to have some automated tool to check if any of the links on the site are dead.  A simple why to do that is to create an app that gets a url, makes an http GET request to the url, parses the page for all the anchor tags make an http get request to all hrefs n the anchor tag, then store the status code of the request (200, 404, etc).  Implement the dead link checker in `app.js`

