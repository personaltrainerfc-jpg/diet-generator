import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import History from "./pages/History";
import DietDetail from "./pages/DietDetail";
import Recipes from "./pages/Recipes";
import CustomFoods from "./pages/CustomFoods";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import TrainerDashboard from "./pages/TrainerDashboard";
import ClientPortal from "./pages/ClientPortal";
import Templates from "./pages/Templates";
import CalendarView from "./pages/CalendarView";
import AiConfig from "./pages/AiConfig";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import AdminPanel from "./pages/AdminPanel";

function DashboardRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/history" component={History} />
        <Route path="/diet/:id" component={DietDetail} />
        <Route path="/recipes" component={Recipes} />
        <Route path="/custom-foods" component={CustomFoods} />
        <Route path="/clients" component={Clients} />
        <Route path="/clients/:id" component={ClientDetail} />
        <Route path="/dashboard" component={TrainerDashboard} />
        <Route path="/templates" component={Templates} />
        <Route path="/calendar" component={CalendarView} />
        <Route path="/ai-config" component={AiConfig} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <Switch>
            {/* Public auth routes */}
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/verify-email" component={VerifyEmail} />
            {/* Client portal */}
            <Route path="/portal" component={ClientPortal} />
            {/* Admin panel */}
            <Route path="/admin" component={AdminPanel} />
            {/* Protected dashboard (DashboardLayout handles auth check) */}
            <Route>{() => <DashboardRouter />}</Route>
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
