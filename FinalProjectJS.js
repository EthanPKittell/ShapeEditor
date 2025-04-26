//Variables for handling shape selection with transformations
let shapes = [];
let undoStack = [];
//makes sure the undo stack doesn't get too big
if (undoStack.length >= 20) undoStack.shift();
let selectedShape = null;

let multipoints = [];

//copy var
let clipboardShape = null;

let gridOn = false;
var shapeSelectVar = "line"
var sides = 5;
var modeSelectVar = "draw";
var thicknessSelect = 1;
var shapeColorSelect = "white"

const shapeSelectStuff = document.getElementById("shapeStuff");
const polygonStuff = document.getElementById("polygonSides");
const polygonSides = document.getElementById("sides");
const thicknessSelectVal = document.getElementById("thicknessSelect");
const colorIndicator = document.getElementById("colorIndicator");

//copy paste functions
function copyShape() {
    if (selectedShape) {
        clipboardShape = JSON.parse(JSON.stringify(selectedShape)); // deep copy
        console.log("Copied shape:", clipboardShape);
    } else {
        console.log("No shape selected to copy.");
    }
}

function pasteShape() {
    if (clipboardShape) {
        let pastedShape = JSON.parse(JSON.stringify(clipboardShape)); // clone it again

        // Offset pasted shape so it's not directly on top
        if (pastedShape.points) {
            for (let pt of pastedShape.points) {
                pt.x += 20;
                pt.y += 20;
            }
        } else {
            pastedShape.x += 20;
            pastedShape.y += 20;
        }

        shapes.push(pastedShape);
        pushUndoState();
        drawShapes();
        console.log("Pasted shape:", pastedShape);
    } else {
        console.log("Clipboard is empty.");
    }
}

//event listeners for all ctrl + actions
document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        copyShape();
    }
    if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        pasteShape();
    }
    if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
    }
});

//grid toggle
function toggleSnapGrid() {
    gridOn = !gridOn;
    drawShapes();

}
function drawGrid() {
    const spacing = 30; // grid size
    ctx1.clearRect(0, 0, canvas1.width, canvas1.height); // clear old grid
    //clearing the canvss
    ctx2.clearRect(0, 0, canvas1.width, canvas1.height);
    //fill the background
    ctx1.fillRect(0, 0, canvas1.width, canvas1.height);


    if (!gridOn) return;

    ctx1.beginPath();
    ctx1.strokeStyle = "black";
    ctx1.lineWidth = 1.0;

    for (let x = 0; x <= canvas2.width; x += spacing) {
        ctx1.moveTo(x, 0);
        ctx1.lineTo(x, canvas2.height);
    }

    for (let y = 0; y <= canvas2.height; y += spacing) {
        ctx1.moveTo(0, y);
        ctx1.lineTo(canvas2.width, y);
    }

    ctx1.stroke();
}

//file saving functions
function saveJPEG() {
    const canvas = document.getElementById("layer1"); // your main canvas
    const image = canvas.toDataURL("image/jpeg");

    const a = document.createElement("a");
    a.href = image;
    a.download = "canvas_image.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const canvas = document.getElementById("layer1");

    const imageData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height]
    });

    pdf.addImage(imageData, 'JPEG', 0, 0, canvas.width, canvas.height);
    pdf.save("canvas_diagram.pdf");
}

function saveDiagram() {
    const dataStr = JSON.stringify(shapes, null, 2); //Pretty-print
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagram.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

  document.getElementById('fileInput').addEventListener('change', loadDiagram);

function loadDiagram(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const loadedShapes = JSON.parse(e.target.result);
      shapes = loadedShapes;
      drawShapes();
    } catch (err) {
      alert("Invalid JSON file.");
      console.error(err);
    }
  };

  reader.readAsText(file);
}

