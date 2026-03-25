import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const NUTRIFLOW_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/nutriflow_logo_43762e41.webp";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Las contrasenas no coinciden.");
      return;
    }
    if (!token) {
      toast.error("Token de reset no valido. Solicita un nuevo enlace.");
      return;
    }
    resetMutation.mutate({ token, newPassword: password });
  };

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 p-4">
        <Card className="w-full max-w-md border-border/50 shadow-lg">
          <CardContent className="flex flex-col items-center gap-6 pt-10 pb-8">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Enlace no valido</h2>
              <p className="text-muted-foreground text-sm">
                Este enlace de restablecimiento no es valido o ha expirado.
              </p>
            </div>
            <Link href="/forgot-password">
              <Button>Solicitar nuevo enlace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 p-4">
        <Card className="w-full max-w-md border-border/50 shadow-lg">
          <CardContent className="flex flex-col items-center gap-6 pt-10 pb-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Contrasena actualizada</h2>
              <p className="text-muted-foreground text-sm">
                Tu contrasena se ha restablecido correctamente. Ya puedes iniciar sesion.
              </p>
            </div>
            <Button onClick={() => navigate("/login")} className="w-full" size="lg">
              Iniciar sesion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img
            src={NUTRIFLOW_LOGO}
            alt="NutriFlow"
            className="h-16 object-contain mb-3"
          />
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Nueva contrasena</CardTitle>
            <CardDescription>
              Introduce tu nueva contrasena
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contrasena</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    autoFocus
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${hasMinLength ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      8+ caracteres
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${hasUppercase ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      1 mayuscula
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${hasNumber ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      1 numero
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repite la contrasena"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="new-password"
                  />
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-destructive">Las contrasenas no coinciden</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={resetMutation.isPending || !hasMinLength || !hasUppercase || !hasNumber || !passwordsMatch}
              >
                {resetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Restablecer contrasena"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
