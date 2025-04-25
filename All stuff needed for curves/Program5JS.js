var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

var i;
var drawSelectVar = "DDALine";
//for (i = 0; i < 200; i++) { 
//    ctx.fillRect(i,i,1,1); // fill in the pixel at (10,10)
//}

//Get all elements for different inputs
const circleStuff = document.getElementById("circleStuff");
const shapeStuff = document.getElementById("shapeStuff");
const curveStuff = document.getElementById("curveStuff");
const shapeSelection = document.getElementById("shapes");

//get elements for all inputs

//circle inputs
const xInput = document.getElementById("x");
const yInput = document.getElementById("y");
const rInput = document.getElementById("r");

//shape/algo inputs
const x1Input = document.getElementById("x1");
const y1Input = document.getElementById("y1");
const x2Input = document.getElementById("x2");
const y2Input = document.getElementById("y2");

const x3Input = document.getElementById("x3");
const y3Input = document.getElementById("y3");
const x4Input = document.getElementById("x4");
const y4Input = document.getElementById("y4");

//This function is to hide unneeded inputs when a shape is selected and not a curve
function updateDrawSelection() {
    //global variable for getting the selected shape
    drawSelectVar = shapeSelection.value;
    console.log(drawSelectVar);
    
    
    //show only circle inputs
    if (drawSelectVar == "MidpointCircle") {
        circleStuff.style.display = "inline";
        shapeStuff.style.display = "none";
        curveStuff.style.display = "none";
        console.log("This ran CIRCLE STUFF GONE")
    }//This is line/shape inputs
    else if (drawSelectVar == "DDALine" || drawSelectVar == "MidpointLine" || drawSelectVar == "MidpointEllipse") {
        circleStuff.style.display = "none";
        shapeStuff.style.display = "inline";
        curveStuff.style.display = "none";
    }
    else {//curve inputs
        circleStuff.style.display = "none";
        shapeStuff.style.display = "inline";
        curveStuff.style.display = "inline";
    }
    
}
shapeSelection.addEventListener("input", updateDrawSelection);



//These are all the functions to generate these shapes WITHOUT primitives
//only using points

function generateShapeOrCurve() {
    
    //input values for all shapes and algos
    var x = parseInt(xInput.value) || 0;
    var y = parseInt(yInput.value) || 0;
    var r = parseInt(rInput.value) || 0;

    var x1 = parseInt(x1Input.value) || 0;
    var y1 = parseInt(y1Input.value) || 0;
    var x2 = parseInt(x2Input.value)|| 0;
    var y2 = parseInt(y2Input.value) || 0;

    var x3 = x3Input.value || 0;
    var y3 = y3Input.value || 0;
    var x4 = x4Input.value || 0;
    var y4 = y4Input.value || 0;

    if (drawSelectVar == "DDALine"){
        DDA(x1, y1, x2, y2);
    }
    else if (drawSelectVar == "MidpointLine"){
        MidpointLine(x1, y1, x2, y2);
    }
    else if (drawSelectVar == "MidpointCircle"){
        MidpointCircle(x,y,r);
    }
    else if (drawSelectVar == "MidpointEllipse"){
        MidpointEllipse(x1, y1, x2, y2);
    }
    else if (drawSelectVar == "BezierCurve"){
       
        let p1 = { x: x1, y: y1 };
        let p2 = { x: x2, y: y2 };
        let p3 = { x: x3, y: y3 };
        let p4 = { x: x4, y: y4 };
        //Draw the curve with 100 subdivisions
        bezier(100, p1, p2, p3, p4);
    }
    else if (drawSelectVar == "HermiteCurve"){

        let p1 = { x: x1, y: y1 };
        let p4 = { x: x2, y: y2 };
        let r1 = { x: x3, y: y3 };
        let r4 = { x: x4, y: y4 };
        hermite(100, p1, p4, r1, r4)
    }
    else if (drawSelectVar == "B-SplineCurve"){

        let p1 = { x: x1, y: y1 };
        let p2 = { x: x2, y: y2 };
        let p3 = { x: x3, y: y3 };
        let p4 = { x: x4, y: y4 };

        spline(100, p1, p2, p3, p4);
    }

}