function initialize(){

	//Get the base layercanvas object
    canvas1 = document.getElementById("layer1");

   	ctx1 = canvas1.getContext("2d");
	
	ctx1.fillStyle = "gray";

    ctx1.fillRect(0, 0, canvas1.width, canvas1.height);

	//Get the top layer canvas object
	canvas2 = document.getElementById("layer2");

	ctx2 = canvas2.getContext("2d");	

	is_down = false;// mouse hasn't been pressed

    //make polygon stuff initially invisible
    polygonStuff.style.display = "none";

    
}

function updateThicknessSelection(){


    thicknessSelect = thicknessSelectVal.value;

}

thicknessSelectVal.addEventListener("input", updateThicknessSelection);

//Support multiple colors
function setShapeColor(color) {
    shapeColorSelect = color;
    colorIndicator.innerText = 'CURRENT COLOR SELECTED: ' + String(color).toUpperCase();
}

/*function undo() {
    shapes.pop();
    drawShapes();
}*/
function pushUndoState() {
    undoStack.push(JSON.parse(JSON.stringify(shapes))); //deep copy
    
    //if (undoStack.length > 20) undoStack.shift(); // optional limit
}
function undo() {
    if (undoStack.length > 0) {
        
    shapes = undoStack.pop();
    
      drawShapes();
    
      console.log(shapes);
      console.log(undoStack);
    } else {
    
      console.log("Nothing to undo!");
      shapes = [];
      drawShapes();
    }
  }
//snap to grid function for these mouse funcs

function snap(coord, spacing = 30) {
    return Math.round(coord / spacing) * spacing;
}



// callback for mouse down events
function mouse_down(event) {

	xDown = event.clientX;
	yDown = event.clientY;

    if (gridOn) {
        xDown = snap(xDown);
        yDown = snap(yDown);
    }

	is_down = true;    
    
	coords = "X: "+ x + " Y: " + y + " is_down = " + is_down;

	//document.getElementById("val1").innerHTML = coords;

    //If we are doing some type of translation/scaling/rotation we can select shapes
    if (modeSelectVar != "draw" && xDown <= canvas1.width && yDown <= canvas1.height){
        //function for selecting the shape based on its saved coordinates
        selectShapeToTransform(event);
    }
}

