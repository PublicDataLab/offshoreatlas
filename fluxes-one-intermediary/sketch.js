var locationData;
var img;

function preload() {
	// put preload code here
	//locationData = getMyBeautifulData();
	img = loadImage('download.jpg');
	locationData = getCurrentPosition();

}

function setup() {
	createCanvas(windowWidth, windowHeight)
	background(255, 0, 0)
	//getCurrentPosition(doThisOnLocation)
	console.log(locationData);
	image(img, 100,100)
}

function draw() {
	// put drawing code here
	//background(200)
}

function doThisOnLocation(position){
    print("lat: " + position.latitude);
    print("long: " + position.longitude);
}