function DDA(x0, y0, x1, y1) {

    var i;
 
    var dx = x1 - x0;
    var dy = y1 - y0;

    //basically taking the max number of points
    var numPoints = Math.max(Math.abs(dx), Math.abs(dy));
    var xIncrement = dx / numPoints;
    var yIncrement = dy / numPoints;

    var x = x0; 
    var y = y0;
    
    //add onto the starting position instead of making the staring position
    //incorporated into the forloop
    for (var i = 0; i <= numPoints; i++) {
        ctx.fillRect(x, y, 1, 1);//Draw each pixel
        x += xIncrement;   
        y += yIncrement;
    }
}

//DD A Function for line generation 
function MidpointLine(x0, y0, x1, y1) {
    //This basically ensures the line is always drawn from left to right
    if (x0 > x1) {
        [x0, x1] = [x1, x0];
        [y0, y1] = [y1, y0];
    }

    let dx = x1 - x0; 
    let dy = y1 - y0;
    let x = x0;  
    let y = y0;

    //Handle vertical lines
    if (dx === 0) {
        let yStart = Math.min(y0, y1);
        let yEnd = Math.max(y0, y1);
        for (let y = yStart; y <= yEnd; y++) {
        ctx.fillRect(x0, y, 1, 1);
        }
        return;
    }

    //Handle horizontal lines
    if (dy === 0) {
        for (let x = x0; x <= x1; x++) {
        ctx.fillRect(x, y0, 1, 1);
        }
        return;
    }


    //This handles the case where the slope isn't positive
    if (Math.abs(dy) > Math.abs(dx)) { 
        //If the line is going down we swap x and y
        [x, y] = [y, x];
        [dx, dy] = [dy, dx];
        [x0, y0] = [y0, x0];
        [x1, y1] = [y1, x1];
    }

    //checking if the line is going up or down
    let yStep = (dy >= 0) ? 1 : -1; 
    dy = Math.abs(dy);

    let d = 2 * dy - dx;
    let incrE = 2 * dy;
    let incrNE = 2 * (dy - dx);

    while (x <= x1) {
        //checking if slop isn't positive
        if (Math.abs(dy) > Math.abs(dx)) {
            //swap back if slope is going down
            ctx.fillRect(y, x, 1, 1);
        } else {
            ctx.fillRect(x, y, 1, 1);
        }

        if (d <= 0) {
            d += incrE;
        } else {
            d += incrNE;
            y += yStep;
        }
        x++;
    }
}



//Draw all points but for 1 pixel each
function CirclePoints(cx, cy, x, y) {
    ctx.fillRect( cx+x, cy+y,1,1);
    ctx.fillRect( cx+y, cy+x,1,1);
    ctx.fillRect( cx+y, cy-x,1,1);
    ctx.fillRect( cx+x, cy-y,1,1);
    ctx.fillRect( cx-x, cy-y,1,1);
    ctx.fillRect( cx-y, cy-x,1,1);
    ctx.fillRect( cx-y, cy+x,1,1);
    ctx.fillRect( cx-x, cy+y,1,1);
}

function MidpointCircle(x0, y0, radius) {
    var x = 0;
    var y = radius;
    //Initial decision parameter
    var d = 1 - radius;

    CirclePoints(x0, y0, x, y);
    //Should be y >= x to ensure full octant coverage
    while (y >= x) { 
        if (d < 0) {  
            d = d + 2 * x + 1;
        } else {
            y--;
            d = d + 2 * (x - y) + 1;
        }
        x++;
        //draws full circle
        CirclePoints(x0, y0, x, y); 
    }
}

//ellipse points with cx cy translation
function EllipsePoints(cx, cy, x, y)
{
    ctx.fillRect(cx+x, cy+y,1,1);
    ctx.fillRect(cx-x, cy+y,1,1);
    ctx.fillRect(cx+x, cy-y,1,1);
    ctx.fillRect(cx-x, cy-y,1,1);
}

