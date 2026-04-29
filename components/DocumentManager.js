'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import FolderView from './FolderView';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DocumentManager({ onLogout }) {
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{ name: newFolderName }])
        .select();

      if (error) throw error;
      setFolders([...folders, data[0]]);
      setNewFolderName('');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const deleteFolder = async (folderId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce dossier et tous ses fichiers ?')) return;

    try {
      await supabase.storage.from('documents').remove([`${folderId}/*`]);
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
      setFolders(folders.filter(f => f.id !== folderId));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('docManagerAuth');
    onLogout();
  };

  if (currentFolder) {
    return (
      <FolderView
        folder={currentFolder}
        onBack={() => setCurrentFolder(null)}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">📚 Mes Documents</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          Déconnexion
        </button>
      </nav>

      <div className="p-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Créer un nouveau dossier</h2>
          <form onSubmit={createFolder} className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nom du dossier"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg"
            >
              Créer
            </button>
          </form>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Chargement...</div>
        ) : folders.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Aucun dossier. Créez-en un pour commencer !
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => setCurrentFolder(folder)}
                    className="flex-1 cursor-pointer"
                  >
                    <h3 className="text-lg font-bold text-blue-600 hover:text-blue-800">
                      📁 {folder.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => deleteFolder(folder.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
