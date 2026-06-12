<Route
  path="/admin/dashboard"
  element={
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  }
/>
