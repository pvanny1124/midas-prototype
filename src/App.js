import React, { Component } from 'react';
import './App.css';

 //mount scoket io on top of http server
var fetch = require('isomorphic-fetch');
var io = require('socket.io-client');

/********************Configure Client Socket with the Backend Socket*****************/
const URL = "http://127.0.0.1:3000";
const socket = io(URL);

//We only need to setup socket once here to keep the connection open at ALL times
//throughout each user interaction with the component and sub-components.
//If we were to write "const socket - io(<endpoint>)" before emitting, for example,
//then we are basically telling the backend to disconnect and reconnect.
//This won't work for our purposes because once we disconnect, the backend
//Stops sending the stream of information that we need.
//creating the socket only once GLOBALLY ensures that the only time the client ever disconnects
//is when he/she closes the window.

//NOTE: The data structure implemented for the user portfolio using MongoDB is inefficient,
//however, since this is only a prototype, I am not considering efficiency.
//After carefully researching the differences between MongoDB vs. PostgreSQL,
//I have came to the conclusion that both offer roughly the same performance when it 
//Comes to indexing (O(logn) time). Even if we structure the portfolio object
//to have the tickers as indexes, MongoDB still uses a B-tree to find the information
//in the database.
//MongoDB offers an ease of programming while keeping everything in JavaScript.
//However, PostgreSQL shall be the main method for ease of clarity among tables and structure.
//Sequelize.js shall be the preffered ORM to work with since it provides
//PostgreSQL support.



//StockPrice renders the stock price passed in as props.
class StockPrice extends Component {
  render() {
    return (
      <li>{"$" + this.props.stockPrice}</li>
    );
  }
}

/* ShowPortfolio is in charge of rendering the User's portfolio with realtime price updates.
   It will display the tickers the user owns, how many shares of those tickers
   the user owns, and the last price the use bought into that stock.

   The way it works is that socketIO is in charge of sending the client a stream
   of portfolio updates with newest prices. 

   How this is acheived is emitting a "portfolio update" event that will
   tell the backend to give the client a brand new portfolio with the price changes
   (details in the event handler in server.js).

   ShowPortfolio will recieve the new portfolio by handling the event: "new portfolio."
   Here, we loop through the new portfolio we receive and push an <li> element with the information
   we need such as the ticker with its current price and how many shares the user owns of 
   that ticker into "portfolioList."

   portfolioList is then stored in state and since setState re-renders the component,
   we don't have to worry about re-rendering through another component or action.

   The problem is that if we were to just have socket.emit and socket.on local to the
   render() function, each time setState is called, the component re-emits, sending 
   another request for ANOTHER stream of information. Not only that, but the socket.on
   method will keep setting the state which ends up creating ANOTHER socket.on and 
   socket.emit which constantly update the portfolio so blazing fast that it doesn't 
   give the component time to reflect any changes or get the data we want. 
   Also, it crashes the app. (takes the logic out of the if statement to see what I mean >;D)

   To avoid that issue, I implemented a "waitingForUpdate" state variable that
   will check if the component has already emitted and set an event handler.
   That way, we only emit once, and there is only one socket.on event handler
   receieving the data.

   TotalPortfolioValue is updated as we loop and we just pass that into portfolioValue 
   in state.

*/
class ShowPortfolio extends Component {
  constructor(props){
    super(props);

    this.state = {
      portfolio: {},
      portfolioList: [],
      waitingForUpdate: false,
      portfolioValue: 0,

    }
  }

  render() {
   var { portfolio, cashValue } = this.props;
   

   console.log("waiting for update?: " + this.state.waitingForUpdate);

   //Don't emit again after re-rendering
   //Don't place socket.on outside of this if statement or
   //else, after every render, a new socket.on function will be created
   //and multiply the amount of requests received.
   if(!this.state.waitingForUpdate){
     
      
      socket.emit("portfolio update", portfolio);
   
      socket.on("new portfolio", async newPortfolio => {  
              var totalPortfolioValue = 0;
              var portfolioList = [];

              //Debugging
              console.log(newPortfolio);  
              console.log(portfolioList);

              var user = await getUserPortfolio();
              var cashValue = user.cash;
              totalPortfolioValue += cashValue;

              for(let stock of newPortfolio) {
                  totalPortfolioValue += (parseInt(stock.currentPrice) * parseInt(stock.shares));
                  portfolioList.push(<li>{"Ticker: " + stock.ticker + " Shares owned: " + stock.shares + " Current Price: " + stock.currentPrice}</li>);
              }

              this.setState({waitingForUpdate: true, portfolioList: portfolioList, portfolioValue: Math.round(100*totalPortfolioValue)/100});
          
        });
      }
   

    return (
      <div>
        <div>{"Total Portfolio Value: $" + this.state.portfolioValue}</div>
        {this.state.portfolioList}
      </div>
      
    );
  }
}

