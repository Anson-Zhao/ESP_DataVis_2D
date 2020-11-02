const Influx = require('influx');
const express = require('express');
const app = express();
const nodemailer = require('nodemailer');
app.engine('ejs',require("ejs").renderFile);
app.set('view engine', 'ejs');

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
    // host: "localhost",
    user: "AppUser",
    password: "Special888%",
    port: "3306",
    Schema: "ESP2",
    Table: "stationdata"
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
    console.log("station Id")
    console.log(stationId);
    con.query("SELECT State FROM ESP2.stationdata Where StationId ='"+stationId+ "';",function (err, result1) {
        // console.log("result")
        // console.log(result1)
        if (err){
            throw err;
        }else{
            con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.stationdata Where StationDescription = 'Earthquake'",function (err, result) {
                if (err) throw err;
                res.send(result);
            });
        }
    });
});

//Flag format
//[
// [{stationinfo},[xdata{},{},...],[ydata{},{},...]],
// ]
//pair format
//[
// [{stationinfo},[xdata[{},{}],[{},{}]...],[ydata]]
// ]

//this part is working for the Check the selectable time period event (in historical page) as the flag part.
async function moon(timeFrom,timeTo,Flag,Pair,email){
    for(var i=0;i<EQstations.length;i++){
            Flag.push([{stationInfo: EQstations[i]},[],[]]);
            Pair.push([{stationInfo: EQstations[i]},[],[]]);
            var Qstring='SELECT * FROM ' + EQstations[i].StationId + 'avg WHERE time >= ' +"\'"+timeFrom+"\'"+ ' AND time<= '+"\'"+timeTo+"\'";
            // console.log(Qstring)
            await influx.query(Qstring).then
            (result => {
                // console.log("result")
                // console.log(result.length)
                for (var a = 0; a < result.length; a++) {
                    DifB = result[a+1].X - result[a].X;
                    DifA = result[a+1].Y - result[a].Y;
                    if (Math.abs(DifB) > 9) {
                        Flag[i][1].push({
                            // stationInfo: EQstations[i],
                            time: result[a].time._nanoISO,
                            X: result[a].X,
                            Y: result[a].Y,
                            Z: result[a].Z,
                            Diff: DifB
                        });
                        DifB = null;
                    }
                    else if(Math.abs(DifA)>9){
                        Flag[i][2].push({
                            // stationInfo: stations[i],
                            time: result[a].time._nanoISO,
                            X: result[a].X,
                            Y: result[a].Y,
                            Z: result[a].Z,
                            Diff: DifA
                        });
                        DifA = null;
                    }
                    else {
                        DifB = null;
                    }
                }
            }).catch(err => {
                console.log("Errors: ");
                console.log(err)
            });
            if (i === EQstations.length -1) {
                console.log("this is flag")
                console.log(Flag[0]);
                console.log(Flag[1]);
                console.log(Flag[2]);
                await pair(Flag,Pair,email)
                await seconds(Flag,email)
            }
    }
}

//Match the Flags of different stations into pairs and push them into pair(an array), the step after flag.
//The whole event checker part will use this function together.
function pair(Flag,Pair,email) {
    console.log("Pair running")
    var i
    //checking x
    for (i=0;i<Flag.length;i++){
        for (var b = 0; b < Flag[i][1].length-1; b++) {
            if (Date.parse(Flag[i][1][b + 1].time) - Date.parse(Flag[i][1][b].time) < 11000000 && Flag[i][1][b].Diff * Flag[i][1][b + 1].Diff < 0) {
                var array=[];
                array.push(Flag[i][1][b], Flag[i][1][b + 1])
                Pair[i][1].push(array);
                Flag[i][1].splice(b,2)
                // console.log("pair x push")
                b--;
                //so the format will look like [ [{stationname}, [{},{}],...],...]
                //when finish compair, it will be deleted.
            } else {
                Flag[i][1].splice(b,1);
                b--;

            }
        }
        //checking y
        for (var a = 0; a < Flag[i][2].length-1; a++) {
            if (Date.parse(Flag[i][2][a + 1].time) - Date.parse(Flag[i][2][a].time) < 11000000 && Flag[i][2][a].Diff * Flag[i][2][a + 1].Diff < 0) {
                var array2=[];
                array2.push(Flag[i][2][a], Flag[i][2][a + 1])
                Pair[i][2].push(array2);
                Flag[i][2].splice(1,2)
                // console.log("pair y push")
                a--;
                //so the format will look like [ [{stationname}, [[{},{}],...],[[{},{}],...]],...]
                //when finish compair, it will be deleted.
            } else {
                Flag[i][2].splice(a,1);
                a--;

            }
        }
    }
    console.log("pair round "+ i)
    if(i===Flag.length){
        console.log("these re pair")
        console.log("This is sta2 xs "+Pair[0][1].length+", and ys "+Pair[0][2].length)
        console.log("This is sta3 xs "+Pair[1][1].length+", and ys "+Pair[1][2].length)
        console.log("This is sta4 xs "+Pair[2][1].length+", and ys "+Pair[2][2].length)
        // console.log(Pair[0])
        // console.log(Pair[1])
        // console.log(Pair[2])
        // match(Pair,email)
        valid(Pair,email)
    }
}

