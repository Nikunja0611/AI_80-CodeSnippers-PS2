// utils/rolePermissions.js
const rolePermissions = {
    'admin': {
      modules: ['sales', 'purchase', 'inventory', 'production', 'finance', 'gst'],
      dataAccess: 'full'
    },
    'manager': {
      modules: ['sales', 'purchase', 'inventory', 'production'],
      dataAccess: 'departmental'
    },
    'sales': {
      modules: ['sales', 'inventory'],
      dataAccess: 'limited'
    },
    'purchase': {
      modules: ['purchase', 'inventory'],
      dataAccess: 'limited'
    },
    'stores': {
      modules: ['inventory'],
      dataAccess: 'limited'
    },
    'finance': {
      modules: ['finance', 'gst'],
      dataAccess: 'limited'
    },
    'employee': {
      modules: ['general'],
      dataAccess: 'basic'
    },
    'guest': {
      modules: ['general'],
      dataAccess: 'minimal'
    }
  };
  
  // Function to check user permissions
  const checkPermission = (role, department, module) => {
    const userRole = rolePermissions[role] || rolePermissions.guest;
    return userRole.modules.includes(module) || userRole.modules.includes('general');
  };
  
  module.exports = { rolePermissions, checkPermission };