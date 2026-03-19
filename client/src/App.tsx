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
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/portal" component={ClientPortal} />
            <Route>{() => <DashboardRouter />}</Route>
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
