const baseUrl = process.env.LINKSHELF_BASE_URL ?? "http://127.0.0.1:3000";

const checks = [
  { path: "/", statuses: [200] },
  { path: "/login?returnTo=/studio/dashboard", statuses: [200] },
  { path: "/admin-secret", statuses: [303, 307, 308] },
  { path: "/liamroberts.photo", statuses: [200] },
  { path: "/liamroberts.photo/photography-kit", statuses: [200] },
  { path: "/studio/dashboard", statuses: [303, 307, 308] },
  { path: "/hub/dashboard", statuses: [303, 307, 308] },
  { path: "/admin/dashboard", statuses: [303, 307, 308] },
];

const failures = [];

for (const check of checks) {
  const response = await fetch(new URL(check.path, baseUrl), {
    redirect: "manual",
  });
  if (!check.statuses.includes(response.status)) {
    failures.push(`${check.path}: expected ${check.statuses.join("/")} got ${response.status}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`smoke-routes passed ${checks.length} checks against ${baseUrl}`);
