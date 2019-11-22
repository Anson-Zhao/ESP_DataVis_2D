const Influx = require('influx');
const express = require('express');
const app = express();
var jsonexport = require('jsonexport');
const influx = new Influx.InfluxDB({
    host: 'aworldbridgelabs.com',
    database: 'RayESP',
    username: "rayf",
    password: "RayESP8010",
    port: 8086
});

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
var queryA = 'SELECT MEAN("X"), MEAN("Y"), MEAN("Z") FROM station_one WHERE time >= now() - ' + pastTime + ' AND time<=now() - '+ nowTime + ' GROUP BY time(1s)';
var queryA2 = 'SELECT MEAN("X"), MEAN("Y"), MEAN("Z") FROM station_two WHERE time >= now() - ' + pastTime + ' AND time<=now() - '+ nowTime + ' GROUP BY time(1s)';
// var queryX = "SELECT MEAN(\"X\") FROM ar WHERE time>'2019-07-23T20:25:00Z' AND time<'2019-07-23T20:29:00Z' GROUP BY time(1s)";
// var queryY = "SELECT MEAN(\"Y\") FROM ar WHERE time>'2019-07-23T20:25:00Z' AND time<'2019-07-23T20:29:00Z' GROUP BY time(1s)";
// var queryZ = "SELECT MEAN(\"Z\") FROM ar WHERE time>'2019-07-23T20:25:00Z' AND time<'2019-07-23T20:29:00Z' GROUP BY time(1s)";
var x_csv,y_csv,z_csv,gx,gy,gz;
var life = [];

app.get('/query', function (req, res) {

    influx.query(queryA).then
    (result => {
        // console.log(result);

        res.send(result);

    }).catch(err => {
        console.log(err)
    });

});
app.get('/query2', function (req, res) {
    influx.query(queryA2).then
    (result => {
        // console.log(result);
        res.send(result);
    }).catch(err => {
        console.log(err)
    });
});
app.get('/newWind', function (req, res) {
    var queryH = 'SELECT MEAN("X"), MEAN("Y"), MEAN("Z") FROM ' + req.query.stationIs + ' WHERE time >= ' + "'" + req.query.timeFrom + "'" + ' AND time<= ' + "'" + req.query.timeTo + "'" + ' GROUP BY time(1s)';

    influx.query(queryH).then
    (result => {
        res.send(result);
        console.log(result)
    }).catch(err => {
        res.status(500).send(err.stack)
    });
});
app.listen('3006');