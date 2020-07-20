const Influx = require('influx');
const express = require('express');
const app = express();
const nodemailer = require('nodemailer');

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

app.get ('/stations', function (req, res){
    res.setHeader("Access-Control-Allow-Origin", "*");
    con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.stationdata Where Status = 'Active'",function (err, result) {
        if (err) throw err;
        res.send(result);
    });
});

app.get ('/stationsForN', function (req, res){ //stations information used for new event page
    res.setHeader("Access-Control-Allow-Origin", "*");
    var stationId = req.query.stationID;
    // console.log("station Id")
    // console.log(stationId);
    con.query("SELECT State FROM ESP2.stationdata Where StationId ='"+stationId+ "';",function (err, result1) {
        // console.log("result")
        // console.log(result1)
        if (err){
            throw err;
        }else{
            con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.stationdata Where Status = 'Active' AND State = '"+result1[0].State+"';",function (err, result) {
                if (err) throw err;
                res.send(result);
            });
        }
    });
});

async function moon(timeFrom,timeTo,Flag,Pair){
    for(var i=0;i<EQstations.length;i++){
            Flag.push([{stationInfo: EQstations[i]}]);
            Pair.push([{stationInfo: EQstations[i]}]);
            var Qstring='SELECT * FROM ' + EQstations[i].StationId + 'avg WHERE time >= ' +"\'"+timeFrom+"\'"+ ' AND time<= '+"\'"+timeTo+"\'";
            // console.log(Qstring)
            await influx.query(Qstring).then
            (result => {
                // console.log("result")
                // console.log(result.length)
                for (var a = 0; a < result.length; a++) {
                    DifB = result[a+1].X - result[a].X;
                    if (Math.abs(DifB) > 9) {
                        Flag[i].push({
                            // stationInfo: EQstations[i],
                            time: result[a].time._nanoISO,
                            X: result[a].X,
                            Y: result[a].Y,
                            Z: result[a].Z,
                            Diff: DifB
                        });
                        DifB = null;
                    } else {
                        DifB = null;
                    }
                }
            }).catch(err => {
                console.log("Errors: ");
                console.log(err)
            });
            if (i === EQstations.length -1) {
                // console.log(Flag[0]);
                // console.log(Flag[1]);
                // console.log(Flag[2]);
                await pair(Flag,Pair)
            }
    }
}


function pair(Flag,Pair) {
    for (var i=0;i<Flag.length;i++){
        for (var b = 1; b < Flag[i].length-1; b++) {
            if (Date.parse(Flag[i][b + 1].time) - Date.parse(Flag[i][b].time) < 11000000 && Flag[i][b].Diff * Flag[i][b + 1].Diff < 0) {
                var array=[];
                array.push(Flag[i][b], Flag[i][b + 1])
                Pair[i].push(array);
                Flag[i].splice(b,2)
                b--;
                //so the format will look like [ [{stationname}, [{},{}],...],...]
                //when finish compair, it will be deleted.
            } else {
                Flag[i].splice(b,1);
                b--;

            }
        }
        if(i===Flag.length-1){
            console.log(Pair[0].length,Pair[1].length,Pair[2].length)
            match(Pair)
        }
    }
}

function match(Pair){
    // console.log("match begin at"+Date())
    //check every station
    for(var v=0; v<Pair.length; v++){
        //check every pair in one station
        // console.log("stations: "+Pair.length+'/'+v)
        for(var t=1; t<Pair[v].length; t++){
            //compare with every other stations
            // console.log('pairs: '+Pair[v].length+"/"+t)
            for(var z=v+1; z<Pair.length; z++){
                // console.log('other stations: '+Pair.length+'/'+z)
                //compare with every pair in other stations
                for(var y=1; y<Pair[z].length; y++){
                    // console.log('pair in other stations:'+y)
                    // console.log(Pair[v][t][1].time)
                    // console.log(Pair[z][y][0].time)
                    // console.log(Pair[v][0].stationInfo.StationId)
                    if(Date.parse(Pair[v][t][1].time)>Date.parse(Pair[z][y][0].time)
                        &&Date.parse(Pair[v][t][1].time)<Date.parse(Pair[z][y][1].time)){
                        // console.log("hi there")
                        // console.log(Pair[v][t][1].time)
                        // console.log(Pair[z][y][0].time)
                        // console.log(Pair[v][0].stationInfo.StationId)
                        // console.log(Pair[v][t][0].time,Pair[v][t][1].time,Pair[v][0].stationInfo.StationId,Pair[v][0].stationInfo.StationName)
                        alarm(Pair[v][t][0].time,Pair[v][t][1].time,Pair[v][0].stationInfo.StationId,Pair[v][0].stationInfo.StationName);
                        alarm(Pair[z][y][0].time,Pair[z][y][1].time,Pair[z][0].stationInfo.StationId,Pair[z][0].stationInfo.StationName)
                        Pair[z].splice(y,1)
                        Pair[v].splice(t,1)
                        continue
                    }
                    else{
                        continue
                    }
                }
            }
        }
    }
}
app.get ('/newMoon', function (req, res) { //stations information used for new event page
    var timeFrom = req.query.timeFrom;
    var timeTo = req.query.timeTo;
    var FLAGH = []
    var PAIRH = []
    // console.log("These are new things")
    // console.log(timeFrom, timeTo);
    moon(timeFrom,timeTo,FLAGH,PAIRH)
    res.send("event success")
});



