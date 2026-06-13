const socket = io();

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("roomInput");

let localStream;
let peerConnection;
let roomId;

const servers = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302"
    }
  ]
};

async function startMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    localVideo.srcObject = localStream;
  } catch (err) {
    alert("Camera/Microphone permission denied");
    console.error(err);
  }
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
      socket.emit("ice-candidate", {
        roomId,
        candidate: event.candidate
      });
    }
  };

  peerConnection.onconnectionstatechange = () => {
    console.log("Connection State:", peerConnection.connectionState);
  };
}

joinBtn.addEventListener("click", async () => {
  roomId = roomInput.value.trim();

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

  socket.emit("offer", {
    roomId,
    offer
  });
});

socket.on("offer", async (data) => {
  await peerConnection.setRemoteDescription(data.offer);

  const answer = await peerConnection.createAnswer();

  await peerConnection.setLocalDescription(answer);

  socket.emit("answer", {
    roomId,
    answer
  });
});

socket.on("answer", async (data) => {
  await peerConnection.setRemoteDescription(data.answer);
});

socket.on("ice-candidate", async (data) => {
  try {
    await peerConnection.addIceCandidate(data.candidate);
  } catch (err) {
    console.error(err);
  }
});