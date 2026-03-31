import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Shield, Camera, Lock, Loader2, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const Profile = () => {
    const navigate = useNavigate();
    const { user, profile, loading, signOut } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Auth Form State
    const [isLogin, setIsLogin] = useState(true);
    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [authLoading, setAuthLoading] = useState(false);

    // Profile State
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [photo, setPhoto] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setName(profile.full_name || "");
            setPhoto(profile.avatar_url || null);
        }
        if (user) {
            setEmail(user.email || "");
        }
    }, [profile, user]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: authEmail,
                    password: authPassword,
                });
                if (error) throw error;
                toast.success("Bem-vindo de volta!");
            } else {
                const { error } = await supabase.auth.signUp({
                    email: authEmail,
                    password: authPassword,
                });
                if (error) throw error;
                toast.success("Conta criada! Verifique seu e-mail.");
            }
        } catch (error: any) {
            toast.error("Erro na autenticação", { description: error.message });
        } finally {
            setAuthLoading(false);
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && user) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                setPhoto(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: name,
                    avatar_url: photo,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            toast.success("Perfil atualizado no Supabase!");
        } catch (error: any) {
            toast.error("Erro ao salvar", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    // --- FORMULÁRIO DE LOGIN ---
    if (!user) {
        return (
            <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-full max-w-md">
                    <Button variant="ghost" onClick={() => navigate("/")} className="mb-8 hover:bg-white/5 gap-2 text-muted-foreground">
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </Button>
                    <Card className="border-none bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden">
                        <div className="h-1 bg-primary w-full" />
                        <CardHeader className="text-center pt-8">
                            <CardTitle className="text-2xl font-bold text-white">
                                {isLogin ? "Acessar Cockpit" : "Criar Nova Conta"}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground pt-2">
                                {isLogin ? "Entre com suas credenciais do Supabase" : "Comece sua jornada financeira agora"}
                            </p>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <form onSubmit={handleAuth} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">E-mail</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                        <Input 
                                            type="email" 
                                            placeholder="seu@email.com"
                                            value={authEmail}
                                            onChange={(e) => setAuthEmail(e.target.value)}
                                            className="bg-white/[0.03] border-white/10 pl-10 h-11"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Senha</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                        <Input 
                                            type="password" 
                                            placeholder="••••••••"
                                            value={authPassword}
                                            onChange={(e) => setAuthPassword(e.target.value)}
                                            className="bg-white/[0.03] border-white/10 pl-10 h-11"
                                            required
                                        />
                                    </div>
                                </div>
                                <Button 
                                    className="w-full h-12 bg-white text-black font-bold hover:bg-white/90 group"
                                    disabled={authLoading}
                                >
                                    {authLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (isLogin ? "Entrar" : "Criar Conta")}
                                </Button>
                            </form>
                            <div className="text-center">
                                <button 
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    // --- TELA DE PERFIL (LOGADO) ---
    return (
        <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full max-w-2xl">
                <div className="flex justify-between items-center mb-8">
                    <Button variant="ghost" onClick={() => navigate("/")} className="hover:bg-white/5 gap-2 text-muted-foreground hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </Button>
                    <Button onClick={signOut} variant="ghost" className="text-red-400 hover:bg-red-400/10 hover:text-red-300 gap-2 text-xs font-bold uppercase tracking-widest">
                        Sair <LogOut size={14} />
                    </Button>
                </div>

                <Card className="border-none bg-white/[0.02] backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center pb-0 pt-10">
                        <div className="flex justify-center mb-6 relative group">
                            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                            <div onClick={() => fileInputRef.current?.click()} className="relative group cursor-pointer transition-transform duration-300 hover:scale-105">
                                <Avatar className="w-32 h-32 border-4 border-primary/20 shadow-[0_0_30px_rgba(var(--primary),0.2)]">
                                    <AvatarImage src={photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} />
                                    <AvatarFallback className="bg-white/5 text-4xl">{name.substring(0, 2).toUpperCase() || "??"}</AvatarFallback>
                                </Avatar>
                                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity border border-white/20">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            Perfil Cockpit
                        </CardTitle>
                        <p className="text-muted-foreground text-xs pt-1 uppercase tracking-widest font-mono">ID: {user.id.slice(0, 8)}...</p>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 text-left">
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white/[0.03] border-white/10 h-11 text-white" />
                            </div>
                            <div className="space-y-2 text-left opacity-50">
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">E-mail (Autenticado)</Label>
                                <Input value={email} disabled className="bg-white/[0.01] border-white/5 h-11 text-white cursor-not-allowed" />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold text-white">Status da Sincronização</Label>
                                    <p className="text-[10px] text-muted-foreground">Seus dados estão protegidos pelo Supabase Auth</p>
                                </div>
                                <Shield className="w-5 h-5 text-green-500/50" />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-white hover:bg-white/90 text-black h-12 font-bold transition-all active:scale-95 shadow-xl">
                                {isSaving ? <Loader2 className="animate-spin" /> : "Sincronizar com Nuvem"}
                            </Button>
                            <Button variant="outline" onClick={() => navigate("/")} className="flex-1 border-white/10 bg-transparent hover:bg-white/5 h-12 text-white/60">
                                Voltar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Profile;
