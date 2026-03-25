import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus("success");
    },
    onError: (err) => {
      setStatus("error");
      setErrorMsg(err.message);
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate({ token });
    } else {
      setStatus("error");
      setErrorMsg("Token de verificacion no encontrado.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardContent className="flex flex-col items-center gap-6 pt-10 pb-8">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Verificando email...</h2>
                <p className="text-muted-foreground text-sm">
                  Espera un momento mientras confirmamos tu cuenta.
                </p>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Email verificado</h2>
                <p className="text-muted-foreground text-sm">
                  Tu cuenta ha sido activada correctamente. Ya puedes iniciar sesion.
                </p>
              </div>
              <Link href="/login">
                <Button size="lg" className="w-full">
                  Iniciar sesion
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Error de verificacion</h2>
                <p className="text-muted-foreground text-sm">
                  {errorMsg || "El enlace de verificacion no es valido o ha expirado."}
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/login">
                  <Button variant="outline">Ir al login</Button>
                </Link>
                <Link href="/register">
                  <Button>Registrarse de nuevo</Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
