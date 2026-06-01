import React, { useState, useRef, useEffect } from 'react';
import './ChatWidget.scss';
import { environment } from '../../environments/environment';
import { useCookies } from 'react-cookie';

// A premium user icon SVG representing the AI Coach character in miniature
const UserIcon = () => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28" style={{ overflow: 'visible' }}>
    <defs>
      <linearGradient id="hairGradMini" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3d2c20" />
        <stop offset="100%" stopColor="#1a110a" />
      </linearGradient>
      <linearGradient id="skinGradMini" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f5cbb5" />
        <stop offset="100%" stopColor="#e29f80" />
      </linearGradient>
      <linearGradient id="suitGradMini" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8a9ba8" />
        <stop offset="100%" stopColor="#5c6a75" />
      </linearGradient>
    </defs>
    {/* Background Circle */}
    <circle cx="60" cy="60" r="58" fill="#1E293B" stroke="#ffffff" strokeWidth="4" />
    <g transform="scale(0.85) translate(10.5, 12)">
      {/* Neck */}
      <path d="M52 65 C52 75, 68 75, 68 65 L68 85 L52 85 Z" fill="url(#skinGradMini)" />
      {/* Ears */}
      <path d="M41 43 C37 43, 36 53, 41 52 Z" fill="#e29f80" />
      <path d="M79 43 C83 43, 84 53, 79 52 Z" fill="#e29f80" />
      {/* Head */}
      <path d="M41 40 C41 28, 79 28, 79 40 C79 56, 75 70, 60 74 C45 70, 41 56, 41 40 Z" fill="url(#skinGradMini)" />
      {/* Hair */}
      <path d="M41 42 C38 35, 40 20, 60 18 C80 20, 82 35, 79 42 C79 38, 77 34, 76 34 C76 32, 60 26, 44 34 C43 34, 41 38, 41 42 Z" fill="url(#hairGradMini)" />
      <path d="M40 38 C43 25, 50 18, 60 17 C70 18, 77 25, 80 38 C77 34, 73 30, 60 29 C47 30, 43 34, 40 38 Z" fill="url(#hairGradMini)" />
      <path d="M41 38 L41 48 L43 45 L43 38 Z" fill="#221915" />
      <path d="M79 38 L79 48 L77 45 L77 38 Z" fill="#221915" />
      {/* Eyebrows */}
      <path d="M44 38 Q49 35 54 37" stroke="#1a120e" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path d="M66 37 Q71 35 76 38" stroke="#1a120e" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <ellipse cx="49" cy="45" rx="5" ry="3.2" fill="#ffffff" stroke="#2c1e15" strokeWidth="1" />
      <circle cx="49" cy="45" r="2.5" fill="#5c3a21" />
      <ellipse cx="71" cy="45" rx="5" ry="3.2" fill="#ffffff" stroke="#2c1e15" strokeWidth="1" />
      <circle cx="71" cy="45" r="2.5" fill="#5c3a21" />
      {/* Nose */}
      <path d="M60 45 L60 55 C60 57, 57 58, 60 58 C62 58, 62 56, 62 55" stroke="#bc7b5c" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Mouth */}
      <path d="M50 59 C50 59, 52 68, 60 68 C68 68, 70 59, 70 59 Z" fill="#4d120f" stroke="#2c1e15" strokeWidth="1.5" />
      <path d="M51 60 C53 62, 67 62, 69 60 L68 59 Z" fill="#ffffff" />
      {/* Vest */}
      <path d="M48 76 L72 76 L80 110 L40 110 Z" fill="#46515c" />
      {/* Shirt */}
      <path d="M50 74 L60 86 L70 74 L73 78 L60 94 L47 78 Z" fill="#ffffff" />
      {/* Suit */}
      <path d="M30 100 C30 84, 40 76, 48 76 L42 110 L30 110 Z" fill="url(#suitGradMini)" />
      <path d="M90 100 C90 84, 80 76, 72 76 L78 110 L90 110 Z" fill="url(#suitGradMini)" />
    </g>
  </svg>
);

const TOPICS = [
  "growth mindset",
  "time management",
  "dealing with frustration",
  "goal-setting"
];

type CoachExpression = 'welcome' | 'thinking' | 'speaking' | 'happy' | 'thumbsup';

