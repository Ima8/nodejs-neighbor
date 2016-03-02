var http = require('http');
var cluster = require("cluster");
//The url we want is: 'www.random.org/integers/?num=1&min=1&max=10&col=1&base=10&format=plain&rnd=new'
var options = {
  host: '127.0.0.1',
  port: '3000',
  path: '/'
};

var num = 0;
var stop = 20000;
var hrstart = process.hrtime();
start = function() {

  callback = function(response) {
    var str = '';

    //another chunk of data has been recieved, so append it to `str`
    response.on('data', function(chunk) {
      str += chunk;
    });

    //the whole response has been recieved, so we just print it out here
    response.on('end', function() {
      console.log(str + " =  " + ++num);
      if (num > stop) {
        hrend = process.hrtime(hrstart);
        console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1] /
          1000000);
      } else {
        start();
      }

    });
  }
  http.request(options, callback).end();
}
if (cluster.isMaster) {
  // this is the master control process
  console.log("Control process running: PID=" + process.pid);

  // fork as many times as we have CPUs
  var numCPUs = require("os").cpus().length;

  for (var i = 0; i < numCPUs / 2; i++) {
    cluster.fork();

  }

  // handle unwanted worker exits
  cluster.on("exit", function(worker, code) {
    if (code != 0) {
      console.log("Worker crashed! Spawning a replacement.");
      cluster.fork();
    }
  });

  // I'm using the SIGUSR2 signal to listen for reload requests
  // you could, instead, use file watcher logic, or anything else
  process.on("SIGUSR2", function() {
    console.log("SIGUSR2 received, reloading workers");

    // delete the cached module, so we can reload the app
    delete require.cache[require.resolve("./app")];

    // only reload one worker at a time
    // otherwise, we'll have a time when no request handlers are running
    var i = 0;
    var workers = Object.keys(cluster.workers);
    var f = function() {
      if (i == workers.length) return;

      console.log("Killing " + workers[i]);

      cluster.workers[workers[i]].disconnect();
      cluster.workers[workers[i]].on("disconnect", function() {
        console.log("Shutdown complete");
      });
      var newWorker = cluster.fork();
      newWorker.on("listening", function() {
        console.log("Replacement worker online.");
        i++;
        f();
      });
    }
    f();
  });
} else {
  console.log("Hello  >>  " + process.pid);
  start();
}
