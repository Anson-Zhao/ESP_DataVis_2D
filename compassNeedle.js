// Global variable
let img = null,
    needle = null,
    ctx = null,
    degrees = 0;

let img2 = null,
    needle2 = null,
    ctx2 = null,
    degrees2 = 0;
let imgD1 = null,
    arrow1 = null,
    ctxD1 = null,
    degreesD1 = 0;

$(document).ready(function () {
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

    let canvasD1 = document.getElementById('depth1');

    // Canvas supported?
    //https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag
    if (canvasD1.getContext('2d')) {
        ctxD1 = canvasD1.getContext('2d');
        // Load the needle image
        arrow1 = new Image();
        arrow1.src = 'compass/arrow.png';
        arrow1.style.height = '100px';
        arrow1.style.width = '200px';
        console.log(arrow1.style);
        // // Load the compass image
        imgD1 = new Image();
        imgD1.src = 'jsLibrary/compass/compass.png';
        arrow1.onload = imgLoadedD1;
    } else {
        alert("Canvas not supported!");
    }




});
function calcAngleDegrees(x, y) {
    return Math.atan2(y, x) * 180 / Math.PI;
}
function calcHypotenuse(a, b) {
    return(Math.sqrt((a * a) + (b * b)));
}
function clearCanvas() {
    // clear canvas
    ctx.clearRect(0, 0, 300, 300);
}
function clearCanvas2() {
    // clear canvas
    ctx2.clearRect(0, 0, 300, 300);
}
function clearCanvasD1() {
    // clear canvas
    ctxD1.clearRect(0, 0, 300, 300);
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

    console.log('Station 2 heading:'+calcAngleDegrees(statwo[0], statwo[1]));

    let degrees2 = calcAngleDegrees(statwo[0], statwo[1]);
    clearCanvas2();

    // Draw the compass onto the canvas
    ctx2.drawImage(img2, -0, -0);

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
function drawD() {

    var depthX1 =  calcHypotenuse(staone[0], staone[1]);
    console.log('station 1 depth angle:'+calcAngleDegrees(depthX1, staone[2]));

    let degreesD1 = calcAngleDegrees(depthX1, staone[2]);
    clearCanvasD1();

    // Draw the compass onto the canvas
    ctxD1.drawImage(imgD1, 0, 0);

    // Save the current drawing state
    ctxD1.save();

    // // Now move across and down half the
    ctxD1.translate(153, 140);

    // Rotate around this point
    ctxD1.rotate((-degreesD1) * (Math.PI / 180));
    console.log(-degreesD1);
    // Draw the image back and up
    ctxD1.drawImage(arrow1, -250, -250);

    // Restore the previous drawing state
    ctxD1.restore();
}
function imgLoaded() {
    // Image loaded event complete.  Start the timer
    setInterval(draw, 5000);
}
function imgLoaded2() {
    // Image loaded event complete.  Start the timer
    setInterval(draw2, 5000);
}
function imgLoadedD1() {
    // Image loaded event complete.  Start the timer
    setInterval(drawD, 5000);
}




// function init() {
//     // Grab the compass element
//     let canvas2 = document.getElementById('compass2');
//
//     // Canvas supported?
//     if (canvas2.getContext('2d')) {
//         ctx2 = canvas2.getContext('2d');
//
//         // Load the needle image
//         needle2 = new Image();
//         needle2.src = 'jsLibrary/compass/needle.png';
//
//         // Load the compass image
//         img2 = new Image();
//         img2.src = 'jsLibrary/compass/compass.png';
//         img2.onload = imgLoaded2;
//     } else {
//         alert("Canvas not supported!");
//     }
//
//     // Grab the compass element
//     let canvas = document.getElementById('compass1');
//     // let canvas2 = document.getElementById('compass2');
//
//     // Canvas supported?
//     if (canvas.getContext('2d')) {
//         ctx = canvas.getContext('2d');
//
//         // Load the needle image
//         needle = new Image();
//         needle.src = 'jsLibrary/compass/needle.png';
//
//         // Load the compass image
//         img = new Image();
//         img.src = 'jsLibrary/compass/compass.png';
//         img.onload = imgLoaded;
//     } else {
//         alert("Canvas not supported!");
//     }
//
// }
function depth() {
    var depthX =  calcHypotenuse(staone[0], staone[1]);
    console.log('station 1 depth angle:'+calcAngleDegrees(depthX, staone[2]))
}
setInterval(depth, 5000);