import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  HeartHandshake,
  Home,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Users,
  X
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { enumLabel } from "../lib/format";
import { installNativeBackHandler } from "../lib/native";
import { Badge, Button } from "./ui";
import { useEffect } from "react";

interface NavigationItem {
  label: string;
  href: string;
  icon: typeof Home;
  primary?: boolean;
}

const navigation: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home, primary: true },
  { label: "Meetings", href: "/meetings", icon: CalendarDays, primary: true },
  { label: "Announcements", href: "/announcements", icon: Megaphone },
  { label: "Resources", href: "/resources", icon: FileText },
  { label: "Prayer", href: "/prayer", icon: HeartHandshake, primary: true },
  { label: "Discussions", href: "/discussions", icon: MessageSquare, primary: true },
  { label: "Reading", href: "/reading", icon: BookOpen },
  { label: "Directory", href: "/directory", icon: Users },
  { label: "Reports", href: "/reports", icon: BarChart3 }
] as const;

function NavigationLink({
  href,
  label,
  icon: Icon,
  onClick
}: (typeof navigation)[number] & { onClick?: () => void }) {
  return (
    <NavLink
      className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
      onClick={onClick}
      to={href}
    >
      <Icon aria-hidden="true" size={20} />
      <span>{label}</span>
    </NavLink>
  );
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(
    () =>
      installNativeBackHandler(() => {
        if (menuOpen) {
          setMenuOpen(false);
          return true;
        }
        if (location.pathname !== "/dashboard") {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/dashboard", { replace: true });
          }
          return true;
        }
        return false;
      }),
    [location.pathname, menuOpen, navigate]
  );

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  const visibleNavigation = navigation.filter((item) => item.href !== "/reports" || user?.role === "ADMIN");
  const primaryNavigation = visibleNavigation.filter((item) => item.primary);

  return (
    <div className="app-shell">
      <aside className="side-navigation">
        <NavLink className="brand" to="/dashboard">
          <img className="brand__logo" src="/egf-connect.png" alt="EGF Connect" />
          <span>
            <strong>EGF Connect</strong>
            <small>Gather • Grow • Go</small>
          </span>
        </NavLink>
        <nav aria-label="Main navigation" className="side-navigation__links">
          {visibleNavigation.map((item) => <NavigationLink key={item.href} {...item} />)}
        </nav>
        <Button loading={loggingOut} onClick={handleLogout} variant="outline">
          <LogOut aria-hidden="true" size={18} />
          Log out
        </Button>
      </aside>

      <div className="app-shell__main">
        <header className="mobile-header">
          <NavLink className="mobile-brand" to="/dashboard">
            <img className="brand__logo brand__logo--small" src="/egf-connect.png" alt="" />
            <strong>EGF Connect</strong>
          </NavLink>
          <Badge tone="gold">{user ? enumLabel(user.role) : ""}</Badge>
        </header>

        <main className="screen" id="main-content">
          <Outlet />
        </main>

        <nav aria-label="Main navigation" className="bottom-navigation">
          {primaryNavigation.map(({ href, label, icon: Icon }) => (
            <NavLink
              className={({ isActive }) => `bottom-navigation__item${isActive ? " bottom-navigation__item--active" : ""}`}
              key={href}
              to={href}
            >
              <Icon aria-hidden="true" size={21} />
              <span>{label}</span>
            </NavLink>
          ))}
          <button
            aria-expanded={menuOpen}
            className={`bottom-navigation__item${menuOpen ? " bottom-navigation__item--active" : ""}`}
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            <Menu aria-hidden="true" size={21} />
            <span>More</span>
          </button>
        </nav>
      </div>

      {menuOpen ? (
        <div className="sheet-backdrop" onMouseDown={() => setMenuOpen(false)}>
          <section
            aria-label="More navigation"
            aria-modal="true"
            className="navigation-sheet"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header>
              <div>
                <p className="eyebrow">{user?.email}</p>
                <h2>{user?.name}</h2>
              </div>
              <Button aria-label="Close menu" onClick={() => setMenuOpen(false)} size="icon" variant="ghost">
                <X aria-hidden="true" size={21} />
              </Button>
            </header>
            <nav className="navigation-sheet__links">
              {visibleNavigation.map((item) => <NavigationLink key={item.href} {...item} />)}
            </nav>
            <Button loading={loggingOut} onClick={handleLogout} variant="outline">
              <LogOut aria-hidden="true" size={18} />
              Log out
            </Button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
