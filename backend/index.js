const express = require('express');
const config = require('./config');
const database = require('./database');
const router = require('./router');
const cors = require('cors');
const cookie = require('cookie-parser');

const app = express();
app.use(express.static('public'));
app.use(cors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200', 'http://192.168.1.141:4200'],
    credentials: true,
}));
app.use(express.json());
app.use(cookie());
app.use('/api', router);
app.use(function (err, req, res, next) {
    function getErrorData(err) {
        if (typeof err === 'string') {
            return [err];
        } else if (Array.isArray(err)) {
            return err;
        }
        console.log(err);
        return Object.values(err.errors).map(e => e.message); // mongoose error
    }

    const errorData = getErrorData(err);
    res.status(400);
    res.send({
        errors: errorData
    });
});

database().then(() => {
    app.listen(config.port, () => console.log(`Server listening on port ${config.port}`));
}).catch(() => {
    console.error('No database server');
});
