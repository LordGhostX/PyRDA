let screen, initWidth, initHeight, host;
let socket;

function debounce(func, wait, immediate) {
	let timeout;
	return function() {
		let context = this, args = arguments;
		let later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		let callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

function screenUpdate(){
    let binary = reader.result;
    screen.src = "data:image/jpeg;base64," + btoa(binary);
}

function getMousePos(screen, event){
    let rect = screen.getBoundingClientRect(),
        scaleX =  initWidth / screen.width,
        scaleY = initHeight / screen.height;
    console.log(`scales: ${scaleX} ${scaleY}`);
    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    }
}

let reader = new FileReader();
reader.onload = screenUpdate;

let deboundHandler = debounce(moveHandler, 200);

function moveHandler(event){
    let pos = getMousePos(screen, event);

    console.log(`Sent ${pos.x} ${pos.y}`);
    socket.send(`move ${pos.x} ${pos.y}`);
}

function lclickHandler(event){
		if (event && (event.which == 2 || event.button == 4 )) {
			console.log("mouse 2");
			socket.send("mouse 2");
		}
		else {
			console.log("mouse 0");
	    socket.send("mouse 0");
		}
}

function rclickHandler(){
    console.log("mouse 1");
    socket.send("mouse 1");
}

function keyHandler(event){
    event.preventDefault();
    let key = event.key;
    if (key.length != 1){
        key = key.toLowerCase();
    }

    key = key.replace("arrow", "");

    if (key == " "){
        key = "space";
    }
    if (event.ctrlKey)
        key += " ctrl";
    if(event.shiftKey)
        key += " shift";
    if(event.altKey)
        key += " alt";
    console.log("key " + key);
    socket.send("key " + key)
}



function messageHandler(event){
    try {
        reader.readAsBinaryString(event.data);
    } catch (TypeError) {
        let data = event.data.split(" ");
        initWidth = data[1];
        initHeight = data[2];
        console.log(`Host resolution: ${initWidth}x${initHeight}`);
    }
}

window.onload = function(){
    host = document.location.host;
    document.getElementById("h").innerText = `You are now controlling server located at: ${host}`

    screen = document.getElementById("screen");

    socket = new WebSocket("ws://" + host + "/ws");
    socket.onmessage = messageHandler;

    document.addEventListener('keydown', keyHandler);
}
