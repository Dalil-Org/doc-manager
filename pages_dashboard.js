import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import styles from '../styles/Dashboard.module.css'

export default function Dashboard() {
  const router = useRouter()
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const authenticated = localStorage.getItem('authenticated')
    if (!authenticated) {
      router.push('/')
    } else {
      loadFolders()
    }
  }, [])

  const loadFolders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFolders(data || [])
      setCurrentFolder(null)
      setFiles([])
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFilesInFolder = async (folderId) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
      setCurrentFolder(folderId)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const createFolder = async (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return

    try {
      const { error } = await supabase
        .from('folders')
        .insert([{ name: newFolderName }])

      if (error) throw error
      setNewFolderName('')
      loadFolders()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const deleteFolder = async (folderId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce dossier et tous ses fichiers ?')) return

    try {
      await supabase.from('files').delete().eq('folder_id', folderId)
      await supabase.from('folders').delete().eq('id', folderId)
      loadFolders()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const deleteFile = async (fileId, filePath) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return

    try {
      await supabase.storage.from('documents').remove([filePath])
      await supabase.from('files').delete().eq('id', fileId)
      loadFilesInFolder(currentFolder)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleFileUpload = async (e) => {
    if (!currentFolder) {
      alert('Veuillez sélectionner un dossier')
      return
    }

    const file = e.target.files[0]
    if (!file) return

    try {
      setLoading(true)
      const fileName = `${Date.now()}_${file.name}`
      const filePath = `${currentFolder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { error: dbError } = await supabase
        .from('files')
        .insert([{
          folder_id: currentFolder,
          name: file.name,
          file_path: filePath,
          file_size: file.size
        }])

      if (dbError) throw dbError
      loadFilesInFolder(currentFolder)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'upload')
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (filePath, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authenticated')
    router.push('/')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestionnaire de Documents</h1>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Déconnexion
        </button>
      </div>

      <div className={styles.content}>
        {!currentFolder ? (
          <div className={styles.foldersSection}>
            <h2>Mes Dossiers</h2>
            
            <form onSubmit={createFolder} className={styles.createForm}>
              <input
                type="text"
                placeholder="Nom du nouveau dossier"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className={styles.input}
              />
              <button type="submit" className={styles.button}>
                Créer un dossier
              </button>
            </form>

            {loading ? (
              <p>Chargement...</p>
            ) : folders.length === 0 ? (
              <p className={styles.empty}>Aucun dossier. Créez-en un pour commencer !</p>
            ) : (
              <div className={styles.foldersList}>
                {folders.map((folder) => (
                  <div key={folder.id} className={styles.folderItem}>
                    <button
                      onClick={() => loadFilesInFolder(folder.id)}
                      className={styles.folderButton}
                    >
                      📁 {folder.name}
                    </button>
                    <button
                      onClick={() => deleteFolder(folder.id)}
                      className={styles.deleteBtn}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.filesSection}>
            <button
              onClick={loadFolders}
              className={styles.backBtn}
            >
              ← Retour aux dossiers
            </button>

            <h2>Fichiers du dossier</h2>

            <div className={styles.uploadSection}>
              <label className={styles.uploadLabel}>
                📤 Ajouter un fichier
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className={styles.fileInput}
                  disabled={loading}
                />
              </label>
            </div>

            {loading ? (
              <p>Chargement...</p>
            ) : files.length === 0 ? (
              <p className={styles.empty}>Aucun fichier dans ce dossier</p>
            ) : (
              <div className={styles.filesList}>
                {files.map((file) => (
                  <div key={file.id} className={styles.fileItem}>
                    <div className={styles.fileInfo}>
                      <span className={styles.fileName}>📄 {file.name}</span>
                      <span className={styles.fileSize}>
                        {(file.file_size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                    <div className={styles.fileActions}>
                      <button
                        onClick={() => downloadFile(file.file_path, file.name)}
                        className={styles.downloadBtn}
                      >
                        ⬇️ Télécharger
                      </button>
                      <button
                        onClick={() => deleteFile(file.id, file.file_path)}
                        className={styles.deleteBtn}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
