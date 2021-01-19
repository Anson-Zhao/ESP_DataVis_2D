// const Influx = require('influx');
const express = require('express');
const app = express();
const nodemailer = require('nodemailer');
app.engine('ejs', require("ejs").renderFile);
app.set('view engine', 'ejs');
var exec = require('child_process').exec;

app.get('/refresh', function (req, res) {
    console.log("trying to refreshing")

    exec("systemctl restart espmock.service", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
    // res.send('yeah');
});

app.listen('3909');
