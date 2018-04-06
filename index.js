const path = require('path');

const pug = require('pug');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const basicAuth = require('express-basic-auth');
const mongoose = require('mongoose');
const morgan = require('morgan');

const LONGPOLL_TIMEOUT = 50 * 1000;

mongoose.connect(process.env.MONGODB_URI);

// const async = require('async');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// const Service = require('./src/db/service');
// const Plan = require('./src/db/plan');

// const plans = require('./scripts/plans.json');
// const services = require('./scripts/services.json');

// async.waterfall([
//     function (cb) {
//         Service.remove().exec();
//     },
//     function (cb) {
//         async.forEach(services, (service, innerCb) => {
//             (new Service({
//                 name: service
//             })).save(err => {
//                 if (err) {
//                     return innerCb(err);
//                 }

//                 innerCb();
//             });
//         }, cb);
//     },
//     function (cb) {
//         stripe.products.create({
//             name:  'WellnessRoom',
//             type: 'service',
//         }, function(err, product) {
//             if (err) {
//                 return cb(err);
//             }

//             async.forEach(plans, (plan, innerCb) => {
//                 stripe.plans.create({
//                     product: product.id,
//                     currency: 'cad',
//                     interval: 'month',
//                     nickname: plan.name + ' ' + plan.description,
//                     amount: plan.priceCanadianCents,
//                 }, function (err, stripePlan) {
//                     if (err) {
//                         return innerCb(err);
//                     }

//                     (new Plan(Object.assign({
//                         stripeId: stripePlan.id
//                     }, plan))).save(err => {
//                         if (err) {
//                             return innerCb(err);
//                         }

//                         innerCb();
//                     });
//                 });
//             }, cb);
//         });
//     }
// ], function (err) {
//     if (err) {
//         return console.error(err);
//     }

//     mongoose.disconnect();
//     console.log('Done');
// });


const express = require('express');
const app = express();

const OPTIONS_PATH = path.join(__dirname, 'conf', process.env.NODE_ENV + '.json');
const options = Object.assign({
    app: app
}, require(OPTIONS_PATH));

function ensureSecure (req, res, next) {
    if (req.get('x-forwarded-proto') === 'https'){
        return next();
    }

    const httpsUrl = `https://${req.get('host')}${req.url}`;
    res.redirect(301, httpsUrl);
}

const userRoutes = require('./src/routes/user')(options);
const searchRoutes = require('./src/routes/search')(options);
const clientRoutes = require('./src/routes/client')(options);
const serviceRoutes = require('./src/routes/service')(options);
const serviceProviderRoutes = require('./src/routes/serviceprovider')(options);
const appointmentRoutes = require('./src/routes/appointment')(options);
const slotRoutes = require('./src/routes/slot')(options);
const planRoutes = require('./src/routes/plan')(options);
const subscriptionRoutes = require('./src/routes/subscription')(options);
const orderRoutes = require('./src/routes/order')(options);

const middleware = require('./src/middleware')(options);
const common = require('./src/common');
const cookieOptions = common.cookieOptions;

//app.all('*', ensureSecure);

app.get('/robots.txt', function (req, res) {
    res.type('text/plain');
    res.send('User-agent: *\nDisallow: /\n');
});

app.use(bodyParser.json({
    limit: '10MB'
}));
app.use(cookieParser());
app.use(morgan('combined'));

app.use('/', express.static(__dirname + '/site'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));
app.use('/dist', express.static(__dirname + '/dist'));
app.use('/site/img', express.static(__dirname + '/site/img'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/views', express.static(__dirname + '/views'));
app.use('/img', express.static(__dirname + '/img'));
app.use('/assets', express.static(__dirname + '/node_modules/angular1-star-rating/dist/assets/'));

app.engine('pug', pug.__express);

app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // HTTP 1.1.
    res.setHeader('Pragma', 'no-cache'); // HTTP 1.0.
    res.setHeader('Expires', '0'); // Proxies.

    res.render('home.pug', {
        pretty: true,
        user: req.cookies.user,
        name: req.cookies.name,
        isClient: req.cookies.isClient
    });
});

app.get('/longpoll', (req, res, _next) => {
    var returned = false;

    app.on(req.query.collection, listener);

    res.writeHead(202, {
        'Content-Type': 'application/json'
    });

    var timer = setTimeout(() => {
        returnResult({});
    }, LONGPOLL_TIMEOUT);

    function listener (obj) {
        if (!returned && obj.serviceProviderId.equals(req.query.serviceprovider)) {
            clearTimeout(timer);

            var result = {};
            result[req.query.collection] = true;

            returnResult(result);
        }
    }

    function returnResult (result) {
        returned = true;
        app.removeListener(req.query.collection, listener);
        res.write(JSON.stringify(result));
        res.end();
    }
});

app.get('/config', (req, res, _next) => {
    res.json({
        stripePublicKey: options.STRIPE_PUBLIC_KEY,
        googleRecaptchaPublicKey: options.RECAPTCHA_SITE_KEY
    });
});