//trying to see the valid signals
function valid(Pair,email){
    console.log("valid has been ran")
    var validing=[];
    //every stations
    for(var v=0; v<Pair.length; v++){
        validing.push([Pair[v][0],[]])
        //every x
        for(var x=0; x<Pair[v][1].length; x++){
            //every y
            for (var y=0; y<Pair[v][2].length; y++){

                if(Date.parse(Pair[v][1][x][1].time)>Date.parse(Pair[v][2][y][0].time)
                    &&Date.parse(Pair[v][1][x][1].time)<Date.parse(Pair[v][2][y][1].time)){
                    // console.log(Pair[v][2].length)
                    // console.log(Pair[v][1][x][1].time)
                    // console.log(Pair[v][2][y][0].time)
                    // console.log(Pair[v][2][y][1].time)
                    if(Date.parse(Pair[v][1][x][0].time)>Pair[v][2][y][0].time){
                        validing[v][1].push([[Pair[v][2][y][0].time,Pair[v][2][y][1].time],Pair[v][1][x],Pair[v][2][y]])
                    }
                    else {
                        validing[v][1].push([[Pair[v][1][x][0].time,Pair[v][2][y][1].time],Pair[v][1][x],Pair[v][2][y]])
                    }
                    Pair[v][1].splice(x,1)
                    Pair[v][2].splice(y,1)

                    // console.log("pushed")
                }
                else if(Date.parse(Pair[v][1][x][0].time)<Date.parse(Pair[v][2][y][0].time)
                    &&Date.parse(Pair[v][1][x][0].time)>Date.parse(Pair[v][2][y][1].time)){

                    //[[{stationinfo},[[ [{xb},{xe}],[{yb},{ye}] ],...]
                    // ]
                    if(Pair[v][1][x][1].time>Pair[v][2][y][1].time){
                        validing[v][1].push([Pair[v][1][x][0].time,Pair[v][1][x][1].time],[Pair[v][1][x],Pair[v][2][y]])
                    }
                    else{
                        validing[v][1].push([Pair[v][1][x][0].time,Pair[v][2][y][1].time],[Pair[v][1][x],Pair[v][2][y]])
                    }
                    console.log("pushed")
                    Pair[v][1].splice(x,1)
                    Pair[v][2].splice(y,1)
                }
            }
        }
        if(v ===Pair.length-1){
            console.log("vaid pairs")
            console.log(validing)
            console.log("station 2 xy pairs: "+validing[0][1].length)
            console.log("station 3 xy pairs: "+validing[1][1].length)
            console.log("station 4 xy pairs: "+validing[2][1].length)
            match(validing,email)
        }
    }
}


