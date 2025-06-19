// middleware/auth.js
const mockUsers = {
  'netrunnerX': { id: 'netrunnerX', role: 'admin', name: 'NetRunner X' },
  'reliefAdmin': { id: 'reliefAdmin', role: 'admin', name: 'Relief Admin' },
  'citizen1': { id: 'citizen1', role: 'contributor', name: 'Citizen One' }
};

const authenticate = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId || !mockUsers[userId]) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.user = mockUsers[userId];
  next();
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

export { authenticate, requireRole };