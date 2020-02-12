const Influx = require('influx');
const express = require('express');
const app = express();
var jsonexport = require('jsonexport');
var path = require('path');
const csv = require('csv-parser');
var fs = require('fs');


const influx = new Influx.InfluxDB({
    host: 'aworldbridgelabs.com',
    database: 'RayESP',
    username: "rayf",
    password: "RayESP8010",
    port: 8086
});

var mysql = require('mysql');
var http = require('http');
var bodyParser = require("body-parser");

var con = mysql.createConnection({
    host: "10.11.90.16",
    user: "AppUser",
    password: "Special888%",
    port: "3306",
    Schema: "ESP2",
    Table: "StationData"
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());


function convertToCSV(objArray,m) {
    // console.log(objArray);
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = "time," + m +"\n";
    for (var i = 0; i < array.length; i++) {
        var line = "";
        for (var a = 0;a<1;a++) {
            line += array[i]["time"];
            line += ",";
            line += array[i]["mean"]
        }
        str += line + '\r\n';
    }
    return str;
}

function converter(result){
    var trares = result;
    for(var i=0; i<result.length;i++){
        trares[i].time=result[i].time._nanoISO;
    }
    return trares
}

function avg(res,len){
    var arr = res.slice(Math.max(res.length - len, 1));
    var sum = 0;
    for(var i = 0; i<arr.length; i++){
        sum = sum + arr[i].mean
    }
    var average = sum/len;
    return average
}

var pastTime = "4m";
var nowTime = "2m";

app.get('/newWind', function (req, res) {
    var queryHa = 'SELECT * FROM ' + req.query.stationIs + 'avg WHERE time >= ' + "'" + req.query.timeFrom + "'" + ' AND time<= ' + "'" + req.query.timeTo + "'";
// console.log(queryHa);
    influx.query(queryHa).then
    (result => {
        res.send(result);
        // console.log(result)
    }).catch(err => {
        res.status(500).send(err.stack)
    });
});
var csvData;
function download_csv(exportFilename) {
    if (exportFilename == null) {
        exportFilename = timeFrom + '-' + timeTo + 'AvgESPData';
    }
    console.log(download);


    csvData = new Blob([download], {type: 'text/csv;charset=utf-8;'});
    // IE11 & Edge
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(csvData, exportFilename);
    } else {
        //In FF link must be added to DOM to be clicked
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(csvData);
        link.setAttribute('download', exportFilename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

app.get('/newSnow', async function (req, res) {
    var queryH = 'SELECT * FROM ' + req.query.stationIs + ' WHERE time >= ' + "'" + req.query.timeFrom + "'" + ' AND time<= ' + "'" + req.query.timeTo + "'";
    console.log(queryH);
    var download=[];
    await influx.query(queryH).then
    (result => {
        console.log("run raw data request");
        // console.log(timeFrom+timeTo);



        result.forEach(function (el, i) {
            // var time = new Date(el.time);
            // console.log(el.time);
            // console.log(el.time._nanoISO);
            // console.log(el._nanoISO);
            var a = '' + el.X;
            var b = '' + el.Y;
            var c = '' + el.Z;
            var t = el.time;
            // download += t + ',' + a + ',' + b + ',' + c + '\n';
            download.push({time: t, x: a, y: b, z: c});
        });



        // console.log(result)
    }) .catch(err => {
        // res.status(500).send(err.stack)
    });

    var exportFilename = req.query.stationName + "_" + req.query.timeFrom.slice(5,-11) +'-'+ req.query.timeTo.slice(5,-11) + 'Raw.csv';
    // download_csv(exportFilename);
    console.log(exportFilename);
    console.log("finish editing result");
    var link = 'rawData/'+exportFilename;
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const csvWriter = createCsvWriter({
        path: link,
        header: [
            {id: 'time', title: 'Time'},
            {id: 'x', title: 'X'},
            {id: 'y', title: 'Y'},
            {id: 'z', title: 'Z'},
        ]
    });
    console.log("data done");
    await csvWriter
        .writeRecords(download)
        .then(()=> {
            console.log('The CSV file was written successfully');
            console.log('link is sent?');
            console.log(link);
            res.send(link);
            console.log('link is sent');
            console.log('The CSV file was written successfully~~~~~~~~~?');
        });
});

var pack=[];
var i=0;
app.get('/querys', async function (req, res) {
    // console.log(req.query.stations);
    // var pack = await [[req.query.stations[0],Q(req.query.stations[0])]];
    for(i = 0; i<req.query.stations.length; i++){
        // var result;
        var query = 'SELECT * FROM ' + req.query.stations[i] + 'avg WHERE time >= now() - ' + pastTime + ' AND time<=now() - '+ nowTime;
        await influx.query(query).then
        (result => {
            pack[i]= [req.query.stations[i],result];
        }).catch(err => {
            console.log(err)
        });

        if (i === req.query.stations.length - 1) {
            res.send(pack);
        }
    }
});

app.get ('/stations', function (req, res){
    // console.log(req);
    con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.StationData Where Status = 'Active'",function (err, result) {
        if (err) throw err;
        console.log(result);
        res.send(result);
    });
});

app.listen('3005');