//to see whether the time of different stations are matched with each other. If it is, then call the alarm and send the necessary info as parameters.
function match(Pair,email){
    console.log("match begin at"+Date())
    var m=1;
    //check every station
    for(var v=0; v<Pair.length; v++){
        //check every pair in one station
        // console.log("stations: "+Pair.length+'/'+v)
        for(var t=0; t<Pair[v][m].length; t++){
            //compare with every other stations
            // console.log('pairs: '+Pair[v].length+"/"+t)
            for(var z=v+1; z<Pair.length; z++){
                // console.log('other stations: '+Pair.length+'/'+z)
                //compare with every pair in other stations
                for(var y=0; y<Pair[z][m].length; y++){
                    // console.log('pair in other stations:'+y)
                    // console.log(Pair[v][t][1].time)
                    // console.log(Pair[z][y][0].time)
                    // console.log(Pair[v][0].stationInfo.StationId)
                    if(Date.parse(Pair[v][m][t][0][1])>Date.parse(Pair[z][m][y][0][0])
                        &&Date.parse(Pair[v][m][t][0][1])<Date.parse(Pair[z][m][y][0][1])){
                        console.log("hi there")
                        // console.log(Pair[v][t][1].time)
                        // console.log(Pair[z][y][0].time)
                        // console.log(Pair[v][0].stationInfo.StationId)
                        // console.log(Pair[v][t][0].time,Pair[v][t][1].time,Pair[v][0].stationInfo.StationId,Pair[v][0].stationInfo.StationName)
                        alarm(Pair[v][0].stationInfo.City, Pair[v][0].stationInfo.State, Pair[v][0].stationInfo.Longitude, Pair[v][0].stationInfo.Latitude, Pair[v][m][t][0][0],Pair[v][m][t][0][1],Pair[v][0].stationInfo.StationId,Pair[v][0].stationInfo.StationName,email,
                            Pair[z][0].stationInfo.City, Pair[z][0].stationInfo.State, Pair[z][0].stationInfo.Longitude, Pair[z][0].stationInfo.Latitude, Pair[z][m][y][0][0],Pair[z][m][y][0][1],Pair[z][0].stationInfo.StationId,Pair[z][0].stationInfo.StationName,
                            Pair[v][m][t][1][0].Diff,Pair[v][m][t][2][0].Diff,
                            Pair[z][m][y][1][0].Diff,Pair[z][m][y][2][0].Diff);
                        // alarm(Pair[v][0].stationInfo.City, Pair[v][0].stationInfo.State, Pair[v][0].stationInfo.Longitude, Pair[v][0].stationInfo.Latitude, Pair[v][m][t][0].time,Pair[v][m][t][1].time,Pair[v][0].stationInfo.StationId,Pair[v][0].stationInfo.StationName,email,
                        //     Pair[z][0].stationInfo.City, Pair[z][0].stationInfo.State, Pair[z][0].stationInfo.Longitude, Pair[z][0].stationInfo.Latitude, Pair[z][m][y][0].time,Pair[z][m][y][1].time,Pair[z][0].stationInfo.StationId,Pair[z][0].stationInfo.StationName,
                        //     Pair[v][m][t][0].X,Pair[v][m][t][0].Y,Pair[v][m][t][0].Z,Pair[v][m][t][0].Diff,Pair[v][m][t][1].X,Pair[v][m][t][1].Y,Pair[v][m][t][1].Z,Pair[v][m][t][1].Diff,
                        //     Pair[z][m][y][0].X,Pair[z][m][y][0].Y,Pair[z][m][y][0].Z,Pair[z][m][y][0].Diff,Pair[z][m][y][1].X,Pair[z][m][y][1].Y,Pair[z][m][y][1].Z,Pair[z][m][y][1].Diff,
                        //     Pair[v][m][t][2].Diff,Pair[v][m][t][3].Diff,Pair[z][m][y][2].Diff,Pair[z][m][y][3].Diff);
                        // alarm(Pair[z][0].stationInfo.City, Pair[z][0].stationInfo.State, Pair[z][0].stationInfo.Longitude, Pair[z][0].stationInfo.Latitude, Pair[z][y][0].time,Pair[z][y][1].time,Pair[z][0].stationInfo.StationId,Pair[z][0].stationInfo.StationName,email)
                        Pair[z][1].splice(y,1)
                        Pair[v][1].splice(t,1)
                        // Pair[z][2].splice(y,1)
                        // Pair[v][2].splice(t,1)
                        continue
                    }
                    else if(Date.parse(Pair[z][m][y][0][1])>Date.parse(Pair[v][m][t][0][0])
                        &&Date.parse(Pair[z][m][y][0][1])<Date.parse(Pair[v][m][t][0][1])){
                        console.log("Hi there")
                        alarm(Pair[v][0].stationInfo.City, Pair[v][0].stationInfo.State, Pair[v][0].stationInfo.Longitude, Pair[v][0].stationInfo.Latitude, Pair[v][m][t][0][0],Pair[v][m][t][0][1],Pair[v][0].stationInfo.StationId,Pair[v][0].stationInfo.StationName,email,
                            Pair[z][0].stationInfo.City, Pair[z][0].stationInfo.State, Pair[z][0].stationInfo.Longitude, Pair[z][0].stationInfo.Latitude, Pair[z][m][y][0][0],Pair[z][m][y][0][1],Pair[z][0].stationInfo.StationId,Pair[z][0].stationInfo.StationName,
                            Pair[v][m][t][1][0].Diff,Pair[v][m][t][2][0].Diff,
                            Pair[z][m][y][1][0].Diff,Pair[z][m][y][2][0].Diff);
                        // alarm(Pair[v][0].stationInfo.City, Pair[v][0].stationInfo.State, Pair[v][0].stationInfo.Longitude, Pair[v][0].stationInfo.Latitude, Pair[v][m][t][0].time,Pair[v][m][t][1].time,Pair[v][0].stationInfo.StationId,Pair[v][0].stationInfo.StationName,email,
                        //     Pair[z][0].stationInfo.City, Pair[z][0].stationInfo.State, Pair[z][0].stationInfo.Longitude, Pair[z][0].stationInfo.Latitude, Pair[z][m][y][0].time,Pair[z][m][y][1].time,Pair[z][0].stationInfo.StationId,Pair[z][0].stationInfo.StationName,
                        //     Pair[v][m][t][0].X,Pair[v][m][t][0].Y,Pair[v][m][t][0].Z,Pair[v][m][t][0].Diff,Pair[v][m][t][1].X,Pair[v][m][t][1].Y,Pair[v][m][t][1].Z,Pair[v][m][t][1].Diff,
                        //     Pair[z][m][y][0].X,Pair[z][m][y][0].Y,Pair[z][m][y][0].Z,Pair[z][m][y][0].Diff,Pair[z][m][y][1].X,Pair[z][m][y][1].Y,Pair[z][m][y][1].Z,Pair[z][m][y][1].Diff
                        //     ,Pair[v][m][t][2].Diff,Pair[v][m][t][3].Diff,Pair[z][m][y][2].Diff,Pair[z][m][y][3].Diff);
                        // alarm(Pair[z][0].stationInfo.City, Pair[z][0].stationInfo.State, Pair[z][0].stationInfo.Longitude, Pair[z][0].stationInfo.Latitude, Pair[z][y][0].time,Pair[z][y][1].time,Pair[z][0].stationInfo.StationId,Pair[z][0].stationInfo.StationName,email)
                        Pair[z][1].splice(y,1)
                        Pair[v][1].splice(t,1)
                        // Pair[z][2].splice(y,1)
                        // Pair[v][2].splice(t,1)
                        continue
                    }
                }
            }
        }
    }
}

