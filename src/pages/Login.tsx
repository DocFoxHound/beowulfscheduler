export default function Login() {
    const handleLogin = () => {
      // Redirect to backend to start Discord OAuth
      window.location.href = "http://localhost:3000/auth/discord";
    };
  
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl mb-4">Welcome to the Dashboard</h1>
        <button
          onClick={handleLogin}
          className="bg-indigo-600 text-white px-6 py-2 rounded shadow"
        >
          Login with Discord
        </button>
      </div>
    );
  }