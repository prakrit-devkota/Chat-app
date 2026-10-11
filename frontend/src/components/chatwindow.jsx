import { useState } from 'react'

export default function ChatWindow({ user }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Select a user to start chatting
      </div>
    )
  }

  const handleSend = () => {
    if (!text.trim()) return
    setMessages([...messages, { id: Date.now(), text, fromMe: true }])
    setText('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with the clicked user */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-200">
        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-sm text-gray-500">{user.status}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
            <span className="bg-blue-500 text-white px-3 py-2 rounded-lg max-w-xs">{m.text}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 p-4 bg-white border-t border-gray-200">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 outline-none focus:border-blue-500"
        />
        <button onClick={handleSend} className="bg-blue-500 text-white px-5 rounded-full">
          Send
        </button>
      </div>
    </div>
  )
}