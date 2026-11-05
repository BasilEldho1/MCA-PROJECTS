import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { ChatProvider } from './context/ChatContext';

import { TopToolbar } from './components/editor/toolbar/TopToolbar';
import { LeftSidebar } from './components/editor/sidebar/LeftSidebar';
import { RightPropertiesPanel } from './components/editor/sidebar/RightPropertiesPanel';
import { EditorFloorsPanel } from './components/editor/sidebar/EditorFloorsPanel';
import { Canvas2D } from './components/editor/canvas2d/Canvas2D';
import { Canvas3D } from './components/viewer3d/Canvas3D';
import { DashboardView } from './components/dashboard/DashboardView';
import { MyProjectsView } from './components/dashboard/MyProjectsView';
import { NewProjectModal } from './components/dashboard/NewProjectModal';
import { ShareModal } from './components/dashboard/ShareModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { FindProfessionalsView } from './components/professionals/FindProfessionalsView';
import { ProfessionalDashboardView } from './components/professionals/ProfessionalDashboardView';
import { ChatView } from './components/chat/ChatView';
import { UserProfileView } from './components/profile/UserProfileView';
import { SettingsView } from './components/settings/SettingsView';
import { LandingPage } from './components/landing/LandingPage';
import { AuthPage } from './components/auth/AuthPage';
import { AIChatBotModal } from './components/chat/AIChatBotModal';
import { PlanUploaderModal } from './components/upload/PlanUploaderModal';
import { NotFoundView } from './components/common/NotFoundView';
import { DemoPaymentSandboxView } from './components/payment/DemoPaymentSandboxView';
import { Bot } from 'lucide-react';
import { getStoredUser } from './utils/storage';

export type AppView =
  | 'landing'
  | 'auth'
  | 'dashboard'
  | 'my-projects'
  | 'editor'
  | 'professionals'
  | 'chat'
  | 'professional-dashboard'
  | 'profile'
  | 'settings'
  | 'admin'
  | 'not-found'
  | 'access-denied'
  | 'payment-demo';

const parseHashRoute = (): { view: AppView } => {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (!hash) return { view: 'landing' };
  const [baseRoute] = hash.split('?');
  const route = baseRoute.toLowerCase();

  switch (route) {
    case '':
    case 'landing':
    case 'home':
      return { view: 'landing' };
    case 'auth':
    case 'login':
    case 'register':
      return { view: 'auth' };
    case 'dashboard':
      return { view: 'dashboard' };
    case 'my-projects':
    case 'projects':
      return { view: 'my-projects' };
    case 'editor':
    case 'floor-planner':
    case 'studio':
      return { view: 'editor' };
    case 'professionals':
      return { view: 'professionals' };
    case 'chat':
    case 'messages':
      return { view: 'chat' };
    case 'professional-dashboard':
    case 'pro-dashboard':
    case 'pro-workspace':
      return { view: 'professional-dashboard' };
    case 'profile':
      return { view: 'profile' };
    case 'settings':
      return { view: 'settings' };
    case 'admin':
      return { view: 'admin' };
    case 'payment-demo':
    case 'payment':
    case 'pay-demo':
      return { view: 'payment-demo' };
    default:
      return { view: 'not-found' };
  }
};

