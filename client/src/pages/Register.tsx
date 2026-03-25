import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Mail, Lock, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const NUTRIFLOW_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663395627355/JuA5L95oAvQY6eqfSgbwUN/nutriflow_logo_43762e41.webp";

export default function Register() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registered, setRegistered] = useState(false);

  const [emailSentOk, setEmailSentOk] = useState(true);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setRegistered(true);
      setEmailSentOk(data.emailSent);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const resendMutation = trpc.auth.resendVerification.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
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
    registerMutation.mutate({
      email: email.trim(),
      password,
      name: name.trim(),
      trainerName: trainerName.trim() || undefined,
      origin: window.location.origin,
    });
  };

  // Password strength indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 p-4">
        <Card className="w-full max-w-md border-border/50 shadow-lg">
          <CardContent className="flex flex-col items-center gap-6 pt-10 pb-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Cuenta creada</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                {emailSentOk
                  ? <>Hemos enviado un enlace de verificacion a <strong>{email}</strong>. Revisa tu bandeja de entrada (y spam) para activar tu cuenta.</>
                  : <>Tu cuenta ha sido creada, pero hubo un problema al enviar el email de verificacion. Pulsa el boton de abajo para reenviar.</>
                }
              </p>
            </div>
            <div className="w-full space-y-3">
              <Button onClick={() => navigate("/login")} className="w-full" size="lg">
                Ir a iniciar sesion
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                disabled={resendMutation.isPending}
                onClick={() => resendMutation.mutate({ email: email.trim(), origin: window.location.origin })}
              >
                {resendMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reenviando...</>
                ) : (
                  <><Mail className="mr-2 h-4 w-4" /> Reenviar email de verificacion</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={NUTRIFLOW_LOGO}
            alt="NutriFlow"
            className="h-16 object-contain mb-3"
          />
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Crear cuenta</CardTitle>
            <CardDescription>
              Registrate como entrenador en NutriFlow
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trainerName">Nombre de tu negocio (opcional)</Label>
                <Input
                  id="trainerName"
                  type="text"
                  placeholder="Ej: Nutricion Deportiva Madrid"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contrasena *</Label>
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
                <Label htmlFor="confirmPassword">Confirmar contrasena *</Label>
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
                disabled={registerMutation.isPending || !hasMinLength || !hasUppercase || !hasNumber || !passwordsMatch}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Ya tienes cuenta?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Inicia sesion
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
