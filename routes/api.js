/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var fetch = require('node-fetch');
var mongoose = require('mongoose');


const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

mongoose.connect(CONNECTION_STRING, {useNewUrlParser: true, useUnifiedTopology: true}, (err, db) => {
  if(!err) console.log('db connected')
})

var Ip = require('../Ip');

async function getStocks(stock, like, ip, res) {
  let stockPrices = {};
  console.log('type: ', typeof stock)
  fetch(`https://repeated-alpaca.glitch.me/v1/stock/${stock[0]}/quote`)
     .then(res => res.json())
     .then(data => {
       stockPrices[stock[0]] = {stock: data.symbol, price: data.latestPrice}
       fetch(`https://repeated-alpaca.glitch.me/v1/stock/${stock[1]}/quote`)
       .then(res => res.json())
       .then(data => {
         stockPrices[stock[1]] = {stock: data.symbol, price: data.latestPrice}
         
         function pushStock() {
          if(like) {
           // console.log('lijke: ', like)
           let stkArr = []
           stock.forEach(x => {
             stkArr.push({stock_name: x, like: 1});
           })
           return stkArr
          } else return [];
         }
         
          
        // console.log('ip inside: ', ip);
        let ipU;
        Ip.findOne({ip_address: ip}, (err, ipUser) => {
         if(!ipUser) {
           // console.log('user not in db so creating');
           var newIp = new Ip({
             ip_address: ip,
             stocks: pushStock(),
           });

           newIp.save((err, data) => {
             if(err) throw err;
             checkDb(newIp);
           });

         } else {
           checkDb(ipUser);
         }
        // console.log('done creating user');
         function checkDb(ipAddr) {
           let stockData = [];
           let stockLikes = {};
            // console.log('stock =>', stock)
            stock.forEach(x => {
              // console.log('x => ', x)
              let target = ipAddr.stocks.find(st => st.stock_name === x)
              // console.log('target: ', target);
              if(target) {
                // console.log('target in');
              } else {
                // console.log('they are not in')
                if(like) {
                  ipUser.stocks.push({stock_name: x, like: 1})
                  ipUser.save((err, data) => {
                    if(err) throw err;
                  });
                }

                // console.log('stock: ', stockPrices[x]);
             }
              // console.log('done with the like thing')
              try {
                stockLikes[x] = ipUser.stocks.find(st => st.stock_name === x).like
              }catch(err) {
                stockLikes[x] = 0
                // console.log('stock has no likes')
              }

              stockData.push(stockPrices[x]);
            });
            // console.log('stockLikes: ', stockLikes);
            // console.log('stockPrices: ', stockPrices);
            if(stock.length > 1) {
              stockData[0].rel_likes = stockLikes[stock[0]] - stockLikes[stock[1]];
              stockData[1].rel_likes = stockLikes[stock[1]] - stockLikes[stock[0]];

            } else{
              stockData[0].likes = stockLikes[stock[0]];
              stockData = stockData[0];
            }
            res.json({stockData});
            // console.log('stockdata-end: ', stockData)
         }
         
     })
         
   });
 });
}

module.exports = function (app) {

  
  app.route('/api/stock-prices')
    .get(function (req, res){
      console.log('>>>>>>>>>>>>>>>*Incoming request*<<<<<<<<<<<<<<<')
      let stock = req.query.stock;
      console.log(stock.forEach);
      // let lowCStock = stock.map(st => st.toLowerCase());
      let like = req.query.like
      console.log('like: ', like);
      console.log('query: ', req.query);
      console.log('stocks: ', stock)
      var ip = req.headers['x-forwarded-for'].split(',')[0];
      // console.log('ip: ', ip);
      getStocks(Array.isArray(stock) ? stock : [stock], like, ip, res);


    });
  
  app.get('/all', (req, res) => {
    Ip.find({}, (err, docs) => {
      res.send(docs);
    })
  })
  
  app.get('/clear', (req, res) => {
    Ip.remove({}, (err, docs) => {
      res.send('done')
    })
  })
};