// Dynamic animated SVG mascot representing different emotions of the AI coach
const CoachMascot = ({ expression }: { expression: CoachExpression }) => {
  return (
    <div className={`coach-mascot-container ${expression}`}>
      <svg viewBox="0 0 120 120" className="mascot-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3d2c20" />
            <stop offset="100%" stopColor="#1a110a" />
          </linearGradient>
          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f5cbb5" />
            <stop offset="100%" stopColor="#e29f80" />
          </linearGradient>
          <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8a9ba8" />
            <stop offset="100%" stopColor="#5c6a75" />
          </linearGradient>
        </defs>

        {/* Background Aura */}
        <circle cx="60" cy="60" r="50" className="aura-bg" />

        {/* Neck */}
        <path d="M52 65 C52 75, 68 75, 68 65 L68 85 L52 85 Z" fill="url(#skinGrad)" />
        {/* Chin shadow */}
        <path d="M52 66 C58 74, 62 74, 68 66 C68 72, 52 72, 52 66 Z" fill="#c48568" opacity="0.6" />

        {/* Ears */}
        <path d="M41 43 C37 43, 36 53, 41 52 Z" fill="#e29f80" />
        <path d="M41 45 C38 45, 38 50, 41 49 Z" fill="#c48568" opacity="0.7" />
        <path d="M79 43 C83 43, 84 53, 79 52 Z" fill="#e29f80" />
        <path d="M79 45 C82 45, 82 50, 79 49 Z" fill="#c48568" opacity="0.7" />

        {/* Head/Face Shape */}
        <path d="M41 40 C41 28, 79 28, 79 40 C79 56, 75 70, 60 74 C45 70, 41 56, 41 40 Z" fill="url(#skinGrad)" />

        {/* Cheeks Highlight */}
        <circle cx="48" cy="54" r="5" fill="#f2bca2" opacity="0.4" />
        <circle cx="72" cy="54" r="5" fill="#f2bca2" opacity="0.4" />

        {/* Hair - Main Back Volume */}
        <path d="M41 42 C38 35, 40 20, 60 18 C80 20, 82 35, 79 42 C79 38, 77 34, 76 34 C76 32, 60 26, 44 34 C43 34, 41 38, 41 42 Z" fill="url(#hairGrad)" />
        
        {/* Hair - Front Volume & Slicked Back Styling */}
        <path d="M40 38 C43 25, 50 18, 60 17 C70 18, 77 25, 80 38 C77 34, 73 30, 60 29 C47 30, 43 34, 40 38 Z" fill="url(#hairGrad)" />
        {/* Sideburns */}
        <path d="M41 38 L41 48 L43 45 L43 38 Z" fill="#221915" />
        <path d="M79 38 L79 48 L77 45 L77 38 Z" fill="#221915" />
        
        {/* Hair Texture/Comb Lines */}
        <path d="M48 28 Q60 23 72 28" stroke="#5c4538" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M45 32 Q60 27 75 32" stroke="#5c4538" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M51 24 Q60 19 69 24" stroke="#5c4538" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M55 21 Q60 17 65 21" stroke="#5c4538" strokeWidth="1.0" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M42 36 Q60 30 78 36" stroke="#5c4538" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />

        {/* Eyebrows */}
        {expression === 'thinking' && (
          <>
            <path d="M44 39 Q49 37 54 38" stroke="#1a120e" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M66 34 Q71 31 76 33" stroke="#1a120e" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}
        {expression === 'happy' && (
          <>
            <path d="M44 36 Q49 32 54 35" stroke="#1a120e" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M66 35 Q71 32 76 36" stroke="#1a120e" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}
        {(expression === 'welcome' || expression === 'speaking' || expression === 'thumbsup') && (
          <>
            <path d="M44 38 Q49 35 54 37" stroke="#1a120e" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M66 37 Q71 35 76 38" stroke="#1a120e" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* Eyes */}
        {expression === 'thinking' && (
          <>
            <ellipse cx="49" cy="45" rx="5" ry="3.2" fill="#ffffff" stroke="#2c1e15" strokeWidth="1" />
            <circle cx="50" cy="43.8" r="2.5" fill="#5c3a21" />
            <circle cx="50" cy="43.8" r="1.3" fill="#000000" />
            <circle cx="49.5" cy="43.0" r="0.6" fill="#ffffff" />

            <ellipse cx="71" cy="45" rx="5" ry="3.2" fill="#ffffff" stroke="#2c1e15" strokeWidth="1" />
            <circle cx="72" cy="43.8" r="2.5" fill="#5c3a21" />
            <circle cx="72" cy="43.8" r="1.3" fill="#000000" />
            <circle cx="71.5" cy="43.0" r="0.6" fill="#ffffff" />
          </>
        )}
        {expression === 'happy' && (
          <>
            <path d="M44 46 Q49 41 54 46" stroke="#2c1e15" strokeWidth="2.5" fill="none" strokeLinecap="round" className="eyes happy-eyes" />
            <path d="M66 46 Q71 41 76 46" stroke="#2c1e15" strokeWidth="2.5" fill="none" strokeLinecap="round" className="eyes happy-eyes" />
          </>
        )}
        {(expression === 'welcome' || expression === 'speaking' || expression === 'thumbsup') && (
          <>
            <ellipse cx="49" cy="45" rx="5" ry="3.2" fill="#ffffff" stroke="#2c1e15" strokeWidth="1" className="eyes normal-eyes" />
            <circle cx="49" cy="45" r="2.5" fill="#5c3a21" />
            <circle cx="49" cy="45" r="1.3" fill="#000000" />
            <circle cx="48.2" cy="44.2" r="0.6" fill="#ffffff" />

            <ellipse cx="71" cy="45" rx="5" ry="3.2" fill="#ffffff" stroke="#2c1e15" strokeWidth="1" className="eyes normal-eyes" />
            <circle cx="71" cy="45" r="2.5" fill="#5c3a21" />
            <circle cx="71" cy="45" r="1.3" fill="#000000" />
            <circle cx="70.2" cy="44.2" r="0.6" fill="#ffffff" />
          </>
        )}

        {/* Nose */}
        <path d="M60 45 L60 55 C60 57, 57 58, 60 58 C62 58, 62 56, 62 55" stroke="#bc7b5c" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M57 56 Q60 57 63 56" stroke="#a36547" strokeWidth="1" fill="none" />

        {/* Mouth */}
        {expression === 'speaking' && (
          <g className="mouth speaking-mouth">
            <path d="M52 58 C50 58, 52 70, 60 70 C68 70, 70 58, 68 58 Z" fill="#4d120f" stroke="#2c1e15" strokeWidth="1" />
            <path d="M53 59 C55 61, 65 61, 67 59 Z" fill="#ffffff" />
            <path d="M55 67 C57 65, 63 65, 65 67 Z" fill="#c0392b" />
          </g>
        )}
        {expression === 'thinking' && (
          <path d="M52 61 Q60 58 68 61" stroke="#2c1e15" strokeWidth="2.5" fill="none" strokeLinecap="round" className="mouth thinking-mouth" />
        )}
        {(expression === 'welcome' || expression === 'thumbsup') && (
          <g className="mouth smiling-mouth">
            <path d="M50 59 C50 59, 52 68, 60 68 C68 68, 70 59, 70 59 Z" fill="#4d120f" stroke="#2c1e15" strokeWidth="1" />
            <path d="M51 60 C53 62, 67 62, 69 60 L68 59 C65 59, 55 59, 52 59 Z" fill="#ffffff" />
            <path d="M54 66 C57 63, 63 63, 66 66 Z" fill="#c0392b" />
          </g>
        )}
        {expression === 'happy' && (
          <g className="mouth smiling-mouth">
            <path d="M48 58 C48 58, 50 71, 60 71 C70 71, 72 58, 72 58 Z" fill="#4d120f" stroke="#2c1e15" strokeWidth="1.5" />
            <path d="M49 59 C51 62, 69 62, 71 59 Z" fill="#ffffff" />
            <path d="M53 67 C57 64, 63 64, 67 67 Z" fill="#c0392b" />
          </g>
        )}

        {/* Clothing - Vest */}
        <path d="M48 76 L72 76 L80 110 L40 110 Z" fill="#46515c" className="suit-body" />
        <circle cx="60" cy="85" r="1.5" fill="#111111" />
        <circle cx="60" cy="94" r="1.5" fill="#111111" />
        <circle cx="60" cy="103" r="1.5" fill="#111111" />

        {/* Clothing - White Shirt with Open Collar */}
        <path d="M50 74 L60 86 L70 74 L73 78 L60 94 L47 78 Z" fill="#ffffff" className="shirt-collar" />
        <path d="M50 74 L60 86 L53 87 Z" fill="#e6eaed" stroke="#b0bec5" strokeWidth="0.5" />
        <path d="M70 74 L60 86 L67 87 Z" fill="#e6eaed" stroke="#b0bec5" strokeWidth="0.5" />

        {/* Clothing - Grey Suit Jacket */}
        <path d="M30 100 C30 84, 40 76, 48 76 L42 110 L30 110 Z" fill="url(#suitGrad)" className="suit-body" />
        <path d="M90 100 C90 84, 80 76, 72 76 L78 110 L90 110 Z" fill="url(#suitGrad)" className="suit-body" />
        <path d="M48 76 L40 92 L46 95 L50 82 Z" fill="#5c6a75" stroke="#46515c" strokeWidth="0.5" />
        <path d="M72 76 L80 92 L74 95 L70 82 Z" fill="#5c6a75" stroke="#46515c" strokeWidth="0.5" />

        {/* Dynamic accessory elements */}
        {expression === 'thinking' && (
          <g className="thought-dots">
            <circle cx="95" cy="30" r="2" fill="#8CC63F" className="dot-1" />
            <circle cx="102" cy="23" r="3" fill="#8CC63F" className="dot-2" />
            <circle cx="110" cy="14" r="4.5" fill="#8CC63F" className="dot-3" />
          </g>
        )}
        {expression === 'thumbsup' && (
          <g className="thumbsup-hand">
            <circle cx="95" cy="65" r="12" fill="#f5cbb5" stroke="#2c1e15" strokeWidth="2" />
            <path d="M95 58 C93 48, 88 52, 91 58 Z" fill="#f5cbb5" stroke="#2c1e15" strokeWidth="2" />
            <path d="M98 62 C102 62, 102 65, 98 65" stroke="#2c1e15" strokeWidth="2" fill="none" />
            <path d="M98 65 C102 65, 102 68, 98 68" stroke="#2c1e15" strokeWidth="2" fill="none" />
            <path d="M98 68 C102 68, 102 71, 98 71" stroke="#2c1e15" strokeWidth="2" fill="none" />
          </g>
        )}
        {expression === 'happy' && (
          <g className="celebration-sparkles">
            <path d="M20 25 L24 29 M20 29 L24 25" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
            <path d="M100 25 L104 29 M100 29 L104 25" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [topic, setTopic] = useState<string>('');
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [coachExpression, setCoachExpression] = useState<CoachExpression>('welcome');
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const toggleWidget = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      setCoachExpression('welcome');
      if (!sessionId) {
        startSession("General Coaching");
      }
    }
  };

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!sessionId) {
      startSession("General Coaching");
    }
  }, []);

  const [cookies] = useCookies(['login']);

  const startSession = async (selectedTopic: string) => {
    setIsLoading(true);
    setTopic(selectedTopic);
    setCoachExpression('thinking');
    try {
      let resolvedUserId = "5f8f8c44b54764421b7156e0"; // Static fallback
      if (cookies.login) {
        try {
          const payload = JSON.parse(atob(cookies.login.split('.')[1]));
          const username = payload.username;
          if (username) {
            const userRes = await fetch(`${environment.urls.middlewareURL}/user/getUser?username=${encodeURIComponent(username)}`, {
              headers: { 'Authorization': `Bearer ${cookies.login}` }
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              if (userData && userData._id) {
                resolvedUserId = userData._id;
              }
            }
          }
        } catch (jwtErr) {
          console.error("Failed to decode token or resolve user ID:", jwtErr);
        }
      }

      const response = await fetch(`${environment.urls.middlewareURL}/chat/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resolvedUserId, topic: selectedTopic })
      });
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session._id);
        setMessages([{ sender: 'bot', text: `Hi there! I'm your AI Coach. 🧠 How are you feeling about your learning and chess progress today?` }]);
        setCoachExpression('happy');
      } else {
        throw new Error("Failed to start session");
      }
    } catch (e) {
      console.error(e);
      setMessages([{ sender: 'bot', text: 'Error starting session. Please try again.' }]);
      setCoachExpression('welcome');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setCoachExpression('thinking');
    try {
      const response = await fetch(`${environment.urls.middlewareURL}/chat/session/${sessionId}/end`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [
          ...prev, 
          { sender: 'bot', text: `Session complete! 🎉\n\nSummary: ${data.session.summary}\n\nActions:\n${data.session.actions.join('\n')}` }
        ]);
        setSessionId(null);
        setCoachExpression('thumbsup');
      }
    } catch (e) {
      console.error(e);
      setCoachExpression('welcome');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);
    setCoachExpression('thinking');

    try {
      const response = await fetch(`${environment.urls.middlewareURL}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId, message: userMsg })
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to fetch');
      }

      setMessages(prev => [...prev, { sender: 'bot', text: '' }]);
      setIsLoading(false);
      setCoachExpression('speaking');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.includes('data: [DONE]')) continue;
          if (line.startsWith('data: ')) {
            try {
              const dataStr = line.slice(6);
              const parsed = JSON.parse(dataStr);
              const content = parsed.choices[0]?.delta?.content;
              
              if (content) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsgIndex = newMessages.length - 1;
                  newMessages[lastMsgIndex] = {
                    ...newMessages[lastMsgIndex],
                    text: newMessages[lastMsgIndex].text + content
                  };
                  return newMessages;
                });
              }
            } catch (e) {
              // Ignore incomplete JSON chunks and wait for the rest
            }
          }
        }
      }

      // Check tone or words to update expression on response completion
      setCoachExpression('happy');

    } catch (error) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'failed to fetch' }]);
      setIsLoading(false);
      setCoachExpression('welcome');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const getCoachBubbleText = () => {
    switch (coachExpression) {
      case 'welcome':
        return "Hello! I'm your AI Coach. Ready to unlock your potential?";
      case 'thinking':
        return "Let me think about that for a second...";
      case 'speaking':
        return "Here's what I recommend for you...";
      case 'happy':
        return "Awesome! You are making great progress.";
      case 'thumbsup':
        return "Spot on! Keep up this amazing mindset.";
      default:
        return "Ready to practice some new mental skills?";
    }
  };

  return (
    <div className="chat-widget-container">
      {isOpen && (
        <div className="chat-overlay-backdrop" onClick={toggleWidget}>
          <div className="chat-widget-window" onClick={(e) => e.stopPropagation()}>
            
            {/* Left Column: AI Coach Sidebar */}
            <div className="chat-coach-sidebar">
              <div className="sidebar-branding">
                <div className="mascot-badge">AI Coach</div>
                <div className="status-indicator">
                  <span className="pulse-dot"></span>
                  Online
                </div>
              </div>

              {/* Coach Avatar Display */}
              <div className="avatar-frame-container">
                <CoachMascot expression={coachExpression} />
                
                {/* Speech bubble for the mascot */}
                <div className="coach-bubble">
                  <div className="bubble-arrow"></div>
                  <p>{getCoachBubbleText()}</p>
                </div>
              </div>

              {/* Tips & Guidance Info card */}
              <div className="coach-tips-card">
                <h5>Pro Tip 💡</h5>
                <p>Developing a growth mindset helps you embrace challenges and learn from failure. Take your time to reflect on your answers!</p>
              </div>
            </div>

            {/* Right Column: Chat Workspace */}
            <div className="chat-main-area">
              <div className="chat-header">
                <div className="header-title-section">
                  <h4>Mental Strength Training</h4>
                  {topic && <span className="topic-tag">{topic}</span>}
                </div>
                <div className="chat-header-actions">
                  {sessionId && (
                    <button onClick={handleEndSession} className="end-btn" title="End Session">
                      End Session 🏁
                    </button>
                  )}
                  <button onClick={toggleWidget} className="close-btn" title="Close">&times;</button>
                </div>
              </div>

              <div className="chat-messages" ref={chatMessagesRef}>
                {!sessionId && messages.length === 0 ? (
                  <div className="chat-loading-session" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <div className="typing-loader">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <p style={{ marginTop: '14px', color: '#64748B', fontSize: '15px', fontWeight: '500' }}>Starting your coaching session...</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`chat-message ${msg.sender}`}>
                        <div className="message-sender-label">
                          {msg.sender === 'user' ? 'You' : 'Coach'}
                        </div>
                        <div className="message-text">
                          {msg.text.split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="chat-message bot loading">
                        <div className="message-sender-label">Coach</div>
                        <div className="typing-loader">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {sessionId && (
                <div className="chat-input-area">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Reflect and reply here..."
                    disabled={isLoading}
                  />
                  <button onClick={handleSend} disabled={isLoading || !input.trim()}>
                    Send
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
      
      {!isOpen && (
        <button className="chat-text-button" onClick={toggleWidget}>
          Talk to AI Coach
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