// callback for mouse move events
function mouse_move(event) {

	x = event.clientX;
	y = event.clientY;

	if(is_down)	{
		ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

		// elastic band
		ctx2.strokeStyle = "yellow";

        //checking that the mouse is actually IN the canvas before doing anything
        if (x <= canvas1.width && y <= canvas1.height) {
            ctx2.beginPath();
            ctx2.strokeRect(xDown,yDown, x-xDown, y-yDown);
            //This is where line rubberbanding begins
            if (modeSelectVar == "draw") {
                if (shapeSelectVar == "line"){

                    //draws a line from where the mouse is down to where it is dragged
                    ctx2.moveTo(xDown, yDown);
                    ctx2.lineTo(x, y);
                
                }
                //this is where the cricle begins
                else if(shapeSelectVar == "circle"){

                    //get radius from where mouse is down to where it is dragged
                    let radius = Math.sqrt((x - xDown) ** 2 + (y - yDown) ** 2);
                    //make 2 semi circles for a full circle
                    ctx2.arc(xDown,yDown,radius,0,2*Math.PI);
                    
                }
                //this is where the rectangle begins
                else if(shapeSelectVar == "rectangle"){
                    
                    //using the canvas rectangle function
                    ctx2.strokeRect(xDown,yDown, x-xDown, y-yDown);
                    
                }
                //this is where the ellipse begins
                else if(shapeSelectVar == "ellipse"){
                    
                    //using the canvas ellipse function
                    ctx2.ellipse(xDown, yDown, Math.abs(x-xDown), Math.abs(y-yDown), 0, 0, 2 * Math.PI);
                    //using abs becuase ellipse doesn't use negative vals
                }
                //this is where the triangle begins
                else if(shapeSelectVar == "triangle"){
                    
                    //getting midpoint of base
                    let midX = (xDown + x) / 2; 

                    ctx2.beginPath();
                    //bottom-left point of triangle
                    ctx2.moveTo(xDown, y);
                    //bottom right
                    ctx2.lineTo(x, y);
                    //top point
                    ctx2.lineTo(midX, yDown);
                    //complete triangle
                    ctx2.closePath();
                    
                    
                }
                //this is where the polygon begins
                else if(shapeSelectVar == "polygon"){
                    
                    //get radius of the polygon
                    let radius = Math.sqrt((x - xDown) ** 2 + (y - yDown) ** 2);
                    
                    ctx2.beginPath();
                    //loop for creating the polygon depending on the number of sides selected
                    for (let i = 0; i < sides; i++) {
                        //getting the angle for each point of the polygon
                        let angle = (i * 2 * Math.PI) / sides; 
                        //getting the coordinates for each polygon
                        let xPos = xDown + radius * Math.cos(angle);
                        let yPos = yDown + radius * Math.sin(angle);
                        if (i === 0) {
                            ctx2.moveTo(xPos, yPos);
                        } else {
                            ctx2.lineTo(xPos, yPos);
                        }
                    }
                    ctx2.closePath(); // Connects last point to the first
                    
                    
                }
                //this is where the square begins
                else if(shapeSelectVar == "square"){
                     
                    let dx = x - xDown;
                    let dy = y - yDown;   

                   //I have it using the min for both sides because I want to keep the square sides equal
                    let side = Math.min(Math.abs(dx), Math.abs(dy)); 

                    //Need to keep  the direction of dragging (quadrant handling) 
                    let drawX = dx < 0 ? xDown - side : xDown;
                    let drawY = dy < 0 ? yDown - side : yDown;

                    ctx2.strokeRect(drawX, drawY, side, side);
                    
                }
            }
            else if (modeSelectVar == "translate") {
                
                //function for translating
                moveShape(event);

            }
            else if (modeSelectVar == "scale"){

                //functiion for scaling
                scaleShape(event);

            }
            else if (modeSelectVar == "rotate"){

                //function for rotation
                rotateShape(event);
            }
            ctx2.stroke();
        }
        
	}

	coords = "X: "+ x + " Y: " + y +" is_down = " + is_down;	
	//document.getElementById("val2").innerHTML = coords;
}


