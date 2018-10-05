import React, { Component } from 'react';
import './App.css';

 //mount scoket io on top of http server
var fetch = require('isomorphic-fetch');
var io = require('socket.io-client');

const socket = io('http://localhost');

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
        endpoint: "http://127.0.0.1:3000"
      }
  }

  //This runs automatically when the App component is mounted
  //componentDidMount just sets up our connection to socketio again through our socket
  //And we set the response in state to the new data that was emitted from the server
  componentDidMount() {
    const { endpoint } = this.state;
    const socket = io(endpoint);
    socket.on("FromAPI", data => this.setState({ response: data }));
  }

  render() {
  
    //Using a little trick called object destructuring (es7 feauture), we can
    //directly store the response value in a response variable.
    //This is what we'll pass in the <StockPrice> component
    const { response } = this.state;
    return (
      <div className="App">
        <p>Apple Realtime StockPrice:</p>
        <StockPrice stockPrice={this.state.response} />
      </div>
    );
  }
}

export default App;
