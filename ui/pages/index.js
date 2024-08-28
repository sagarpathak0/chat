import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { motion } from 'framer-motion';

let socket;

export default function Chat() {
  const [username, setUsername] = useState('');
  const [currentRoom, setCurrentRoom] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [typingStatus, setTypingStatus] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
//[,'https://chat-api-ruddy.vercel.app/',]
  useEffect(() => {
    socket = io('https://chat-api-ruddy.vercel.app');

    socket.on('loginError', (errorMessage) => {
      alert(errorMessage);
    });

    socket.on('messageHistory', (history) => {
      setMessages(history.map(entry => ({
        user: entry.user,
        message: entry.user === username ? `You: ${entry.message}` : `${entry.user}: ${entry.message}`
      })));
    });

    socket.on('typing', (data) => {
      setTypingStatus(data.isTyping ? `${data.username} is typing...` : '');
    });

    socket.on('chatMessage', (message) => {
      setMessages(prevMessages => [...prevMessages, { user: '', message }]);
    });

    return () => {
      socket.disconnect();
    };
  }, [username]);

  const login = () => {
    if (username.trim()) {
      socket.emit('login', username);
      setLoggedIn(true);
    }
  };

  const joinChatRoom = () => {
    const roomName = prompt('Enter Chat Room Name');
    if (roomName) {
      setCurrentRoom(roomName);
      socket.emit('joinRoom', roomName);
      setRoomJoined(true);
    }
  };

  const startPrivateChat = () => {
    const recipient = prompt('Enter the username of the person you want to chat with:');
    if (recipient) {
      setCurrentRoom('');
      socket.emit('privateChat', recipient);
    }
  };

  const sendMessage = (e) => {
    if (e.key === 'Enter' && message.trim()) {
      socket.emit('chatMessage', message);
      setMessage('');
    }
  };

  const handleTyping = () => {
    if (currentRoom) {
      socket.emit('typing', true);
      setTimeout(() => {
        socket.emit('typing', false);
      }, 1000);
    }
  };

  const logout = () => {
    // Disconnect from the socket
    socket.emit('logout');
    socket.disconnect();

    // Reset state
    setUsername('');
    setCurrentRoom('');
    setMessage('');
    setMessages([]);
    setTypingStatus('');
    setLoggedIn(false);
    setRoomJoined(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg flex items-center p-4">
        <h1 className="text-3xl font-bold text-gray-100 flex-grow">ChatApp</h1>
        {loggedIn && (
          <button
            className="bg-red-500 text-white py-2 px-4 rounded-full hover:bg-red-600 transition"
            onClick={logout}
          >
            Logout
          </button>
        )}
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {roomJoined ? (
          <>
            <motion.div
              className="flex-1 overflow-auto p-6 space-y-6 bg-gray-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.user === 'You' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`p-4 max-w-xs rounded-lg shadow-md ${msg.user === 'You' ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-200'} relative`}
                    >
                      <p className="font-medium">{msg.user}</p>
                      <p>{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <div className="flex items-center p-4 bg-gray-800 shadow-inner">
              <input
                className="flex-grow p-3 bg-gray-700 text-white border border-gray-600 rounded-lg mr-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                type="text"
                placeholder="Type a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onInput={handleTyping}
                onKeyDown={sendMessage}
              />
            </div>
            <p className="text-center mt-2 italic text-gray-400">{typingStatus}</p>
          </>
        ) : (
          <motion.div
            className="flex flex-col items-center justify-center flex-1 p-6 bg-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {!loggedIn ? (
              <>
                <h2 className="text-4xl font-semibold mb-6">Login</h2>
                <input
                  className="w-80 p-3 bg-gray-700 text-white border border-gray-600 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  type="text"
                  placeholder="Enter your Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <button
                  className="w-80 bg-indigo-500 text-white py-3 px-4 rounded-lg shadow-md hover:bg-indigo-600 transition"
                  onClick={login}
                >
                  Login
                </button>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-semibold mb-6">Get Started</h2>
                <button
                  className="w-80 bg-teal-500 text-white py-3 px-4 rounded-lg shadow-md mb-4 hover:bg-teal-600 transition"
                  onClick={joinChatRoom}
                >
                  Join Chat Room
                </button>
                <button
                  className="w-80 bg-purple-500 text-white py-3 px-4 rounded-lg shadow-md hover:bg-purple-600 transition"
                  onClick={startPrivateChat}
                >
                  Start Private Chat
                </button>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