// callback for mouse up events
function mouse_up(event) {

	xUp = event.clientX;
	yUp = event.clientY;

    if (gridOn) {
        xUp = snap(xUp);
        yUp = snap(yUp);
    }
    

	is_down = false;

	ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    
	coords = "X: "+ xUp + " Y: " + yUp +" is_down = " + is_down;

    if (xUp <= canvas1.width && yUp <= canvas1.height) {
        
        ctx1.beginPath();
        //this is where line rubberbanding ends (mouse up completes line)
        if (modeSelectVar == "draw") {

            //same code as mouse move for drawing the line
            if (shapeSelectVar == "line"){
                ctx1.moveTo(xDown, yDown);
                //ctx1.lineTo(event.offsetX, event.offsetY);
                ctx1.lineTo(xUp, yUp);
                //final shape look is white with a wider line width to show it has been drawn
                ctx1.strokeStyle = shapeColorSelect;
                ctx1.lineWidth = thicknessSelect;
                //creating object to define shape for when we redraw all shapes
                let newShape = { type: shapeSelectVar, x: xDown, y: yDown, width: xUp - xDown, height: yUp - yDown, angle: 0, thickness: thicknessSelect, colorVal: shapeColorSelect};
                pushUndoState();
                shapes.push(newShape);
                //saving the shape
                
            }
            //circle end
            else if(shapeSelectVar == "circle"){
                let radius = Math.sqrt((xUp - xDown) ** 2 + (yUp - yDown) ** 2);
                ctx1.arc(xDown,yDown,radius,0,2*Math.PI);
                ctx1.strokeStyle = shapeColorSelect;
                ctx1.lineWidth = thicknessSelect;
                let newShape = { type: shapeSelectVar, x: xDown, y: yDown, width: xUp - xDown, height: yUp - yDown, angle: 0 , thickness: thicknessSelect, colorVal: shapeColorSelect};
                newShape.radius = Math.sqrt((xUp - xDown) ** 2 + (yUp - yDown) ** 2);
                //added radius to the shape object for redrawing
                pushUndoState();
                shapes.push(newShape); 
                //saving the shape
                
            }
            //rectangle end
            else if(shapeSelectVar == "rectangle"){
                
                ctx1.strokeRect(xDown,yDown, xUp-xDown, yUp-yDown);
                ctx1.strokeStyle = shapeColorSelect;
                ctx1.lineWidth = thicknessSelect;
                let newShape = { type: shapeSelectVar, x: xDown, y: yDown, width: xUp - xDown, height: yUp - yDown, angle: 0, thickness: thicknessSelect, colorVal: shapeColorSelect};
                pushUndoState();
                shapes.push(newShape);
                
                
            }
            //rectangle end
            else if(shapeSelectVar == "ellipse"){
                
                
                ctx1.ellipse(xDown, yDown, Math.abs(xUp-xDown), Math.abs(yUp-yDown), 0, 0, 2 * Math.PI);
                    //using abs becuase ellipse doesn't use negative vals
                ctx1.strokeStyle = shapeColorSelect;
                ctx1.lineWidth = thicknessSelect;
                let newShape = { type: shapeSelectVar, x: xDown, y: yDown, width: xUp - xDown, height: yUp - yDown, angle: 0, thickness: thicknessSelect, colorVal: shapeColorSelect};
                pushUndoState();
                shapes.push(newShape);
                
                
            }
            //square end
            else if(shapeSelectVar == "square"){
                
                ctx1.strokeStyle = shapeColorSelect;
                ctx1.lineWidth = thicknessSelect;
                //took this from my mouse move function
                let dx = xUp - xDown;
                let dy = yUp - yDown;   

                //I have it using the min for both sides because I want to keep the square sides equal
                let side = Math.min(Math.abs(dx), Math.abs(dy)); 

                //Need to keep  the direction of dragging (quadrant handling) 
                let drawX = dx < 0 ? xDown - side : xDown;
                let drawY = dy < 0 ? yDown - side : yDown;

                ctx1.strokeRect(drawX, drawY, side, side);
                
                
                let newShape = { type: shapeSelectVar, x: drawX, y: drawY, width: side, height: side, angle: 0, thickness: thicknessSelect, colorVal: shapeColorSelect};
                pushUndoState();
                shapes.push(newShape);
                
                
            }
            //triangle end
            else if(shapeSelectVar == "triangle"){
                let midX = (xDown + xUp) / 2;

                ctx1.beginPath();
                ctx1.moveTo(xDown, yUp);
                ctx1.lineTo(xUp, yUp);
                ctx1.lineTo(midX, yDown);
                ctx1.closePath();
                ctx1.strokeStyle = shapeColorSelect;
                ctx1.lineWidth = thicknessSelect;
                let newShape = { type: shapeSelectVar, x: xDown, y: yDown, width: xUp - xDown, height: yUp - yDown, angle: 0, thickness: thicknessSelect, colorVal: shapeColorSelect};
                pushUndoState();
                shapes.push(newShape);
                
                
            }
            //curve end
            else if(shapeSelectVar == "curve"){
                
                multipoints.push({ x: xUp, y: yUp });
                console.log(multipoints)
                if (multipoints.length == 4){
                ctx1.beginPath();
                ctx1.moveTo(multipoints[0].x, multipoints[0].y);
                ctx1.bezierCurveTo(multipoints[1].x, multipoints[1].y, multipoints[2].x, multipoints[2].y, multipoints[3].x, multipoints[3].y); 
                
                ctx1.strokeStyle = shapeColorSelect;
                ctx1.lineWidth = thicknessSelect;
                
                let newShape = { type: shapeSelectVar, points: multipoints, width: xUp - xDown, height: yUp - yDown, angle: 0, thickness: thicknessSelect, colorVal: shapeColorSelect};
                pushUndoState();
                shapes.push(newShape);
                multipoints = []; //just clearing the array
                

                }
                
            }
            //polyline end
            else if(shapeSelectVar == "polyline"){
                multipoints.push({ x: xUp, y: yUp });
                console.log(multipoints)
                if (multipoints.length == 4){
                    ctx1.strokeStyle = shapeColorSelect;
                    ctx1.lineWidth = thicknessSelect;
                    for (let i = 0; i < multipoints.length-1; i++){
                        
                        ctx1.moveTo(multipoints[i].x, multipoints[i].y);
                        ctx1.lineTo(multipoints[i+1].x, multipoints[i+1].y);
                        ctx1.stroke();
                    }
                
                let newShape = { type: shapeSelectVar, points: multipoints, width: xUp - xDown, height: yUp - yDown, angle: 0, thickness: thicknessSelect, colorVal: shapeColorSelect};
                pushUndoState();
                shapes.push(newShape);
                multipoints = []; //just clearing the array
                
                }
            }
            //polygon end
            else if(shapeSelectVar == "polygon"){
                
                //same code as in mouse_move for the drawing of this polygon
                let radius = Math.sqrt((xUp - xDown) ** 2 + (yUp - yDown) ** 2);

                ctx1.beginPath();
                ctx1.strokeStyle = shapeColorSelect;
                ctx1.lineWidth = thicknessSelect;
                for (let i = 0; i < sides; i++) {
                    let angle = (i * 2 * Math.PI) / sides;
                    let xPos = xDown + radius * Math.cos(angle);
                    let yPos = yDown + radius * Math.sin(angle);
                    if (i === 0) {
                        ctx1.moveTo(xPos, yPos);
                    } else {
                        ctx1.lineTo(xPos, yPos);
                    }
                }
                ctx1.closePath();
                
                //added sides to the object so on redraw we can get the original number of sides
                let newShape = { type: shapeSelectVar, x: xDown, y: yDown, width: xUp - xDown, height: yUp - yDown, angle: 0, sides: sides, thickness: thicknessSelect, colorVal: shapeColorSelect};
                newShape.radius = Math.sqrt((xUp - xDown) ** 2 + (yUp - yDown) ** 2);
                pushUndoState();
                shapes.push(newShape);
                
                
            }
        }
        ctx1.stroke();
    }
    console.log(shapes);
    console.log(undoStack);
	//document.getElementById("val3").innerHTML = coords;
}