// midpoint algorith for ellipses; assumes center is at (0, 0);
function MidpointEllipse(x0, y0, a, b) 
{ 
    var d2;
    var x = 0;
    var y = b;
    var d1 = (b*b) - (a*a*b) + (0.25*a*a);
    
    EllipsePoints(x0,y0,x, y);
  
    // test gradient if still in region 1
    while (((a*a)*(y-0.5)) > ((b*b)*(x+1))) {
        if (d1 < 0) {
            d1 = d1 + ((b*b)*(2*x+3));
        }
        else {
            d1 = d1 + ((b*b)*(2*x+3)) + ((a*a)*(-2*y+2));
            y--;
        }
        x++;
        EllipsePoints(x0,y0,x, y);
    }   //region 1
    
    d2 = ((b*b)*(x+0.5)*(x+0.5))+((a*a)*(y-1)*(y-1))-(a*a*b*b);
    while (y > 0) {
        if (d2 < 0) {
            d2 = d2 + ((b*b)*(2*x+2)) + ((a*a)*(-2*y+3));
            x++;
        }
        else {
            d2 = d2 + ((a*a)*(-2*y+3));
        }
        y--;
        EllipsePoints(x0,y0,x, y);//region 2
    }   
} 

function drawPixel(x, y) {
    //draws a pixel in the specified x,y replaces the func PRINT_TXY(t,x,y)
    ctx.fillRect(x, y, 1, 1);
}

// n: how many subdivisions for t in the range [0,1]
function bezier(n, p1, p2, p3, p4) {
    let delta = 1.0 / n;
    let t = 0.0;

    let x = p1.x;
    let y = p1.y;
    //Drawing the first point
    drawPixel(x, y); 

    for (let i = 0; i < n; i++) { 
        t += delta;
        let t2 = t * t;
        let t3 = t2 * t; 

        let q1 = (1 - t);
        let q2 = q1 * q1;
        let q3 = q2 * q1;

        x = q3*p1.x + (3*t*q2)*p2.x + (3*t2*q1)*p3.x + t3*p4.x;
        y = q3*p1.y + (3*t*q2)*p2.y + (3*t2*q1)*p3.y + t3*p4.y;

        drawPixel(x, y); 
    }
}

// n: how many subdivisions for t in the range [0,1]
function hermite( n, p1, p4, r1, r4)
{

    let x, y;
    let delta = 1.0/ n;
    let t;

    x = p1.x;
    y = p1.y;
    t = 0.0;
    //draw first point
    drawPixel(x, y);
    for (let i = 0; i < n; i++) {
        t += delta;
        let t2 = t * t;
        let t3 = t2 * t;

        x = ((2*t3)-(3*t2)+1)*p1.x + ((-2*t3)+(3*t2))*p4.x + (t3-(2*t2)+t)*r1.x + (t3-t2)*r4.x;
        y = ((2*t3)-(3*t2)+1)*p1.y + ((-2*t3)+(3*t2))*p4.y + (t3-(2*t2)+t)*r1.y + (t3-t2)*r4.y;
        drawPixel(x, y);
    }
    
}

// n: how many subdivisions for t in the range [0,1]
function spline(n, p1, p2, p3, p4)
{

      

    let x, y;
    let delta = 1.0/ n;
    let t;


    x = p1.x;
    y = p1.y;
    t = 0.0;
    drawPixel(x, y);
    for (let i = 0; i < n; i++) {
        t += delta;
        let t2 = t * t;
        let t3 = t2 * t;  

        x = (((1-t3)/6)*p1.x)+(((3*t3-6*t2+4)/6)*p2.x)+(((-3*t3+3*t2+3*t+1)/6)*p3.x)+((t3/6)*p4.x);
        y = (((1-t3)/6)*p1.y)+(((3*t3-6*t2+4)/6)*p2.y)+(((-3*t3+3*t2+3*t+1)/6)*p3.y)+((t3/6)*p4.y);
        
        drawPixel(x, y); 
    }
    
}

//This is all the code needed to handle the same shapes USING primitives to compare output

