const Influx = require('influx');
const express = require('express');
const app = express();
const nodemailer = require('nodemailer');
// const ib = require(ib*);
// let jsonexport = require('jsonexport');
// let path = require('path');
// const csv = require('csv-parser');
// let fs = require('fs');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'youremail@gmail.com',
        pass: 'yourpassword'
    }
});

const mailOptions = {
    from: 'youremail@gmail.com',
    to: 'myfriend@yahoo.com',
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
};

const influx = new Influx.InfluxDB({
    precision: 'rfc3339',
    host: 'aworldbridgelabs.com',
    database: 'RayESP',
    username: "rayf",
    password: "RayESP8010",
    port: 8086
});

const mysql = require('mysql');
// let http = require('http');
const bodyParser = require("body-parser");

const con = mysql.createConnection({
    host: "10.11.90.16",
    user: "AppUser",
    password: "Special888%",
    port: "3306",
    Schema: "ESP2",
    Table: "StationData"
});

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

let pastTime = "3d";
let nowTime = "2m";
let pack=[];
let i=0;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());


// function convertToCSV(objArray,m) {
//     // console.log(objArray);
//     let array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
//     let str = "time," + m +"\n";
//     for (let i = 0; i < array.length; i++) {
//         let line = "";
//         for (let a = 0;a<1;a++) {
//             line += array[i]["time"];
//             line += ",";
//             line += array[i]["mean"]
//         }
//         str += line + '\r\n';
//     }
//     return str;
// }

// function converter(result){
//     let trares = result;
//     for(let i=0; i<result.length;i++){
//         trares[i].time=result[i].time._nanoISO;
//     }
//     return trares
// }

// function avg(res,len){
//     let arr = res.slice(Math.max(res.length - len, 1));
//     let sum = 0;
//     for(let i = 0; i<arr.length; i++){
//         sum = sum + arr[i].mean
//     }
//     let average = sum/len;
//     return average
// }

app.get ('/stations', function (req, res){
    // console.log(req);
    con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.StationData Where Status = 'Active'",function (err, result) {
        console.log(result[0].StationId);
        // EventCheck(result);
        res.send(result);
    });
});

function diff_minutes(dt2, dt1)
{
    var diff =(dt2.getTime() - dt1.getTime()) / 1000;
    diff /= 60;
    return Math.abs(Math.round(diff));
}

var EQstations;
con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.StationData Where StationDescription = 'Earthquake'",function (err, result) {
    // [
    //   RowDataPacket {
    //     StationName: 'ESP02',
    //     City: 'Soquel',
    //     State: 'California',
    //     StationId: 'station_two',
    //     Longitude: '-121.947898',
    //     Latitude: '37.024433'
    //   },...]
    console.log(result[0].StationId);
    console.log(result);
    EQstations=result;
    EventCheck(result);
    // res.send(result);
});
var Flag=[];
var Pair=[];
var c=0;
var minute="6m";
async function EventCheck(stations){
    console.log("all begin");
    for(var i=0;i<stations.length;i++){
        Flag.push([stations[i].StationName]);
        Pair.push([stations[i].StationName]);
        console.log(Date());
        var querystatement='SELECT * FROM ' + stations[i].StationId + 'avg WHERE time >= now()-' +minute+ ' AND time<= now()';
        console.log(querystatement);
        await influx.query(querystatement).then
        (result => {
            // console.log(result.length);
            // console.log(result[0].X);
            // console.log(result[0].Y);
            // console.log(result[0].Z);
            // console.log(result[0].time._nanoISO);
            for (var a = 0; a < result.length; a++) {
                // DifA = result[a + 1].X - result[a].X;
                DifB = result[a + 2].X - result[a + 1].X;
                // console.log(DifA,DifB);
                if (Math.abs(DifB) > 9) {
                    Flag[i].push({
                        stationInfo: stations[i],
                        time: result[a].time._nanoISO,
                        X: result[a + 2].X,
                        Y: result[a + 2].Y,
                        Z: result[a + 2].Z,
                        Diff: DifB
                    });
                    // DifA = null;
                    DifB = null;
                } else {
                    // DifA = null;
                    DifB = null;
                }
                if (a === result.length - 3) {
                    console.log("flag done at"+Date());
                    pair()
                }
            }

            function pair() {
                console.log("Pair begin at"+Date());
                for (var b = 1; b < Flag[i].length; b++) {
                    // Flag[b].stationInfo===Flag[b+1].stationInfo&&

                    if (Date.parse(Flag[b + 1].time) - Date.parse(Flag[b].time) < 10800000 && Flag[b].Diff * Flag[b + 1].Diff < 0) {
                        Pair[i].push([Flag[i][b], Flag[i][b + 1]]);
                        Flag[i].splice(b,2)
                        //so the format will look like [ [{},{}] ]
                        //when finish compair, it will be deleted.
                    } else {
                        Flag[i].splice(b,1);
                        b++;
                    }
                    if (b === Flag[i].length - 1) {
                        console.log("pair done at"+Date())
                    }
                }
            }
        }).catch(err => {
        });
        console.log("Flag length:"+Flag[i].length);
        console.log(Pair);
        console.log("Pair Length:"+Pair[i].length);
        console.log(Date()+"one station end");
    }
    console.log("All end");
    // console.log(Flag);

    console.log(Date());
    setInterval(function () {
        EventCheck(EQstations)}, 300000);
}