function selectShapeToTransform(event) {
    let clickX = event.clientX;
    let clickY = event.clientY;

    selectedShape = null; // Reset selection

    for (let shape of shapes) {
        //shape dimensions
        let lowerShapeCoordX;
        let lowerShapeCoordY;
        let upperShapeCoordX;
        let upperShapeCoordY;
        //setting up the X dimension
        if (shape.x < shape.x + shape.width) {
            lowerShapeCoordX = shape.x;
            upperShapeCoordX = shape.x + shape.width;
        }
        else {
            lowerShapeCoordX = shape.x + shape.width;
            upperShapeCoordX = shape.x;
        }

        //setting up the Y dimension
        if (shape.y < shape.y + shape.height) {
            lowerShapeCoordY = shape.y;
            upperShapeCoordY = shape.y + shape.height;
        }
        else {
            lowerShapeCoordY = shape.y + shape.height;
            upperShapeCoordY = shape.y;
        }

        //getting the shape based where the user clicked (did the user click on an object)
        if (shape.type === "rectangle" || shape.type === "line" || shape.type === "triangle" || shape.type == "square") {
            if (clickX >= lowerShapeCoordX && clickX <= upperShapeCoordX &&
                clickY >= lowerShapeCoordY && clickY <= upperShapeCoordY) {
                selectedShape = shape;
                break;
            }
        
        } else if (shape.type === "circle" || shape.type === "polygon") {
            let distance = Math.sqrt((clickX - shape.x) ** 2 + (clickY - shape.y) ** 2);
            if (distance <= shape.radius) {
                selectedShape = shape;
                break;
            }
        }
        else if (shape.type === "ellipse") {
            let x1 = shape.x - shape.width;
            let y1 = shape.y - shape.height;
            let x2 = shape.x + shape.width*2;
            let y2 = shape.y + shape.height*2;
        
            let minX = Math.min(x1, x2);
            let maxX = Math.max(x1, x2);
            let minY = Math.min(y1, y2);
            let maxY = Math.max(y1, y2);
        
            if (clickX >= minX && clickX <= maxX &&
                clickY >= minY && clickY <= maxY) {
                selectedShape = shape;
                break;
            }
        }
        //these are harder to get an exact selection box around do I just have one over the whole shape
        else if (shape.type === "curve" || shape.type == "polyline") {
            //using spread operaror to break up the array
            let minX = Math.min(...shape.points.map(p => p.x));
            let maxX = Math.max(...shape.points.map(p => p.x));
            let minY = Math.min(...shape.points.map(p => p.y));
            let maxY = Math.max(...shape.points.map(p => p.y));
        
            if (clickX >= minX && clickX <= maxX &&
                clickY >= minY && clickY <= maxY) {
                selectedShape = shape;
                break;
            }
        }
       
    }
    //for debugging shows which shape is selected
    if (selectedShape) {
        console.log("Selected shape:", selectedShape);
        pushUndoState();
    }
    

    
}

