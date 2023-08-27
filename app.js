import express from 'express'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import indexRouter from './routes/index.js'
import usersRouter from './routes/users.js'

var app = express();

// view engine setup
app.set('views', './views');
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('./public'));

app.use('/', indexRouter);
app.use('/users', usersRouter);




app.listen(6969, () => console.log('Listening'))


export default app