// testgroup=[];
// test1();
// function test1(result){
//     for(var a=0;a<result.length;a++) {
//         // DifA = result[a + 1].X - result[a].X;
//         DifB = result[a + 2].X - result[a + 1].X;
//         if (Math.abs(DifB) > 9) {
//             Flag.push({stationInfo:stations[i],time:result[a].time._nanoISO, X:result[a + 2].X, Y:result[a + 2].Y, Z:result[a + 2].Z, Diff:DifB});
//             DifA = null;
//             DifB = null;
//         } else {
//             DifA = null;
//             DifB = null;
//         }
//     }
//     for(var b=0; a<Flag.length;b++) {
//     if (Flag[b].stationInfo===Flag[b+1].stationInfo&&Date.parse(Flag[b + 1].time) - Date.parse(Flag[b].time) < 10800000&&Flag[b].Diff * Flag[b + 1].Diff < 0) {
//         Pair.push([Flag[b],Flag[b+1]])
//         //so the format will look like [ [{},{}] ]
//     } else {
//         b++;
//     }
// }
// }
// console.log(Date.parse("2020-05-31T16:42:35.000Z"));
// console.log(Date.parse("2020-05-31T16:42:35.000Z") - Date.parse("2020-05-31T16:42:37.000Z"));
// if (Date.parse(EndT) - Date.parse(BeginT) > 10800000) {
//     BeginT = EndT = null;
// }




app.get('/newWind', function (req, res) {
    let queryHa = 'SELECT * FROM ' + req.query.stationIs + 'avg WHERE time >= ' + "'" + req.query.timeFrom + "'" + ' AND time<= ' + "'" + req.query.timeTo + "'";
// console.log(queryHa);
    influx.query(queryHa).then
    (result => {
        res.send(result);
        // console.log(result)
    }).catch(err => {
        res.status(500).send(err.stack)
    });
});
// let csvData;
// function download_csv(exportFilename) {
//     if (exportFilename == null) {
//         exportFilename = timeFrom + '-' + timeTo + 'AvgESPData';
//     }
//     console.log(download);
//
//
//     csvData = new Blob([download], {type: 'text/csv;charset=utf-8;'});
//     // IE11 & Edge
//     if (navigator.msSaveBlob) {
//         navigator.msSaveBlob(csvData, exportFilename);
//     } else {
//         //In FF link must be added to DOM to be clicked
//         let link = document.createElement('a');
//         link.href = window.URL.createObjectURL(csvData);
//         link.setAttribute('download', exportFilename);
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//     }
// }

app.get('/newSnow', async function (req, res) {
    let queryH = 'SELECT * FROM ' + req.query.stationIs + ' WHERE time >= ' + "'" + req.query.timeFrom + "'" + ' AND time<= ' + "'" + req.query.timeTo + "'";
    // console.log(queryH);
    let download=[];
    await influx.query(queryH).then
    (result => {
        result.forEach(function (el, i) {
            let a = '' + el.X;
            let b = '' + el.Y;
            let c = '' + el.Z;
            let t = el.time;
            // download += t + ',' + a + ',' + b + ',' + c + '\n';
            download.push({time: t, x: a, y: b, z: c});
        })}).catch(err => {
        res.status(500).send(err.stack)
    });

    let exportFilename = req.query.stationName + "_" + req.query.timeFrom.slice(5,-11) +'-'+ req.query.timeTo.slice(5,-11) + 'Raw.csv';
    let link = './rawData/'+exportFilename;
    const csvWriter = createCsvWriter({
        path: link,
        header: [
            {id: 'time', title: 'Time'},
            {id: 'x', title: 'X'},
            {id: 'y', title: 'Y'},
            {id: 'z', title: 'Z'},
        ]
    });
    await csvWriter
        .writeRecords(download)
        .then(()=> {

            res.send(link);
        });
});

app.get('/query', function (req, res) {
    pastTime = req.query.chartDuration;
    let query = 'SELECT * FROM ' + req.query.stationID + 'avg WHERE time >= now() - ' + pastTime + ' AND time<=now() - '+ nowTime;
    influx.query(query).then
    (result => {
        res.send(result);
    }).catch(err => {
        console.log(err)
    })
});

app.get('/mail', function (req, res){
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
});

// app.get('/querys', async function (req, res) {
//     // console.log(req.query.stations);
//     // let pack = await [[req.query.stations[0],Q(req.query.stations[0])]];
//     for(i = 0; i<req.query.stations.length; i++){
//         // let result;
//         let query = 'SELECT * FROM ' + req.query.stations[i] + 'avg WHERE time >= now() - ' + pastTime + ' AND time<=now() - '+ nowTime;
//         await influx.query(query).then
//         (result => {
//             pack[i]= [req.query.stations[i],result];
//         }).catch(err => {
//             console.log(err)
//         });
//
//         if (i === req.query.stations.length - 1) {
//             res.send(pack);
//         }
//     }
// });





app.listen('3005');