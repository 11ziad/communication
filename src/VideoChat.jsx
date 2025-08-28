import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import { Copy, Video, VideoOff, Mic, MicOff, Phone, Menu, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
export default function VideoChat() {
  const [myId, setMyId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const [error, setError] = useState("");
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true); // في الكبير مفتوح
  const myVideo = useRef();
  const remoteVideo = useRef();
  const peerInstance = useRef();
  const myStream = useRef();

  useEffect(() => {
    const peer = new Peer();
    peerInstance.current = peer;

    peer.on("open", (id) => setMyId(id));

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      myStream.current = stream;
      myVideo.current.srcObject = stream;
      myVideo.current.play();
    });

    peer.on("call", (call) => {
      call.answer(myStream.current);
      call.on("stream", (remoteStream) => {
        remoteVideo.current.srcObject = remoteStream;
        remoteVideo.current.play();
      });
    });
  }, []);

  const startCall = () => {
    if (!remoteId.trim()) {
      setError("Enter ID ");
      return;
    }
    setError("");
    const call = peerInstance.current.call(remoteId, myStream.current);
    call.on("stream", (remoteStream) => {
      remoteVideo.current.srcObject = remoteStream;
      remoteVideo.current.play();
    });
  };

  const toggleCamera = () => {
    const videoTrack = myStream.current.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    setCameraOn(videoTrack.enabled);
  };

  const toggleMic = () => {
    const audioTrack = myStream.current.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
  };

  const leaveCall = () => {
    myStream.current.getTracks().forEach((track) => track.stop());
    peerInstance.current.destroy();
  };

  const copyId = () => {
     navigator.clipboard.writeText(myId);
    toast.success("Copied successfully!");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white relative overflow-hidden">
         <Toaster position="top-right" />
        {/* Remote control video (enlarged) */}
      <video
        ref={remoteVideo}
        autoPlay
        playsInline
        className="w-[95%] h-[90%] mx-auto object-cover bg-black rounded-lg shadow-lg"
      />

    {/* My video (little in the corner) */}
      <video
        ref={myVideo}
        muted
        autoPlay
        playsInline
        className="absolute w-38 h-30 md:w-60 md:h-44 rounded-lg shadow-lg border border-gray-700 bg-black
                   top-4 right-2 md:right-6 md:bottom-20 md:top-auto md:left-auto"
      />

            {/* buttons */}
      <div className="absolute bottom-10 md:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 md:gap-4">
        <button
          onClick={toggleCamera}
          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600"
        >
          {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
        <button
          onClick={toggleMic}
          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600"
        >
          {micOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
        <button
          onClick={leaveCall}
          className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500"
        >
          <Phone size={18} />
        </button>
      </div>

        {/* Menu button for small screens */}
        <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 left-4 md:hidden bg-gray-800 p-2 rounded-lg cursor-pointer"
      >
        {sidebarOpen ? <X size={20} className=" cursor-pointer" /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      {sidebarOpen && (
        <div
          className={`
            absolute top-0 left-0 bg-gray-800 shadow-md transition-transform duration-300
            w-64 md:w-72 p-4 rounded-b-lg md:rounded-lg md:top-4 md:left-4
          `}
          style={{ maxHeight: "fit-content" }}
        >
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-blue-300">TO KNOW YOU</p>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={18} className=" cursor-pointer"/>
            </button>
          </div>

          <div className="flex items-center justify-between bg-gray-700 px-2 py-1 rounded">
            <span className="truncate">{myId}</span>
            <button onClick={copyId} className="ml-2 hover:cursor-pointer">
              <Copy size={16} />
            </button>
          </div>

          <input
            type="text"
            placeholder="To contact enter your ID"
            value={remoteId}
            onChange={(e) => setRemoteId(e.target.value)}
            className="w-full mt-3 px-2 py-1 rounded bg-gray-700 text-white"
          />
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

          <button
            onClick={startCall}
            className="hover:cursor-pointer mt-3 w-full bg-blue-600 hover:bg-blue-500 py-1 rounded flex items-center justify-center gap-2"
          >
            start call <Phone size={16} />
          </button>
        </div>
      )}

    {/* Show Sidebar button on large screens if locked */}
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