function generateShapeOrCurvePrim() {
    
    //input values for all shapes and algos
    var x = parseInt(xInput.value) || 0; 
    var y = parseInt(yInput.value) || 0;
    var r = parseInt(rInput.value) || 0;

    var x1 = parseInt(x1Input.value) || 0;
    var y1 = parseInt(y1Input.value) || 0;
    var x2 = parseInt(x2Input.value)|| 0;
    var y2 = parseInt(y2Input.value) || 0;

    var x3 = x3Input.value || 0;
    var y3 = y3Input.value || 0;
    var x4 = x4Input.value || 0;
    var y4 = y4Input.value || 0;

    if (drawSelectVar == "DDALine" || drawSelectVar == "MidpointLine"){
        DDAandMidpointLinePrim(x1, y1, x2, y2);
    }
    else if (drawSelectVar == "MidpointCircle"){
        MidpointCirclePrim(x,y,r);
    }
    else if (drawSelectVar == "MidpointEllipse"){
        MidpointEllipsePrim(x1, y1, x2, y2);
    }
    else if (drawSelectVar == "BezierCurve"){
       
        let p1 = { x: x1, y: y1 };
        let p2 = { x: x2, y: y2 };
        let p3 = { x: x3, y: y3 };
        let p4 = { x: x4, y: y4 };  

        BezierPrim(p1, p2, p3, p4);
    }
    else if (drawSelectVar == "HermiteCurve"){

        let p1 = { x: x1, y: y1 };
        let p4 = { x: x2, y: y2 };
        let r1 = { x: x3, y: y3 };
        let r4 = { x: x4, y: y4 };
        HermitePrim(100, p1, p4, r1, r4)
    }
    else if (drawSelectVar == "B-SplineCurve"){

        let p1 = { x: x1, y: y1 };
        let p2 = { x: x2, y: y2 };
        let p3 = { x: x3, y: y3 };
        let p4 = { x: x4, y: y4 };

        BSplinePrim(100, p1, p2, p3, p4);
    }

}

function DDAandMidpointLinePrim(x0, y0, x1, y1) {
    ctx.beginPath();

    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

function MidpointCirclePrim(x0, y0, radius) {


    ctx.beginPath();
    ctx.arc(x0, y0, radius, 0, 2 * Math.PI);
    ctx.stroke();
}

function MidpointEllipsePrim(x0, y0, a, b) {

    ctx.beginPath();
    ctx.ellipse(x0, y0, a, b, 0, 0, 2 * Math.PI);
    ctx.stroke();

}

//This curve is already supported with canvas API
function BezierPrim(p1, p2, p3, p4) {

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.bezierCurveTo(p2.x, p2.y, p3.x, p3.y, p4.x, p4.y); 
    ctx.stroke();
    
}

//These two curves arent supported in the canvas API so much of it as the same as previous implementation
function HermitePrim(n, p1, p4, r1, r4) {

    ctx.beginPath(); 
    ctx.moveTo(p1.x, p1.y);

    for (let i = 0; i <= n; i++) {  
        let t = i / n;
        let t2 = t * t;   
        let t3 = t2 * t;

        let x = ((2*t3)-(3*t2)+1)*p1.x + ((-2*t3)+(3*t2))*p4.x + (t3-(2*t2)+t)*r1.x + (t3-t2)*r4.x;
        let y = ((2*t3)-(3*t2)+1)*p1.y + ((-2*t3)+(3*t2))*p4.y + (t3-(2*t2)+t)*r1.y + (t3-t2)*r4.y;
        
        ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function BSplinePrim(n, p1, p2, p3, p4) {

    ctx.beginPath();
    let t = 0;  
    let t2 = t * t;
    let t3 = t2 * t;
    
    let x = (((1-t3)/6)*p1.x)+(((3*t3-6*t2+4)/6)*p2.x)+(((-3*t3+3*t2+3*t+1)/6)*p3.x)+((t3/6)*p4.x);
    let y = (((1-t3)/6)*p1.y)+(((3*t3-6*t2+4)/6)*p2.y)+(((-3*t3+3*t2+3*t+1)/6)*p3.y)+((t3/6)*p4.y);
    
    //we move to where the curve actually starts
    ctx.moveTo(x, y);

    //Loop only from 1 to n-1
    for (let i = 1; i < n; i++) { 
        t = i / n; 
        t2 = t * t;
        t3 = t2 * t;

        x = (((1-t3)/6)*p1.x)+(((3*t3-6*t2+4)/6)*p2.x)+(((-3*t3+3*t2+3*t+1)/6)*p3.x)+((t3/6)*p4.x);
        y = (((1-t3)/6)*p1.y)+(((3*t3-6*t2+4)/6)*p2.y)+(((-3*t3+3*t2+3*t+1)/6)*p3.y)+((t3/6)*p4.y);

        ctx.lineTo(x, y);
    }
    ctx.stroke();
}
