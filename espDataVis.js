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
    con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.stationdata Where Status = 'Active'",function (err, result) {
        if (err) throw err;
        // console.log(result);
        res.send(result);
    });
});

app.get ('/stationsForN', function (req, res){ //stations information used for new event page
    res.setHeader("Access-Control-Allow-Origin", "*");
    var stationId = req.query.stationID;
    console.log("station Id")
    console.log(stationId);
    con.query("SELECT State FROM ESP2.stationdata Where StationId ='"+stationId+ "';",function (err, result1) {
        // console
        console.log("result")
        console.log(result1)
        if (err){
            throw err;
        }else{
            con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.stationdata Where Status = 'Active' AND State = '"+result1[0].State+"';",function (err, result) {
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


app.get ('/newMoon', function (req, res){ //stations information used for new event page
    // res.setHeader("Access-Control-Allow-Origin", "*");
    // var stationId = req.query.stationIs;
    var timeFrom = req.query.timeFrom;
    var timeTo = req.query.timeTo;
    var FLAG=[]
    var PAIR=[]
    console.log("These are new things")
    console.log(timeFrom,timeTo);
    moon(FLAG,PAIR)
    async function moon(Flag,Pair) {
        for(var i=0;i<EQstations.length;i++){
            Flag.push([{stationInfo: EQstations[i]}]);
            Pair.push([{stationInfo: EQstations[i]}]);
            // console.log(result[i])
            // console.log(Pair)

            var Qstring='SELECT * FROM ' + EQstations[i].StationId + 'avg WHERE time >= ' +"\'"+timeFrom+"\'"+ ' AND time<= '+"\'"+timeTo+"\'";
            console.log(Qstring)
            await influx.query(Qstring).then
            (result => {
                console.log("result")
                console.log(result.length)
                flag(result,Flag,Pair);
            }).catch(err => {
                console.log("Errors: ");
                console.log(err)
            });
            if(i===EQstations.length-1){
                // console.log(FLAG,PAIR)
                // console.log("match is called")
                match(Pair)
                // console.log("EventC");
                // EventCheck(result,Flag,Pair);
            }
        }
        async function flag(result,Flag,Pair){
            for (var a = 0; a < result.length-1; a++) {
                // DifA = result[a + 1].X - result[a].X;
                // console.log(a);
                // console.log(result.length)
                DifB = result[a+1].X - result[a].X;
                // console.log("this is difference");
                // console.log(DifB);
                if (Math.abs(DifB) > 9) {
                    Flag[i].push({
                        stationInfo: EQstations[i],
                        time: result[a].time._nanoISO,
                        X: result[a].X,
                        Y: result[a].Y,
                        Z: result[a].Z,
                        Diff: DifB
                    });
                    // DifA = null;
                    DifB = null;
                } else {
                    // DifA = null;
                    DifB = null;
                }
                // console.log(a)
                // console.log(result.length)
                if (a === result.length -2) {
                    // console.log("flag done at"+Date());
                    // console.log("Flag length:"+Flag[i].length);
                    console.log(Flag[i]);
                    await pair(Flag,Pair)
                }
            }
        }

        function pair(Flag,Pair) {
            // console.log("Pair begin at"+Date());
            // console.log(Flag)
            for (var b = 1; b < Flag[i].length-1; b++) {
                // Flag[b].stationInfo===Flag[b+1].stationInfo&&
                // console.log(Flag[i][b].time);
                // console.log(Date.parse(Flag[i][b + 1].time) - Date.parse(Flag[i][b].time));
                // console.log(Flag[i][b].Diff * Flag[i][b + 1].Diff);
                // console.log('flag length: '+Flag[i].length)
                // console.log('number of b: '+b);
                // console.log(Flag)

                if (Date.parse(Flag[i][b + 1].time) - Date.parse(Flag[i][b].time) < 11000000 && Flag[i][b].Diff * Flag[i][b + 1].Diff < 0) {
                    var array=[];
                    array.push(Flag[i][b], Flag[i][b + 1])
                    Pair[i].push(array);
                    // console.log(Flag[i][b])
                    Flag[i].splice(b,2)
                    // console.log(Flag[i][b], Flag[i][b + 1])
                    // console.log("a pair and flg length: "+Flag[i].length)
                    // console.log(Flag[i])
                    b--;
                    //so the format will look like [ [{stationname}, [{},{}],...],...]
                    //when finish compair, it will be deleted.
                } else {
                    Flag[i].splice(b,1);
                    b--;

                }
                // if (b===Flag[i].length-1) {
                // console.log("pair done at"+Date())
                // console.log(Pair)
                // console.log(Pair[0][1])
                // }
            }
        }

        function match(Pair){
            //check every station
            for(var v=0; v<Pair.length; v++){
                //check every pair in one station
                // console.log("stations: "+Pair.length+'/'+v)
                // console.log("I'm working1")
                for(var t=1; t<Pair[v].length; t++){
                    //compare with every other stations
                    // console.log('pairs: '+Pair[v].length+"/"+t)
                    for(var z=v+1; z<Pair.length; z++){
                        // console.log('other stations: '+Pair.length+'/'+z)
                        //compare with every pair in other stations
                        // console.log(Pair[z].length)
                        for(var y=1; y<Pair[z].length; y++){
                            // console.log('pair in other stations:'+y)
                            //
                            // console.log(Date.parse(Pair[v][t][1].time)>Date.parse(Pair[z][y][0].time))
                            // console.log("second")
                            // console.log(Pair[z][y])
                            // console.log(Date.parse(Pair[v][t][1].time)<Date.parse(Pair[z][y][1].time))
                            // console.log(Pair[v][t][1].time,Pair[z][y][0].time,Pair[z][y][1].time)
                            if(Date.parse(Pair[v][t][1].time)>Date.parse(Pair[z][y][0].time)
                                &&Date.parse(Pair[v][t][1].time)<Date.parse(Pair[z][y][1].time)){
                                console.log("hi there")
                                // console.log(Pair[v][t][1].time)
                                // console.log(Pair[z][y][0].time)
                                // console.log(Pair[v][0].stationInfo.StationId)
                                console.log(Pair[v][t][0].time,Pair[v][t][1].time,Pair[v][0].stationInfo.StationId,Pair[v][0].stationInfo.StationName)
                                alarm(Pair[v][t][0].time,Pair[v][t][1].time,Pair[v][0].stationInfo.StationId,Pair[v][0].stationInfo.StationName);
                                alarm(Pair[z][y][0].time,Pair[z][y][1].time,Pair[z][0].stationInfo.StationId,Pair[z][0].stationInfo.StationName)
                                continue
                            }
                            else{
                                continue
                            }
                        }
                    }
                }
                // console.log("one station")
            }
            // console.log("match finished")
        }
    }


    res.send("event success")
});



var EQstations;
var Flag=[];
var Pair=[];
con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.stationdata Where StationDescription = 'Earthquake'",function (err, result) {
    //   RowDataPacket {
    //     StationName: 'ESP02',
    //     City: 'Soquel',
    //     State: 'California',
    //     StationId: 'station_two',
    //     Longitude: '-121.947898',
    //     Latitude: '37.024433'
    //   },...]
    // console.log(result[0].StationId);
    // console.log(result);
    EQstations=result;

    for(var i=0;i<result.length;i++) {
        Flag.push([{stationInfo: result[i]}]);
        Pair.push([{stationInfo: result[i]}]);
        // console.log(result[i])
        // console.log(Pair)
        if(i===result.length-1){
            // console.log("EventC");
            // EventCheck(result,Flag,Pair);
        }
    }

    // res.send(result);
});



// async function flag(result,Flag,Pair){
//     for (var a = 0; a < result.length-1; a++) {
//         // DifA = result[a + 1].X - result[a].X;
//         // console.log(a);
//         // console.log(result.length)
//         DifB = result[a+1].X - result[a].X;
//         // console.log("this is difference");
//         // console.log(DifB);
//         if (Math.abs(DifB) > 9) {
//             Flag[i].push({
//                 stationInfo: EQstations[i],
//                 time: result[a].time._nanoISO,
//                 X: result[a].X,
//                 Y: result[a].Y,
//                 Z: result[a].Z,
//                 Diff: DifB
//             });
//             // DifA = null;
//             DifB = null;
//         } else {
//             // DifA = null;
//             DifB = null;
//         }
//         // console.log(a)
//         // console.log(result.length)
//         if (a === result.length -2) {
//             // console.log("flag done at"+Date());
//             // console.log("Flag length:"+Flag[i].length);
//             console.log(Flag[i]);
//             await pair(Flag,Pair)
//         }
//     }
// }
//
// function pair(Flag,Pair) {
//     // console.log("Pair begin at"+Date());
//     // console.log(Flag)
//     for (var b = 1; b < Flag[i].length-1; b++) {
//         // Flag[b].stationInfo===Flag[b+1].stationInfo&&
//         // console.log(Flag[i][b].time);
//         // console.log(Date.parse(Flag[i][b + 1].time) - Date.parse(Flag[i][b].time));
//         // console.log(Flag[i][b].Diff * Flag[i][b + 1].Diff);
//         // console.log('flag length: '+Flag[i].length)
//         // console.log('number of b: '+b);
//         // console.log(Flag)
//
//         if (Date.parse(Flag[i][b + 1].time) - Date.parse(Flag[i][b].time) < 11000000 && Flag[i][b].Diff * Flag[i][b + 1].Diff < 0) {
//             var array=[];
//             array.push(Flag[i][b], Flag[i][b + 1])
//             Pair[i].push(array);
//             // console.log(Flag[i][b])
//             Flag[i].splice(b,2)
//             // console.log(Flag[i][b], Flag[i][b + 1])
//             // console.log("a pair and flg length: "+Flag[i].length)
//             // console.log(Flag[i])
//             b--;
//             //so the format will look like [ [{stationname}, [{},{}],...],...]
//             //when finish compair, it will be deleted.
//         } else {
//             Flag[i].splice(b,1);
//             b--;
//
//         }
//         // if (b===Flag[i].length-1) {
//             // console.log("pair done at"+Date())
//             // console.log(Pair)
//             // console.log(Pair[0][1])
//         // }
//     }
// }
//
// function match(Pair){
//     //check every station
//     for(var v=0; v<Pair.length; v++){
//         //check every pair in one station
//         console.log("stations: "+Pair.length+'/'+v)
//         // console.log("I'm working1")
//         for(var t=1; t<Pair[v].length; t++){
//             //compare with every other stations
//             console.log('pairs: '+Pair[v].length+"/"+t)
//             for(var z=v+1; z<Pair.length; z++){
//                 console.log('other stations: '+Pair.length+'/'+z)
//                 //compare with every pair in other stations
//                 console.log(Pair[z].length)
//                 for(var y=1; y<Pair[z].length; y++){
//                     console.log('pair in other stations:'+y)
//                     //
//                     // console.log(Date.parse(Pair[v][t][1].time)>Date.parse(Pair[z][y][0].time))
//                     // console.log("second")
//                     // console.log(Pair[z][y])
//                     // console.log(Date.parse(Pair[v][t][1].time)<Date.parse(Pair[z][y][1].time))
//                     console.log(Pair[v][t][1].time,Pair[z][y][0].time,Pair[z][y][1].time)
//                     if(Date.parse(Pair[v][t][1].time)>Date.parse(Pair[z][y][0].time)
//                         &&Date.parse(Pair[v][t][1].time)<Date.parse(Pair[z][y][1].time)){
//                         console.log("hi there")
//                         // console.log(Pair[v][t][1].time)
//                         // console.log(Pair[z][y][0].time)
//                         // console.log(Pair[v][0].stationInfo.StationId)
//                         // console.log(Pair[v][t][0].time,Pair[v][t][1].time,Pair[v][0].stationInfo.StationId,Pair[v][0].stationInfo.StationName)
//                         alarm(Pair[v][t][0].time,Pair[v][t][1].time,Pair[v][0].stationInfo.StationId,Pair[v][0].stationInfo.StationName);
//                         alarm(Pair[z][y][0].time,Pair[z][y][1].time,Pair[z][0].stationInfo.StationId,Pair[z][0].stationInfo.StationName)
//                         continue
//                     }
//                     else{
//                         continue
//                     }
//                 }
//             }
//         }
//         // console.log("one station")
//     }
//     // console.log("match finished")
// }

function alarm(timeFrom,timeTo,stationId,stationName) {
    // var time = "2020-04-01T16:00:00.000Z",
    //     stationId = "station_two";
    console.log(timeFrom,timeTo,stationId,stationName)

    const mailOptions = {
        from: 'yge5095@gmail.com',
        to: 'lin.feng@g.northernacademy.org',
        subject: 'ESP Station Data',
        // html:'<p><a href="http://localhost:3005/newEjs?timeFrom="'+ timeFrom + "&timeTo=" + timeTo + "&stationName=" +
        //     stationName + "&stationId=" + stationId + '"\">From ' + timeFrom + " to " + timeTo + ", there is an abnormal spike happened on station " + stationName + "</a></p>"
        html: '<p><a href="http://localhost:3005/newEjs?timeFrom='+timeFrom+'&timeTo='+timeTo+'&stationName='+stationName+'&stationId='+stationId+'">' +
            'From ' + timeFrom + " to " + timeTo + ", there is an abnormal spike happened on station " + stationName + '</a></p>'

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

var c=0;
var minute="6m";
async function EventCheck(stations,Flag,Pair){
    // console.log("all begin");
    //check each station's data one by one
    for(var i=0;i<stations.length;i++){
        // console.log(Date());
        var querystatement='SELECT * FROM ' + stations[i].StationId + 'avg WHERE time >= now()-' +minute+ ' AND time<= now()';
        var test='SELECT * FROM ' + stations[i].StationId + 'avg WHERE time >='+ ' \'2020-04-09T00:00:10Z\''+ ' AND '+'time<= \'2020-04-11T00:00:50Z\'';
        console.log(test);
        // console.log(querystatement);
        await influx.query(querystatement).then
        (result => {
            // console.log('this is result');
            // console.log(result.length);
            // console.log(result);
            // console.log(result[0].X);
            // console.log(result[0].Y);
            // console.log(result[0].Z);
            // console.log(i+querystatement);
            // console.log(result[0].time._nanoISO);
            // console.log(result);
            // check the Flag here
            // console.log("begin flag")
            flag(result,Flag,Pair)
            async function flag(result,Flag,Pair){
                for (var a = 0; a < result.length; a++) {
                    // DifA = result[a + 1].X - result[a].X;
                    // console.log(a);
                    // console.log(result.length)
                    DifB = result[a+1].X - result[a].X;
                    // console.log("this is difference");
                    // console.log(DifB);
                    if (Math.abs(DifB) > 9) {
                        Flag[i].push({
                            // stationInfo: stations[i],
                            time: result[a].time._nanoISO,
                            X: result[a].X,
                            Y: result[a].Y,
                            Z: result[a].Z,
                            Diff: DifB
                        });
                        // DifA = null;
                        DifB = null;
                    } else {
                        // DifA = null;
                        DifB = null;
                    }
                    // console.log(a)
                    // console.log(result.length)
                    if (a === result.length -2) {
                        // console.log("flag done at"+Date());
                        // console.log("Flag length:"+Flag[i].length);
                        // console.log(Flag[i]);
                        await pair(Flag,Pair)
                    }
                }
            }

            function pair(Flag,Pair) {
                // console.log("Pair begin at"+Date());
                // console.log(Flag)
                for (var b = 1; b <= Flag[i].length-1; b++) {
                    // Flag[b].stationInfo===Flag[b+1].stationInfo&&
                    // console.log(Flag[i][b].time);
                    // console.log(Date.parse(Flag[i][b + 1].time) - Date.parse(Flag[i][b].time));
                    // console.log(Flag[i][b].Diff * Flag[i][b + 1].Diff);
                    // console.log('flag length: '+Flag[i].length)
                    // console.log('number of b: '+b);
                    // console.log(Flag)

                    if (Date.parse(Flag[i][b + 1].time) - Date.parse(Flag[i][b].time) < 11000000 && Flag[i][b].Diff * Flag[i][b + 1].Diff < 0) {
                        var array=[];
                        array.push(Flag[i][b], Flag[i][b + 1])
                        Pair[i].push(array);
                        // console.log(Flag[i][b])
                        Flag[i].splice(b,2)
                        // console.log("a pair and flg length: "+Flag[i].length)
                        // console.log(Flag[i])
                        b--;
                        //so the format will look like [ [{stationname}, [{},{}],...],...]
                        //when finish compair, it will be deleted.
                    } else {
                        Flag[i].splice(b,1);
                        b--;

                    }
                    if (b===Flag[i].length-1) {
                        // console.log("pair done at"+Date())
                        // console.log(Pair)
                        // console.log(Pair[0][1])
                    }
                }
            }
        }).catch(err => {
            console.log("Errors: ");
            console.log(err)
        });

        // console.log("Pair Length:"+Pair[i].length);
        // console.log(Pair);
        //format:
        // [
        //     [ { stationInfo: [RowDataPacket] }, [ [Object], [Object] ] ],
        //     [ { stationInfo: [RowDataPacket] } ],
        //     [ { stationInfo: [RowDataPacket] } ]
        // ]
        //two objects look like:
        // [
        //     {
        //         time: '2020-01-01T02:21:59Z',
        //         X: 25385.435536666668,
        //         Y: -6292.829026666666,
        //         Z: -35964.70881,
        //         Diff: -9.169136666667328
        //     },
        //     {
        //         time: '2020-01-01T04:28:59Z',
        //         X: 25406.02273333333,
        //         Y: -6308.46234,
        //         Z: -35989.95120333333,
        //         Diff: 9.576666666667734
        //     }
        // ]
        console.log(Date()+"one station end");
        if (i === stations.length - 1) {
            // console.log("Match begin at"+Date());
            match(Pair);
        }
    }
    console.log("All stations end");
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





// Alarm("2020-04-01T16:00:00.000Z","station_two");




app.get('/newEjs',function (req,res) {
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
    console.log(req.query.timeFrom,req.query.timeTo,req.query.stationName,req.query.stationId)
    res.render('new.ejs', {timeFrom: req.query.timeFrom, timeTo: req.query.timeTo, stationName: req.query.stationName, stationId: req.query.stationId})
});

app.get('/newWind', function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    console.log("Time FROM")
    console.log(req.query.stationIs,req.query.timeFrom,req.query.timeTo)
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