import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import authRoutes from './routes/auth.routes';
import routesRoutes from './routes/routes.routes';
import userRoutes from './routes/user.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:19006',
    'http://192.168.100.4:8081',      // ← IP corregida
    'http://192.168.100.4:19006',     // ← Agregada también
    'exp://192.168.100.4:8081',       // ← IP corregida
    'exp://localhost:8081',
    process.env.FRONTEND_URL || ''
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo salió mal!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`
    🚀 Servidor corriendo en http://localhost:${PORT}
    📱 Para Expo: exp://192.168.100.4:${PORT}    ← IP corregida
    🔥 Ambiente: ${process.env.NODE_ENV}
  `);
});