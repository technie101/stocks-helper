var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var PythonShell = require('python-shell');
var mysql      = require('mysql');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();
var router = express.Router();              // get an instance of the express Router
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


router.get('/getStockPricePy', function(req, res, next) {
	
	var scrip = req.query.scrip;
	var row = req.query.row;
	
	var pyshell = new PythonShell('nse.py');
	
	console.log("Sending request to nse...");
	
	pyshell.send(JSON.stringify([scrip]));

	pyshell.on('message', function (message) {
		// received a message sent from the Python script (a simple "print" statement)
		var returnData = {};
		
		returnData.row=row;
		returnData.scrip = scrip;
		returnData.data=message;
		
		res.send(returnData);
	});

	// end the input stream and allow the process to exit
	pyshell.end(function (err) {
		if (err){
			throw err;
		};
		console.log('finished');
	});
	
	//res.send(scripResponse);
});

router.get('/getStockPrice', function(req, res, next) {
	
	var scrip = req.query.scrip;
	var id = req.query.id;
	
	request({
		url: "https://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/ajaxGetQuoteJSON.jsp?series=EQ&symbol="+scrip,
		method: "GET",
		json:true,
		headers: {
			'Accept' : '*/*',
			'Accept-Language' : 'en-US,en;q=0.5',
			'Host': 'nseindia.com',
			'Referer': "https://www.nseindia.com/live_market/dynaContent/live_watch/get_quote/GetQuote.jsp?symbol=INFY&illiquid=0&smeFlag=0&itpFlag=0",
			'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:28.0) Gecko/20100101 Firefox/28.0',
			'X-Requested-With': 'XMLHttpRequest'
      }
	}, function (error, response, body) {
		var returnData = {};
		if(response && response.statusCode == 200){
			returnData.id=id;
			returnData.scrip = scrip;
			if(body && body.data && body.data.length>0){
				returnData.data=body.data[0];	
			}
			res.send(returnData);
	  }else{
			console.log("Error in getting stock details :: "+response);
			returnData.error=true;
			res.send(returnData);
	  }
	  
	});
	
	
	//res.send(scripResponse);
});

router.get('/index', function(req, res, next) {
	res.render("showAll");
});

router.get('/getMyStocks/active', function(req, res, next) {
	var connection = mysql.createConnection({
	  host     : 'localhost',
	  user     : 'root',
	  password : 'admin',
	  database : 'mystocks'
	});

	connection.connect();

	connection.query('SELECT * from mystocks_holdings', function(err, rows, fields) {
	  if (!err){
		//console.log('The solution is: ', rows);
		
		
		for(i=0;i<rows.length;i++){
			rows[i].currentPrice=0.0;
			rows[i].myPriceChange = 0.0;
			rows[i].todayChange = 0.0;
			rows[i].todayChangePercent = 0.0;
			rows[i].totalCurrentValue = 0.0;
			rows[i].profitLoss = 0.0;
			rows[i].todayHighLow = "";
		}
		res.send(rows);
	  }else{
		console.log('Error while performing Query.');
	  }
	});

	connection.end();
	
});

router.get('/getMyStocks/passive', function(req, res, next) {
	var connection = mysql.createConnection({
	  host     : 'localhost',
	  user     : 'root',
	  password : 'admin',
	  database : 'mystocks'
	});

	connection.connect();

	connection.query('SELECT * from mystocks_passive_holdings', function(err, rows, fields) {
	  if (!err){
		//console.log('The solution is: ', rows);
		
		
		for(i=0;i<rows.length;i++){
			rows[i].currentPrice=0.0;
			
			rows[i].todayChange = 0.0;
			rows[i].todayChangePercent = 0.0;
			rows[i].totalCurrentValue = 0.0;
			rows[i].todayHighLow = "";
		}
		res.send(rows);
	  }else{
		console.log('Error while performing Query.');
	  }
	});

	connection.end();
	
});

router.get('/getTipOffs', function(req, res, next) {
	var connection = mysql.createConnection({
	  host     : 'localhost',
	  user     : 'root',
	  password : 'admin',
	  database : 'mystocks'
	});

	connection.connect();

	connection.query('SELECT * from mystocks_recommendations', function(err, rows, fields) {
	  if (!err){
		//console.log('The solution is: ', rows);
		
		
		for(i=0;i<rows.length;i++){
			rows[i].currentPrice=0.0;
			
			rows[i].priceChange = 0.0;
			rows[i].todayChange = 0.0;
			rows[i].todayChangePercent = 0.0;
			rows[i].todayHighLow = "";
		}
		res.send(rows);
	  }else{
		console.log('Error while performing Query.');
	  }
	});

	connection.end();
	
});


router.get('/getSales', function(req, res, next) {
	var connection = mysql.createConnection({
	  host     : 'localhost',
	  user     : 'root',
	  password : 'admin',
	  database : 'mystocks'
	});

	connection.connect();

	connection.query('SELECT * from mystocks_sales', function(err, rows, fields) {
	  if (!err){
			res.send(rows);
	  }else{
			console.log('Error while performing Query.');
	  }
	});

	connection.end();
	
});

app.use("/", router);
app.listen(9999);

module.exports = app;
