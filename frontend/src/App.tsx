import { useDispatch, useSelector } from 'react-redux';
import { selectAppStatus } from './redux/app/app.selectors';
import { initializeApp } from './redux/app/app.reducer';
import { AppDispatch } from './redux/store';
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { LoginView } from './components/views/auth/LoginView';
import { GroupCalendarView } from './components/views/groups/GroupCalendarView';
import { MyEventsView } from './components/views/events/MyEventsView';
import { AISuggestionsView } from './components/views/ai/AISuggestionsView';
import { AdminGroupManagementView } from './components/views/admin/AdminGroupManagementView';
import { AdminUserManagementView } from './components/views/admin/AdminUserManagementView';
import { ProtectedRoute } from './utils/ProtectedRoute';
import { EventDetailsView } from './components/views/events/EventDetailsView';
import { EventFormView } from './components/views/events/EventFormView';
import { LoadingOverlayView } from './components/views/shared/LoadingOverlayView';
import { ErrorOverlayView } from './components/views/shared/ErrorOverlayView';
import { GroupsManagementView } from './components/views/groups/GroupsManagementView';
import { GroupFormView } from './components/views/groups/GroupFormView';
import { RegisterView } from './components/views/auth/RegisterView';

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const appStatus = useSelector(selectAppStatus);

  useEffect(() => {
    dispatch(initializeApp());
  }, [dispatch]);

  if (appStatus?.type === 'initializing') {
    return <div>Initializing...</div>;
  }

  return (
    <>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<GroupCalendarView />} />
            <Route path="my-events" element={<MyEventsView />} />
            <Route path="ai-suggestions" element={<AISuggestionsView />} />
            <Route path="event/new" element={<EventFormView />} />
            <Route path="event/:eventId" element={<EventDetailsView />} />
            <Route path="event/:eventId/edit" element={<EventFormView />} />
            <Route path="admin/users" element={<AdminUserManagementView />} />
            <Route path="admin/groups" element={<AdminGroupManagementView />} />
            <Route path="groups" element={<GroupsManagementView />} />
            <Route path="groups/create" element={<GroupFormView />} />
            <Route path="groups/:groupId/edit" element={<GroupFormView />} />
          </Route>
        </Route>
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginView />} />
          <Route path="register" element={<RegisterView />} />
        </Route>
      </Routes>
      <LoadingOverlayView />
      <ErrorOverlayView />
    </>
  );
}

export default App;
