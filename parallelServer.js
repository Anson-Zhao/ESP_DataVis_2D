// const Influx = require('influx');
const express = require('express');
const app = express();
const nodemailer = require('nodemailer');
app.engine('ejs', require("ejs").renderFile);
app.set('view engine', 'ejs');
var exec = require('child_process').exec;

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        // user: 'yge5095@gmail.com',
        // pass: '1syyRFLATs%'
        user: 'aaaa.zhao@g.northernacademy.org',
        pass: 'qwer1234'
    }
});

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

    const mailOptions = {
        to: email,
        subject: 'Someone restart the live server manually through the refresh button on historical page.',
        html: "The server has been restarted on<b>"+new Date()+"</b>"
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            //http://localhost:3005/newEjs?stationID=3333&dateTime=8888
            console.log('Email sent: ' + info.response);
        }
    });

    res.send('yeah');
});

app.listen('3909');