//If there is anomaly happened in two stations within 20s, which is flags. Then call the alarm.
function seconds(Flag,email){
    // console.log("match begin at"+Date())
    //check every station
    for(var v=0; v<Flag.length; v++){
        //check every pair in one station
        // console.log("stations: "+Pair.length+'/'+v)
        for(var t=1; t<Flag[v].length; t++){
            //compare with every other stations
            // console.log('pairs: '+Pair[v].length+"/"+t)
            for(var z=v+1; z<Flag.length; z++){
                // console.log('other stations: '+Pair.length+'/'+z)
                //compare with every pair in other stations
                for(var y=1; y<Flag[z].length; y++){
                    // console.log('pair in other stations:'+y)
                    // console.log(Pair[v][t][1].time)
                    // console.log(Pair[z][y][0].time)
                    // console.log(Pair[v][0].stationInfo.StationId)
                    if(Date.parse(Flag[v][t].time)>Date.parse(Flag[z][y].time)-20000
                    &&Date.parse(Flag[v][t].time)<Date.parse(Flag[z][y].time)+20000){
                        // console.log("hi there")
                        // console.log(Pair[v][t][1].time)
                        // console.log(Pair[z][y][0].time)
                        // console.log(Pair[v][0].stationInfo.StationId)
                        // console.log(Pair[v][t][0].time,Pair[v][t][1].time,Pair[v][0].stationInfo.StationId,Pair[v][0].stationInfo.StationName)
                        alarm(Flag[v][0].stationInfo.City, Flag[v][0].stationInfo.State, Flag[v][0].stationInfo.Longitude, Flag[v][0].stationInfo.Latitude, Flag[v][t].time,null,Flag[v][0].stationInfo.StationId,Flag[v][0].stationInfo.StationName,email,
                            Flag[z][0].stationInfo.City, Flag[z][0].stationInfo.State, Flag[z][0].stationInfo.Longitude, Flag[z][0].stationInfo.Latitude, Flag[z][y].time,null,Flag[z][0].stationInfo.StationId,Flag[z][0].stationInfo.StationName,
                            Pair[v][t].X,Pair[v][t].Y,Pair[v][t].Z,Pair[v][t].Diff,null,null,null,null,
                            Pair[z][y].X,Pair[z][y].Y,Pair[z][y].Z,Pair[z][y].Diff,null,null,null,null);
                        // alarm(Pair[z][0].stationInfo.City, Pair[z][0].stationInfo.State, Pair[z][0].stationInfo.Longitude, Pair[z][0].stationInfo.Latitude, Pair[z][y][0].time,Pair[z][y][1].time,Pair[z][0].stationInfo.StationId,Pair[z][0].stationInfo.StationName,email)
                        continue
                    }
                }
            }
        }
    }
}


