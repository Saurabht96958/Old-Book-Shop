const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const routePage = require('./routers/route');
const addProduct = require('./routers/addProduct')
const morgan = require('morgan');
const methodOverride = require('method-override');

const app = express();
 
 
const PORT = 5000;
app.use(methodOverride('_method'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(express.static('public')); 


//setting session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  }));
 
// Routers
app.use('/',routePage);
app.use('/',addProduct);




app.listen(PORT, console.log('Server is running at port:', PORT));