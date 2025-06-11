import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
    const [recognition, setRecognition] = useState(null);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const videoRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputText(transcript);
                setIsListening(false);
            };

            recognitionInstance.onerror = () => {
                setIsListening(false);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        }
    }, []);

    // Handle video events
    useEffect(() => {
        if (videoRef.current) {
            const video = videoRef.current;
            
            const handlePlay = () => setIsVideoPlaying(true);
            const handlePause = () => setIsVideoPlaying(false);
            const handleEnded = () => {
                setIsVideoPlaying(false);
                // Pause the video and show as static image
                video.pause();
            };

            video.addEventListener('play', handlePlay);
            video.addEventListener('pause', handlePause);
            video.addEventListener('ended', handleEnded);

            return () => {
                video.removeEventListener('play', handlePlay);
                video.removeEventListener('pause', handlePause);
                video.removeEventListener('ended', handleEnded);
            };
        }
    }, [currentVideoUrl]);

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const startListening = () => {
        if (recognition && !isListening) {
            setIsListening(true);
            recognition.start();
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = { type: 'user', text: inputText };
        setMessages(prev => [...prev, userMessage]);
        setCurrentMessage(inputText); // Show user message on avatar
        setIsLoading(true);
        
        const messageToSend = inputText;
        setInputText('');

        try {
            const response = await axios.post('http://localhost:5000/api/chat', {
                message: messageToSend
            });

            const botMessage = {
                type: 'bot',
                text: response.data.text,
                videoUrl: response.data.videoUrl
            };

            setMessages(prev => [...prev, botMessage]);
            setCurrentMessage(response.data.text); // Show bot response on avatar
            
            // Update video URL and play when new one is available
            if (response.data.videoUrl) {
                setCurrentVideoUrl(response.data.videoUrl);
                // Reset video playing state for new video
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.play();
                    }
                }, 100);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = {
                type: 'bot',
                text: 'Sorry, I encountered an error. Please try again.',
                videoUrl: null
            };
            setMessages(prev => [...prev, errorMessage]);
            setCurrentMessage('Sorry, I encountered an error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    const chatbotStyles = {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        fontFamily: 'Arial, sans-serif'
    };

    const chatIconStyles = {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#007bff',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px',
        boxShadow: '0 4px 12px rgba(0,123,255,0.3)',
        transition: 'transform 0.2s',
        '&:hover': {
            transform: 'scale(1.1)'
        }
    };

    const chatWindowStyles = {
        position: 'absolute',
        bottom: '70px',
        right: '0',
        width: '350px',
        height: '400px',
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Semi-transparent background
        backdropFilter: 'blur(10px)', // Glass effect
        WebkitBackdropFilter: 'blur(10px)', // Safari support
        border: '1px solid rgba(255, 255, 255, 0.2)', // Subtle border
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)', // Enhanced shadow for glass effect
        display: isOpen ? 'flex' : 'none',
        flexDirection: 'column',
        overflow: 'hidden'
    };

    const avatarContainerStyles = {
        flex: 1,
        backgroundColor: 'transparent', // Fully transparent background
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        minHeight: '300px'
    };

    const closeButtonStyles = {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.7)', // Slightly more opaque for visibility
        border: 'none',
        color: 'white',
        fontSize: '18px',
        cursor: 'pointer',
        borderRadius: '50%',
        width: '30px',
        height: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)'
    };

    const messageOverlayStyles = {
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)', // Keep this opaque for readability
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '14px',
        maxHeight: '80px',
        overflowY: 'auto',
        wordWrap: 'break-word',
        zIndex: 5,
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)'
    };

    const inputContainerStyles = {
        padding: '15px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.3)',
        display: 'flex',
        gap: '8px'
    };

    const inputStyles = {
        flex: 1,
        padding: '10px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '20px',
        outline: 'none',
        fontSize: '14px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        color: '#333',
        '::placeholder': {
            color: 'rgba(0, 0, 0, 0.7)'
        }
    };

    const buttonStyles = {
        padding: '10px 15px',
        backgroundColor: 'rgba(0, 123, 255, 0.8)',
        color: 'white',
        border: 'none',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '14px',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        transition: 'background-color 0.2s'
    };

    const micButtonStyles = {
        ...buttonStyles,
        backgroundColor: isListening ? 'rgba(220, 53, 69, 0.8)' : 'rgba(40, 167, 69, 0.8)',
        minWidth: '40px'
    };

    return React.createElement('div', { style: chatbotStyles },
        React.createElement('button', {
            style: chatIconStyles,
            onClick: toggleChat,
            onMouseEnter: (e) => e.target.style.transform = 'scale(1.1)',
            onMouseLeave: (e) => e.target.style.transform = 'scale(1)'
        }, '💬'),
        
        React.createElement('div', { style: chatWindowStyles },
            React.createElement('button', {
                onClick: toggleChat,
                style: closeButtonStyles,
                title: 'Close chat'
            }, '×'),
            
            React.createElement('div', { style: avatarContainerStyles },
                currentVideoUrl ? 
                    React.createElement('video', {
                        ref: videoRef,
                        src: currentVideoUrl,
                        muted: false,
                        loop: false, // Changed to false so video stops when finished
                        style: {
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }
                    }) :
                    React.createElement('div', {
                        style: {
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0, 123, 255, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '32px',
                            backdropFilter: 'blur(5px)',
                            WebkitBackdropFilter: 'blur(5px)'
                        }
                    }, '🤖'),
                
                // Message overlay on the avatar
                (currentMessage || isLoading) && React.createElement('div', { style: messageOverlayStyles },
                    isLoading ? 'AI is thinking...' : currentMessage
                )
            ),
            
            React.createElement('div', { style: inputContainerStyles },
                React.createElement('input', {
                    type: 'text',
                    value: inputText,
                    onChange: (e) => setInputText(e.target.value),
                    onKeyPress: handleKeyPress,
                    placeholder: 'Type your message...',
                    style: inputStyles,
                    disabled: isLoading
                }),
                recognition && React.createElement('button', {
                    onClick: startListening,
                    style: micButtonStyles,
                    disabled: isLoading || isListening,
                    title: isListening ? 'Listening...' : 'Voice Input'
                }, isListening ? '🔴' : '🎤'),
                React.createElement('button', {
                    onClick: sendMessage,
                    style: buttonStyles,
                    disabled: isLoading || !inputText.trim()
                }, 'Send')
            )
        )
    );
};

export default Chatbot;