import { createRoot } from 'react-dom/client';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './index.css';
import App from './App.jsx';
import packageJson from '../package.json';

console.log(`[LogBook] Booting Frontend - Version: ${packageJson.version}`);

createRoot(document.getElementById('root')).render(<App />);
