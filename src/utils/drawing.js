import * as poseDetection from "@tensorflow-models/pose-detection";

const adjacentKeyPoints = poseDetection.util.getAdjacentPairs(
  poseDetection.SupportedModels.BlazePose
);
export function drawSkeleton(keypoints, ctx) {
  adjacentKeyPoints.forEach((adjacentPoint) => {
    const pointOne = keypoints[adjacentPoint[0]];
    const pointTwo = keypoints[adjacentPoint[1]];

    if (pointOne.score > 0.75 && pointTwo.score > 0.75) {
      ctx.beginPath();
      ctx.strokeStyle = "green";
      ctx.moveTo(pointOne.x, pointOne.y);
      ctx.lineTo(pointTwo.x, pointTwo.y);
      ctx.stroke();
    }
  });
}

export function drawPose(keypoints, targetCanvas) {
  const ctx = targetCanvas.getContext("2d");
  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  if (!keypoints || keypoints.length === 0) {
    return;
  }
  drawSkeleton(keypoints, ctx);
  keypoints.forEach((pose, i) => {
    if (pose.score > 0.7) {
      const x = Math.trunc(pose?.x);
      const y = Math.trunc(pose?.y);
      // draw point
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI, false);
      ctx.fillStyle = "green";
      ctx.fill();
    }
  });
}
