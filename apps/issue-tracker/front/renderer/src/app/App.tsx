import { lazy, Suspense } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/features/shell/AppShell";
import { BoardPage } from "@/pages/BoardPage";
import { InboxPage } from "@/pages/InboxPage";
import { IssuePage } from "@/pages/IssuePage";
import { TablePage } from "@/pages/TablePage";
import { RelayProvider } from "./providers/RelayProvider";

const CalendarPage = lazy(() =>
  import("@/pages/CalendarPage").then((m) => ({ default: m.CalendarPage })),
);
const GanttPage = lazy(() =>
  import("@/pages/GanttPage").then((m) => ({ default: m.GanttPage })),
);

// local:3000/table

export const App = () => (
  <RelayProvider>
    <HashRouter>
      <AppShell>
        <Suspense fallback={<div className="p-8 text-t2">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/inbox" replace />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/board" element={<BoardPage />} />
            <Route path="/table" element={<TablePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/gantt" element={<GanttPage />} />
            <Route path="/issues/:id" element={<IssuePage />} />
            <Route path="*" element={<Navigate to="/inbox" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </HashRouter>
  </RelayProvider>
);