function moveShape(event) {
    //only works if a shape is seletced
    if (!selectedShape) return;

    
    //where the user is dragging for rubberbband effect
    let newX = event.clientX;
    let newY = event.clientY;

    //change in X
    let dx = newX - xDown;
    //change in Y
    let dy = newY - yDown;

    // Get the translation matrix
    let translationMatrix = translate(dx, dy);

    if (selectedShape.type === "curve" || selectedShape.type == "polyline"){
        // Apply translation
        //getting dx from the matrix and applying it to the shape's x
        selectedShape.points[0].x += translationMatrix[0][2]; 
        selectedShape.points[1].x += translationMatrix[0][2]; 
        selectedShape.points[2].x += translationMatrix[0][2]; 
        selectedShape.points[3].x += translationMatrix[0][2]; 
        //getting the dy from the matrix and applying it to the shape's y
        selectedShape.points[0].y += translationMatrix[1][2]; 
        selectedShape.points[1].y += translationMatrix[1][2]; 
        selectedShape.points[2].y += translationMatrix[1][2]; 
        selectedShape.points[3].y += translationMatrix[1][2]; 
    }
    else {
        // Apply translation
        //getting dx from the matrix and applying it to the shape's x
        selectedShape.x += translationMatrix[0][2]; 
        //getting the dy from the matrix and applying it to the shape's y
        selectedShape.y += translationMatrix[1][2]; 
    }

    //updating the new reference point
    xDown = newX;
    yDown = newY;

    //redraw all shapes
    drawShapes(); 
}

function scaleShape(event) {
    //doesn't go through the function if a shape isn't selected
    if (!selectedShape) return;

    //scaling the shape based on mouse movement
    let scaleFactor = 1 + (event.movementY * 0.01); 

    //getting the scaling matrix
    let scalingMatrix = scale(scaleFactor, scaleFactor, 1);

    //
    if (selectedShape.type === "circle") {
        //Scale radius and uses x scaling factor
        selectedShape.radius *= scalingMatrix[0][0];
    }
    else if (selectedShape.type === "polygon"){
        //scale's width and height
        selectedShape.width *= scalingMatrix[0][0];
        selectedShape.height *= scalingMatrix[1][1];
        //also scale the radius since thats how we can select this shape
        selectedShape.radius *= scalingMatrix[0][0];
    } else if (selectedShape.type === "polyline" || selectedShape.type === "curve") {
        //Scale around the first point (as origin)
        let origin = selectedShape.points[0];
        for (let point of selectedShape.points) {
            point.x = origin.x + (point.x - origin.x) * scaleFactor;
            point.y = origin.y + (point.y - origin.y) * scaleFactor;
        }
    } else {
    //everything else we just scale the width and height
    selectedShape.width *= scalingMatrix[0][0];
    selectedShape.height *= scalingMatrix[1][1];
    }
    //redraw shapes
    drawShapes();
}




