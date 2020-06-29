const Influx = require('influx');
const express = require('express');
const app = express();
const nodemailer = require('nodemailer');
// let jsonexport = require('jsonexport');
// let path = require('path');
// const csv = require('csv-parser');
// let fs = require('fs');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        // user: 'yge5095@gmail.com',
        // pass: '1syyRFLATs%'
        user: 'aaaa.zhao@g.northernacademy.org',
        pass: 'qwer1234'
    }
});

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
    res.setHeader("Access-Control-Allow-Origin", "*");
    // console.log(req);
    con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM esp2.stationdata Where Status = 'Active'",function (err, result) {
        if (err) throw err;
        // console.log(result);
        res.send(result);
    });
});

app.get ('/stationsForN', function (req, res){ //stations information used for new event page
    res.setHeader("Access-Control-Allow-Origin", "*");
    var stationId = req.query.stationID;
    console.log(req);
    con.query("SELECT State FROM esp2.stationdata Where StationId ='"+stationId+ "';",function (err, result1) {
        if (err){
            throw err;
        }else{
            con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM esp2.stationdata Where Status = 'Active' AND State = '"+result1[0].State+"';",function (err, result) {
                if (err) throw err;
                // console.log(result);
                res.send(result);
            });
        }
        // console.log(result1[0].State);
        // res.send(result);
    });
    // console.log(req);
});



var EQstations;
var Flag=[];
var Pair=[];
con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.StationData Where StationDescription = 'Earthquake'",function (err, result) {
    //   RowDataPacket {
    //     StationName: 'ESP02',
    //     City: 'Soquel',
    //     State: 'California',
    //     StationId: 'station_two',
    //     Longitude: '-121.947898',
    //     Latitude: '37.024433'
    //   },...]
    // console.log(result[0].StationId);
    console.log(result);
    EQstations=result;

    for(var i=0;i<result.length;i++) {
        Flag.push([result[i].StationName]);
        Pair.push([result[i].StationName]);
        if(i===result.length-1){
            console.log("EventC");
            EventCheck(result);
        }
    }

    // res.send(result);
});


var c=0;
var minute="6m";
async function EventCheck(stations){
    // console.log("all begin");
    //check each station's data one by one
    for(var i=1;i<2;i++){
        // console.log(Date());
        var querystatement='SELECT * FROM ' + stations[i].StationId + 'avg WHERE time >= now()-' +minute+ ' AND time<= now()';
        var test='SELECT * FROM ' + stations[i].StationId + 'avg WHERE time >='+ ' \'2019-12-31T00:00:10Z\''+ ' AND '+'time<= \'2020-01-03T00:00:50Z\'';
        console.log(test);
        console.log(querystatement);
        await influx.query(test).then
        (result => {
            console.log('this is result');
            console.log(result.length);
            // console.log(result);
            // console.log(result[0].X);
            // console.log(result[0].Y);
            // console.log(result[0].Z);
            console.log(i+querystatement);
            console.log(result[0].time._nanoISO);
            // console.log(result);
            //check the Flag here
            // for (var a = 0; a < result.length; a++) {
            //     // DifA = result[a + 1].X - result[a].X;
            //     DifB = result[a+1].X - result[a].X;
            //     console.log("this is difference");
            //     console.log(DifB);
            //     if (Math.abs(DifB) > 9) {
            //         Flag[i].push({
            //             stationInfo: stations[i],
            //             time: result[a].time._nanoISO,
            //             X: result[a].X,
            //             Y: result[a].Y,
            //             Z: result[a].Z,
            //             Diff: DifB
            //         });
            //         // DifA = null;
            //         DifB = null;
            //     } else {
            //         // DifA = null;
            //         DifB = null;
            //     }
            //     if (a === result.length - 1) {
            //         console.log("flag done at"+Date());
            //         // pair()
            //     }
            // }

            // function pair() {
            //     console.log("Pair begin at"+Date());
            //     for (var b = 1; b < Flag[i].length; b++) {
            //         // Flag[b].stationInfo===Flag[b+1].stationInfo&&
            //
            //         if (Date.parse(Flag[i][b + 1].time) - Date.parse(Flag[i][b].time) < 11000000 && Flag[i][b].Diff * Flag[i][b + 1].Diff < 0) {
            //             Pair[i].push([Flag[i][b], Flag[i][b + 1]]);
            //             Flag[i].splice(b,2)
            //             //so the format will look like [ [stationname, [{},{}],...],...]
            //             //when finish compair, it will be deleted.
            //         } else {
            //             Flag[i].splice(b,1);
            //             b++;
            //         }
            //         if (b === Flag[i].length - 1) {
            //             console.log("pair done at"+Date())
            //         }
            //     }
            // }
        }).catch(err => {
            console.log("Errors: ");
            console.log(err)
        });
        console.log("Flag length:"+Flag[i].length);
        console.log(Pair);
        console.log("Pair Length:"+Pair[i].length);
        console.log(Date()+"one station end");
        // if (i === stations.length - 1) {
        //     console.log("Match begin at"+Date());
        //     // match();
        // }
    }
    console.log("All stations end");
    // console.log(Flag);
    console.log(Date());



    // function match(){
    //     //check every station
    //     for(var v=0; v<Pair.length; v++){
    //         //check every pair in one station
    //         for(var t=1; t<Pair[v].length; t++){
    //             //compare with every other stations
    //             for(var z=v+1; z<Pair.length; z++){
    //                 //compare with every pair in other stations
    //                 for(var y=0; y<Pair[z].length; y++){
    //                     if(Date.parse(Pair[v][t][1].time)>Date.parse(Pair[z][y][1].time)
    //                         &&Date.parse(Pair[v][t][1].time)<Date.parse(Pair[z][y][2].time)){
    //                         alarm(Pair[v][t][1].time,Pair[v][t][1].stationInfo.stationId);
    //                         alarm(Pair[z][y][1].time,Pair[z][y][1].stationInfo.stationId)
    //                    }
    //                 }
    //             }
    //         }
    //     console.log("one station")
    //     }
    //     console.log("match finished")
    // }

    // setInterval(function () {
    //     EventCheck(EQstations)}, 300000);
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





// Alarm("2020-04-01T16:00:00.000Z","station_two");
function alarm(time,stationId) {
    // var time = "2020-04-01T16:00:00.000Z",
    //     stationId = "station_two";

    const mailOptions = {
        from: 'yge5095@gmail.com',
        to: 'lin.feng@g.northernacademy.org',
        subject: 'ESP Station Data',
        html:"<p><a href=\"http://localhost:3005/newEjs?time="+ time + "&stationId="+stationId+"\">click the text to view the data</a></p>"
    };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            //http://localhost:3005/newEjs?stationID=3333&dateTime=8888
            console.log('Email sent: ' + info.response);
        }
    });
}



app.get('/newEjs',function (req,res) {
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
    res.render('new.ejs',req.query)
});

app.get('/newWind', function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    let queryHa = 'SELECT * FROM ' + req.query.stationIs + 'avg WHERE time >= ' + "'" + req.query.timeFrom + "'" + ' AND time<= ' + "'" + req.query.timeTo + "'";
    influx.query(queryHa).then
    (result => {
        res.send(result);
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
    res.setHeader("Access-Control-Allow-Origin", "*");
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
    res.setHeader("Access-Control-Allow-Origin", "*");
    pastTime = req.query.chartDuration;
    let query = 'SELECT * FROM ' + req.query.stationID + 'avg WHERE time >= now() - ' + pastTime + ' AND time<=now() - '+ nowTime;
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

app.listen('3005');