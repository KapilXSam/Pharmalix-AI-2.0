import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export const useWebRTC = (userId: string | null, consultationId: number) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isCallActive, setIsCallActive] = useState(false);
    const [incomingCall, setIncomingCall] = useState<any | null>(null);
    const pc = useRef<RTCPeerConnection | null>(null);
    const channel = useRef<any | null>(null);

    const setupMedia = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.error("Error accessing media devices.", error);
            return null;
        }
    }, []);

    const sendSignal = useCallback((type: string, payload: any) => {
        if (channel.current) {
            channel.current.send({
                type: 'broadcast',
                event: 'webrtc-signal',
                payload: { type, payload, senderId: userId },
            });
        }
    }, [userId]);
    
    const cleanupConnection = useCallback(() => {
        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        setRemoteStream(null);
        setIsCallActive(false);
        setIncomingCall(null);
    }, [localStream]);

    const endCall = useCallback(() => {
        sendSignal('end-call', {});
        cleanupConnection();
    }, [sendSignal, cleanupConnection]);


    const createPeerConnection = useCallback((stream: MediaStream) => {
        if (pc.current) {
            pc.current.close();
        }

        pc.current = new RTCPeerConnection(ICE_SERVERS);

        stream.getTracks().forEach(track => {
            pc.current!.addTrack(track, stream);
        });

        pc.current.ontrack = event => {
            setRemoteStream(event.streams[0]);
        };

        pc.current.onicecandidate = event => {
            if (event.candidate) {
                sendSignal('ice-candidate', event.candidate);
            }
        };
        
        pc.current.onconnectionstatechange = () => {
            if (pc.current?.connectionState === 'disconnected' || pc.current?.connectionState === 'failed' || pc.current?.connectionState === 'closed') {
                endCall();
            }
        };

        setIsCallActive(true);
    }, [sendSignal, endCall]);

    const startCall = useCallback(async () => {
        const stream = await setupMedia();
        if (stream && userId) {
            createPeerConnection(stream);
            const offer = await pc.current!.createOffer();
            await pc.current!.setLocalDescription(offer);
            sendSignal('offer', offer);
        }
    }, [setupMedia, createPeerConnection, sendSignal, userId]);
    
    const answerCall = useCallback(async () => {
        if (!incomingCall) return;

        const stream = await setupMedia();
        if (stream && userId) {
            createPeerConnection(stream);
            await pc.current!.setRemoteDescription(new RTCSessionDescription(incomingCall.payload));
            const answer = await pc.current!.createAnswer();
            await pc.current!.setLocalDescription(answer);
            sendSignal('answer', answer);
            setIncomingCall(null);
        }
    }, [incomingCall, setupMedia, createPeerConnection, sendSignal, userId]);


    const handleSignal = useCallback(async (data: any) => {
        if (!userId || data.senderId === userId) return;

        switch (data.type) {
            case 'offer':
                if (!isCallActive && !incomingCall) {
                    setIncomingCall(data);
                }
                break;
            case 'answer':
                if (pc.current && pc.current.signalingState !== 'stable') {
                    await pc.current.setRemoteDescription(new RTCSessionDescription(data.payload));
                }
                break;
            case 'ice-candidate':
                if (pc.current) {
                    try {
                        await pc.current.addIceCandidate(new RTCIceCandidate(data.payload));
                    } catch (e) {
                        console.error('Error adding received ice candidate', e);
                    }
                }
                break;
            case 'end-call':
                cleanupConnection();
                break;
        }
    }, [userId, isCallActive, incomingCall, cleanupConnection]);

    useEffect(() => {
        if (userId && consultationId) {
            const newChannel = supabase.channel(`webrtc-consultation-${consultationId}`);
            
            newChannel.on('broadcast', { event: 'webrtc-signal' }, ({ payload }) => {
                handleSignal(payload);
            }).subscribe();

            channel.current = newChannel;

            return () => {
                if (channel.current) {
                    supabase.removeChannel(channel.current);
                }
                cleanupConnection();
            };
        }
    }, [userId, consultationId, handleSignal, cleanupConnection]);

    return {
        localStream,
        remoteStream,
        isCallActive,
        incomingCall,
        startCall,
        answerCall,
        endCall,
    };
};