//this is part that responsible for the check the event (in historical page) where you can select specific time period.
app.get ('/newMoon', function (req, res) { //stations information used for new event page
    var timeFrom = req.query.timeFrom;
    var timeTo = req.query.timeTo;
    var email = req.query.email;
    var FLAGH = []
    var PAIRH = []
    // console.log("These are new things")
    // console.log(timeFrom, timeTo);
    moon(timeFrom,timeTo,FLAGH,PAIRH,email)
    res.send("event success")
});


var DeEmail='lin.feng@g.northernacademy.org, ron@trilliumlearning.com, azhao@northernacademy.org, esp_notify@northernacademy.org';
var EQstations;
var FlagN=[];
var PairN=[];
con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.stationdata Where StationDescription = 'Earthquake'",function (err, result) {
    EQstations=result;

    for(var i=0;i<result.length;i++) {
        FlagN.push([{stationInfo: result[i]},[],[]]);
        PairN.push([{stationInfo: result[i]},[],[]]);
        if(i===result.length-1){
            EventCheck(result,FlagN,PairN,DeEmail);
        }
    }
});

//this is the alarm that will send out the notification link to the specific email
// StationName,City,State,StationId,Longitude,Latitude
function alarm(city,state,lo,la,timeFrom,timeTo,stationId,stationName,email,
               city2,state2,lo2,la2,timeFrom2,timeTo2,stationId2,stationName2,
               bd1x,bd1y,bd2x,bd2y) {
    // console.log(timeFrom,timeTo,stationId,stationName)

    const mailOptions = {
        from: 'yge5095@gmail.com',
        to: email,
        subject: 'ESP Station Data',
        // html:'<p><a href="http://localhost:3005/newEjs?timeFrom="'+ timeFrom + "&timeTo=" + timeTo + "&stationName=" +
        //     stationName + "&stationId=" + stationId + '"\">From ' + timeFrom + " to " + timeTo + ", there is an abnormal spike happened on station " + stationName + "</a></p>"
        // html: '<p><a href="https://cors.aworldbridgelabs.com:9084/http://mockup.esp.aworldbridgelabs.com:3005/newEjs?timeFrom='+timeFrom+'&timeTo='+timeTo+'&city='+city+'&state='+state+'&lo='+lo+'&la='+la+'&stationName='+stationName+'&stationId='+stationId+'">' +
        //     'From ' + timeFrom + " to " + timeTo + ", there is an anopoly happened on station " + stationName + '</a></p>'
        html: '<p><a href="http://localhost:3005/newEjs?timeFrom='+timeFrom+'&timeTo='+timeTo+'&city='+city+'&state='+state+'&lo='+lo+'&la='+la+'&stationName='+stationName+'&stationId='+stationId
            +'&timeFrom2='+timeFrom2+'&timeTo2='+timeTo2+'&city2='+city2+'&state2='+state2+'&lo2='+lo2+'&la2='+la2+'&stationName2='+stationName2+'&stationId2='+stationId2
            +'&bdx='+bd1x+'&bdy='+bd1y+'&bdx2='+bd2x+'&bdy2='+bd2y+'">' +
            'From ' + timeFrom + " to " + timeTo + ", there is an anomaly happened on station " + stationName
            + ". At the same time, there is an anomaly happened on station "+ stationName2+", and the time range is "+timeFrom2+" to "+timeTo2+". Notification: The time periods here are using the widest time(xUy) as a reference."+'</a></p>'

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
        for(var a=0;a<Pair[i][1].length;a++){
            if(Date.parse(Pair[i][1][a][1].time)>Date.parse(Date())+1800000){
                Pair[i][1].splice(a,1)
                //[[{StaInfo},{{},{}}],
                // [{StaInfo}],
                // [Sta]]
            }
        }
        for(var b=0;b<Pair[i][2].length;b++){
            if(Date.parse(Pair[i][2][b][1].time)>Date.parse(Date())+1800000){
                Pair[i][2].splice(b,1)
                //[[{StaInfo},{{},{}}],
                // [{StaInfo}],
                // [Sta]]
            }
        }
    }
}

