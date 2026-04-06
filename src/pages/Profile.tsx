import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    Lock,
    Loader2,
    Camera,
    Shield,
    ArrowLeft,
    LogOut,
    CheckCircle2,
    Settings,
    ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const defaultAvatars = [
    "https://preview.redd.it/the-new-discord-default-profile-pictures-v0-4zgagzeyej7f1.png?width=1024&format=png&auto=webp&s=36a85f787f4826665e26be46c3b509281551a043",
    "https://preview.redd.it/the-new-discord-default-profile-pictures-v0-dd62486xej7f1.png?width=1024&format=png&auto=webp&s=834060ca1b6be81c4d32adfbfc7dcdbb7018cf32",
    "https://preview.redd.it/the-new-discord-default-profile-pictures-v0-uqvmqo1cdj7f1.png?width=1024&format=png&auto=webp&s=8cfc3d1836ac0b79e2ccabd65a9010da1eed29d7",
    "https://preview.redd.it/the-new-discord-default-profile-pictures-v0-j2ta0gxbfj7f1.png?width=1024&format=png&auto=webp&s=c9bc69f1003815a9f1f8085e7bb8e5de5a21a75d"
];

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
    const [salary, setSalary] = useState("0");
    const [salaryDay, setSalaryDay] = useState(5);
    const [age, setAge] = useState(0);
    const [email, setEmail] = useState("");
    const [photo, setPhoto] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (profile) {
            setName(profile.full_name || "");
            setSalary(profile.salary_monthly?.toString() || "0");
            setSalaryDay(profile.salary_day || 5);
            setAge(profile.age || 0);
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
                    salary_monthly: parseFloat(salary) || 0,
                    salary_day: salaryDay,
                    age: age,
                    avatar_url: photo,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            setIsEditing(false); // Sair do modo de edição após salvar
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
                    <Card className="border-none bg-white/[0.02] backdrop-blur-xl overflow-hidden">
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
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">E-mail</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={authEmail}
                                            onChange={(e) => setAuthEmail(e.target.value)}
                                            className="bg-white/[0.03] border-none focus-visible:ring-1 focus-visible:ring-primary/50 pl-10 h-11"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Senha</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={authPassword}
                                            onChange={(e) => setAuthPassword(e.target.value)}
                                            className="bg-white/[0.03] border-none focus-visible:ring-1 focus-visible:ring-primary/50 pl-10 h-11"
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
        <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-start pt-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-full max-w-4xl">
                {/* Header Externo */}
                <div className="flex justify-between items-center mb-6 px-2">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/")}
                        className="hover:bg-white/5 gap-2 text-white/40 hover:text-white transition-all text-sm font-medium tracking-tight h-auto p-0"
                    >
                        <ArrowLeft className="w-4 h-4" /> Dashboard
                    </Button>
                    <div className="flex items-center gap-6">
                        <Button
                            onClick={() => setIsEditing(!isEditing)}
                            variant="ghost"
                            className={`p-0 h-auto hover:bg-transparent ${isEditing ? 'text-primary' : 'text-white/40 hover:text-white'} transition-all`}
                        >
                            <Settings size={20} />
                        </Button>
                        <Button
                            onClick={signOut}
                            variant="ghost"
                            className="text-[#FF5C5C] hover:bg-[#FF5C5C]/10 gap-2 text-[13px] font-bold uppercase tracking-[0.2em] h-auto p-0 hover:text-[#FF5C5C]"
                        >
                            SAIR <LogOut size={18} />
                        </Button>
                    </div>
                </div>

                <Card className="border-none bg-background rounded-[2.5rem] overflow-hidden pb-12">
                    <CardHeader className="pb-8 pt-14 px-12 text-left">
                        <div className="flex items-start gap-12 w-full group">
                            {/* Avatar Principal - À Esquerda */}
                            <div className="flex flex-col items-center gap-3 shrink-0">
                                <div className="relative group/avatar">
                                    <Avatar className="w-44 h-44 bg-transparent border-none ring-0 transition-transform duration-500 group-hover:scale-[1.02]">
                                        <AvatarImage src={photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} className="object-cover" />
                                        <AvatarFallback className="bg-[#1A1A1A] text-4xl text-white/50">{name.substring(0, 2).toUpperCase() || "??"}</AvatarFallback>
                                    </Avatar>
                                    {isEditing && (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-[2px]"
                                        >
                                            <Camera className="w-8 h-8 text-white/60" />
                                        </div>
                                    )}
                                    <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                                </div>
                                <div className="text-center opacity-30 space-y-0.5">
                                    <p className="text-[10px] uppercase tracking-[0.3em] font-mono whitespace-nowrap">ID: {user.id.toUpperCase().slice(0, 8)}...</p>
                                </div>
                            </div>

                            {/* Info de Texto e Dados - Centro-Esquerda */}
                            <div className="flex-1 space-y-8">
                                <input
                                    value={name}
                                    readOnly={!isEditing}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`bg-transparent border-none p-0 text-[38px] md:text-[38px] font-bold text-white tracking-tighter leading-none h-auto w-full outline-none focus:ring-0 ${isEditing ? 'cursor-text border-b border-white/10 pb-1' : 'cursor-default'}`}
                                    placeholder="Seu Nome"
                                />

                                {/* Lista de Informações Básicas (Estilo Sleep Chronotype) */}
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center gap-8 group/info">
                                        <span className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold w-28 shrink-0">Idade:</span>
                                        <Input
                                            type="number"
                                            value={age}
                                            readOnly={!isEditing}
                                            onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                                            className={`${isEditing ? 'bg-white/[0.03] px-3' : 'bg-transparent px-0'} border-none h-8 w-24 text-white/80 rounded-lg text-sm font-medium transition-all focus-visible:ring-1 focus-visible:ring-white/10`}
                                        />
                                    </div>
                                    <div className="flex items-center gap-8 group/info">
                                        <span className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold w-28 shrink-0">Salário:</span>
                                        <Input
                                            type="number"
                                            value={salary}
                                            readOnly={!isEditing}
                                            onChange={(e) => setSalary(e.target.value)}
                                            className={`${isEditing ? 'bg-white/[0.03] px-3' : 'bg-transparent px-0'} border-none h-8 w-40 text-white/80 rounded-lg text-sm font-medium transition-all focus-visible:ring-1 focus-visible:ring-white/10`}
                                        />
                                    </div>
                                    <div className="flex items-center gap-8 group/info">
                                        <span className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold w-28 shrink-0">Dia do Sal.:</span>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min={1}
                                                max={31}
                                                value={salaryDay}
                                                readOnly={!isEditing}
                                                onChange={(e) => setSalaryDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 5)))}
                                                className={`${isEditing ? 'bg-white/[0.03] px-3' : 'bg-transparent px-0'} border-none h-8 w-20 text-white/80 rounded-lg text-sm font-medium transition-all focus-visible:ring-1 focus-visible:ring-white/10`}
                                            />
                                            {!isEditing && <span className="text-xs text-white/30 font-medium">todo mês</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8 group/info">
                                        <span className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold w-28 shrink-0">E-mail:</span>
                                        <span className="text-sm text-white/20 font-medium">{email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Seletor de Fotos Padrão - À Direita */}
                            <div className={`flex items-center gap-3 shrink-0 mt-4 transition-all duration-300 ${isEditing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                {defaultAvatars.map((url, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setPhoto(url)}
                                        className={`w-12 h-12 rounded-full overflow-hidden transition-all hover:scale-110 active:scale-95 ${photo === url ? 'ring-2 ring-primary opacity-100' : 'opacity-30 hover:opacity-100'}`}
                                    >
                                        <img src={url} alt={`Default ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="px-14 pt-4">
                        <div className="pt-8 border-t border-white/[0.02] flex flex-col gap-4">
                            <div className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.03] transition-all hover:bg-white/[0.05]">
                                <div className="space-y-1.5">
                                    <Label className="text-base font-bold text-white tracking-wide">Status da Sincronização</Label>
                                    <p className="text-[11px] text-white/30 tracking-tight">Seus dados estão protegidos pelo Supabase Auth</p>
                                </div>
                                <div className="p-3 bg-[#1A1A1A] rounded-2xl">
                                    <Shield className="w-6 h-6 text-[#4ADE80]/40" />
                                </div>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-white/[0.03] hover:bg-white/[0.05] text-white h-[4.5rem] rounded-3xl font-bold transition-all active:scale-[0.98] border-none flex items-center justify-between px-6"
                            >
                                <span className="text-[15px] tracking-tight">
                                    {isSaving ? "Sincronizando..." : "Sincronizar com Nuvem"}
                                </span>
                                <div className="p-3 bg-[#1A1A1A] rounded-2xl">
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin text-white/20" /> : <ChevronRight className="w-5 h-5 text-white/40" />}
                                </div>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Profile;
