// Global variable
let img = null,
    needle = null,
    ctx = null,
    degrees = 0;

$(document).ready(function () {

    // Grab the compass element
    let canvas2 = document.getElementById('compass2');

    // Canvas supported?
    if (canvas2.getContext('2d')) {
        ctx2 = canvas2.getContext('2d');

        // Load the needle image
        needle2 = new Image();
        needle2.src = 'jsLibrary/compass/needle.png';

        // Load the compass image
        img2 = new Image();
        img2.src = 'jsLibrary/compass/compass.png';
        img2.onload = imgLoaded2;
    } else {
        alert("Canvas not supported!");
    }

    // Grab the compass element
    let canvas = document.getElementById('compass1');
    // let canvas2 = document.getElementById('compass2');

    // Canvas supported?
    if (canvas.getContext('2d')) {
        ctx = canvas.getContext('2d');

        // Load the needle image
        needle = new Image();
        needle.src = 'jsLibrary/compass/needle.png';

        // Load the compass image
        img = new Image();
        img.src = 'jsLibrary/compass/compass.png';
        img.onload = imgLoaded;
    } else {
        alert("Canvas not supported!");
    }

});



function clearCanvas() {
    // clear canvas
    ctx.clearRect(0, 0, 300, 300);
    // ctx2.clearRect(0, 0, 300, 300);
}
function calcAngleDegrees(x, y) {
    return Math.atan2(y, x) * 180 / Math.PI;
}

function drawCompass(data) {

    console.log(data);

    console.log('Station 1 heading:'+calcAngleDegrees(data[0], data[1]));

    let degrees = calcAngleDegrees(data[0], data[1]);
    clearCanvas();

    // Draw the compass onto the canvas
    ctx.drawImage(img, 0, 0);

    // Save the current drawing state
    ctx.save();

    // Now move across and down half the
    ctx.translate(153, 140);

    // Rotate around this point
    ctx.rotate(degrees * (Math.PI / 180));

    // Draw the image back and up
    ctx.drawImage(needle, -172, -172);

    // Restore the previous drawing state
    ctx.restore();
}

function draw() {

    console.log(staone);

    console.log('Station 1 heading:'+calcAngleDegrees(staone[0], staone[1]));

    let degrees = calcAngleDegrees(staone[0], staone[1]);
    clearCanvas();

    // Draw the compass onto the canvas
    ctx.drawImage(img, 0, 0);

    // Save the current drawing state
    ctx.save();

    // Now move across and down half the
    ctx.translate(153, 140);

    // Rotate around this point
    ctx.rotate(degrees * (Math.PI / 180));

    // Draw the image back and up
    ctx.drawImage(needle, -172, -172);

    // Restore the previous drawing state
    ctx.restore();
}

function draw2() {

    console.log(statwo);

    console.log('Station 2 heading2:'+calcAngleDegrees(statwo[0], statwo[1]));

    let degrees2 = calcAngleDegrees(statwo[0], statwo[1]);
    clearCanvas2();

    // Draw the compass onto the canvas
    ctx2.drawImage(img2, 0, 0);

    // Save the current drawing state
    ctx2.save();

    // Now move across and down half the
    ctx2.translate(153, 140);

    // Rotate around this point
    ctx2.rotate(degrees2 * (Math.PI / 180));

    // Draw the image back and up
    ctx2.drawImage(needle2, -172, -172);

    // Restore the previous drawing state
    ctx2.restore();
}
function imgLoaded() {
    // Image loaded event complete.  Start the timer
    setInterval(draw, 5000);
}
function imgLoaded2() {
    // Image loaded event complete.  Start the timer
    setInterval(draw2, 5000);
}

let img2 = null,
    needle2 = null,
    ctx2 = null,
    degrees2 = 0;


function clearCanvas2() {
    // clear canvas
    ctx2.clearRect(0, 0, 300, 300);
    // ctx2.clearRect(0, 0, 300, 300);
}


function init() {
    // Grab the compass element
    let canvas2 = document.getElementById('compass2');

    // Canvas supported?
    if (canvas2.getContext('2d')) {
        ctx2 = canvas2.getContext('2d');

        // Load the needle image
        needle2 = new Image();
        needle2.src = 'jsLibrary/compass/needle.png';

        // Load the compass image
        img2 = new Image();
        img2.src = 'jsLibrary/compass/compass.png';
        img2.onload = imgLoaded2;
    } else {
        alert("Canvas not supported!");
    }

    // Grab the compass element
    let canvas = document.getElementById('compass1');
    // let canvas2 = document.getElementById('compass2');

    // Canvas supported?
    if (canvas.getContext('2d')) {
        ctx = canvas.getContext('2d');

        // Load the needle image
        needle = new Image();
        needle.src = 'jsLibrary/compass/needle.png';

        // Load the compass image
        img = new Image();
        img.src = 'jsLibrary/compass/compass.png';
        img.onload = imgLoaded;
    } else {
        alert("Canvas not supported!");
    }

}

function calcDepthAngle(x, y) {
    return Math.atan2(y, x) * 180 / Math.PI;
}

let depth = function () {
    let bob = staone[0]/2+staone[1]/2;
    console.log(bob);
    console.log(calcDepthAngle(bob,staone[2]));
};
setInterval(depth, 5000);