const MainAppContent: React.FC = () => {
  const { currentProject, projects, selectProject, activeView, setActiveView, undo, redo, deleteSelected } = useProject();
  const { isProfessional, user, logout } = useAuth();

  const [currentView, setCurrentView] = useState<AppView>(() => {
    try {
      const parsed = parseHashRoute();
      if (parsed.view !== 'landing' && parsed.view !== 'not-found') {
        return parsed.view;
      }
      const stored = getStoredUser();
      if (stored?.role === 'admin') return 'admin';
      if (stored?.role === 'professional') return 'professional-dashboard';
      return stored ? 'dashboard' : 'landing';
    } catch {
      return 'landing';
    }
  });

  const [authMode, setAuthMode] = useState<'login' | 'register-user' | 'register-pro'>('login');
  const [authRole, setAuthRole] = useState<'user' | 'professional' | 'admin'>('user');

  // Robust navigation helper with role protection and URL hash synchronization
  const navigateTo = useCallback((targetView: AppView) => {
    // 1. Route guard: Admin Console
    if (targetView === 'admin') {
      if (user?.role !== 'admin') {
        setCurrentView('access-denied');
        if (window.location.hash !== '#/admin') {
          window.location.hash = '#/admin';
        }
        return;
      }
    }

    // 2. Route guard: Professional Dashboard
    if (targetView === 'professional-dashboard') {
      if (!isProfessional && user?.role !== 'professional' && user?.role !== 'admin') {
        setCurrentView('dashboard');
        window.location.hash = '#/dashboard';
        return;
      }
    }

    // 3. Route guard: Profile & Settings require authentication
    if ((targetView === 'profile' || targetView === 'settings') && !user) {
      setAuthMode('login');
      setAuthRole('user');
      setCurrentView('auth');
      window.location.hash = '#/auth';
      return;
    }

    setCurrentView(targetView);
    const targetHash = targetView === 'landing' ? '#/' : `#/${targetView}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  }, [user, isProfessional]);

  // Sync hash changes (back/forward buttons, direct URL entry)
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHashRoute();
      if (parsed.view === 'admin') {
        if (user?.role !== 'admin') {
          setCurrentView('access-denied');
          return;
        }
      } else if (parsed.view === 'professional-dashboard') {
        if (!isProfessional && user?.role !== 'professional' && user?.role !== 'admin') {
          setCurrentView('dashboard');
          window.location.hash = '#/dashboard';
          return;
        }
      } else if ((parsed.view === 'profile' || parsed.view === 'settings') && !user) {
        setAuthMode('login');
        setAuthRole('user');
        setCurrentView('auth');
        window.location.hash = '#/auth';
        return;
      }
      setCurrentView(parsed.view);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user, isProfessional]);

  // Automatically ensure admin stays strictly in the Admin Console
  useEffect(() => {
    if (user?.role === 'admin' && currentView !== 'admin' && currentView !== 'editor') {
      navigateTo('admin');
    }
  }, [user?.role, currentView, navigateTo]);

  const handleOpenLogin = (role?: 'user' | 'professional' | 'admin') => {
    setAuthMode('login');
    if (role) setAuthRole(role);
    navigateTo('auth');
  };

  const handleOpenRegister = (role?: 'user' | 'professional') => {
    setAuthMode(role === 'professional' ? 'register-pro' : 'register-user');
    if (role) setAuthRole(role);
    navigateTo('auth');
  };

  // Modals state
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAIChatBotOpen, setIsAIChatBotOpen] = useState(false);
  const [isPlanUploaderOpen, setIsPlanUploaderOpen] = useState(false);
  const [planUploaderTargetView, setPlanUploaderTargetView] = useState<'2D' | '3D'>('3D');

  // Global Keyboard Shortcuts (Delete, Undo, Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, undo, redo]);

  const handleOpenProjectFromDashboard = (projectId: string, view?: '2D' | '3D') => {
    selectProject(projectId);
    if (view) {
      setActiveView(view);
    }
    navigateTo('editor');
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Landing Page View */}
      {currentView === 'landing' && (
        <div className="flex-1 overflow-y-auto">
          <LandingPage
            onStartDesigning={() => navigateTo('dashboard')}
            onExploreDemo={() => {
              if (projects.length > 0) {
                selectProject(projects[0].id);
              }
              setActiveView('3D');
              navigateTo('editor');
            }}
            onOpenLogin={handleOpenLogin}
            onOpenRegister={handleOpenRegister}
            onOpenProfessionals={() => navigateTo('professionals')}
            onOpenFloorPlanner={() => {
              if (projects.length > 0) {
                selectProject(projects[0].id);
              }
              setActiveView('2D');
              navigateTo('editor');
            }}
          />
        </div>
      )}

      {/* 2. Full Authentication Page (User, Pro & Admin) */}
      {currentView === 'auth' && (
        <div className="flex-1 overflow-y-auto">
          <AuthPage
            initialMode={authMode}
            initialRole={authRole}
            onSuccess={(role) => {
              if (role === 'admin') {
                navigateTo('admin');
              } else if (role === 'professional') {
                navigateTo('professional-dashboard');
              } else {
                navigateTo('dashboard');
              }
            }}
            onBackToHome={() => navigateTo('landing')}
          />
        </div>
      )}

      {/* 2b. Dedicated Administrator Management Console View */}
      {currentView === 'admin' && (
        <div className="flex-1 w-full h-full overflow-hidden">
          <AdminDashboard
            isFullPage={true}
            onSignOut={() => {
              logout();
              navigateTo('landing');
            }}
            onOpenProject={(projectId) => {
              selectProject(projectId);
              setActiveView('3D');
              navigateTo('editor');
            }}
          />
        </div>
      )}

      {/* 3. Main Dashboard */}
      {currentView === 'dashboard' && (
        <div className="flex-1 overflow-y-auto">
          <DashboardView
            onOpenEditor={handleOpenProjectFromDashboard}
            onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
            onOpenShareModal={(_projectId?: string) => setIsShareModalOpen(true)}
            onOpenProfileModal={() => navigateTo('profile')}
            onOpenAdminModal={() => {
              if (user?.role === 'admin') {
                navigateTo('admin');
              } else {
                setIsAdminModalOpen(true);
              }
            }}
            onOpenProfessionals={() => navigateTo('professionals')}
            onOpenChat={() => navigateTo('chat')}
            onOpenProfessionalDashboard={() => navigateTo('professional-dashboard')}
            onOpenMyProjects={() => navigateTo('my-projects')}
            onOpenSettings={() => navigateTo('settings')}
            onOpenLanding={() => navigateTo('landing')}
            onOpenLogin={() => handleOpenLogin()}
            onOpenRegister={(role) => handleOpenRegister(role)}
            onOpenPaymentDemo={() => navigateTo('payment-demo')}
            onOpenUploadPlan={(view) => {
              setPlanUploaderTargetView(view || '3D');
              setIsPlanUploaderOpen(true);
            }}
          />
        </div>
      )}

      {/* 4. All Projects Gallery */}
      {currentView === 'my-projects' && (
        <div className="flex-1 w-full h-full overflow-y-auto min-h-0">
          <MyProjectsView
            onOpenEditor={handleOpenProjectFromDashboard}
            onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onBackToDashboard={() => navigateTo('dashboard')}
          />
        </div>
      )}

      {/* 5. Find Professionals Directory */}
      {currentView === 'professionals' && (
        <div className="flex-1 w-full h-full overflow-y-auto min-h-0">
          <FindProfessionalsView
            onBackToDashboard={() => navigateTo('dashboard')}
            onOpenChat={() => navigateTo('chat')}
          />
        </div>
      )}

      {/* 6. Messaging & Consultations */}
      {currentView === 'chat' && (
        <div className="flex-1 w-full h-full overflow-hidden min-h-0">
          <ChatView
            onBackToDashboard={() => navigateTo('dashboard')}
            onOpenSharedProjectIn3D={(projectId) => {
              selectProject(projectId);
              setActiveView('3D');
              navigateTo('editor');
            }}
            onOpenAIChatBot={() => setIsAIChatBotOpen(true)}
          />
        </div>
      )}

      {/* 7. Professional Dashboard */}
      {currentView === 'professional-dashboard' && (
        <div className="flex-1 w-full h-full overflow-y-auto min-h-0">
          <ProfessionalDashboardView
            onOpenChat={() => navigateTo('chat')}
            onOpenSharedProjectIn3D={(projectId) => {
              selectProject(projectId);
              setActiveView('3D');
              navigateTo('editor');
            }}
            onBackToMainDashboard={() => navigateTo('dashboard')}
          />
        </div>
      )}

      {/* 8. User Profile View */}
      {currentView === 'profile' && (
        <div className="flex-1 w-full h-full overflow-y-auto min-h-0">
          <UserProfileView
            onBackToDashboard={() => navigateTo('dashboard')}
            onOpenChat={() => navigateTo('chat')}
          />
        </div>
      )}

      {/* 9. Settings View */}
      {currentView === 'settings' && (
        <div className="flex-1 w-full h-full overflow-y-auto min-h-0">
          <SettingsView
            onBackToDashboard={() => navigateTo('dashboard')}
          />
        </div>
      )}

      {/* 10. 2D / 3D Floor Plan Designer Studio */}
      {currentView === 'editor' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">
          <TopToolbar
            onBackToDashboard={() => navigateTo('dashboard')}
            onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenProfileModal={() => navigateTo('profile')}
            onOpenAdminModal={() => {
              if (user?.role === 'admin') {
                navigateTo('admin');
              } else {
                setIsAdminModalOpen(true);
              }
            }}
            onOpenChat={() => navigateTo('chat')}
            onOpenLogin={() => handleOpenLogin()}
            onOpenRegister={(role) => handleOpenRegister(role)}
          />

          <div className="flex-1 flex overflow-hidden relative min-h-0">
            <LeftSidebar />

            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <main className="flex-1 h-full relative overflow-hidden bg-white min-w-0">
                {activeView === '2D' ? <Canvas2D /> : <Canvas3D />}
              </main>
              <EditorFloorsPanel />
            </div>

            <RightPropertiesPanel />
          </div>
        </div>
      )}

      {/* 11. 404 Route Not Found Fallback */}
      {currentView === 'not-found' && (
        <NotFoundView
          type="404"
          onGoHome={() => navigateTo('landing')}
          onGoDashboard={() => navigateTo('dashboard')}
          onOpenLogin={() => handleOpenLogin()}
        />
      )}

      {/* 12. 403 Access Denied Fallback */}
      {currentView === 'access-denied' && (
        <NotFoundView
          type="403"
          onGoHome={() => navigateTo('landing')}
          onGoDashboard={() => navigateTo('dashboard')}
          onOpenLogin={() => handleOpenLogin('admin')}
        />
      )}

      {/* 13. Demo Card Payment Sandbox View */}
      {currentView === 'payment-demo' && (
        <div className="flex-1 w-full h-full overflow-y-auto min-h-0">
          <DemoPaymentSandboxView
            onBackToDashboard={() => navigateTo('dashboard')}
          />
        </div>
      )}

      {/* Global Modals */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onProjectCreated={id => {
          selectProject(id);
          navigateTo('editor');
        }}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={currentProject?.id}
      />

      <AdminDashboard
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onOpenProject={id => {
          selectProject(id);
          navigateTo('editor');
        }}
      />

      <AIChatBotModal
        isOpen={isAIChatBotOpen}
        onClose={() => setIsAIChatBotOpen(false)}
        onOpenEditor={(projectId, view) => {
          selectProject(projectId);
          if (view) setActiveView(view);
          navigateTo('editor');
        }}
      />

      <PlanUploaderModal
        isOpen={isPlanUploaderOpen}
        onClose={() => setIsPlanUploaderOpen(false)}
        createNewProjectOnUpload={true}
        initialTargetView={planUploaderTargetView}
        onPlanLoadedAndProcessed={(res) => {
          setIsPlanUploaderOpen(false);
          if (res?.projectId) {
            selectProject(res.projectId);
          }
          if (res?.targetView) {
            setActiveView(res.targetView);
          }
          navigateTo('editor');
        }}
      />

      {/* Floating AI Architect Bot Trigger Button (displayed on general navigation views, hidden in full editor/auth/admin to prevent canvas occlusion) */}
      {currentView !== 'editor' && currentView !== 'admin' && currentView !== 'auth' && currentView !== 'not-found' && currentView !== 'access-denied' && (
        <button
          onClick={() => setIsAIChatBotOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs rounded-full shadow-2xl shadow-emerald-600/40 border border-emerald-300/40 transition-all duration-300 transform hover:scale-105 cursor-pointer"
          title="Open AI Architect & Blueprint Scanner Bot"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Bot size={15} className="text-white" />
          </div>
          <span className="hidden sm:inline">AI Architect Bot</span>
          <span className="sm:hidden font-black">AI Bot</span>
        </button>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <ChatProvider>
          <MainAppContent />
        </ChatProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}
