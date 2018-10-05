const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fetch = require('isomorphic-fetch');

const port = 3000;
const app = express();

//SocketIO mounting
const server = http.createServer(app);
const io = socketIo(server); 

// END CONFIG ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

let interval;

//So that we don't spam another client with this info,
//we need to clear the setInterval timer.
//using the interval variable, we can set this to the setInterval function
//and since its global, if its still running upon a new connection,
//then we use clearInterval and pass in interval to stop the timer.
//clearInterval is a pre-defined function from js.

io.on("connection", socket => {
  console.log("New client connected");

  if (interval) {
    clearInterval(interval);
  }

  interval = setInterval(() => getApiAndEmit(socket), 100);

  socket.on("disconnect", () => {
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
const getApiAndEmit = async socket => {
    try {
      const res = await getStockPrice('aapl'); // Getting the data from DarkSky
      console.log(res);
      socket.emit("FromAPI", res); // Emitting a new message to the client

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