var c=0;
var minute="6m";
async function EventCheck(stations,Flag,Pair,email){
    var preSta=EQstations;
    con.query("SELECT StationName,City,State,StationId,Longitude,Latitude FROM ESP2.stationdata Where StationDescription = 'Earthquake'",function (err, result) {
        var newSta=result;
        if(newSta.length !== preSta.length && preSta.length<newSta.length){
            for(var i=0;i<newSta.length-preSta.length;i++) {
                FlagN.push([{stationInfo: result[preSta.length+i+1]},[],[]]);
                PairN.push([{stationInfo: result[preSta.length+i+1]},[],[]]);
                // if(i===result.length-1){
                //     EventCheck(result,FlagN,PairN);
                // }
            }
        }
    });
    // console.log("all begin");
    //check each station's data one by one
    console.log("stations length is "+stations.length)
    for(var i=0;i<stations.length;i++){

        // console.log(Date());
        var querystatement='SELECT * FROM ' + stations[i].StationId + 'avg WHERE time >= now()-' +minute+ ' AND time<= now()';
        var test='SELECT * FROM ' + stations[i].StationId + 'avg WHERE time >='+ ' \'2020-10-15T00:00:10Z\''+ ' AND '+'time<= \'2020-10-24T00:00:50Z\'';
        // console.log(test);
        // console.log(querystatement);
        await influx.query(querystatement).then
        (result => {
            console.log('this is result');
            console.log(result.length);
            // console.log(result);
            // console.log(result[0].X);
            // console.log(re                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               sult[0].Y);
            // console.log(result[0].Z);
            // console.log(i+querystatement);
            // console.log(result[0].time._nanoISO);
            // console.log(result);
            // check the Flag here
            // console.log("begin flag")
            flag(result,Flag,Pair,email)
            async function flag(result,Flag,Pair,email){
                for (var a = 0; a < result.length; a++) {
                    // DifA = result[a + 1].X - result[a].X;
                    // console.log(a);
                    // console.log(result.length)
                    DifB = result[a+1].X - result[a].X;
                    DifA = result[a+1].Y - result[a].Y;
                    // console.log("this is difference");
                    // console.log(DifB);
                    if (Math.abs(DifB) > 9) {
                        Flag[i][1].push({
                            // stationInfo: stations[i],
                            time: result[a].time._nanoISO,
                            X: result[a].X,
                            Y: result[a].Y,
                            Z: result[a].Z,
                            Diff: DifB
                        });
                        // console.log("pushed")
                        DifB = null;
                    }
                    else if(Math.abs(DifA)>9){
                        Flag[i][2].push({
                            // stationInfo: stations[i],
                            time: result[a].time._nanoISO,
                            X: result[a].X,
                            Y: result[a].Y,
                            Z: result[a].Z,
                            Diff: DifA
                        });
                        // console.log("pushed")
                        DifA = null;
                    }
                    else {
                        DifA = null;
                        DifB = null;
                    }
                    // console.log(a)
                    // console.log(result.length)

                }
            }
        }).catch(err => {
            console.log("Errors: ");
            console.log(err)
        });
        if (i === EQstations.length-1) {
            console.log("flag round done at"+Date());
            console.log("Flag length sta2 x is "+Flag[0][1].length+", and y is "+Flag[0][2].length);
            console.log("Flag length sta3 x is "+Flag[1][1].length+", and y is "+Flag[1][2].length);
            console.log("Flag length sta4 x is "+Flag[2][1].length+", and y is "+Flag[2][2].length);
            // console.log(Flag[1][2]);
            await pair(Flag,Pair,email)
            console.log("PAIR has been run")
            await seconds(Flag,email)
        }
    }

    setInterval(function () {
        EventCheck(EQstations,FlagN,PairN,DeEmail)}, 300000);
    setInterval(function () {
        Delete(PairN)}, 300000);
}