//ShowCashValue displays users cash passed in as a prop
class ShowCashValue extends Component {
  render(){
    var cashValue = this.props.cashValue;
    return (
      <div>
        <span>{"Cash on account: " + "$" + Math.round(100*cashValue)/100}</span>
      </div>
    );
  }
}



//The main Simulator Component that we will use in the main project.
//Just for clarity, the state variable resoponse is just the price of a ticker,
//and value is the same as ticker. I was first working with value but i got lazy
//later on and didn't want to change it. 
//endpoint is not needed. I had it here initially because I kept on
//closes and reopening the socket connection but then I realized
//I didn't need to do that.
// Again, just a prototype.
class App extends Component {
  constructor(props){
      super(props);
      this.state = {
        response: false,
        endpoint: "http://127.0.0.1:3000",
        value: "",
        ticker: "",
        showPortfolio: false,
        buyFailed: false,
        sellFailed: false,
        user: {},
        amountOfSharesToBuy: "",
        amountOfSharesToSell: ""
      }
  }

  handleBuy(event){
      event.preventDefault();

      var { response, ticker, amountOfSharesToBuy, user, value} = this.state;
      var totalCostOfShares = response * parseInt(amountOfSharesToBuy);

      //if the input is empty, just return and do nothing
      if(value == "" || amountOfSharesToBuy == "") return;

      //if user has no shares
      if(isEmpty(user.portfolio)){

        //TODO: Calculate average price brought
        user.portfolio.push({ticker: ticker, shares: amountOfSharesToBuy, priceBought: response});
        user.cash = user.cash - totalCostOfShares;

        this.setState({user: user});
        
        updateUserPortfolio(user)
            .catch((err) => {console.log(err)});

        return;
      }

      //If the user has money to buy shares...
      if((user.cash - totalCostOfShares) > 0){

          //...Check if he/she already own the stock
          for(let stock of user.portfolio){

            if(stock.ticker == ticker) {

              stock.shares = parseInt(stock.shares) + parseInt(amountOfSharesToBuy);
              user.cash = user.cash - totalCostOfShares;
              this.setState({user: user, buyFailed: false});

              //Update the users information
              updateUserPortfolio(user)
                    .catch((err) => {console.log(err)})
              return;
            }
          }

          //If the user doesn't own any shares of the ticker...

          user.portfolio.push({ticker: ticker, shares: amountOfSharesToBuy, priceBought: response});
          user.cash = user.cash - totalCostOfShares;
        
          this.setState({user: user, buyFailed: false});

          updateUserPortfolio(user)
              .catch((err) => {console.log(err)})

      } else {

          //if none of these checks passed, the user doesnt have enough cash to buy stocks.
          this.setState({buyFailed: true});
      }
  
  }

  handleSell(event){
      event.preventDefault();
      
      var { response, ticker, amountOfSharesToSell, user, sellResponse, value } = this.state;

      if(value == "" || amountOfSharesToSell == "") return;

      getStockPrice(ticker)
        .then((price) => {
            //if the user doesnt own stocks...
            if(isEmpty(user.portfolio)){
              this.setState({sellFailed: true});
            } else {
                    //check if the user has the stock, and has more than or equal to x amount of shares to sell
                   for(let stock of user.portfolio){
                          if(stock.ticker == ticker){
                              if(stock.shares >= parseInt(amountOfSharesToSell)){

                                  //remove x amount of shares from ticker object in portfolio
                                  stock.shares = parseInt(stock.shares) - parseInt(amountOfSharesToSell);

                           
                                  //add price x amount of shares to cash    
                                  user.cash = user.cash + (parseInt(amountOfSharesToSell) * parseInt(price));

                                  //Update user Portfolio on backend and on client
                                  updateUserPortfolio(user)
                                      .catch((err) => {console.log(err)});
                                  this.setState({user: user, sellFailed: false});
                                  break;

                              } else {
                                //if not enough shares,
                                this.setState({sellFailed: true});
                              }
                          }
                    }
             
        }

        });
        
           
  }

