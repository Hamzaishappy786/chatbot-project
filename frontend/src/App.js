import React from 'react';
import Chatbot from './components/Chatbot';
import './App.css';

function App() {
    return React.createElement('div', { className: 'App' },
        React.createElement('div', { className: 'main-content' },
            React.createElement('div', { className: 'hero-section' },
                React.createElement('h1', { className: 'title' }, 'Demo Website'),
                React.createElement('p', { className: 'subtitle' }, 'Welcome to our AI-powered chat experience'),
                React.createElement('div', { className: 'features' },
                    React.createElement('div', { className: 'feature-card' },
                        React.createElement('h3', null, 'AI Chat'),
                        React.createElement('p', null, 'Intelligent conversations powered by OpenAI')
                    ),
                    React.createElement('div', { className: 'feature-card' },
                        React.createElement('h3', null, 'Avatar Responses'),
                        React.createElement('p', null, 'Visual AI avatar powered by D-ID technology')
                    ),
                    React.createElement('div', { className: 'feature-card' },
                        React.createElement('h3', null, 'Voice Input'),
                        React.createElement('p', null, 'Speak naturally or type your messages')
                    )
                )
            )
        ),
        React.createElement(Chatbot)
    );
}

export default App;