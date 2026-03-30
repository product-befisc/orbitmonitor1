import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Server, FileText, LayoutDashboard } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PLATFORM_LINKS = [
  { name: 'SFTP Platform', icon: Server, href: 'https://sftp.example.com', description: 'Secure file transfer portal' },
  { name: 'Invoicing Platform', icon: FileText, href: 'https://invoicing.example.com', description: 'Billing & invoice management' },
  { name: 'Customer Dashboard', icon: LayoutDashboard, href: 'https://dashboard.example.com', description: 'Client-facing analytics' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulated login
    setTimeout(() => {
      setLoading(false);
      toast({ title: 'Welcome back!', description: 'Signed in successfully.' });
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Login Card */}
        <Card className="border border-primary/10 shadow-xl shadow-primary/5">
          <CardContent className="pt-8 pb-8 px-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-2 mb-1">
                <div className="relative w-10 h-10">
                  <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
                    <circle cx="20" cy="20" r="18" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
                    <circle cx="20" cy="20" r="12" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6" />
                    <circle cx="20" cy="20" r="3" fill="hsl(var(--primary))" />
                    <circle cx="20" cy="8" r="2" fill="hsl(var(--primary))" />
                    <circle cx="30" cy="15" r="1.5" fill="hsl(var(--primary))" opacity="0.7" />
                    <line x1="20" y1="20" x2="20" y2="8" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />
                    <line x1="20" y1="20" x2="30" y2="15" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.4" />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-primary tracking-tight">Orbit</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground tracking-wide">Monitoring Made Easy</span>
            </div>

            <p className="text-center text-sm text-muted-foreground mb-6">Sign in to your dashboard</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-5">Secure access to API analytics dashboard</p>
          </CardContent>
        </Card>

        {/* Platform Links Card */}
        <Card className="border border-border/60 shadow-md">
          <CardContent className="pt-5 pb-5 px-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Explore other Befisc platforms</h3>
            <div className="space-y-2">
              {PLATFORM_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <link.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground block">{link.name}</span>
                    <span className="text-[11px] text-muted-foreground">{link.description}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