function rotateShape(event) {
    //doesn't go through the function if a shape isn't selected
    if (!selectedShape) return;

    // Get the mouse position relative to the canvas
    let mouseX = event.clientX - canvas1.offsetLeft;
    let mouseY = event.clientY - canvas1.offsetTop;

    //need these center variables to handle rotating multipoint shapes
    let centerX, centerY;

    if (selectedShape.type === "polyline" || selectedShape.type === "curve") {
        // Use bounding box center
        let minX = Math.min(...selectedShape.points.map(p => p.x));
        let maxX = Math.max(...selectedShape.points.map(p => p.x));
        let minY = Math.min(...selectedShape.points.map(p => p.y));
        let maxY = Math.max(...selectedShape.points.map(p => p.y));

        centerX = (minX + maxX) / 2;
        centerY = (minY + maxY) / 2;
    
        // Compute angle between center and mouse position
        let deltaX = mouseX - centerX;
        let deltaY = mouseY - centerY;
        let angle = Math.atan2(deltaY, deltaX);

        selectedShape.angle = angle;
    }
    else{
        //gets the angle between the center of the shape and the mouse's position
        let deltaX = mouseX - selectedShape.x;
        let deltaY = mouseY - selectedShape.y;
        //getting the angle in radians
        let angle = Math.atan2(deltaY, deltaX);

        //updating the selected shape's angle
        selectedShape.angle = angle;
    }
    
    //redrawing all shapes
    drawShapes();
}




