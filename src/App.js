import React, { Component } from 'react';
import './App.css';

 //mount scoket io on top of http server
var fetch = require('isomorphic-fetch');
var io = require('socket.io-client');


const socket = io();

var userObj = {
  watchlist: [], //what stocks is the user interested in
  portfolio: [{}], //object of stocks the user owns that carries information (detailed below)
  cash: 10000,   //$10,000 to start with 
  portfolioValue: 10000, //total value of all stocks + cash not invested
  username: "",
  email: "",
  friends: ["john@doe.com", "mary@jane.com"], 
  userId: 0,
  age: 23,
  country: "USA",
  jobTitle: "student", //or software engineer wink wink.
  investingType: "trader", //or investor 
  hasMidasTouch: false, //do you have a bigger portfolio value than your friends?
  transactionHistory: [{}] //history of buy/sell orders
  //etc
}

class User {
  constructor(name, age, username, jobTitle, country){
    this.username = username;
    this.name = name;
    this.watchlist = [];
    this.cash = 10000;
    this.portfolio = [];
    this.portfolioValue = 10000;
    this.country = "";
    this.transactionHistory = [{}];
    this.jobTitle = jobTitle;
    this.userId = 0;
    this.country = country;
    this.friends = [{}];
  }
}

//Dummy variable
var Patrick = new User("Patrick", 23, "pvanny1124", "student", "USA");
// console.log(Patrick.portfolio)


//StockPrice renders the stockprice
class StockPrice extends Component {
  render() {
    return (
      <li>{this.props.stockPrice}</li>
    );
  }
}

class ShowPortfolio extends Component {
  render() {
   var portfolio = this.props.portfolio;
   var portfolioList = [];

   portfolio.forEach((stock) => {
      portfolioList.push(<li>{"Ticker: " + stock.ticker + " Shares owned: " + stock.shares}</li>);
   });

    return (
      <div>
        {portfolioList}
      </div>
      
    );
  }
}

class App extends Component {
  constructor(props){
      super(props);
      this.state = {
        response: false,
        endpoint: "http://127.0.0.1:3000",
        value: "",
        ticker: "",
        amountOfShares: 0,
        showPortfolio: false
      }
  }

  //This runs automatically when the App component is mounted
  //componentDidMount just sets up our connection to socketio again through our socket
  //And we set the response in state to the new data that was emitted from the server

  handleBuy(event){
      event.preventDefault();

      var { response, ticker, amountOfShares } = this.state; //price
      console.log("amount of shares: " + amountOfShares);

      const { endpoint } = this.state;
      const socket = io(endpoint);
      Patrick.portfolio.push({ticker: ticker, shares: amountOfShares, priceBought: response});

      console.log("Patrick's portfolio: ")
      console.log(Patrick.portfolio);
  
      
  }

  handleBuyChange(event){
      //need to do this to access event.target.value through handleBuy
      this.setState({amountOfShares: event.target.value});
  }

  handleShowPortfolio(event){
    event.preventDefault();
    this.setState({showPortfolio: true});
  }

  handleChange(event){
      this.setState({
        value: event.target.value.toLowerCase()
      });
      console.log(event.target.value);
  }

  handleSubmit(event) {
    event.preventDefault(); //prevent the form from opening another window
    const { endpoint } = this.state;
    const socket = io(endpoint);
    socket.emit('get quote', this.state.value); //works
    socket.on("stock price", data => this.setState({ ticker: this.state.value, response: data }));
  }

  render() {
  
    //Using a little trick called object destructuring (es7 feauture), we can
    //directly store the response value in a response variable.
    //This is what we'll pass in the <StockPrice> component

    var { response, showPortfolio } = this.state;
    console.log("portfolio response " + showPortfolio);
    console.log("Value before rendering" + response);
   
    return (
      <div className="App">
        <p>Get Realtime Stock Price:</p>
          <form onSubmit={(event) => this.handleSubmit(event)}>
            <input type="text"  placeholder="msft" onChange={(event) => this.handleChange(event)}/>
            <input type="submit" value="Submit" />
          </form>

          {/*Return StockPrice if we get a response back from the server*/}
           {response ? <StockPrice stockPrice={response} /> : <span>No information available yet</span> }

          {/*Buy/Sell buttons*/}
          <form onSubmit={(event) => this.handleBuy(event)}>
            <label for="buy">Buy</label>
            <input type="text" placeholder="x amount of shares" onChange={(event) => this.handleBuyChange(event)}/>
            <input type="submit" value="Submit" />
          </form>
          
          <button onClick={() => this.handleSell}> Sell </button>

          <form onSubmit={(event) => this.handleShowPortfolio(event)}>
            <input type="submit" value="Show Portfolio" />
          </form>

          {showPortfolio ? <ShowPortfolio portfolio={Patrick.portfolio}/> : <span>Click button above to show portfolio</span>}

      </div>
    );
  }

}


export default App;
