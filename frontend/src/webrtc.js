export default class WebRTC {
    constructor() {
        this.peerConnection = null;
    }
    newPeerConnection(onIceCandidate,onRemoteStream,onConnectionStateChange) {
        const configuration = {
            iceServers: [
                {
                    urls: 'stun:stun.l.google.com:19302',
                },
            ],
        };
        this.peerConnection = new RTCPeerConnection(configuration);
        this.peerConnection.onicecandidate=(event => {
            if (event.candidate) {
                onIceCandidate(event.candidate);
            }
        });
        this.peerConnection.ontrack = (event) => {
            onRemoteStream(event.streams[0]);
        };
        this.peerConnection.onconnectionstatechange = () => {
            onConnectionStateChange(this.peerConnection.connectionState);
        };
    }
    async addIceCandidate(candidate){
        if (!this.peerConnection) {
            console.error("Peer connection is not initialized.");
            return;
        }
        try{
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error("Error adding ice candidate:", error);
            throw error;
        }
    }

     attachLocalStream(stream) {
        if (!this.peerConnection) {
            console.error("Peer connection is not initialized.");
            return;
        }
        stream.getTracks().forEach((track) => {
            this.peerConnection.addTrack(track, stream);
        });
    }
    async createOffer() {
        if (!this.peerConnection) {
            console.error("Peer connection is not initialized.");
            return;
        }
        try{
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            return offer;
        } catch (error) {
            console.error("Error creating offer:", error);
            throw error;
        }
    }
     async createAnswer() {
        if (!this.peerConnection) {
            console.error("Peer connection is not initialized.");
            return;
        }
        try{
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            return answer;
        } catch (error) {
            console.error("Error creating answer:", error);
            throw error;
        }
    }
    async setRemoteDescription(sdp){
        if (!this.peerConnection) {
            console.error("Peer connection is not initialized.");
            return;
        }
        try{
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
        } catch (error) {
            console.error("Error setting remote description:", error);
            throw error;
        }
    }
    close(){
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        else{
            console.warn("Peer connection is already closed or not initialized.");
        }
    }
}