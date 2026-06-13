const socket = io();

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("roomInput");

let localStream;
let peerConnection;

const servers = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302"
    }
  ]
};

async function startMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  localVideo.srcObject = localStream;
}

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(servers);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate);
    }
  };
}

joinBtn.addEventListener("click", async () => {

  const roomId = roomInput.value.trim();

  if (!roomId) {
    alert("Enter Room ID");
    return;
  }

  await startMedia();

  createPeerConnection();

  socket.emit("join-room", roomId);
});

socket.on("user-joined", async () => {

  const offer = await peerConnection.createOffer();

  await peerConnection.setLocalDescription(offer);

  socket.emit("offer", offer);
});

socket.on("offer", async (offer) => {

  await peerConnection.setRemoteDescription(offer);

  const answer = await peerConnection.createAnswer();

  await peerConnection.setLocalDescription(answer);

  socket.emit("answer", answer);
});

socket.on("answer", async (answer) => {

  await peerConnection.setRemoteDescription(answer);
});

socket.on("ice-candidate", async (candidate) => {

  try {
    await peerConnection.addIceCandidate(candidate);
  } catch (error) {
    console.error(error);
  }
});