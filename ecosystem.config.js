module.exports = {
  apps: [
    {
      name: "library-api",
      script: "node_modules/.bin/babel-node",
      args: "index.js",
      // "current" is a symlink to the active release, switched atomically by
      // deploy.sh — pm2 always runs whatever it currently points to.
      cwd: "/var/www/library-management-system-/current",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "300M",

      env: {
        NODE_ENV: "production",
      },

      // Restart behavior
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,

      // Logs — under shared/ so they persist across releases, same as uploads
      error_file: "/var/www/library-management-system-/shared/logs/library-api-error.log",
      out_file: "/var/www/library-management-system-/shared/logs/library-api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,
    },
  ],
};