function drawShapes() {
    let centerX, centerY;
    //clearing the canvss
    /*ctx2.clearRect(0, 0, canvas1.width, canvas1.height);
    ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
    //fill the background
    ctx1.fillRect(0, 0, canvas1.width, canvas1.height);*/
    
    drawGrid();

    //go through each shape for redraw
    for (let shape of shapes) {
        
        ctx1.strokeStyle = shape.colorVal;
        ctx1.lineWidth = shape.thickness;

        //Translate to the shape's center before rotating it
        
        if (shape.type =="line" || shape.type == "triangle" || shape.type == "rectangle" || shape.type == "square"){
            //moving to the shape's center
            ctx1.translate(shape.x + shape.width/2, shape.y + shape.height/2);
        }
        else if (shape.type == "polyline" || shape.type == "curve"){
            //ctx1.translate(shape.points[0].x, shape.points[0].y);
            let minX = Math.min(...shape.points.map(p => p.x));
            let maxX = Math.max(...shape.points.map(p => p.x));
            let minY = Math.min(...shape.points.map(p => p.y));
            let maxY = Math.max(...shape.points.map(p => p.y));

            centerX = (minX + maxX) / 2;
            centerY = (minY + maxY) / 2;

            ctx1.translate(centerX, centerY);
        }
        else {
            ctx1.translate(shape.x , shape.y);
        }
        
        //rotate by the angle of the shape object
        ctx1.rotate(shape.angle);

        //redraw the shape depending on its type
        if (shape.type === "rectangle") {
            ctx1.beginPath();
            ctx1.strokeRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
        }
        if (shape.type === "square") {
                ctx1.beginPath();
                ctx1.strokeRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
        } else if (shape.type === "circle") {
            ctx1.beginPath();
            ctx1.arc(0, 0, shape.radius, 0, 2 * Math.PI);
            ctx1.stroke();
        } else if (shape.type === "ellipse") {
            ctx1.beginPath();
            ctx1.ellipse(0, 0, shape.width, shape.height, 0, 0, 2 * Math.PI);
            ctx1.stroke();
        } else if (shape.type === "line") {
            ctx1.beginPath();
            ctx1.moveTo(-shape.width / 2, -shape.height / 2);
            ctx1.lineTo(shape.width / 2, shape.height / 2);
            ctx1.stroke();
        }
        else if(shape.type == "triangle"){
    

            //draw triangle off relative coordinates
            let halfWidth = shape.width / 2;
            let halfHeight = shape.height / 2;

            ctx1.moveTo(-halfWidth, halfHeight);   
            ctx1.lineTo(halfWidth, halfHeight);  
            ctx1.lineTo(0, -halfHeight); 
            ctx1.closePath();
            ctx1.stroke();

            
        }
        else if (shape.type === "polyline") {
            
            ctx1.beginPath();
           
            //Move to origin because we already translated
            /*ctx1.moveTo(0, 0);
            for (let i = 1; i < shape.points.length; i++) {
                let dx = shape.points[i].x - shape.points[0].x;
                let dy = shape.points[i].y - shape.points[0].y;
                ctx1.lineTo(dx, dy);*/
            
                ctx1.moveTo(shape.points[0].x - centerX, shape.points[0].y - centerY);
                for (let i = 1; i < shape.points.length; i++) {
                    ctx1.lineTo(
                        shape.points[i].x - centerX,
                        shape.points[i].y - centerY
                    );
                

            
            }
            ctx1.stroke();
            
        }
        else if (shape.type == "curve") {
            ctx1.beginPath(); 
        
            //Move to the start point  (near center)
            ctx1.moveTo(
                shape.points[0].x - centerX,
                shape.points[0].y - centerY
            );
    
            //draw curve relative to center
            ctx1.bezierCurveTo(
                shape.points[1].x - centerX, shape.points[1].y - centerY,
                shape.points[2].x - centerX, shape.points[2].y - centerY,
                shape.points[3].x - centerX, shape.points[3].y - centerY
            );
        
            ctx1.stroke();
        }
        else if (shape.type == "polygon"){
            ctx1.beginPath();
            let halfWidth = shape.width / 2;
            let halfHeight = shape.height / 2;
        //get corrected radius
        let radius = Math.sqrt(shape.width ** 2 + shape.height ** 2); 

        ctx1.moveTo(-halfWidth,halfHeight);

            //draw polygon at the relative coordinates
            for (let i = 0; i < shape.sides; i++) {
                let angle = (i * 2 * Math.PI) / shape.sides;
                let xPos = radius * Math.cos(angle);
                let yPos = radius * Math.sin(angle); 

                if (i === 0) {
                    ctx1.moveTo(xPos, yPos);
                } else {
                    ctx1.lineTo(xPos, yPos);
                }
            }
        ctx1.closePath();
        ctx1.stroke();
        }
        //reset the transformation to avoid effecting the drawing of other shapes
        ctx1.resetTransform();
    }
}



const modeSelection = document.getElementById("mode");
const modeIndicator = document.getElementById("modeIndicator");
const shapeSelection = document.getElementById("shapes");
const shapeIndicator = document.getElementById("shapeIndicator");


function updateShapeSelection() {
    //global variable for getting the selected shape
    shapeSelectVar = shapeSelection.value;
    shapeIndicator.innerText = 'CURRENT SHAPE SELECTED: ' + String(shapeSelection.value).toUpperCase();
    
    if (shapeSelectVar == "polygon") {
        polygonStuff.style.display = "inline";
    }
    else {
        polygonStuff.style.display = "none";
    }
    
}

function updateModeSelection() {
    //global variable for getting the selected shape
    modeSelectVar = modeSelection.value;
    modeIndicator.innerText = 'CURRENT MODE SELECTED: ' + String(modeSelection.value).toUpperCase();
    
    if (modeSelectVar == "draw") {
        shapeSelectStuff.style.display = "inline";
    }
    else {
        shapeSelectStuff.style.display = "none";
    }
    
}

function updatePolygonSides() {
    
    sides = polygonSides.value;
}

function clearCanvas() {
    
    shapes = [];
    
    //redraw shapes
    drawShapes();
}

shapeSelection.addEventListener("input", updateShapeSelection);
modeSelection.addEventListener("input", updateModeSelection);
polygonSides.addEventListener("input", updatePolygonSides);
