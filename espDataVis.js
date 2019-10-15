const Influx = require('influx');
const express = require('express');
const app = express();
var jsonexport = require('jsonexport');
const influx = new Influx.InfluxDB({
    host: 'aworldbridgelabs.com',
    database: 'RayESP',
    username: "rayf",
    password: "RayESP8010",
    port: 8086,
    schema: [
        {
            measurement: 'station_one',
            fields: {
            },
            tags: [
            ]
        }
    ]
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


app.get('/query', function (req, res) {

    influx.query(queryA).then
    (result => {
        console.log(result);
        res.send(result);
    }).catch(err => {
        console.log(err)
    });
});
app.listen('8008');