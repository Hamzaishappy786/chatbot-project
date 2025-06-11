const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI Chat endpoint with D-ID Clips API
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        console.log('Received message:', message);
        
        // First, get OpenAI response
        const openaiResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant. Keep responses concise and friendly, under 100 words.'
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 150,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiResponse = openaiResponse.data.choices[0].message.content;
        console.log('OpenAI Response:', aiResponse);

        // Try D-ID integration using Clips API
        let finalVideoUrl = null;
        
        if (process.env.DID_API_KEY && process.env.DID_API_KEY.trim() !== '') {
            try {
                console.log('Attempting D-ID Clips API integration...');
                
                const didResponse = await axios.post(
                    'https://api.d-id.com/clips',
                    {
                        presenter_id: 'lily-ldwi8a_LdG',
                        script: {
                            type: 'text',
                            subtitles: 'false',
                            provider: {
                                type: 'microsoft', 
                                voice_id: 'Sara'
                            },
                            input: aiResponse.substring(0, 500), // Limit text length
                            ssml: 'false'
                        },
                        config: {
                            result_format: 'mp4'
                        },
                        presenter_config: {
                            crop: {
                                type: 'wide'
                            }
                        }
                    },
                    {
                        headers: {
                            'accept': 'application/json',
                            'content-type': 'application/json',
                            'authorization': `Basic ${process.env.DID_API_KEY}`
                        },
                        timeout: 15000
                    }
                );

                const clipId = didResponse.data.id;
                console.log('D-ID Clip ID:', clipId);
                
                // Poll for video completion
                let videoReady = false;
                let attempts = 0;

                while (!videoReady && attempts < 30) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    const statusResponse = await axios.get(
                        `https://api.d-id.com/clips/${clipId}`,
                        {
                            headers: {
                                'accept': 'application/json',
                                'authorization': `Basic ${process.env.DID_API_KEY}`
                            },
                            timeout: 5000
                        }
                    );

                    console.log(`Attempt ${attempts + 1}: Status -`, statusResponse.data.status);

                    if (statusResponse.data.status === 'done') {
                        videoReady = true;
                        finalVideoUrl = statusResponse.data.result_url;
                        console.log('Video ready:', finalVideoUrl);
                    } else if (statusResponse.data.status === 'error') {
                        console.error('D-ID processing failed:', statusResponse.data);
                        break;
                    }
                    
                    attempts++;
                }

                if (!videoReady) {
                    console.log('Video generation timed out after 30 attempts');
                }

            } catch (didError) {
                console.error('D-ID Error Details:');
                console.error('Status:', didError.response?.status);
                console.error('Data:', didError.response?.data);
                console.error('Message:', didError.message);
                // Continue without video - just return text response
            }
        } else {
            console.log('No D-ID API key provided, skipping avatar generation');
        }

        res.json({
            text: aiResponse,
            videoUrl: finalVideoUrl,
            success: true
        });

    } catch (error) {
        console.error('Main Error Details:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Message:', error.message);
        
        res.status(500).json({ 
            error: 'Failed to process request',
            details: error.response?.data || error.message,
            success: false
        });
    }
});

// Test D-ID connection
app.get('/api/test-did', async (req, res) => {
    try {
        const response = await axios.post(
            'https://api.d-id.com/clips',
            {
                presenter_id: 'lily-ldwi8a_LdG',
                script: {
                    type: 'text',
                    subtitles: 'false',
                    provider: {type: 'microsoft', voice_id: 'Sara'},
                    input: 'Testing D-ID connection',
                    ssml: 'false'
                },
                config: {result_format: 'mp4'},
                presenter_config: {crop: {type: 'wide'}}
            },
            {
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'authorization': `Basic ${process.env.DID_API_KEY}`
                }
            }
        );
        
        res.json({
            success: true,
            clipId: response.data.id,
            message: 'D-ID connection successful'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend is working!',
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasDID: !!process.env.DID_API_KEY,
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', port: PORT });
});

module.exports = app;