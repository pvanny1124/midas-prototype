const express       = require("express");
const http          = require("http");
const socketIo      = require("socket.io");
const fetch         = require('isomorphic-fetch');
const mongoose      = require('mongoose');
const app           = express();
var User            = require('../models/UserSchema');
var bodyParser      = require('body-parser');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}));
app.use(function(req, res, next) {  
  //Following is needed to allow a fetch put request to work on the client side:

    // Website you wish to allow to connect
    var allowedOrigins = ['http://127.0.0.1:3001', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://localhost:3000'];
    var origin = req.headers.origin;
    if(allowedOrigins.indexOf(origin) > -1){
         res.setHeader('Access-Control-Allow-Origin', origin);
    }
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});  

//Connect to mlab database
var databaseUser = process.env.USER;
var databaseUserPassword = process.env.PASSWORD;
const database_url = `mongodb://${databaseUser}:${databaseUserPassword}@ds119350.mlab.com:19350/midas-prototype`;
mongoose.connect(database_url);
mongoose.Promise = Promise;


const port = 3000;

//SocketIO mounting
const server = http.createServer(app);
const io = socketIo(server); 

// io.listen(3001);

// END CONFIG ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

let interval;

//So that we don't spam another client with this info,
//we need to clear the setInterval timer.
//using the interval variable, we can set this to the setInterval function
//and since its global, if its still running upon a new connection,
//then we use clearInterval and pass in interval to stop the timer.
//clearInterval is a pre-defined function from js.


app.get("/api/user", function(req, res){
    User.findOne({firstName: "Patrick"})
        .then((user) => {
          res.json(user);
        })
        .catch((err) => {
          res.send(err);
        })
});

app.put("/api/user/:id", function(req, res){
    User.update({_id: req.body._id}, {_id: req.body._id, portfolio: req.body.portfolio, cash: req.body.cash})
        .then((user) => {
          res.json(user);
        })
        .catch((err) => {
          res.send(err);
        });
});

io.on("connection", socket => {
  console.log("New client connected");

  

  if (interval) {
    clearInterval(interval);
  }
  socket.on("get quote", (ticker) => {
        console.log("ticker received in backend: " + ticker);
        interval = setInterval(() => getStockPriceAndEmit(socket, ticker), 100);
  })
  //interval = setInterval(() => getApiAndEmit(socket), 100);

  socket.on("buy stock", (ticker) => {
      console.log("getting stock price in backend for" + ticker);
      getStockPriceAndEmitForBuyOperation(socket, ticker);
  });

  socket.on("disconnect", () => {
      clearInterval(interval);
    console.log("Client disconnected");
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));


//Here, we are just creating a function that takes in 1 parameter
//namely, the socket.
//The keyword "async" just means that the function will be returned as a Promise.
//That way, when we call getStockPrice(), we can use the await keyword inside the function
//to truly map the data tha we get back to res.
//without await, res wont wait for getStockPrice to return its value.
const getStockPriceAndEmit = async (socket, ticker) => {
    try {
      const res = await getStockPrice(ticker); // Getting the data from DarkSky
      console.log(res);
      socket.emit("stock price", res); // Emitting a new message to the client

    } catch (error) {
      console.error(`Error: ${error.code}`);
    }
  };


  const getStockPriceAndEmitForBuyOperation = async (socket, ticker) => {
    try {
      const res = await getStockPrice(ticker); // Getting the data from DarkSky
      console.log(res);
      socket.emit("recieve stock price", res); // Emitting a new message to the client

    } catch (error) {
      console.error(`Error: ${error.code}`);
    }
  };



function getStockPrice(ticker){
    return fetch(`https://api.iextrading.com/1.0/stock/${ticker}/price`)
        .then((response) => {
            return response.json()
        })
        .then((data) => {
            return data;
        })
}