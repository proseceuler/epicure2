import { PomodoroProvider } from '@/context/PomodoroContext';
import AppLayout, { usePageState } from '@/components/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import GradesPage from '@/pages/GradesPage';
import ForecastPage from '@/pages/ForecastPage';
import ClassHubPage from '@/pages/ClassHubPage';
import TodosPage from '@/pages/TodosPage';
import KanbanPage from '@/pages/KanbanPage';
import CalendarPage from '@/pages/CalendarPage';
import PomodoroPage from '@/pages/PomodoroPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import HabitsPage from '@/pages/HabitsPage';
import ScratchpadPage from '@/pages/ScratchpadPage';
import FinancePage from '@/pages/FinancePage';

function App() {
  const [page, navigate] = usePageState();

  const pages: Record<string, React.ReactNode> = {
    dashboard: <DashboardPage navigate={navigate} />,
    grades: <GradesPage />,
    forecast: <ForecastPage />,
    classhub: <ClassHubPage />,
    todos: <TodosPage />,
    kanban: <KanbanPage />,
    calendar: <CalendarPage />,
    pomodoro: <PomodoroPage />,
    analytics: <AnalyticsPage />,
    habits: <HabitsPage />,
    scratchpad: <ScratchpadPage />,
    finance: <FinancePage />,
  };

  return (
    <PomodoroProvider>
      <AppLayout page={page} navigate={navigate}>
        {pages[page] ?? pages.dashboard}
      </AppLayout>
    </PomodoroProvider>
  );
}

export default App;
