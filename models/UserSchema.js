var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    firstName: String,
    lastName: String,
    email: { type: String, unique: true, required: true },
    portfolio: [mongoose.Schema.Types.Mixed],
    cash: Number,

});

module.exports = mongoose.model("User", UserSchema);

// var userObj = {
//     watchlist: [], //what stocks is the user interested in
//     portfolio: [{}], //object of stocks the user owns that carries information (detailed below)
//     cash: 10000,   //$10,000 to start with 
//     portfolioValue: 10000, //total value of all stocks + cash not invested
//     username: "",
//     email: "",
//     friends: ["john@doe.com", "mary@jane.com"], 
//     userId: 0,
//     age: 23,
//     country: "USA",
//     jobTitle: "student", //or software engineer wink wink.
//     investingType: "trader", //or investor 
//     hasMidasTouch: false, //do you have a bigger portfolio value than your friends?
//     transactionHistory: [] //history of buy/sell orders
//     //etc
//   }
