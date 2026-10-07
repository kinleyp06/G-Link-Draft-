import { ToastProvider } from './components/ui';
import StyleGuide from './pages/dev/StyleGuide.jsx';

// For now the app only shows the style guide (F-01). Pages are added later.
export default function App() {
  return (
    <ToastProvider>
      <StyleGuide />
    </ToastProvider>
  );
}
