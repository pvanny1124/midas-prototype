import React, { Component } from 'react';
import './App.css';

 //mount scoket io on top of http server
var fetch = require('isomorphic-fetch');
var io = require('socket.io-client');

const socket = io();

//StockPrice renders the stockprice
class StockPrice extends Component {

  render() {
    return (
      <li>{this.props.stockPrice}</li>
    );
  }
}


class App extends Component {
  constructor(props){
      super(props);
      this.state = {
        response: false,
        endpoint: "http://127.0.0.1:3000",
        value: ""
      }
  }

  //This runs automatically when the App component is mounted
  //componentDidMount just sets up our connection to socketio again through our socket
  //And we set the response in state to the new data that was emitted from the server


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
    socket.on("stock price", data => this.setState({ response: data }));
  }

  // mountSocket() {
  //   const { endpoint } = this.state;
  //   const socket = io(endpoint);
  //   socket.on("stock price", data => this.setState({ response: data }));
  // }

  render() {
  
    //Using a little trick called object destructuring (es7 feauture), we can
    //directly store the response value in a response variable.
    //This is what we'll pass in the <StockPrice> component

    var { response } = this.state;
    console.log("Value before rendering" + response);

    return (
      <div className="App">
        <p>Get Realtime Stock Price:</p>
          <form onSubmit={(event) => this.handleSubmit(event)}>
            <input type="text"  placeholder="msft" onChange={(event) => this.handleChange(event)}/>
            <input type="submit" value="Submit" />
          </form>
          {response ? <StockPrice stockPrice={response} /> : <span>No information available yet</span> }
      </div>
    );
  }
}

export default App;