app.get('/newEjs',function (req,res) {
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow cross domain header
    // console.log("Receive A Demo request: ");
    // console.log(req.query.timeFrom,req.query.timeTo,req.query.stationName,req.query.stationId)
    res.render('new.ejs', {timeFrom: req.query.timeFrom, timeTo: req.query.timeTo, stationName: req.query.stationName, stationId: req.query.stationId, city: req.query.city, state: req.query.state, la: req.query.la, lo: req.query.lo,
        timeFrom2: req.query.timeFrom2, timeTo2: req.query.timeTo2, stationName2: req.query.stationName2, stationId2: req.query.stationId2, city2: req.query.city2, state2: req.query.state2, la2: req.query.la2, lo2: req.query.lo2,
        bdx: req.query.bdx,bdy: req.query.bdy,bdx2: req.query.bdx2,bdy2: req.query.bdy2
    })
});

app.get('/newWind', function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    // console.log("Time FROM")
    console.log(req.query.stationIs,req.query.timeFrom,req.query.timeTo)
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



//to see whether the time of different stations are matched with each other. If it is, then call the alarm and send the necessary info as parameters.
function matchbackuppair(Pair,email){
    console.log("match begin at"+Date())
    var m=1;
    //check every station
    for(var v=0; v<Pair.length; v++){
        //check every pair in one station
        // console.log("stations: "+Pair.length+'/'+v)
        for(var t=0; t<Pair[v][m].length; t++){
            //compare with every other stations
            // console.log('pairs: '+Pair[v].length+"/"+t)
            for(var z=v+1; z<Pair.length; z++){
                // console.log('other stations: '+Pair.length+'/'+z)
                //compare with every pair in other stations
                for(var y=0; y<Pair[z][m].length; y++){
                    // console.log('pair in other stations:'+y)
                    // console.log(Pair[v][t][1].time)
                    // console.log(Pair[z][y][0].time)
                    // console.log(Pair[v][0].stationInfo.StationId)
                    if(Date.parse(Pair[v][m][t][1].time)>Date.parse(Pair[z][m][y][0].time)
                        &&Date.parse(Pair[v][m][t][1].time)<Date.parse(Pair[z][m][y][1].time)){
                        console.log("hi there")
                        // console.log(Pair[v][t][1].time)
                        // console.log(Pair[z][y][0].time)
                        // console.log(Pair[v][0].stationInfo.StationId)
                        // console.log(Pair[v][t][0].time,Pair[v][t][1].time,Pair[v][0].stationInfo.StationId,Pair[v][0].stationInfo.StationName)
                        alarm(Pair[v][0].stationInfo.City, Pair[v][0].stationInfo.State, Pair[v][0].stationInfo.Longitude, Pair[v][0].stationInfo.Latitude, Pair[v][m][t][0].time,Pair[v][m][t][1].time,Pair[v][0].stationInfo.StationId,Pair[v][0].stationInfo.StationName,email,
                            Pair[z][0].stationInfo.City, Pair[z][0].stationInfo.State, Pair[z][0].stationInfo.Longitude, Pair[z][0].stationInfo.Latitude, Pair[z][m][y][0].time,Pair[z][m][y][1].time,Pair[z][0].stationInfo.StationId,Pair[z][0].stationInfo.StationName,
                            Pair[v][m][t][0].X,Pair[v][m][t][0].Y,Pair[v][m][t][0].Z,Pair[v][m][t][0].Diff,Pair[v][m][t][1].X,Pair[v][m][t][1].Y,Pair[v][m][t][1].Z,Pair[v][m][t][1].Diff,
                            Pair[z][m][y][0].X,Pair[z][m][y][0].Y,Pair[z][m][y][0].Z,Pair[z][m][y][0].Diff,Pair[z][m][y][1].X,Pair[z][m][y][1].Y,Pair[z][m][y][1].Z,Pair[z][m][y][1].Diff,
                            Pair[v][m][t][2].Diff,Pair[v][m][t][3].Diff,Pair[z][m][y][2].Diff,Pair[z][m][y][3].Diff);
                        // alarm(Pair[z][0].stationInfo.City, Pair[z][0].stationInfo.State, Pair[z][0].stationInfo.Longitude, Pair[z][0].stationInfo.Latitude, Pair[z][y][0].time,Pair[z][y][1].time,Pair[z][0].stationInfo.StationId,Pair[z][0].stationInfo.StationName,email)
                        Pair[z][1].splice(y,1)
                        Pair[v][1].splice(t,1)
                        // Pair[z][2].splice(y,1)
                        // Pair[v][2].splice(t,1)
                        continue
                    }
                    else if(Date.parse(Pair[z][y][1].time)>Date.parse(Pair[v][t][0].time)
                        &&Date.parse(Pair[z][y][1].time)<Date.parse(Pair[v][t][1].time)){
                        console.log("Hi there")
                        alarm(Pair[v][0].stationInfo.City, Pair[v][0].stationInfo.State, Pair[v][0].stationInfo.Longitude, Pair[v][0].stationInfo.Latitude, Pair[v][m][t][0].time,Pair[v][m][t][1].time,Pair[v][0].stationInfo.StationId,Pair[v][0].stationInfo.StationName,email,
                            Pair[z][0].stationInfo.City, Pair[z][0].stationInfo.State, Pair[z][0].stationInfo.Longitude, Pair[z][0].stationInfo.Latitude, Pair[z][m][y][0].time,Pair[z][m][y][1].time,Pair[z][0].stationInfo.StationId,Pair[z][0].stationInfo.StationName,
                            Pair[v][m][t][0].X,Pair[v][m][t][0].Y,Pair[v][m][t][0].Z,Pair[v][m][t][0].Diff,Pair[v][m][t][1].X,Pair[v][m][t][1].Y,Pair[v][m][t][1].Z,Pair[v][m][t][1].Diff,
                            Pair[z][m][y][0].X,Pair[z][m][y][0].Y,Pair[z][m][y][0].Z,Pair[z][m][y][0].Diff,Pair[z][m][y][1].X,Pair[z][m][y][1].Y,Pair[z][m][y][1].Z,Pair[z][m][y][1].Diff
                            ,Pair[v][m][t][2].Diff,Pair[v][m][t][3].Diff,Pair[z][m][y][2].Diff,Pair[z][m][y][3].Diff);
                        // alarm(Pair[z][0].stationInfo.City, Pair[z][0].stationInfo.State, Pair[z][0].stationInfo.Longitude, Pair[z][0].stationInfo.Latitude, Pair[z][y][0].time,Pair[z][y][1].time,Pair[z][0].stationInfo.StationId,Pair[z][0].stationInfo.StationName,email)
                        Pair[z][1].splice(y,1)
                        Pair[v][1].splice(t,1)
                        // Pair[z][2].splice(y,1)
                        // Pair[v][2].splice(t,1)
                        continue
                    }
                }
            }
        }
    }
}