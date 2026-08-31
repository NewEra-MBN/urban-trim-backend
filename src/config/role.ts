const rolePermissions = {
  owner: ["manage_tenants", "create_tenant", "suspend_tenant", "delete_tenant", "manage_subscriptions", "manage_billing", "view_all_tenants_data", "create_admin", "delete_admin", "manage_platform_settings", "view_platform_analytics", "view_system_logs", "impersonate_user"],

  manager: ["manage_salon_profile", "manage_branches", "manage_services", "manage_pricing", "manage_promotions", "create_staff", "edit_staff", "delete_staff", "assign_staff_schedule", "assign_staff_services", "view_all_appointments", "manage_appointments", "manage_customers", "view_reports"],

  customer: ["view_own_profile", "edit_own_contact_info", "change_own_password", "view_own_schedule", "book_appointment", "reschedule_appointment", "cancel_appointment", "view_own_booking_history", "leave_review"],

  guest: []
} as const


export type Role = keyof typeof rolePermissions;
export type Permissions = typeof rolePermissions[Role][number]

export default rolePermissions;