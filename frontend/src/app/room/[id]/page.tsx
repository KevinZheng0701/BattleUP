"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import VideoCard from "@/components/VideoCard";
import InstructionsBoard from "@/components/InstructionsBoard";

type SignalData = {
  room: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

export default function RoomPage() {
  // Refs for important WebRTC objects
  const offerSent = useRef(false); // Track if we already sent an offer
  const pendingCandidates = useRef<RTCIceCandidate[]>([]); // Queue of ICE candidates until ready
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // State variables
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [countingDown, setCountingDown] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [duration, setDuration] = useState<number>(-1);
  const [myScore, setMyScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);

  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  useEffect(() => {
    async function validateAndConnect() {
      // Exit the room after validation failed
      if (validateRoom()) {
        router.push("/");
        return;
      }
      // Check if room is correct on the backend
      const roomIsValid = await checkRoom();
      if (roomIsValid) {
        await setupConnection();
      } else {
        router.push("/");
        return;
      }

      // Clean up everything when the component unmounts
      return () => {
        roomCleanUp();
      };
    }

    socketRef.current = io("http://localhost:5001");
    validateAndConnect();

    // Valid user and room id are valid on the client side
    function validateRoom() {
      // Early exit if no room id or user id is found and redirect user back home
      const storedId = localStorage.getItem("userId") ?? "";
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const isValidUuid = storedId && uuidRegex.test(storedId);
      return !roomId || !isValidUuid;
    }

    // Verify if the room actually exists before setting up connection
    async function checkRoom() {
      try {
        const response = await fetch("http://localhost:5001/api/check-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
        });

        if (!response.ok) throw new Error("Room not found!");

        const data = await response.json();
        if (!data.exists) throw new Error("Room not found!");

        if (duration === -1) {
          setDuration(data.duration);
        }
        return true;
      } catch (error) {
        alert(error);
        return false;
      }
    }

    // Handle incoming WebRTC signaling data (offer, answer, or ICE candidate)
    async function handleSignal(data: SignalData) {
      try {
        if (!peerConnection.current) {
          return; // No peer connection available
        }

        if (data.offer) {
          // Received an offer then set remote description, create, and send an answer
          if (peerConnection.current.signalingState === "stable") {
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(data.offer),
            );
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            socketRef.current?.emit("signal", { room: roomId, answer });

            // Process any queued ICE candidates
            while (pendingCandidates.current.length > 0) {
              const candidate = pendingCandidates.current.shift();
              if (candidate) {
                await peerConnection.current.addIceCandidate(candidate);
              }
            }
          }
        } else if (data.answer) {
          // Received an answer then finalize the connection
          if (peerConnection.current.signalingState === "have-local-offer") {
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(data.answer),
            );

            // Process any queued ICE candidates
            while (pendingCandidates.current.length > 0) {
              const candidate = pendingCandidates.current.shift();
              if (candidate) {
                await peerConnection.current.addIceCandidate(candidate);
              }
            }
          }
        } else if (data.candidate) {
          // Received an ICE candidate then add it or queue it
          if (peerConnection.current.remoteDescription) {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(data.candidate),
            );
          } else {
            pendingCandidates.current.push(new RTCIceCandidate(data.candidate));
          }
        }
      } catch (error) {
        console.error("[WebRTC] handleSignal error:", error);
      }
    }

    // Handle local peer connection
    async function setupLocalConnection() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);

        // Attach local video stream to video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create a new peer connection
        peerConnection.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        // Add all local tracks to the connection
        stream.getTracks().forEach((track) => {
          peerConnection.current?.addTrack(track, stream);
        });
      } catch (error) {
        alert(
          "Failed to access camera or microphone. Please check permissions.",
        );
        throw error;
      }
    }

    // Handle offer creation once both side are connected
    async function handleReadyEvent(role: string) {
      if (role === "offerer") {
        setTimeout(async () => {
          if (
            peerConnection.current?.signalingState === "stable" &&
            !offerSent.current
          ) {
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            socketRef.current?.emit("signal", { room: roomId, offer });
            offerSent.current = true;
          }
        }, 300);
      }
    }

    // Start the countdown before match starts
    const startReadyTimer = (duration: number) => {
      setTimer(duration);
      setCountingDown(true);
    };

    // Setup WebRTC connection
    const setupConnection = async () => {
      try {
        await setupLocalConnection();
        if (!peerConnection.current) {
          console.error("[WebRTC] PeerConnection missing after setup!");
          throw new Error("PeerConnection setup failed.");
        }

        // Handle ICE candidates
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current?.emit("signal", {
              room: roomId,
              candidate: event.candidate,
            });
          }
        };

        // Handle remote media streams
        peerConnection.current.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Handle connection state changes
        peerConnection.current.onconnectionstatechange = () => {
          if (!peerConnection.current) return;
          const state = peerConnection.current.connectionState;
          if (state === "connected") {
            peerConnection.current.onconnectionstatechange = null;
            startReadyTimer(10);
          }
        };

        if (!socketRef.current) {
          console.error("[WebRTC] SocketRef missing after connecting!");
          throw new Error("Socket connection missing.");
        }

        // Listen for signaling data
        socketRef.current.off("signal"); // Clear previous signal message handler
        socketRef.current.on("signal", (data) => {
          handleSignal(data);
        });

        // Listen for opponent leaving
        socketRef.current.off("opponent_left"); // Clear previous leaving message handler
        socketRef.current.on("opponent_left", () => {
          alert("Opponent has left the room.");
        });

        // Handle ready event to determine offerer or answerer
        socketRef.current.off("ready"); // Clear previous ready message handler
        socketRef.current.on("ready", handleReadyEvent);

        const userId = localStorage.getItem("userId");
        // Join the room
        socketRef.current.emit("join", { room: roomId, userId });
      } catch (error) {
        if (error instanceof DOMException) {
          if (error.name === "NotAllowedError") {
            if (error.message.includes("dismissed")) {
              alert(
                "Please allow camera and microphone access to join the room.",
              );
            } else {
              alert(
                "Access to camera and microphone was denied. Please enable it in your browser settings.",
              );
            }
          } else {
            console.error("setupConnection DOMException error:", error);
          }
        } else {
          console.error("setupConnection unexpected error:", error);
          router.push("/");
        }
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (!countingDown) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCountingDown(false);
          setGameStarted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval); // Cleanup
  }, [countingDown]);

  useEffect(() => {
    if (!gameStarted) return;

    const interval = setInterval(() => {
      setDuration((prev) => {
        if (prev <= 1) {
          if (!gameEnded) {
            clearInterval(interval);
            setGameEnded(true);
            stopGameAndDetermineWinner();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval); // Cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);

  // Clean up the room
  function roomCleanUp() {
    peerConnection.current?.close();
    socketRef.current?.off("signal");
    socketRef.current?.off("ready");
    socketRef.current?.off("opponent_left");
    socketRef.current?.disconnect();
    localStream?.getTracks().forEach((track) => track.stop());
  }

  // Clean up of the game and leaves the room
  function leaveRoom() {
    roomCleanUp();

    // Redirect to main page
    router.push("/");
  }

  // Determine the winner of the game
  function stopGameAndDetermineWinner() {
    if (myScore > opponentScore) {
      alert("You win!");
    } else if (myScore === opponentScore) {
      alert("Tied game!");
    } else {
      alert("You lost!");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-tr from-gray-950 via-gray-900 to-slate-900 p-4 text-center">
      <h1 className="m-2 text-center text-lg font-bold text-amber-50 md:text-xl lg:mb-5 lg:text-2xl">
        {duration === -1 ? (
          "Waiting..."
        ) : (
          <>
            Duration:{" "}
            <span className="text-indigo-200">{duration} seconds</span>
          </>
        )}
      </h1>
      {countingDown && <div>{timer}</div>}
      <button
        onClick={leaveRoom}
        className="absolute top-2 right-2 rounded-lg border bg-red-600 px-3 py-2 text-sm font-bold shadow-md transition hover:bg-red-700 md:text-base lg:text-lg"
      >
        Leave
      </button>

      <div className="grid w-full grid-cols-1 gap-6 p-4 md:grid-cols-2">
        <VideoCard videoRef={localVideoRef} label="You" muted />
        <VideoCard videoRef={remoteVideoRef} label="Opponent" />
      </div>
      <InstructionsBoard
        title="Prepare for Battle"
        instructions={[
          {
            title: "1. Set Up Your Space",
            description:
              "Find a clear area with enough room to perform push-ups. Make sure your environment is well-lit so your movements are easy to track.",
          },
          {
            title: "2. Enable Your Camera",
            description:
              "Turn on your webcam and position it to capture your full body, especially upper body and arms during push-ups.",
          },
          {
            title: "3. Get into Position",
            description:
              "Get into a ready stance — hands placed shoulder-width apart on the ground. Stay still until the match countdown begins.",
          },
          {
            title: "4. Start When Signaled",
            description:
              "Wait for the countdown to finish, then start doing push-ups. Every clean rep counts toward your score!",
          },
        ]}
        backgroundClass="bg-gradient-to-r from-blue-900/35 via-blue-800/50 to-blue-900/35"
      />
    </div>
  );
}
