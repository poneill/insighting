"use strict";
console.log("starting");
var canvas = document.getElementById("canvas");
if (canvas.getContext) {
    var ctx = canvas.getContext("2d");
}
else {
    alert("Canvas not supported!");
}
const CLICKS_PER_MOA = 4;
const NULL_SHOT = [null, null];
const caliber = 22;  // TODO
const TARGET_RED = "rgb(255, 0, 0, 0.1)";
const BLACK = "rgb(0, 0, 0, 0.5)";
const WHITE = "rgb(255, 255, 255, 0.5)";

let history = freshHistory();
console.log("history after top level:", history);

function showDistance(){
    document.getElementById("distancereadout").innerText = distance;
}
// eslint-disable-next-line no-unused-vars
function readDistance() {
    console.log("calling readDistance");
    let v = document.getElementById("distance").value;
    console.log("value", v);
    distance = parseInt(v);
    console.log(distance);
    showDistance();
    history = freshHistory();
    flashScreen();
    console.log("history after read distance:", history);
}
var distance = 10;
showDistance();

function INCHES_PER_MOA() {
    return 1 * distance / 100;
}

function INCHES_PER_CLICK () {
    return INCHES_PER_MOA() / CLICKS_PER_MOA;
}

//readDistance();







console.log(NULL_SHOT);

// adjustment is made, THEN shot taken
function newRecord(guess, shot){
    let adjustment = guess.map(Math.round);
    return {guess: guess, adjustment: adjustment, shot: shot};
}

function freshHistory() {
    return [newRecord([0, 0], NULL_SHOT)];
}



function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}
canvas.addEventListener("click", function(evt) {
    //var mousePos = getMousePos(canvas, evt);
    //var message = "Mouse position: " + mousePos.x + "," + mousePos.y;
    console.log("history at beginning of click:", history);
    var pos = getMousePos(canvas, evt);
    console.log("Clicked at: " + pos.x + " " + pos.y);
    let shot = inchesFromPixelsCoords([pos.x, pos.y]);
    console.log("shot:", shot);
    history[history.length - 1].shot = shot;
    console.log("history after updating shot:", history);
    let currentGuess = calcAdjustment(history);
    console.log("currentGuess:", currentGuess);
    history.push(newRecord(currentGuess, NULL_SHOT));
    console.log("history at end of click:", history);
    flashScreen();
}, false);

function drawTarget() {
    // draw circles
    [1, 2, 3, 4, 5].forEach(
        r => {
            drawCircle(500, 500, 100 * r, TARGET_RED);
        }
    );
    // draw grid
    for (var j = 1; j < canvas.height; j += 100){
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
    }

    for (var i = 1;  i < canvas.width; i+=100){
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.strokeStyle = "gray";
        ctx.stroke();
    }
}

function flashScreen() {
    console.log(history);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTarget();
    history.forEach(
        (record, i) => {
            console.log("processing record:", record);
            let guessInches = record.guess.map(inchesFromClicks);
            console.log("guessInches", guessInches);
            let [xPx, yPx] = pixelsFromInchesCoords(guessInches);
            console.log("plotting guess:", xPx, yPx);
            drawCircle(xPx, yPx, caliber / 2, WHITE);
            if (record.shot != NULL_SHOT){
                [xPx, yPx] = pixelsFromInchesCoords(record.shot);
                drawCircle(xPx, yPx, caliber / 2, BLACK, i);
            }
            // TODO shot numbers
        }
    );
    writeTable();
}
function drawCircle(x, y, r, fillStyle, text=null) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
    if (!(text === null)){
        ctx.strokeStyle = WHITE;
        ctx.fillStyle = WHITE;
        ctx.strokeText(text, x, y);
    }

}

// eslint-disable-next-line no-unused-vars
function undoShot(){
    // Todo: fix bug where you have to undo twice because of null shot
    console.log("Undoing shot");
    if (history.length > 1){
        history.pop();
        history[history.length - 1].shot = NULL_SHOT;
    }
    else {
        console.log("Tried to undo empty history.");
    }
    console.log(history);
    flashScreen();
}

function calcAdjustment(history){
    console.log("calculating adjustment with:", history);
    if (history.length == 0) {
        return [0, 0];
    }
    else {
        let xs = [];
        let ys = [];
        history.forEach(
            record => {
                if (record.shot === NULL_SHOT) {
                    console.log("skipping null shot");
                }
                else{
                    let [adjX, adjY] = record.adjustment;
                    let [sX, sY] = record.shot;
                    xs.push(clicksFromInches(sX - inchesFromClicks(adjX)));
                    ys.push(clicksFromInches(sY - inchesFromClicks(adjY)));}
            });
        let mean_x = xs.reduce((a, b) => a + b) / xs.length;
        let mean_y = ys.reduce((a, b) => a + b) / ys.length;
        let adjustment = [-mean_x, -mean_y];
        console.log("calculated adjustment:", adjustment);
        return adjustment;
    }
}



function inchesFromClicks(clicks){
    console.log("clicks", clicks);
    return clicks * INCHES_PER_CLICK();
}

function clicksFromInches(inches){
    return inches / INCHES_PER_CLICK();
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

function clearTable() {
    // delete data rows of adjustment table
    var table = document.getElementById("adjustmenttable");
    console.log("table:", table);
    Array.from(table.rows).forEach(
        // don't delete the header
        (row, i) => {if (i > 0) table.deleteRow(1);}
    );

}
function writeTable() {
    clearTable();
    var table = document.getElementById("adjustmenttable");
    // write new table
    var lastWindage = 0;
    var lastElevation = 0;
    history.forEach(
        record => {
            // add row to table, get refs
            var tr = table.insertRow(-1);
            var margWindageCell = tr.insertCell(0);
            var margElevationCell = tr.insertCell(1);
            var absWindageCell = tr.insertCell(2);
            var absElevationCell = tr.insertCell(3);
            var shotXCell = tr.insertCell(4);
            var shotYCell = tr.insertCell(5);

            // do marginal adj calculations
            let absWindage = record.adjustment[0];
            let absElevation = record.adjustment[1];
            let margWindage = absWindage - lastWindage;
            let margElevation = absElevation - lastElevation;
            var shotX, shotY;
            if (!(record.shot === NULL_SHOT)){
                shotX = record.shot[0].toFixed(2);
                shotY = record.shot[1].toFixed(2);
            }
            else {
                [shotX, shotY] = ["-", "-"];
            }
            lastWindage = absWindage;
            lastElevation = absElevation;


            // update refs
            absWindageCell.innerHTML=absWindage;
            absElevationCell.innerHTML=absElevation;
            margWindageCell.innerHTML=margWindage;
            margElevationCell.innerHTML=margElevation;
            shotXCell.innerHTML=shotX;
            shotYCell.innerHTML=shotY;
        }
    );
}

flashScreen();
