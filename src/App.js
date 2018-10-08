import React, { Component } from 'react';
import './App.css';

 //mount scoket io on top of http server
var fetch = require('isomorphic-fetch');
var io = require('socket.io-client');


const socket = io();

// class User {
//   constructor(name, age, username, jobTitle, country){
//     this.username = username;
//     this.name = name;
//     this.watchlist = [];
//     this.cash = 10000;
//     this.portfolio = [];
//     this.portfolioValue = 10000;
//     this.country = "";
//     this.transactionHistory = [{}];
//     this.jobTitle = jobTitle;
//     this.userId = 0;
//     this.country = country;
//     this.friends = [{}];
//   }
// }



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

class ShowCashValue extends Component {
  render(){
    var cashValue = this.props.cashValue;
    return (
      <div>
        <span>{cashValue}</span>
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
        showPortfolio: false,
        buyFailed: false,
        user: {}
      }
  }

  //This runs automatically when the App component is mounted
  //componentDidMount just sets up our connection to socketio again through our socket
  //And we set the response in state to the new data that was emitted from the server

  handleBuy(event){
      event.preventDefault();

      var { response, ticker, amountOfShares, user } = this.state;
      const { endpoint } = this.state;
      const socket = io(endpoint);

      var totalCostOfShares = response * amountOfShares;

      //if user has no shares
      if(isEmpty(user.portfolio)){

        //TODO: Calculate average price brought
        user.portfolio.push({ticker: ticker, shares: amountOfShares, priceBought: response});
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

              stock.shares = parseInt(stock.shares) + parseInt(amountOfShares);
              user.cash = user.cash - totalCostOfShares;
              this.setState({user: user, buyFailed: false});

              //Update the users information
              updateUserPortfolio(user)
                    .catch((err) => {console.log(err)})
              return;
            }
          }

          //If the user doesn't own any shares of the ticker...

          user.portfolio.push({ticker: ticker, shares: amountOfShares, priceBought: response});
          user.cash = user.cash - totalCostOfShares;
        
          this.setState({user: user, buyFailed: false});

          updateUserPortfolio(user)
              .catch((err) => {console.log(err)})
      } else {
          this.setState({buyFailed: true});
      }
  
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

  componentWillMount(){
        fetch("/api/user")
                .then((response) => {
                    console.log(response)
                    return response.json();
                })
                .then((user) => {
                    this.setState({user: user});
                    console.log(user);
                })
                .catch((err) => {
                  console.log(err);
                });
  }

  render() {
  
    //Using a little trick called object destructuring (es7 feauture), we can
    //directly store the response value in a response variable.
    //This is what we'll pass in the <StockPrice> component

    var { response, showPortfolio, buyFailed, user } = this.state;
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

          {buyFailed ? <div><span>Buy unsuccessful. Not enough cash.</span></div> : <span></span>}
          <button onClick={() => this.handleSell}> Sell </button>

          <form onSubmit={(event) => this.handleShowPortfolio(event)}>
            <input type="submit" value="Show Portfolio" />
          </form>

          {showPortfolio ? <ShowPortfolio portfolio={user.portfolio}/> : <span>Click button above to show portfolio</span>}
          {showPortfolio ? <ShowCashValue cashValue={user.cash} /> : <span>Click button above to see portfolio value</span>}
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

export default App;
