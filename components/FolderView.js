'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function FolderView({ folder, onBack, onLogout }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [folder]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .storage
        .from('documents')
        .list(`${folder.id}`);

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const { error } = await supabase.storage
        .from('documents')
        .upload(`${folder.id}/${file.name}`, file);

      if (error) throw error;
      await loadFiles();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(`${folder.id}/${fileName}`);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const deleteFile = async (fileName) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    try {
      const { error } = await supabase.storage
        .from('documents')
        .remove([`${folder.id}/${fileName}`]);

      if (error) throw error;
      await loadFiles();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            ← Retour
          </button>
          <h1 className="text-2xl font-bold text-gray-800">📁 {folder.name}</h1>
        </div>
        <button
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          Déconnexion
        </button>
      </nav>

      <div className="p-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Ajouter un fichier</h2>
          <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50">
            <span className="text-blue-600 font-semibold">
              {uploading ? 'Upload en cours...' : '📤 Cliquez pour sélectionner un fichier'}
            </span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Chargement...</div>
        ) : files.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Aucun fichier dans ce dossier
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-bold">Nom du fichier</th>
                  <th className="px-6 py-3 text-left font-bold">Taille</th>
                  <th className="px-6 py-3 text-center font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.name} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-3">📄 {file.name}</td>
                    <td className="px-6 py-3">
                      {(file.metadata?.size / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => downloadFile(file.name)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm mr-2"
                      >
                        Télécharger
                      </button>
                      <button
                        onClick={() => deleteFile(file.name)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}