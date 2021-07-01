import { useEffect, useState } from "react";

const exampleConfig = {
  // the poses the user needs to do to count as one rep
  poseList: ["standing", "squatting", "standing"],
  // string of current pose provided by passing posenet data into trained KNN model
  pose: "standing",
  // currently not used: would be used if someone interuppted a complext workout (burpee) and they would need to restart to get one rep
  restartOnFailure: true,
};
export function useRepetition(props) {
  const { poseList = [], restartOnFailure = false, pose = "" } = props;

  // in the event there are several poses with the same name,
  // we will track by the pose index to determine what's next
  // or if we need to update the rep count
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);

  // actual number of reps
  const [reps, setReps] = useState(0);

  function reset() {
    setReps(0);
    setCurrentPoseIndex(0);
  }

  useEffect(() => {
    // console.log(
    //   `Seeing ${pose}, expecting to see ${poseList[currentPoseIndex]}`
    // );
    // next see if the current pose is the next pose in the list
    if (pose === poseList[currentPoseIndex]) {
      //   console.log(
      //     `Matching! currentPoseIndex: ${currentPoseIndex}, list length: ${poseList.length}`
      //   );

      // if there is no next pose and pose index plus one is equal
      // to the length of props.poseList then update the rep count
      if (currentPoseIndex + 1 === poseList.length) {
        setReps(reps + 1);
        resetPoseCount();
      } else {
        setCurrentPoseIndex(currentPoseIndex + 1);
      }
    } else if (restartOnFailure) {
      resetPoseCount();
    }
  }, [pose, poseList]);

  function resetPoseCount() {
    // if the last pose is the same as the first pose,
    // make sure to count it as part of the rep
    if (pose === poseList[0]) {
      setCurrentPoseIndex(1);
    } // otherwise reset entirely
    else {
      setCurrentPoseIndex(0);
    }
  }

  return {
    reps,
    reset,
    nextExpectedPose: poseList[currentPoseIndex],
  };
}
