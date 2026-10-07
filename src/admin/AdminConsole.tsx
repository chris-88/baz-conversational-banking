import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useMatch } from 'react-router-dom'
import {
  CompassIcon,
  LogOutIcon,
  ChartLineIcon,
  MessagesSquareIcon,
  ShieldAlertIcon,
  SlidersHorizontalIcon,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminLogin } from '@/admin/AdminLogin'
import { useAdminAuth } from '@/admin/useAdminAuth'
import { BazAvatar } from '@/baz/BazAvatar'
import { routes } from '@/app/routes'

/**
 * Four screens: the conversations, and the three things that shape them.
 *
 * There were six, and the split between "overview", "cases" and "audience" was a distinction
 * only the person who built it could hold — all three were lists of the same conversations.
 */
const SECTIONS = [
  {
    to: routes.admin.root,
    label: 'Cases',
    hint: 'Live conversations',
    icon: MessagesSquareIcon,
    end: true,
  },
  {
    to: routes.admin.engine,
    label: 'Goals & needs',
    hint: 'What Baz can recognise',
    icon: CompassIcon,
    end: false,
  },
  {
    to: routes.admin.analytics,
    label: 'Analytics',
    hint: 'What has happened',
    icon: ChartLineIcon,
    end: false,
  },
  {
    to: routes.admin.guardrails,
    label: 'Guardrails',
    hint: 'What it will not do',
    icon: ShieldAlertIcon,
    end: false,
  },
  {
    to: routes.admin.persona,
    label: 'Persona',
    hint: 'How it speaks',
    icon: SlidersHorizontalIcon,
    end: false,
  },
] as const

/**
 * §37 to §44 — the console.
 *
 * A real sidebar rather than an aside pretending to be one: it collapses on a narrow screen,
 * remembers whether it was open, and keeps the keyboard behaviour that comes with it. Signing in
 * only decides what is drawn — the server checks admin status on every call, which is what
 * actually protects this.
 */
export function AdminConsole(): ReactNode {
  const auth = useAdminAuth()
  const { pathname } = useLocation()

  if (auth.checking) {
    return (
      <Shell>
        <Skeleton className="h-64 w-full" />
      </Shell>
    )
  }

  // Signed out, there is nothing to navigate, so the chrome would only be in the way.
  if (auth.email === null) {
    return (
      <Shell>
        <AdminLogin onSignIn={auth.signIn} />
      </Shell>
    )
  }

  return (
    /*
     * Fixed to the viewport, with the scrolling inside it.
     *
     * `min-h-dvh` let the whole page grow, so a three-pane workspace meant for one screen
     * produced a 2,200px page with its own panes scrolling inside it — two scrollbars, neither
     * of them where you reach for one.
     */
    <div className="bg-sidebar h-dvh overflow-hidden">
      {/* `h-full min-h-0` overrides the provider's own `min-h-svh`, which otherwise lets the
          layout grow past the screen and get clipped rather than scroll. */}
      <SidebarProvider className="h-full min-h-0">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  <Link to={routes.admin.root}>
                    <BazAvatar size="sm" />
                    <span className="grid flex-1 text-left leading-tight">
                      <span className="truncate font-semibold">Baz</span>
                      <span className="text-muted-foreground truncate text-xs">Admin console</span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Console</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {SECTIONS.map((section) => (
                    <SidebarMenuItem key={section.to}>
                      <NavLink to={section.to} end={section.end}>
                        {({ isActive }) => (
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={section.label}
                            // Rendered as a span because NavLink already owns the anchor; nesting
                            // one inside another is invalid and breaks the active styling.
                            asChild
                          >
                            <span>
                              <section.icon />
                              <span>{section.label}</span>
                            </span>
                          </SidebarMenuButton>
                        )}
                      </NavLink>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => void auth.signOut()}
                  tooltip={auth.email}
                  className="text-muted-foreground"
                >
                  <LogOutIcon />
                  <span className="truncate">Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-h-0 min-w-0">
          <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 !h-4" />
            <Trail />
          </header>

          {/*
            Keyed on the path so a new screen starts at the top rather than inheriting the last
            one's scroll, which on a long case page lands you in the middle of somebody else's
            conversation.
          */}
          {/*
            A flex column with `min-h-0`, so a screen that wants to fill the space can — the
            workspace sizes its panes from here rather than guessing the chrome's height.
          */}
          {/*
            The shell hands every screen a definite height and lets it choose what to do with
            it: the workspace fills it with `h-full` and scrolls inside its own panes, while a
            long reference screen overflows and scrolls here. A wrapper that did the deciding
            clipped the long ones instead.
          */}
          {/* A div, not a main: `SidebarInset` is already the page's `<main>`. */}
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden p-4 lg:p-6" key={pathname}>
            <div className="mx-auto h-full w-full max-w-[110rem] overflow-y-auto">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

/** Where you are, and the way back. */
function Trail(): ReactNode {
  const { pathname } = useLocation()
  const onCase = useMatch('/admin/case/:caseId') !== null
  const section = SECTIONS.find((candidate) =>
    candidate.end ? pathname === candidate.to : pathname.startsWith(candidate.to),
  )

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {onCase ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={routes.admin.root}>Cases</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Conversation</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage>{section?.label ?? 'Cases'}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/**
 * The signed-out and still-checking states, which need none of the navigation.
 */
function Shell({ children }: { readonly children: ReactNode }): ReactNode {
  return (
    <div className="bg-background min-h-dvh">
      <div className="mx-auto w-full max-w-md px-4 py-12">{children}</div>
    </div>
  )
}
