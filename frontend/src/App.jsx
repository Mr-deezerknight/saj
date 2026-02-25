import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Training from './pages/Training'
import Comparison from './pages/Comparison'
import Predict from './pages/Predict'
import Settings from './pages/Settings'

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'training', label: 'Training', icon: '🧠' },
    { id: 'comparison', label: 'Comparison', icon: '📈' },
    { id: 'predict', label: 'Predict', icon: '🔍' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function App() {
    const [page, setPage] = useState('dashboard')
    const [results, setResults] = useState([])
    const [bestModel, setBestModel] = useState(null)

    const handleTrainingComplete = (data) => {
        setResults(data.results || [])
        setBestModel(data.best_model || data.results?.[0] || null)
    }

    const renderPage = () => {
        switch (page) {
            case 'dashboard':
                return <Dashboard results={results} bestModel={bestModel} onNavigate={setPage} />
            case 'training':
                return <Training onComplete={handleTrainingComplete} />
            case 'comparison':
                return <Comparison results={results} bestModel={bestModel} />
            case 'predict':
                return <Predict results={results} />
            case 'settings':
                return <Settings />
            default:
                return <Dashboard results={results} bestModel={bestModel} onNavigate={setPage} />
        }
    }

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">🛡️</div>
                        <div>
                            <div className="sidebar-logo-text">CyberShield</div>
                            <div className="sidebar-logo-sub">ML Analysis</div>
                        </div>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            className={`nav-item ${page === item.id ? 'active' : ''}`}
                            onClick={() => setPage(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>
                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
                    <div className="text-sm text-muted">Cyberbullying Detection</div>
                    <div className="text-sm text-muted">Comparative Analysis v1.0</div>
                </div>
            </aside>

            {/* Main */}
            <main className="main-content fade-in" key={page}>
                {renderPage()}
            </main>
        </div>
    )
}