  handleBuyChange(event){
      //need to do this to access event.target.value through handleBuy/handleSell
      this.setState({amountOfSharesToBuy: event.target.value});
  }

  handleSellChange(event){
    this.setState({amountOfSharesToSell: event.target.value});
  }

  handleShowPortfolio(event){
    event.preventDefault();
    this.setState({showPortfolio: true});
  }

  handleChange(event){
      var newValue = event.target.value.toLowerCase();
    
      if(newValue == "") {
        this.setState({value: newValue, response: false})
      } else {
        this.setState({value: newValue});
      }
  }

  handleSubmit(event) {
    event.preventDefault(); //prevent the form from opening another window

    //if value in input is empty...
    if(this.state.value == "") this.setState({value: "", response: false});

    //get instant quote and update state
    socket.emit('get quote', this.state.value); //works
    socket.on("stock price", data => this.setState({ ticker: this.state.value, response: data }));
  }

  //Store dummy user once the component first renders using the built in componentWillMount() react function.
  componentWillMount(){
        fetch("/api/user")
                .then((response) => {
                    return response.json();
                })
                .then((user) => {
                    this.setState({user: user});
                })
                .catch((err) => {
                  console.log(err);
                });
  }

  render() {
  
    //following is an example of es7 object destructuring. Easy to set variables
    //to keys that have the same names!
    var { response, showPortfolio, buyFailed, sellFailed, user } = this.state;

    //Debugging
    console.log("portfolio response " + showPortfolio);
    console.log("Value before rendering" + response);
    console.log(this.state.showPortfolio);

    return (
      <div className="App">
        <p>Midas Stock Trading Simulator Prototype</p>

          {/*main ticker input*/}
          <form onSubmit={(event) => this.handleSubmit(event)}>
            <input type="text"  placeholder="msft" onChange={(event) => this.handleChange(event)}/>
            <input type="submit" value="Submit" />
          </form>

          {/*Return StockPrice if we get a response back from the server*/}
           {response ? <StockPrice stockPrice={response} /> : <span>No information available yet</span> }

          {/*Buy button*/}
          <form onSubmit={(event) => this.handleBuy(event)}>
            <label for="buy">Buy</label>
            <input type="text" placeholder="x amount of shares" onChange={(event) => this.handleBuyChange(event)}/>
            <input type="submit" value="Submit" />
          </form>

          {buyFailed ? <div><span>Buy unsuccessful. Not enough cash.</span></div> : <span></span>}

          {/*Sell button*/}
          <form onSubmit={(event) => this.handleSell(event)}>
             <label for="buy">Sell</label>
             <input type="text" placeholder="x amount of shares" onChange={(event) => this.handleSellChange(event)}/>
             <input type="submit" value="Submit" />
          </form>


          {sellFailed ? <div><span>Sell unsuccessful. Not enough shares to sell</span></div> : <span></span>}

          {/*Button to show users portfolio*/}
          <form onSubmit={(event) => this.handleShowPortfolio(event)}>
            <input type="submit" value="Show Portfolio" />
          </form>


          {showPortfolio ? <ShowCashValue cashValue={user.cash} /> : <span>Click button above to see portfolio value</span>}
          {showPortfolio ? <ShowPortfolio cashValue={user.cash} portfolio={user.portfolio}/> : <span>Click button above to show portfolio</span>}

      </div>
    );
  }

}


//Helper functions 
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

async function updateUserPortfolio(user) {
     return fetch("http://localhost:3000/api/user/" + user._id, {
        method: "put",
        headers: new Headers({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({_id: user._id, portfolio: user.portfolio, cash: user.cash})
      })
}


function getStockPrice(ticker){
  return fetch(`https://api.iextrading.com/1.0/stock/${ticker}/price`)
      .then((response) => {
          return response.json()
      })
      .then((data) => {
          return data;
      })
}

function getUserPortfolio(){
  return fetch("/api/user")
            .then((response) => {
              return response.json();
            })
            .then((user) => {
              return user;
            })
}


export default App;
