import './globals.css'

export const metadata = {
  title: 'Gestionnaire de Documents',
  description: 'Gérez vos documents en toute sécurité',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
