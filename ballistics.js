"use strict";
var canvas = document.getElementById('canvas');
if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
}
else {
    alert("Canvas not supported!")
}

const caliber = 22;
const NULL_SHOT = [null, null];

function newRecord(guess){
    console.log("newRecord:", guess);
    let adjustment = guess.map(Math.round);
    return {guess: guess, adjustment: adjustment, shot: NULL_SHOT}
}
let history = [newRecord([0, 0])];

const TARGET_RED = 'rgb(255, 0, 0, 0.1)';
const BLACK = 'rgb(0, 0, 0, 0.5)';
const WHITE = 'rgb(255, 255, 255, 0.5)';

canvas.addEventListener('click', function(evt) {
    //var mousePos = getMousePos(canvas, evt);
    //var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y;
    console.log("Clicked at: " + evt.pageX + " " + evt.pageY);
    history[history.length - 1].shot = inchesFromPixelsCoords([evt.pageX, evt.pageY]);
    let newGuess = calcAdjustment(history);
    history.push(newRecord(newGuess))
    console.log(history);
    flashScreen();
}, false);

function drawTarget() {
    [1, 2, 3, 4, 5].forEach(
        r => {
            drawCircle(500, 500, 100 * r, TARGET_RED);
        }
    );
}

function flashScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTarget();
    history.forEach(
        (record, i) => {
            let [xPx, yPx] = pixelsFromInchesCoords(record.guess.map(inchesFromClicks));
            console.log("plotting guess:", xPx, yPx);
            drawCircle(xPx, yPx, caliber / 2, WHITE);
            if (! (record.shot === NULL_SHOT)){
                [xPx, yPx] = pixelsFromInchesCoords(record.shot);
                drawCircle(xPx, yPx, caliber / 2, BLACK, i);
            }
            else {
                console.log("skipped empty shot");
            }
            // TODO shot numbers
        }
    )
    writeTable();
}
function drawCircle(x, y, r, fillStyle, text=null) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill()
    if (!(text === null)){
        ctx.fillStyle = WHITE;
        ctx.strokeText(text, x, y);
    }

}

function undoShot(){
    // Todo: fix bug where you have to undo twice because of null shot
    console.log("Undoing shot")
    if (history.length > 1){
        history.pop();
    }
    else {
        history[0].shot = NULL_SHOT;
    }
    console.log(history);
    flashScreen();
}

function calcAdjustment(history){
    console.assert(
        !(history[history.length - 1].shot === null),
        "last shot was not taken."
    );
    let xs = [];
    let ys = [];
    history.forEach(
        record => {
            let [adjX, adjY] = record.adjustment;
            let [sX, sY] = record.shot;
            xs.push(clicksFromInches(sX - inchesFromClicks(adjX)));
            ys.push(clicksFromInches(sY - inchesFromClicks(adjY)));
        });
    let mean_x = xs.reduce((a, b) => a + b) / xs.length;
    let mean_y = ys.reduce((a, b) => a + b) / ys.length;
    let adjustment = [-mean_x, -mean_y];
    console.log("calculated adjustment:", adjustment);
    return adjustment;
}


let distance = 50; // TODO make this a form
const CLICKS_PER_MOA = 4;
let INCHES_PER_MOA = 1 * distance / 100;
let INCHES_PER_CLICK = INCHES_PER_MOA / CLICKS_PER_MOA;

function inchesFromClicks(clicks){
    return clicks * INCHES_PER_CLICK;
}

function clicksFromInches(inches){
    return inches / INCHES_PER_CLICK;
}

function inchesFromPixels(px){
    // TODO clean this up
    return (px - 500) / 100;
}

function pixelsFromInches(i){
    return i * 100 + 500;
}

function pixelsFromInchesCoords(xyIn){
    let [xIn, yIn] = xyIn;
    let xPx = xIn * 100 + 500;
    let yPx = 1000 - (yIn * 100 + 500);
    return [xPx, yPx];
}

function inchesFromPixelsCoords(xyPx){
    let [xPx, yPx] = xyPx;
    let xIn = (xPx - 500) / 100;
    let yIn = - (yPx - 500) / 100;
    return [xIn, yIn];

}

function writeTable() {
    // delete old table
    var table = document.getElementById("table");
    console.log("table:", table);
    Array.from(table.rows).forEach(
        (row, i) => {if (i > 0) table.deleteRow(1)}
    );
    console.log("length after deleting:", table.rows.length);
    console.log("kept header:", table.rows[0].id=="header");
    // write new table
    var lastWindage = 0;
    var lastElevation = 0;
    console.log("writing history to table:", history)
    history.forEach(
        record => {
            var tr = table.insertRow(-1);
            var absWindageCell = tr.insertCell(0);
            var absElevationCell = tr.insertCell(1);
            var margWindageCell = tr.insertCell(2);
            var margElevationCell = tr.insertCell(3);
            var shotXCell = tr.insertCell(4);
            var shotYCell = tr.insertCell(5);

            let absWindage = record.adjustment[0];
            let absElevation = record.adjustment[1];
            let margWindage = absWindage - lastWindage;
            let margElevation = absElevation - lastElevation;
            lastWindage = absWindage;
            lastElevation = absElevation;

            absWindageCell.innerHTML=absWindage;
            absElevationCell.innerHTML=absElevation;
            margWindageCell.innerHTML=margWindage;
            margElevationCell.innerHTML=margElevation;

            shotXCell.innerHTML=(record.shot[0] || "-");
            shotYCell.innerHTML=(record.shot[1] || "-");
            console.log(table);

        }
    )
    console.log("length after adding:", table.rows.length);
}

flashScreen();
