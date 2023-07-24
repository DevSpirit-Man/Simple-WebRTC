// Config variables: change them to point to your own servers
const SIGNALING_SERVER_URL = "http://localhost:9999";
const TURN_SERVER_URL = "localhost:3478";
const TURN_SERVER_USERNAME = "username";
const TURN_SERVER_CREDENTIAL = "credential";
// WebRTC config: you don't have to change this for the example to work
// If you are testing on localhost, you can just use PC_CONFIG = {}
const PC_CONFIG = {
  iceServers: [
    {
      urls: "turn:" + TURN_SERVER_URL + "?transport=tcp",
      username: TURN_SERVER_USERNAME,
      credential: TURN_SERVER_CREDENTIAL,
    },
    {
      urls: "turn:" + TURN_SERVER_URL + "?transport=udp",
      username: TURN_SERVER_USERNAME,
      credential: TURN_SERVER_CREDENTIAL,
    },
  ],
};

// Signaling methods
let socket = io(SIGNALING_SERVER_URL, { autoConnect: false });

socket.on("data", (data) => {
  console.log("Data received: ", data);
  handleSignalingData(data);
});

socket.on("ready", () => {
  console.log("Ready");
  // Connection with signaling server is ready, and so is local stream
  createPeerConnection();
  sendOffer();
});

let sendData = (data) => {
  socket.emit("data", data);
};

// WebRTC methods
let pc;
let localStream;
let remoteStreamElement = document.getElementById("remoteStream");
let localStreamElement = document.getElementById("localStream");
let videoFileSelect = document.getElementById("VideoFile");
let screenSelect = document.getElementById("ScreenCapture");
const displayMediaOptions = {
  video: {
    displaySurface: "window",
  },
  audio: false,
};

function getLocalStream_videoFile() {
  navigator.mediaDevices
    // .getDisplayMedia(displayMediaOptions)
    .getUserMedia(displayMediaOptions)
    .then((stream) => {
      console.log("Stream found");

      localStream = stream;
      localStreamElement.srcObject = stream;
      // Disable the microphone by default
      // stream.getAudioTracks()[0].enabled = false;
      localStreamElement.srcObject = localStream;
      // Connect after making sure that local stream is availble
      socket.connect();
    })
    .catch((error) => {
      console.error("Stream not found: ", error);
    });
}

function getLocalStream_screenShare() {
  navigator.mediaDevices
    .getDisplayMedia(displayMediaOptions)
    .then((stream) => {
      console.log("Stream found");

      localStream = stream;
      localStreamElement.srcObject = stream;
      // Disable the microphone by default
      // stream.getAudioTracks()[0].enabled = false;
      localStreamElement.srcObject = localStream;
      // Connect after making sure that local stream is availble
      socket.connect();
    })
    .catch((error) => {
      console.error("Stream not found: ", error);
    });
}

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection();
    pc.onicecandidate = onIceCandidate;
    pc.ontrack = onTrack;
    // pc.addStream(localStream);
    // setInterval(() => {
    //   console.log("--------", localStream);
    // }, 1000);
    console.log("--------", localStream);
    if (localStream) {
      // localStream.getTracks().forEach((track) => {
      //   pc.addTrack(track, localStream);
      // });
      pc.addStream(localStream);
    }

    console.log("PeerConnection created");
  } catch (error) {
    console.error("PeerConnection failed: ", error);
  }
}

let sendOffer = () => {
  console.log("Send offer");
  pc.createOffer().then(setAndSendLocalDescription, (error) => {
    console.error("Send offer failed: ", error);
  });
};

let sendAnswer = () => {
  console.log("Send answer");
  pc.createAnswer().then(setAndSendLocalDescription, (error) => {
    console.error("Send answer failed: ", error);
  });
};

let setAndSendLocalDescription = (sessionDescription) => {
  console.log("setAndSendLocalDescription", setAndSendLocalDescription);
  pc.setLocalDescription(sessionDescription);
  console.log("Local description set");
  sendData(sessionDescription);
};

let onIceCandidate = (event) => {
  if (event.candidate) {
    console.log("ICE candidate");
    sendData({
      type: "candidate",
      candidate: event.candidate,
    });
  }
};

let onTrack = (event) => {
  console.log("Add track");
  remoteStreamElement.srcObject = event.streams[0];
};

function dumpOptionsInfo() {
  const videoTrack = videoElem.srcObject.getVideoTracks()[0];

  console.log("Track settings:");
  console.log(JSON.stringify(videoTrack.getSettings(), null, 2));
  console.log("Track constraints:");
  console.log(JSON.stringify(videoTrack.getConstraints(), null, 2));
}

let handleSignalingData = (data) => {
  switch (data.type) {
    case "offer":
      createPeerConnection();
      pc.setRemoteDescription(new RTCSessionDescription(data));
      sendAnswer();
      break;
    case "answer":
      pc.setRemoteDescription(new RTCSessionDescription(data));
      break;
    case "candidate":
      pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      break;
  }
};

let toggleMic = () => {
  let track = localStream.getAudioTracks()[0];
  track.enabled = !track.enabled;
  let micClass = track.enabled ? "unmuted" : "muted";
  document.getElementById("toggleMic").className = micClass;
};

screenSelect.addEventListener(
  "click",
  (evt) => {
    getLocalStream_screenShare();
  },
  false
);

videoFileSelect.addEventListener(
  "click",
  (evt) => {
    getLocalStream_videoFile();
  },
  false
);
// Start connection
