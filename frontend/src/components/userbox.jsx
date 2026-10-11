export default function UserBox({ user, onClick }) {
  return (
    <div className="flex items-center space-x-3 py-3 px-2 min-h-[72px] rounded-lg hover:bg-gray-100" onClick={onClick}>
      <img
        src={user.avatar}
        alt={user.name}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div className="flex flex-col">
        <span className="font-medium text-base">{user.name}</span>
        <span className={`text-sm ${user.status === 'Online' ? 'text-green-500' : 'text-red-500'}`}>
          {user.status}
        </span>
      </div>
    </div>
  )
}