import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import {
  Copy,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Menu,
  X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function VideoChat() {
  const [myId, setMyId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const [error, setError] = useState("");
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [remoteCameraOn, setRemoteCameraOn] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const myVideo = useRef();
  const remoteVideo = useRef();
  const peerInstance = useRef();
  const myStream = useRef();
  const dataConnection = useRef();

  // صوت دخول جاهز عبر رابط صغير
  const joinSound = useRef(
    new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg")
  );

  useEffect(() => {
    const peer = new Peer();
    peerInstance.current = peer;

    peer.on("open", (id) => setMyId(id));

    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        myStream.current = stream;
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
          myVideo.current.play().catch(() => {});
        }
      } catch (err) {
        console.error("Error accessing media devices.", err);
        setError("Cannot access camera/microphone.");
      }
    };

    getMedia();

    peer.on("call", (call) => {
      const answerCall = () => {
        call.answer(myStream.current);
        call.on("stream", (remoteStream) => {
          if (remoteVideo.current) {
            remoteVideo.current.srcObject = remoteStream;
            remoteVideo.current.play().catch(() => {});
          }
        });
      };
      if (myStream.current) answerCall();
      else getMedia().then(answerCall);
    });

    peer.on("connection", (conn) => {
      dataConnection.current = conn;
      conn.on("data", (data) => {
        if (data.type === "camera") {
          setRemoteCameraOn(data.enabled);
        }
        if (data.type === "joined") {
          joinSound.current.play().catch(() => {});
          toast(`🎉 ${conn.peer} has joined!`, { icon: "🎥" });
        }
      });
    });
  }, []);

  const startCall = () => {
    if (!remoteId.trim()) {
      setError("Enter ID");
      return;
    }
    setError("");
    if (!myStream.current) {
      toast.error("Your media is not ready yet!");
      return;
    }

    const conn = peerInstance.current.connect(remoteId);
    dataConnection.current = conn;

    conn.on("open", () => {
      conn.send({ type: "joined" });
      joinSound.current.play().catch(() => {});
      toast(`🎉 You joined with ${remoteId}!`, { icon: "🎥" });
    });

    conn.on("data", (data) => {
      if (data.type === "camera") setRemoteCameraOn(data.enabled);
      if (data.type === "joined") {
        joinSound.current.play().catch(() => {});
        toast(`${remoteId} has joined!`, { icon: "🎥" });
      }
    });

    const call = peerInstance.current.call(remoteId, myStream.current);
    call.on("stream", (remoteStream) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = remoteStream;
        remoteVideo.current.play().catch(() => {});
      }
    });
  };

  const toggleCamera = () => {
    if (!myStream.current) return;
    const videoTrack = myStream.current.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setCameraOn(videoTrack.enabled);

    if (dataConnection.current && dataConnection.current.open) {
      dataConnection.current.send({ type: "camera", enabled: videoTrack.enabled });
    }
  };

  const toggleMic = () => {
    if (!myStream.current) return;
    const audioTrack = myStream.current.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
  };

  const leaveCall = () => {
    // STOP VIDIO
    if (myStream.current) {
      myStream.current.getTracks().forEach((t) => t.stop());
      myStream.current = null;
    }

     if (peerInstance.current) {
      peerInstance.current.destroy();
      peerInstance.current = null;
    }

    // DELETE VEDIO
    if (myVideo.current) myVideo.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;

    if (dataConnection.current) {
      dataConnection.current.close();
      dataConnection.current = null;
    }

    setCameraOn(true);
    setMicOn(true);
    setRemoteCameraOn(true);
    setRemoteId("");
    setError("");
  };

  const copyId = () => {
    navigator.clipboard.writeText(myId);
    toast.success("Copied successfully!");
  };

  return (
    <div className="flex flex-col items-center justify-center h-[99%] translate-y-3 md:translate-y-0 md:h-screen bg-gray-900 text-white relative overflow-hidden">
      <Toaster position="top-right" />

      {/* Remote video */}
      <div className="relative md:w-[95%] md:h-[90%] w-[95%] h-[80%] mx-auto rounded-lg shadow-lg overflow-hidden bg-black">
        <video
          ref={remoteVideo}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {!remoteCameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
            <VideoOff size={60} className="text-gray-300" />
          </div>
        )}
      </div>

      {/* My video */}
      <div className="absolute w-45 h-45 md:w-60 md:h-44 rounded-lg shadow-lg border border-gray-700 bg-black top-4 right-2 md:right-13 md:bottom-20 md:top-auto md:left-auto overflow-hidden">
        <video
          ref={myVideo}
          muted
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {!cameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
            <VideoOff size={30} className="text-gray-300" />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="absolute bottom-10 md:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 md:gap-4">
        <button
          onClick={toggleCamera}
          className="w-14 h-14 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600"
        >
          {cameraOn ? <Video size={23} /> : <VideoOff size={23} />}
        </button>
        <button
          onClick={toggleMic}
          className="w-14 h-14 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600"
        >
          {micOn ? <Mic size={23} /> : <MicOff size={23} />}
        </button>
        <button
          onClick={leaveCall}
          className="w-14 h-14 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500"
        >
          <Phone size={23} />
        </button>
      </div>

      {/* Sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 left-4 md:hidden bg-gray-800 p-2 rounded-lg cursor-pointer"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className="absolute top-5 text-blue-300 left-14 text-[13px] md:top-2 md:left-15 w-72 md:w-80 p-1 transition-transform duration-300">
        BY : ZIAD MOSTAFA
      </div>

      {sidebarOpen && (
        <div
          className="absolute top-4 left-4 md:top-6 md:left-6 w-72 md:w-80 p-5 rounded-2xl
           bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80
           backdrop-blur-lg shadow-2xl border border-gray-700/50 transition-transform duration-300"
        >
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-bold text-blue-400 tracking-wider uppercase drop-shadow-md">
              To Know You
            </p>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-300 hover:text-white hover:scale-110 transition-transform"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center justify-between bg-gray-800/60 px-3 py-2 rounded-xl border border-gray-600/50 mb-3 shadow-inner">
            <span className="truncate text-white font-medium">{myId}</span>
            <button
              onClick={copyId}
              className="ml-2 hover:text-blue-400 hover:scale-110 transition-transform"
            >
              <Copy size={16} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Enter Your Friend's ID"
            value={remoteId}
            onChange={(e) => setRemoteId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-gray-800/50 border border-gray-600/50 text-white
               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
          />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

          <button
            onClick={startCall}
            className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold
               flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-400/50 transition-all"
          >
            Start Call <Phone size={16} />
          </button>
        </div>
      )}

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="hidden md:flex absolute top-4 left-4 bg-gray-800 p-2 rounded-lg cursor-pointer"
        >
          <Menu size={20} />
        </button>
      )}
    </div>
  );
}
