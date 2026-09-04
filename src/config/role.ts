const rolePermissions = {
  OWNER: ["manage_salon_profile", "manage_branches", "manage_services", "manage_pricing", "manage_promotions","manage_staff","get_staff", "assign_staff_schedule", "assign_staff_services", "view_all_appointments", "manage_appointments", "manage_customers", "view_reports"],

  MANAGER: ["manage_services", "manage_pricing", "manage_promotions", "edit_staff", "assign_staff_schedule", "assign_staff_services", "view_all_appointments", "manage_appointments", "manage_customers", "view_reports"],

  RECEPTIONIST: ["view_all_appointments", "manage_appointments", "manage_customers"],

  ASSISTANT: ["view_all_appointments"],

  STAFF: ["view_own_schedule", "view_own_appointments", "mark_appointment_completed"],
} as const;


export type Role = keyof typeof rolePermissions;
export type Permissions = typeof rolePermissions[Role][number]

export default rolePermissions;