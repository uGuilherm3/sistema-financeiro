import {
  SunMedium,
  Moon,
  Plus,
  Folder,
  Sparkles,
  PenLine,
  Bell,
  X,
  Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarPanelProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
  salary: number;
  totalLimits: number;
  totalExpenses: number;
  isBiluEnabled?: boolean;
  onBiluToggle?: (enabled: boolean) => void;
  userPhoto?: string;
  userName?: string;
  onAddCategoryClick?: () => void;
  onAddItemClick?: () => void;
  notifications?: any[];
  hasUnreadNotifications?: boolean;
  onViewNotifications?: () => void;
  onRemoveNotification?: (id: any) => void;
  onClearAllNotifications?: () => void;
  onNotificationClick?: (notif: any) => void;
}

const SidebarPanel = ({
  activeNav,
  onNavChange,
  salary,
  totalLimits,
  totalExpenses,
  isBiluEnabled = true,
  onBiluToggle,
  userPhoto,
  userName,
  onAddCategoryClick,
  onAddItemClick,
  notifications = [],
  hasUnreadNotifications = false,
  onViewNotifications,
  onRemoveNotification,
  onClearAllNotifications,
  onNotificationClick
}: SidebarPanelProps) => {
  const navigate = useNavigate();

  // Dados mockados ou vindos do contexto do usuário
  const userPhotoUrl = userPhoto;

  // No cockpit financeiro, o saldo é calculado dinamicamente
  const balance = salary - totalExpenses;

  // Evitar erros de renderização se os dados não estiverem prontos
  if (salary === undefined) {
    return (
      <aside className="w-24 shrink-0 flex flex-col items-center justify-center h-full">
        <div className="w-16 bg-white/[0.03] backdrop-blur-xl rounded-full p-4 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-24 shrink-0 flex flex-col items-center justify-center py-6 h-full">
      <div className="w-16 bg-white/[0.02] backdrop-blur-xl rounded-full p-2 flex flex-col items-center gap-4">
        {/* Controle de Tema - Bloco Integrado */}
        <div className="flex flex-col w-full bg-white/5 rounded-full p-1 gap-1">
          <button className="w-full aspect-square rounded-full bg-white/10 flex items-center justify-center text-white transition-all">
            <SunMedium size={20} />
          </button>
          <button className="w-full aspect-square rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all active:opacity-90">
            <Moon size={20} />
          </button>
        </div>

        {/* Divisor Minimalista */}
        <div className="w-8 h-[1px] bg-white/10" />

        {/* Bot AI (Novo local: Topo das Ações) */}
        <button
          onClick={() => onBiluToggle?.(!isBiluEnabled)}
          className={`w-full aspect-square rounded-full flex items-center justify-center transition-all duration-500 ${isBiluEnabled
            ? "bg-white/10 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
            : "bg-transparent hover:bg-white/5"
            }`}
        >
          <svg
            className={`w-6 h-6 transition-all duration-500 ${isBiluEnabled ? "opacity-100 scale-100" : "opacity-30 grayscale scale-100"}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 65 65"
          >
            <mask id="maskme" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="65" height="65">
              <path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="#000" />
              <path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="url(#prefix__paint0_linear_2001_67)" />
            </mask>
            <g mask="url(#maskme)">
              <g filter="url(#prefix__filter0_f_2001_67)"><path d="M-5.859 50.734c7.498 2.663 16.116-2.33 19.249-11.152 3.133-8.821-.406-18.131-7.904-20.794-7.498-2.663-16.116 2.33-19.25 11.151-3.132 8.822.407 18.132 7.905 20.795z" fill="#FFE432" /></g>
              <g filter="url(#prefix__filter1_f_2001_67)"><path d="M27.433 21.649c10.3 0 18.651-8.535 18.651-19.062 0-10.528-8.35-19.062-18.651-19.062S8.78-7.94 8.78 2.587c0 10.527 8.35 19.062 18.652 19.062z" fill="#FC413D" /></g>
              <g filter="url(#prefix__filter2_f_2001_67)"><path d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z" fill="#00B95C" /></g>
              <g filter="url(#prefix__filter3_f_2001_67)"><path d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z" fill="#00B95C" /></g>
              <g filter="url(#prefix__filter4_f_2001_67)"><path d="M30.954 74.181c9.014-5.485 11.427-17.976 5.389-27.9-6.038-9.925-18.241-13.524-27.256-8.04-9.015 5.486-11.428 17.977-5.39 27.902 6.04 9.924 18.242 13.523 27.257 8.038z" fill="#00B95C" /></g>
              <g filter="url(#prefix__filter5_f_2001_67)"><path d="M67.391 42.993c10.132 0 18.346-7.91 18.346-17.666 0-9.757-8.214-17.667-18.346-17.667s-18.346 7.91-18.346 17.667c0 9.757 8.214 17.666 18.346 17.666z" fill="#3186FF" /></g>
              <g filter="url(#prefix__filter6_f_2001_67)"><path d="M-13.065 40.944c9.33 7.094 22.959 4.869 30.442-4.972 7.483-9.84 5.987-23.569-3.343-30.663C4.704-1.786-8.924.439-16.408 10.28c-7.483 9.84-5.986 23.57 3.343 30.664z" fill="#FBBC04" /></g>
              <g filter="url(#prefix__filter7_f_2001_67)"><path d="M34.74 51.43c11.135 7.656 25.896 5.524 32.968-4.764 7.073-10.287 3.779-24.832-7.357-32.488C49.215 6.52 34.455 8.654 27.382 18.94c-7.072 10.288-3.779 24.833 7.357 32.49z" fill="#3186FF" /></g>
              <g filter="url(#prefix__filter8_f_2001_67)"><path d="M54.984-2.336c2.833 3.852-.808 11.34-8.131 16.727-7.324 5.387-15.557 6.631-18.39 2.78-2.833-3.853.807-11.342 8.13-16.728 7.324-5.387 15.558-6.631 18.39-2.78z" fill="#749BFF" /></g>
              <g filter="url(#prefix__filter9_f_2001_67)"><path d="M31.727 16.104C43.053 5.598 46.94-8.626 40.41-15.666c-6.53-7.04-21.006-4.232-32.332 6.274s-15.214 24.73-8.683 31.77c6.53 7.04 21.006 4.232 32.332-6.274z" fill="#FC413D" /></g>
              <g filter="url(#prefix__filter10_f_2001_67)"><path d="M8.51 53.838c6.732 4.818 14.46 5.55 17.262 1.636 2.802-3.915-.384-10.994-7.116-15.812-6.731-4.818-14.46-5.55-17.261-1.636-2.802 3.915.383 10.994 7.115 15.812z" fill="#FFEE48" /></g>
            </g>
            <defs>
              <filter id="prefix__filter0_f_2001_67" x="-19.824" y="13.152" width="39.274" height="43.217" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur stdDeviation="2.46" result="effect1_foregroundBlur_2001_67" /></filter>
              <filter id="prefix__filter1_f_2001_67" x="-15.001" y="-40.257" width="84.868" height="85.688" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur stdDeviation="11.891" result="effect1_foregroundBlur_2001_67" /></filter>
              <filter id="prefix__filter2_f_2001_67" x="-20.776" y="11.927" width="79.454" height="90.916" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67" /></filter>
              <filter id="prefix__filter3_f_2001_67" x="-20.776" y="11.927" width="79.454" height="90.916" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67" /></filter>
              <filter id="prefix__filter4_f_2001_67" x="-19.845" y="15.459" width="79.731" height="81.505" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67" /></filter>
              <filter id="prefix__filter5_f_2001_67" x="29.832" y="-11.552" width="75.117" height="73.758" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur stdDeviation="9.606" result="effect1_foregroundBlur_2001_67" /></filter>
              <filter id="prefix__filter6_f_2001_67" x="-38.583" y="-16.253" width="78.135" height="78.758" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur stdDeviation="8.706" result="effect1_foregroundBlur_2001_67" /></filter>
              <filter id="prefix__filter7_f_2001_67" x="8.107" y="-5.966" width="78.877" height="77.539" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur stdDeviation="7.775" result="effect1_foregroundBlur_2001_67" /></filter>
              <filter id="prefix__filter8_f_2001_67" x="13.587" y="-18.488" width="56.272" height="51.81" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur stdDeviation="6.957" result="effect1_foregroundBlur_2001_67" /></filter>
              <filter id="prefix__filter9_f_2001_67" x="-15.526" y="-31.297" width="70.856" height="69.306" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur stdDeviation="5.876" result="effect1_foregroundBlur_2001_67" /></filter>
              <filter id="prefix__filter10_f_2001_67" x="-14.168" y="20.964" width="55.501" height="51.571" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix" /><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" /><feGaussianBlur stdDeviation="7.273" result="effect1_foregroundBlur_2001_67" /></filter>
              <linearGradient id="prefix__paint0_linear_2001_67" x1="18.447" y1="43.42" x2="52.153" y2="15.004" gradientUnits="userSpaceOnUse"><stop stopColor="#4893FC" /><stop offset=".27" stopColor="#4893FC" /><stop offset=".777" stopColor="#969DFF" /><stop offset="1" stopColor="#BD99FE" /></linearGradient>
            </defs>
          </svg>
        </button>

        {/* Ações Rápidas */}
        <button
          onClick={onAddCategoryClick}
          className="w-full aspect-square rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all group"
        >
          <Folder size={22} className="stroke-[1.5]" />
        </button>
        <button
          onClick={onAddItemClick}
          className="w-full aspect-square rounded-full bg-transparent flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all group"
        >
          <Plus size={22} className="stroke-[1.5]" />
        </button>

        {/* Sino de Notificação (Novo local: Acima do Perfil) */}
        <Popover onOpenChange={(open) => {
          if (open && hasUnreadNotifications && onViewNotifications) {
            onViewNotifications();
          }
        }}>
          <PopoverTrigger asChild>
            <button className="w-full aspect-square rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all group relative">
              <Bell size={20} className="stroke-[1.5]" />
              {hasUnreadNotifications && (
                <span className="absolute top-3 right-3 h-1.5 w-1.5 bg-primary rounded-full group-hover:scale-125 transition-transform" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" sideOffset={12} align="start" avoidCollisions={false} className="w-80 py-0 border-none bg-background backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
            <div className="px-1 py-5 flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white tracking-tight">Notificações</h4>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-0.5">Alertas e eventos</p>
              </div>
              <PopoverClose asChild>
                <button className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all">
                  <X size={16} />
                </button>
              </PopoverClose>
            </div>

            <ScrollArea className="h-full max-h-[350px]">
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-white/20 gap-3">
                  <Bell size={32} strokeWidth={1} />
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold">Tudo limpo por aqui</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif, i) => (
                    <PopoverClose asChild key={i}>
                      <div 
                        className="group mb-4 px-4 py-4 flex gap-4 hover:bg-white/[0.08] active:scale-[0.97] rounded-3xl transition-all cursor-pointer relative"
                        onClick={() => onNotificationClick?.(notif)}
                      >
                        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${notif.type === 'error' ? 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-primary shadow-[0_0_8px_rgba(168,85,247,0.5)]'}`} />
                        <div className="flex-1 space-y-1 pr-6">
  <div className="flex items-center justify-between">
    <p className="text-sm font-semibold text-white leading-tight">{notif.title}</p>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRemoveNotification?.(notif.id);
      }}
      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-destructive transition-all"
    >
      <Trash2 size={12} />
    </button>
  </div>
                          <p className="text-xs text-white/50 leading-relaxed">{notif.message}</p>
                          {notif.amount && (
                            <div className="inline-flex mt-2 px-2 py-0.5 rounded-md bg-white/5">
                              <p className="text-[10px] font-bold text-white/80">{notif.amount}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverClose>
                  ))}

                  {notifications.length > 1 && (
                    <div className="p-4 flex justify-center">
                      <button
                        onClick={onClearAllNotifications}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-all"
                      >
                        Limpar Todas
                      </button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Avatar/Perfil (Novo local: Base) */}
        <button
          onClick={() => navigate("/profile")}
          className="relative group transition-all w-full aspect-square flex items-center justify-center overflow-hidden rounded-full"
        >
          <Avatar className="w-full h-full bg-transparent ring-0 border-none transition-all">
            <AvatarImage src={userPhotoUrl || ""} className="object-cover" />
            <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
              {userName?.substring(0, 2).toUpperCase() || "UN"}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </aside>
  );
};

export default SidebarPanel;
