import { ChefHat } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
          <ChefHat className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-2">404</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Página não encontrada. O link que você seguiu pode estar quebrado.
        </p>
        <Link
          href="/app/dashboard"
          className="inline-flex px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
