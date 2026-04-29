'use client';

import { useState } from 'react';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (password === process.env.NEXT_PUBLIC_PASSWORD) {
      localStorage.setItem('docManagerAuth', 'true');
      onLogin();
    } else {
      setError('Mot de passe incorrect');
      setPassword('');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-96">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          📚 Gestionnaire de Documents
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