app.post('/signup', userRoutes.signup);
app.post('/signup-user', userRoutes.signupUser);
app.post('/login', userRoutes.login);
app.post('/social-login', userRoutes.socialLogin);
app.get('/logout', middleware.checkLoggedIn, userRoutes.logout);
app.post('/request-password-reset', userRoutes.postRequestPasswordReset);
app.post('/reset-password', userRoutes.postResetPassword);
app.get('/users', userRoutes.getUsers);
app.get('/users/:id', userRoutes.getUsersById);
app.patch('/users/:id', middleware.checkLoggedIn, userRoutes.patchUsers);
app.delete('/users/:id', middleware.checkAdmin, userRoutes.deleteUsers);

app.get('/clients', middleware.checkLoggedIn, middleware.checkClient, clientRoutes.getClients);
app.get('/clients/:id', clientRoutes.getClientsById);
app.patch('/clients/:id', middleware.checkLoggedIn, middleware.checkClient, clientRoutes.patchClients);

app.get('/services', serviceRoutes.getServices);

app.get('/serviceproviders', serviceProviderRoutes.getServiceProviders);
app.get('/serviceproviders/:id', middleware.checkLoggedIn, middleware.checkClient, serviceProviderRoutes.getServiceProvidersById);
app.post('/serviceproviders', middleware.checkLoggedIn, middleware.checkClient, serviceProviderRoutes.postServiceProviders);
app.patch('/serviceproviders/:id', middleware.checkLoggedIn, middleware.checkClient, serviceProviderRoutes.patchServiceProviders);
app.delete('/serviceproviders/:id', middleware.checkLoggedIn, middleware.checkClient, serviceProviderRoutes.deleteServiceProviders);

app.get('/appointments', appointmentRoutes.getAppointments);
app.get('/appointments/:id', appointmentRoutes.getAppointmentsById);
app.post('/appointments', appointmentRoutes.postAppointments);
app.patch('/appointments/:id', appointmentRoutes.patchAppointments);
app.get('/confirm-appointments', appointmentRoutes.confirmAppointments);
app.get('/reject-appointments', appointmentRoutes.rejectAppointments);
app.get('/cancel-appointments', appointmentRoutes.cancelAppointments);
app.get('/rate-appointments', appointmentRoutes.rateAppointments);

app.get('/slots', slotRoutes.getSlots);
app.post('/slots', middleware.checkLoggedIn, middleware.checkClient, slotRoutes.postSlots);
app.patch('/slots/:id', middleware.checkLoggedIn, middleware.checkClient, slotRoutes.patchSlots);
app.delete('/slots/:id', middleware.checkLoggedIn, middleware.checkClient, slotRoutes.deleteSlots);

app.post('/search', searchRoutes.search);
app.get('/reverse-geocode', searchRoutes.reverseGeocode);
app.get('/map-autocomplete', searchRoutes.mapAutocomplete);
app.post('/place-query', searchRoutes.placeQuery);

app.get('/plans', planRoutes.getPlans);
app.get('/plans/:id', planRoutes.getPlanById);

app.post('/subscribe', subscriptionRoutes.postSubscribe);
app.post('/unsubscribe', middleware.checkLoggedIn, middleware.checkClient, subscriptionRoutes.postUnsubscribe);

app.get('/orders', orderRoutes.getOrders);

app.get('/admin', basicAuth({
    users: {
        'admin': process.env.ADMIN_PASSWORD
    },
    challenge: true
}), (req, res) => {
    res.cookie('admin', true, cookieOptions);
    res.render('admin.pug', {
        pretty: true
    });
});

app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // HTTP 1.1.
    res.setHeader('Pragma', 'no-cache'); // HTTP 1.0.
    res.setHeader('Expires', '0'); // Proxies.

    res.render('home.pug', {
        pretty: true,
        user: req.cookies.user,
        name: req.cookies.name,
        isClient: req.cookies.isClient,
        path: req.path
    });
});

// Error handler
app.use((err, req, res, _next) => {
    console.log(err);
    res.status(500);
    res.json(err.message || err);
});

const port = process.env.PORT || 31314;
app.listen(port, () => console.log(`Listening on ${port}`));

/*
STRIPE_SECRET_KEY=sk_test_136ZaD4NFLAa1F1PedlZxZXZ NODE_ENV=development MONGODB_URI='mongodb://heroku_wcvmslfs:9kn75mi7dshf9ppj8jqp75oo54@ds219098.mlab.com:19098/heroku_wcvmslfs' MAILGUN_API_KEY='key-5b413451dfdd85f4063104dfec73733d' GOOGLE_API_KEY='AIzaSyDTh16VqimpdbLDDoc7617xE89k99hWfaY' RECAPTCHA_SECRET_KEY='6LfbMkkUAAAAAD7bSZ6IOGb_xo6VY_Gy2-oUrqY3' ADMIN_PASSWORD='Wellnessroom!1' npm start
*/
