/**
 * Node.js Server for School Website
 * Enables access from other devices on the network
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// API Routes
// Get all users
app.get('/api/users', (req, res) => {
    try {
        const usersPath = path.join(__dirname, 'data', 'users.json');
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        res.json({ success: true, users: usersData.users || [] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error reading users data', error: error.message });
    }
});

// Register user
app.post('/api/register', (req, res) => {
    try {
        const usersPath = path.join(__dirname, 'data', 'users.json');
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        
        // Check for duplicate email or phone
        const existingUser = (usersData.users || []).find(
            user => user.email === req.body.email || user.phone === req.body.phone
        );
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل'
            });
        }
        
        // Add new user
        if (!usersData.users) usersData.users = [];
        const newUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            ...req.body,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        usersData.users.push(newUser);
        
        // Save to file
        fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));
        
        console.log(`✅ New user registered: ${newUser.firstName} ${newUser.lastName} (${newUser.email})`);
        
        res.json({ success: true, message: 'تم التسجيل بنجاح', user: {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role,
            grade: newUser.grade
        }});
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error registering user', error: error.message });
    }
});

// Login user
app.post('/api/login', (req, res) => {
    try {
        const usersPath = path.join(__dirname, 'data', 'users.json');
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        
        const user = (usersData.users || []).find(
            u => u.email === req.body.email && u.password === req.body.password
        );
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }
        
        // Update last login
        user.lastLogin = new Date().toISOString();
        fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));
        
        res.json({ success: true, message: 'تم تسجيل الدخول بنجاح', user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error during login', error: error.message });
    }
});

// Update user profile
app.put('/api/users/:userId', (req, res) => {
    try {
        const usersPath = path.join(__dirname, 'data', 'users.json');
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        
        const userIndex = (usersData.users || []).findIndex(u => u.id === req.params.userId);
        
        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }
        
        // Update user
        usersData.users[userIndex] = {
            ...usersData.users[userIndex],
            ...req.body,
            id: usersData.users[userIndex].id,
            email: usersData.users[userIndex].email,
            updatedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2));
        
        res.json({ success: true, message: 'تم تحديث البيانات بنجاح', user: usersData.users[userIndex] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
    }
});

// Get user statistics
app.get('/api/stats', (req, res) => {
    try {
        const usersPath = path.join(__dirname, 'data', 'users.json');
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        const users = usersData.users || [];
        
        const stats = {
            total: users.length,
            students: users.filter(u => u.role === 'student').length,
            teachers: users.filter(u => u.role === 'teacher').length,
            parents: users.filter(u => u.role === 'parent').length,
            admins: users.filter(u => u.role === 'admin').length,
            byGrade: {},
            recentRegistrations: users.filter(
                u => new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length
        };
        
        // Count by grade
        users.forEach(user => {
            if (user.grade && user.grade !== 'admin') {
                stats.byGrade[user.grade] = (stats.byGrade[user.grade] || 0) + 1;
            }
        });
        
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting statistics', error: error.message });
    }
});

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', (err) => {
    if (err) {
        console.error('Error starting server:', err);
        return;
    }
    
    console.log('╔══════════════════════════════════════╗');
    console.log('║     🏫 School Website Server Started      ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║  Server running on PORT: ${PORT}              ║`);
    console.log(`║  Local: http://localhost:${PORT}             ║`);
    
    // Get local IP address
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over internal and non-ipv4 addresses
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`║  Network: http://${net.address}:${PORT}       ║`);
            }
        }
    }
    
    console.log('╠══════════════════════════════════════╣');
    console.log(`║  📁 Files: ${__dirname}                    ║`);
    console.log('║  🌐 Access: http://localhost:${PORT}       ║');
    console.log('╚══════════════════════════════════════╝');
    console.log('\n✅ Server is ready! You can now access the website from other devices on your network.');
    console.log('📱 Open your browser and use one of the addresses above');
    console.log('\nPress Ctrl+C to stop the server\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Server is shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n👋 Server is shutting down gracefully...');
    process.exit(0);
});
