import React, { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import { Button } from './ui/Button';

interface VideoCallProps {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    onEndCall: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({ localStream, remoteStream, onEndCall }) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);
    
    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };
    
    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 z-40 flex flex-col items-center justify-center animate-fadeIn">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            <video ref={localVideoRef} autoPlay playsInline muted className="absolute top-4 right-4 w-48 h-36 rounded-lg shadow-2xl object-cover border-2 border-white/20" />
            
            <div className="absolute bottom-8 flex items-center justify-center gap-4 p-4 bg-black/30 backdrop-blur-md rounded-full">
                <Button onClick={toggleMute} variant="ghost" size="icon" className="text-white rounded-full bg-white/20 hover:bg-white/30">
                    {isMuted ? <MicOff className="h-6 w-6"/> : <Mic className="h-6 w-6"/>}
                </Button>
                <Button onClick={toggleVideo} variant="ghost" size="icon" className="text-white rounded-full bg-white/20 hover:bg-white/30">
                    {isVideoOff ? <VideoOff className="h-6 w-6"/> : <Video className="h-6 w-6"/>}
                </Button>
                <Button onClick={onEndCall} variant="destructive" size="icon" className="rounded-full !w-16 !h-16">
                    <PhoneOff className="h-8 w-8" />
                </Button>
            </div>
        </div>
    );
};

export default VideoCall;