const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts')
const path = require('path');
const morgan = require('morgan');
const mysql = require('mysql');
const myConnection = require('express-myconnection');
const bodyParser = require('body-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const md5 = require('md5');
const router = require('express').Router();
const app = express();

// build host
app.set('port', process.env.PORT || 3000);
global.__basedir = __dirname;


// Set Templating Engine
app.use(expressLayouts)
app.set('layout', './layout/_layoutAdmin', './layout/_layoutAdminDashboard', './layout/_layoutPage', './layout/_layoutPageMember');
app.set('view engine', 'ejs'); // set view  engine 
app.set('views', path.join(__dirname, 'views')); // define path views default

// middle ware 

app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'somesecret',
    cookie: { maxAge: 60000 }
}));

app.use(function (req, res, next) {
    res.locals.user = req.session.User;
    res.locals.customer = req.session.Customer;
    next();
});

// importing routes
const adminRoutes = require('./routes/admin/admin');
const pageRoutes = require('./routes/page/page');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan('dev')); // show log
app.use(myConnection(mysql, {
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
    database: 'shopx',
    multipleStatements: true
}, 'single'));  // conenct db

passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser(async (id, done) => {
    console.log('deserializeUser')
    // const user = await User.find({ _id: id }).populate('roleId').limit(1);
    done(null, null);
})

passport.use(new GoogleStrategy(
    {
        clientID: '814652731110-e75qon3lmnnq6n89d9b78r5gc7rcdens.apps.googleusercontent.com',
        clientSecret: '1WaxTdXp_m1HCNA4f1Uxn0Xk',
        callbackURL: '/auth/google/callback'
    },
    (token, refreshToken, profile, done) => {
        if (profile.id) {

            const connection = mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: '',
                database: 'shopx'
            });

            connection.connect();

            const sqlFound = `select *
                            from users u 
                            join userroles u2 
                            on u.id = u2.userId 
                            join roles r 
                            on r.id = u2.roleId  where u.googleId = '${profile.id}'  and exists (
                            select 1 
                            from roles r 
                            join userRoles u2 
                            on r.id = u2.roleId 
                            where u.id = u2.userId and (lower(r.name) = 'customer'))
                            limit 1`;

            connection.query(sqlFound, function (error, results, fields) {
                if (error) throw error;
                if (results && results[0]) {
                    return done(null, { ...results[0] });
                }
                else {

                    var newUser = {};
                    // set all of the relevant information
                    const password = md5('123456');
                    newUser.googleId = profile.id;
                    newUser.googleToken = token;
                    newUser.fullname = profile.displayName;
                    newUser.avatar = profile.photos[0].value;
                    newUser.email = profile.emails[0].value; // pull the first email

                    const user = [newUser.email, newUser.fullname, password, newUser.email, newUser.avatar, 1, newUser.googleId, newUser.googleToken];

                    connection.query('INSERT INTO users (username,fullname,password,email,avatar, userStatus, googleId, googleToken) values ?', [[user]], (err, u) => {
                        if (error) throw error;
                        let userRoles = [u.insertId, 3];

                        connection.query('INSERT INTO userRoles (userId,roleId) values ?', [[userRoles]], (error, u) => {

                            if (error) throw error;
                            const sqlFind = `select *
                            from users u 
                            join userroles u2 
                            on u.id = u2.userId 
                            join roles r                       
                            on r.id = u2.roleId  where u.googleId = '${profile.id}'  and exists (
                                select 1 
                                from roles r 
                                join userRoles u2 
                                on r.id = u2.roleId 
                                where u.id = u2.userId and (lower(r.name) = 'customer'))
                                limit 1`;

                            connection.query(sqlFind, function (error, results, fields) {
                                if (error) throw error;
                                if (results[0]) {

                                    return done(null, { ...results[0] });
                                }
                            });
                        })
                    });
                }
            });

        }
    }

));

app.use(passport.initialize());
app.use(passport.session());

app.get(
    '/auth/google',
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })
);

let customerGoogle = null;

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/error', session: true }),
    function (req, res) {
        req.session.Customer = req.session.passport.user;
        console.log(req.session, 'session')
        res.redirect('/cua-hang');
    });

app.use('/', pageRoutes);
app.use('/admin/', adminRoutes);

// static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'resources')));

// starting the server
app.listen(app.get('port'), () => {
    console.log(`server on port ${app.get('port')}`);
});

