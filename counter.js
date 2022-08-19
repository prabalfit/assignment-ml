let detector;
let detectorConfig;
let poses;
let video;
let skeleton = true;
let model;
let elbowAngle = 999;
let backAngle = 0;
let reps = 0;
let upPosition = false;
let downPosition = false;
let highlightBack = false;

async function init() {
  detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER };
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
  edges = {
    '5,7': 'm',
    '7,9': 'm',
    '6,8': 'c',
    '8,10': 'c',
    '5,6': 'y',
    '5,11': 'm',
    '6,12': 'c',
    '11,12': 'y',
    '11,13': 'm',
    '13,15': 'm',
    '12,14': 'c',
    '14,16': 'c'
  };
  await getPoses();
}

var vid;
async function setup() {
  
  vid = createVideo("videos/pushups.mp4");
  //vid.hide();
  vid.loop();
  vid.speed(0.6);
  createCanvas(640, 350);
  await init();
  
}

async function getPoses() { 
  poses = await detector.estimatePoses(vid.elt);
  setTimeout(getPoses, 0);
}

function draw() {
  background(220);
  translate(vid.width, 0);
  scale(-1, 1);
  image(vid, 0, 0, vid.width, vid.height);

  // Draw keypoints and skeleton
  drawKeypoints();
  if (skeleton) {
    drawSkeleton();
  }

  // Write text
  fill(255);
  strokeWeight(2);
  stroke(51);
  translate(vid.width, 0);
  scale(-1, 1);
  textSize(40);

  if (poses && poses.length > 0) {
    let pushupString = `Push-ups completed: ${reps}`;
    text(pushupString, 100, 90);
  }
  else {
    text('Loading, please wait...', 100, 90);
  }
  
}

function drawKeypoints() {
  var count = 0;
  if (poses && poses.length > 0) {
    for (let kp of poses[0].keypoints) {
      const { x, y, score } = kp;
      if (score > 0.3) {
        count = count + 1;
        fill(255);
        stroke(0);
        strokeWeight(4);
        circle(x, y, 16);
      }
      
      updateArmAngle();
      updateBackAngle();
      inUpPosition();
      inDownPosition();
    }
  }
}

// Draws lines between the keypoints
function drawSkeleton() {
  confidence_threshold = 0.4;

  if (poses && poses.length > 0) {
    for (const [key, value] of Object.entries(edges)) {
      const p = key.split(",");
      const p1 = p[0];
      const p2 = p[1];

      const y1 = poses[0].keypoints[p1].y;
      const x1 = poses[0].keypoints[p1].x;
      const c1 = poses[0].keypoints[p1].score;
      const y2 = poses[0].keypoints[p2].y;
      const x2 = poses[0].keypoints[p2].x;
      const c2 = poses[0].keypoints[p2].score;

      if ((c1 > confidence_threshold) && (c2 > confidence_threshold)) {
        if ((highlightBack == true) && ((p[1] == 11) || ((p[0] == 6) && (p[1] == 12)) || (p[1] == 13) || (p[0] == 12))) {
          strokeWeight(3);
          stroke(255, 0, 0);
          line(x1, y1, x2, y2);
        }
        else {
          strokeWeight(2);
          stroke('rgb(0, 255, 0)');
          line(x1, y1, x2, y2);
        }
      }
    }
  }
}

function updateArmAngle() {
  leftWrist = poses[0].keypoints[9];
  leftShoulder = poses[0].keypoints[5];
  leftElbow = poses[0].keypoints[7];


  angle = (
    Math.atan2(
      leftWrist.y - leftElbow.y,
      leftWrist.x - leftElbow.x
    ) - Math.atan2(
      leftShoulder.y - leftElbow.y,
      leftShoulder.x - leftElbow.x
    )
  ) * (180 / Math.PI);

  if (leftWrist.score > 0.3 && leftElbow.score > 0.3 && leftShoulder.score > 0.3) {
    elbowAngle = angle;
  }

}

function updateBackAngle() {

  var leftShoulder = poses[0].keypoints[5];
  var leftHip = poses[0].keypoints[11];
  var leftKnee = poses[0].keypoints[13];

  angle = (
    Math.atan2(
      leftKnee.y - leftHip.y,
      leftKnee.x - leftHip.x
    ) - Math.atan2(
      leftShoulder.y - leftHip.y,
      leftShoulder.x - leftHip.x
    )
  ) * (180 / Math.PI);
  angle = angle % 180;
  if (leftKnee.score > 0.3 && leftHip.score > 0.3 && leftShoulder.score > 0.3) {

    backAngle = angle;
  }

  if ((backAngle < 20) || (backAngle > 160)) {
    highlightBack = false;
  }
  else {
    highlightBack = true;

  }

}

function inUpPosition() {
  if (elbowAngle > 160 && elbowAngle < 210) {
    //console.log('In up position')
    if (downPosition == true) {
      reps = reps + 1;
    }
    upPosition = true;
    downPosition = false;
  }
}

function inDownPosition() {
  var elbowAboveNose = false;
  if (poses[0].keypoints[0].y > poses[0].keypoints[7].y) {
    elbowAboveNose = true;
  }


  if ((highlightBack == false) && elbowAboveNose && ((abs(elbowAngle) > 60) && (abs(elbowAngle) < 120))) {

    downPosition = true;
    upPosition = false;
  }
}

