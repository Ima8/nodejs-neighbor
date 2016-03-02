var express = require('express');
var app = express();

var i = 0;
app.get('/', function(req, res) {
  res.send('Hello World!');
  console.log(i++);
  console.log(i++);
  console.log(i++);
  console.log(i++);
});

app.listen(3000);