var EQstations;
var FlagN=[];
var PairN=[];
con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.stationdata Where StationDescription = 'Earthquake'",function (err, result) {
    EQstations=result;

    for(var i=0;i<result.length;i++) {
        FlagN.push([{stationInfo: result[i]}]);
        PairN.push([{stationInfo: result[i]}]);
        if(i===result.length-1){
            EventCheck(result,FlagN,PairN);
        }
    }
});

function alarm(timeFrom,timeTo,stationId,stationName) {
    // console.log(timeFrom,timeTo,stationId,stationName)

    const mailOptions = {
        from: 'yge5095@gmail.com',
        to: 'lin.feng@g.northernacademy.org, ron@trilliumlearning.com, azhao@northernacademy.org',
        subject: 'ESP Station Data',
        // html:'<p><a href="http://localhost:3005/newEjs?timeFrom="'+ timeFrom + "&timeTo=" + timeTo + "&stationName=" +
        //     stationName + "&stationId=" + stationId + '"\">From ' + timeFrom + " to " + timeTo + ", there is an abnormal spike happened on station " + stationName + "</a></p>"
        html: '<p><a href="https://cors.aworldbridgelabs.com:9084/http://mockup.esp.aworldbridgelabs.com:3005/newEjs?timeFrom='+timeFrom+'&timeTo='+timeTo+'&stationName='+stationName+'&stationId='+stationId+'">' +
            'From ' + timeFrom + " to " + timeTo + ", there is an abnormal spike happened on station " + stationName + '</a></p>'

    };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            //http://localhost:3005/newEjs?stationID=3333&dateTime=8888
            // console.log('Email sent: ' + info.response);
        }
    });
}

function Delete(Pair) {
    for(var i=0;i<Pair.length;i++){
        for(var a=0;a<Pair[i].length;a++){
            if(Date.parse(Pair[i][a][1].time)>Date.parse(Date())+1800000){
                Pair[i].splice(a,1)
                //[[{StaInfo},{{},{}}],
                // [{StaInfo}],
                // [Sta]]
            }
        }
    }
}

var c=0;
var minute="6m";
async function EventCheck(stations,Flag,Pair){
    // con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.stationdata Where StationDescription = 'Earthquake'",function (err, result) {
    //     EQstations=result;

        // for(var i=0;i<result.length;i++) {
        //     FlagN.push([{stationInfo: result[i]}]);
        //     PairN.push([{stationInfo: result[i]}]);
            // if(i===result.length-1){
            //     EventCheck(result,FlagN,PairN);
            // }
        // }
    // });
    // console.log("all begin");
    //check each station's data one by one
    for(var i=0;i<stations.length;i++){
        // console.log(Date());
        var querystatement='SELECT * FROM ' + stations[i].StationId + 'avg WHERE time >= now()-' +minute+ ' AND time<= now()';
        var test='SELECT * FROM ' + stations[i].StationId + 'avg WHERE time >='+ ' \'2020-04-09T00:00:10Z\''+ ' AND '+'time<= \'2020-04-11T00:00:50Z\'';
        // console.log(test);
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
                        DifB = null;
                    } else {
                        DifB = null;
                    }
                    // console.log(a)
                    // console.log(result.length)
                    if (a === result.length -3) {
                        // console.log("flag round done at"+Date());
                        // console.log("Flag length:"+Flag[i].length);
                        // console.log(Flag[i]);
                        await pair(Flag,Pair)
                    }
                }
            }
        }).catch(err => {
            console.log("Errors: ");
            console.log(err)
        });
    }

    setInterval(function () {
        EventCheck(EQstations,FlagN,PairN)}, 300000);
    setInterval(function () {
        Delete(PairN)}, 300000);
}

app.get('/newEjs',function (req,res) {
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
    // console.log("Receive A Demo request: ");
    // console.log(req.query.timeFrom,req.query.timeTo,req.query.stationName,req.query.stationId)
    res.render('new.ejs', {timeFrom: req.query.timeFrom, timeTo: req.query.timeTo, stationName: req.query.stationName, stationId: req.query.stationId})
});

app.get('/newWind', function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    // console.log("Time FROM")
    // console.log(req.query.stationIs,req.query.timeFrom,req.query.timeTo)
    let queryHa = 'SELECT * FROM ' + req.query.stationIs + 'avg WHERE time >= ' + "'" + req.query.timeFrom + "'" + ' AND time<= ' + "'" + req.query.timeTo + "'";
    influx.query(queryHa).then
    (result => {
        res.send(result);
    }).catch(err => {
        res.status(500).send(err.stack)
    });
});

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

app.listen('3005');