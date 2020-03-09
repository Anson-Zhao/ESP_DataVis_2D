const Influx = require('influx');
const express = require('express');
const app = express();
// let jsonexport = require('jsonexport');
// let path = require('path');
// const csv = require('csv-parser');
// let fs = require('fs');

app.listen('3005');

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

let pastTime = "4m";
let nowTime = "2m";
let pack=[];
let i=0;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false }));

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
        if (err) throw err;
        // console.log(result);
        res.send(result);
    });
});

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
    let link = 'rawData/'+exportFilename;
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

    let timeFromX = "2020-03-08T23:00:00.000Z";
    let timeToX = "2020-03-09T08:05:00.000Z";
    // let stationID = 'station_two';
    let query = 'SELECT * FROM ' + req.query.stationID + "avg WHERE time >= '" + timeFromX + "'" + " AND time<= '" + timeToX + "'";
    // let query = "SELECT * FROM 'station_two'" + " avg WHERE time >= '" + timeFromX + "'" + " AND time<= '" + timeToX + "'";
    // let query = 'SELECT * FROM ' + stationID + "avg WHERE time >= '" + timeFromX + "'" + " AND time<= '" + timeToX + "'";

    // let query = 'SELECT * FROM ' + req.query.stationID + 'avg WHERE time >= now() - ' + pastTime + ' AND time<=now() - '+ nowTime;
    console.log(query);
    influx.query(query).then
    (result => {
        res.send(result);
    }).catch(err => {
        console.log(err)
    })
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


