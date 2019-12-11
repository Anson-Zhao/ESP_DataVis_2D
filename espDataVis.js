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
var queryA = 'SELECT * FROM station_oneavg WHERE time >= now() - ' + pastTime + ' AND time<=now() - '+ nowTime;
var queryA2 = 'SELECT * FROM station_twoavg WHERE time >= now() - ' + pastTime + ' AND time<=now() - '+ nowTime;
var queryA3 = 'SELECT * FROM station_theavg WHERE time >= now() - ' + pastTime + ' AND time<=now() - '+ nowTime;
// console.log(queryA);
// var backup = 'SELECT MEAN("X"), MEAN("Y"), MEAN("Z") FROM station_twoavg WHERE time >= now() - ' + pastTime + ' AND time<=now() - '+ nowTime + ' GROUP BY time(1s)';
// var queryX = "SELECT MEAN(\"X\") FROM ar WHERE time>'2019-07-23T20:25:00Z' AND time<'2019-07-23T20:29:00Z' GROUP BY time(1s)";
// var queryY = "SELECT MEAN(\"Y\") FROM ar WHERE time>'2019-07-23T20:25:00Z' AND time<'2019-07-23T20:29:00Z' GROUP BY time(1s)";
// var queryZ = "SELECT MEAN(\"Z\") FROM ar WHERE time>'2019-07-23T20:25:00Z' AND time<'2019-07-23T20:29:00Z' GROUP BY time(1s)";
// var x_csv,y_csv,z_csv,gx,gy,gz;
// var life = [];
// var ex='SELECT MEAN("X"), MEAN("Y"), MEAN("Z") FROM ' + req.query.stationIs + ' WHERE time >= ' + "'" + req.query.timeFrom + "'" + ' AND time<= ' + "'" + req.query.timeTo + "'" + ' GROUP BY time(1s)';
// var ex2='SELECT "X", "Y", "Z" FROM ' + req.query.stationIs + ' WHERE time >= ' + "'" + req.query.timeFrom + "'" + ' AND time<= ' + "'" + req.query.timeTo + "'" + ' GROUP BY time(1s)';

app.get('/query', function (req, res) {

    influx.query(queryA).then
    (result=> {
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

app.get('/query3', function (req, res) {
    influx.query(queryA3).then
    (result => {
        console.log(result);
        res.send(result);
    }).catch(err => {
        console.log(err)
    });
});
app.get('/newWind', function (req, res) {
    var queryHa = 'SELECT * FROM ' + req.query.stationIs + 'avg WHERE time >= ' + "'" + req.query.timeFrom + "'" + ' AND time<= ' + "'" + req.query.timeTo + "'";
// console.log(queryHa);
    influx.query(queryHa).then
    (result => {
        res.send(result);
        console.log(result)
    }).catch(err => {
        res.status(500).send(err.stack)
    });
});
app.get('/newSnow', function (req, res) {
    var queryH = 'SELECT * FROM ' + req.query.stationIs + ' WHERE time >= ' + "'" + req.query.timeFrom + "'" + ' AND time<= ' + "'" + req.query.timeTo + "'";
// console.log(queryH);
    influx.query(queryH).then
    (result => {
        res.send(result);
        console.log(result)
    }).catch(err => {
        res.status(500).send(err.stack)
    });
});
var i=0;
app.get('/querys', function (req, res) {
    console.log("query get");
    var pack = {};
    console.log(req.query.stations.length);
    // console.log(req.query.stations.length);
    // console.log('SELECT * FROM ' + req.query.stations[0] + 'avg WHERE time >= now() - ' + pastTime + ' AND time<=now() - '+ nowTime);
    for(i=0; i<req.query.stations.length; i++){
        var query = 'SELECT * FROM ' + req.query.stations[i] + 'avg WHERE time >= now() - ' + pastTime + ' AND time<=now() - '+ nowTime;

        console.log(query);
        console.log("this is I: ");
        console.log(i);

        influx.query(query).then
        ((result, request = req) => {
            // console.log(result);
            // console.log(result);
            console.log("this is index");
            console.log(i-1);
            console.log("this is req lenth");
            console.log(request.query.stations.length);

            // console.log(result);
            console.log("this is pack");
            console.log(request.query.stations[i-1]);
            pack[request.query.stations[i-1]] = result;
            // console.log(pack[i+1]);

            // await


            console.log(pack);
            // console.log(pack[req.query.stations[i]][1]["time"])
        }).catch(err => {
            console.log(err)
        });
        // if(!!pack[req.query.stations[i]]){
        //     continue
        // }

    }
    res.json(pack);
});
app.listen('3005');