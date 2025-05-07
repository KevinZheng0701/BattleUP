"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import VideoCard from "@/components/VideoCard";
import InstructionsBoard from "@/components/InstructionsBoard";
import MatchResultModal from "@/components/MatchResultModal";
import useAlert from "@/context/AlertContext";
const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

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
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Game state variables
  const [gameState, setGameState] = useState<
    "waiting" | "counting" | "playing" | "ended"
  >("waiting");
  const gameEndedRef = useRef<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [duration, setDuration] = useState<number>(-1);
  const [myScore, setMyScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [gameResult, setGameResult] = useState<
    "You Win!" | "Tied Game!" | "You Lost!" | ""
  >("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [disconnection, setDisconnection] = useState<boolean>(false);
  const [rematchRequested, setRematchRequest] = useState<boolean>(false); // State for whether a request is recieved from the other side

  const [userId, setUserId] = useState<string>("");
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  const { showAlert } = useAlert();

  useEffect(() => {
    let isActive = true;
    async function validateAndConnect() {
      // Exit the room after validation failed
      if (!validateRoom()) {
        router.push("/");
        return;
      }
      // Check if room is correct on the backend
      const roomIsValid = await checkRoom();
      if (roomIsValid) {
        socketRef.current = io(API, {
          transports: ["websocket"],
        });
        setupConnection();
      } else {
        router.push("/");
        return;
      }
    }

    // Valid user and room id are valid on the client side
    function validateRoom() {
      // Early exit if no room id or user id is found and redirect user back home
      const storedId = localStorage.getItem("userId") ?? "";
      setUserId(storedId);
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const isValidUuid = storedId && uuidRegex.test(storedId);
      return roomId && isValidUuid;
    }

    // Verify if the room actually exists before setting up connection
    async function checkRoom() {
      try {
        const response = await fetch(`${API}/api/check-room`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room: roomId }),
        });

        if (!response.ok) throw new Error("Room not found!");

        const data = await response.json();
        if (!data.exists) throw new Error("Room not found!");
        const status = data.status;
        if (status == "ended" || status == "disconnected") {
          throw new Error("Room disconnected or ended!");
        }
        setDuration(data.duration);
        return true;
      } catch (error) {
        showAlert("warning", String(error));
        return false;
      }
    }

    // Setup WebRTC connection
    async function setupConnection() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (isActive) {
          // Attach local video stream to video element
          localStreamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;

          // Create a new peer connection
          peerConnection.current = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          });

          // Add all local tracks to the connection
          stream.getTracks().forEach((track) => {
            peerConnection.current?.addTrack(track, stream);
          });

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
            if (remoteVideoRef.current)
              remoteVideoRef.current.srcObject = event.streams[0];
          };

          // Handle connection state changes
          peerConnection.current.onconnectionstatechange = () => {
            if (!peerConnection.current) return;
            const state = peerConnection.current.connectionState;
            if (state === "connected") {
              peerConnection.current.onconnectionstatechange = null;
              setGameState("counting");
            }
          };

          // Ensure no hang over listeners
          socketRef.current?.removeAllListeners();

          // Listen for signaling data
          socketRef.current?.on("signal", handleSignal);

          // Listen for rematch request
          socketRef.current?.on("rematch_request", () => {
            showAlert("info", "Rematch requested!");
          });

          // Listen for opponent leaving
          socketRef.current?.on("opponent_left", handleOpponentLeaving);

          // Listen for rematch approval
          socketRef.current?.on("rematch_approved", resetGame);

          // Handle ready event to determine offerer or answerer
          socketRef.current?.on("ready", handleReadyEvent);

          const storedId = localStorage.getItem("userId");
          // Join the room
          socketRef.current?.emit("join", { room: roomId, userId: storedId });
        }
      } catch (error) {
        if (error instanceof DOMException) {
          if (error.name === "NotAllowedError") {
            if (error.message.includes("dismissed")) {
              showAlert(
                "warning",
                "Please allow camera and microphone access to join the room.",
              );
            } else {
              showAlert(
                "warning",
                "Access to camera and microphone was denied. Please enable it in your browser settings.",
              );
            }
          } else {
            console.log(error);
          }
        } else {
          console.log(error);
          router.push("/");
        }
      }
    }

    // Handle incoming WebRTC signaling data (offer, answer, or ICE candidate)
    async function handleSignal(data: SignalData) {
      if (!peerConnection.current) return;

      // Received an offer then set remote description, create, and send an answer
      if (data.offer && peerConnection.current.signalingState === "stable") {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.offer),
        );
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socketRef.current?.emit("signal", { room: roomId, answer });

        // Process any queued ICE candidates
        while (pendingCandidates.current.length > 0) {
          const candidate = pendingCandidates.current.shift();
          if (candidate)
            await peerConnection.current.addIceCandidate(candidate);
        }
      } else if (
        data.answer &&
        peerConnection.current.signalingState === "have-local-offer"
      ) {
        // Received an answer then finalize the connection
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.answer),
        );

        // Process any queued ICE candidates
        while (pendingCandidates.current.length > 0) {
          const candidate = pendingCandidates.current.shift();
          if (candidate)
            await peerConnection.current.addIceCandidate(candidate);
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

    // Handle when the opponent left the game
    function handleOpponentLeaving() {
      setDisconnection(true);
      setIsModalOpen(true);
      gameEndedRef.current = true;
      setGameState("ended");
      setTimer(0);
      setGameResult("You Win!");
      socketRef.current?.emit("game_ended", { room: roomId });
      showAlert("error", "Opponent has left the room.");
    }

    validateAndConnect();

    // Clean up everything when the component unmounts
    return () => {
      isActive = false; // For strict unmount and remounting causes camera issues when trying to stop
      cleanUpRoom();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (gameState !== "counting" && gameState !== "playing") return;
    const isCounting = gameState === "counting";
    const initialTime = isCounting ? 10 : duration;
    setTimer(initialTime);
    const interval = setInterval(() => {
      if (gameEndedRef.current) {
        clearInterval(interval);
        return;
      }
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (isCounting) {
            setGameState("playing");
          } else {
            socketRef.current?.emit("game_ended", { room: roomId });
            setGameState("ended");
            determineWinner();
            setIsModalOpen(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval); // Cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // Clean up the room
  function cleanUpRoom() {
    if (!socketRef.current) return;
    socketRef.current.emit("leave_room", { room: roomId });
    socketRef.current.removeAllListeners();
    socketRef.current.disconnect();

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Clean up local video
    if (localVideoRef.current) {
      localVideoRef.current.pause();
      localVideoRef.current.srcObject = null;
      localVideoRef.current = null;
    }

    // Clean up remote video
    if (remoteVideoRef.current) {
      remoteVideoRef.current.pause();
      remoteVideoRef.current.srcObject = null;
      remoteVideoRef.current = null;
    }
  }

  // Clean up of the game and leaves the room
  function leaveRoom() {
    cleanUpRoom();

    // Redirect to main page
    router.push("/");
  }

  // Determine the winner of the game
  function determineWinner() {
    if (myScore > opponentScore) {
      setGameResult("You Win!");
    } else if (myScore === opponentScore) {
      setGameResult("Tied Game!");
    } else {
      setGameResult("You Lost!");
    }
  }

  // Reset state variables for a new game
  function resetGame() {
    setMyScore(0);
    setOpponentScore(0);
    setGameResult("");
    setRematchRequest(false);
    setIsModalOpen(false);
    setGameState("counting");
    gameEndedRef.current = false;
  }

  // Send a request to the backend for a rematch
  async function sendRematchRequest() {
    socketRef.current?.emit("rematch", { room: roomId });
    setRematchRequest(true);
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-tr from-gray-950 via-gray-900 to-slate-900 p-4 text-center">
      <div className="flex w-full items-center justify-around">
        <h1 className="m-2 text-center text-lg font-bold text-amber-50 md:text-xl lg:mb-5 lg:text-2xl">
          {gameState === "waiting" ? (
            "Waiting..."
          ) : gameState === "counting" ? (
            <>
              Get ready in <span className="text-indigo-200">{timer}</span>{" "}
              seconds
            </>
          ) : (
            <>
              Duration: <span className="text-indigo-200">{timer} seconds</span>
            </>
          )}
        </h1>
        <button
          onClick={leaveRoom}
          className="rounded-lg border bg-red-600 px-3 py-2 text-sm font-bold shadow-md transition hover:bg-red-700 md:text-base lg:text-lg"
        >
          Leave
        </button>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 p-4 md:grid-cols-2">
        <VideoCard videoRef={localVideoRef} label="You" score={myScore} muted />
        <VideoCard
          videoRef={remoteVideoRef}
          label="Opponent"
          score={opponentScore}
        />
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
        backgroundClass="bg-gradient-to-r from-blue-900/75 via-blue-800/50 to-blue-900/75"
      />
      {isModalOpen && (
        <MatchResultModal
          yourScore={myScore}
          opponentScore={opponentScore}
          result={gameResult}
          duration={duration}
          rematchAvailable={!disconnection}
          userId={userId}
          rematchRequested={rematchRequested}
          onRematch={sendRematchRequest}
        />
      )}
    </div>
  );
}
