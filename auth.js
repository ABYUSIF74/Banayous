/**
 * Authentication System for School Website - File-based storage
 * Saves data to JSON files and communicates with Node.js server API when available
 */

const STORAGE_KEY = 'school_users';
const SESSION_KEY = 'school_session';
const USERS_FILE_KEY = 'school_users_json';

// API Base URL - will work with Node.js server
const API_BASE_URL = window.location.protocol === 'file:' ? null : '/api';

// Initialize users from file or localStorage
function initializeUsers() {
    let users = [];
    
    // Try to load from server API (if available)
    if (API_BASE_URL) {
        return loadFromServer();
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        users = JSON.parse(stored);
    } else {
        // Create default admin account
        users = [{
            id: 'admin_001',
            firstName: 'Admin',
            lastName: 'User',
            fullName: 'مدير النظام',
            email: 'admin@banaious.edu.eg',
            password: 'Admin1234',
            phone: '00000000000',
            role: 'admin',
            grade: 'admin',
            createdAt: new Date().toISOString()
        }];
        saveUsers(users);
    }
    
    return users;
}

// Save users to localStorage for offline access
function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(USERS_FILE_KEY, JSON.stringify(users));
}

// Load users from server API - Make synchronous for initial load to avoid async issues
function loadFromServer() {
    // Try to fetch from server in background
    fetch(`${API_BASE_URL}/users`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.users) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data.users));
            }
        })
        .catch(error => {
            console.log('Error loading from server, using localStorage fallback:', error);
        });
    
    // Return users from localStorage immediately (no recursion)
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    
    // Return empty array if no data exists
    return [];
}

// Save users to server API - Make synchronous
function saveToServer(users) {
    fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ users: users })
    }).catch(error => {
        console.log('Error saving to server:', error);
    });
}

// Get all users
function getAllUsers() {
    return initializeUsers();
}

// Find user by email
function findUserByEmail(email) {
    const users = getAllUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

// Find user by phone
function findUserByPhone(phone) {
    const users = getAllUsers();
    return users.find(user => user.phone === phone);
}

// Register new user
async function register(userData) {
    const users = getAllUsers();
    
    // Check if email already exists
    if (findUserByEmail(userData.email)) {
        return {
            success: false,
            message: 'البريد الإلكتروني مستخدم بالفعل'
        };
    }
    
    // Check if phone already exists
    if (findUserByPhone(userData.phone)) {
        return {
            success: false,
            message: 'رقم الهاتف مستخدم بالفعل'
        };
    }
    
    // Generate user ID
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Create new user object
    const newUser = {
        id: userId,
        ...userData,
        id: userId,
        createdAt: new Date().toISOString(),
        lastLogin: null
    };
    
    // Add to users array
    users.push(newUser);
    
    // Save to storage
    saveUsers(users);
    
    // Also register via API if available (async, but return synchronously)
    if (API_BASE_URL) {
        fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        }).catch(error => {
            console.log('Error registering on server:', error);
        });
    }
    
    return {
        success: true,
        message: 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول',
        user: {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role,
            grade: newUser.grade
        }
    };
}

// Login user
async function login(email, password, rememberMe = false) {
    const users = getAllUsers();
    
    // Find user by email
    const user = findUserByEmail(email);
    
    if (!user) {
        return {
            success: false,
            message: 'البريد الإلكتروني غير موجود'
        };
    }
    
    // Check password
    if (user.password !== password) {
        return {
            success: false,
            message: 'كلمة المرور غير صحيحة'
        };
    }
    
    // Create session
    const session = {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        grade: user.grade,
        phone: user.phone,
        expiresAt: rememberMe ? Date.now() + (30 * 24 * 60 * 60 * 1000) : Date.now() + (24 * 60 * 60 * 1000) // 30 days if remembered, 1 day otherwise
    };
    
    // Save session
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    // Also login via API if available (async, but return synchronously)
    if (API_BASE_URL) {
        fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        }).catch(error => {
            console.log('Error logging in on server:', error);
        });
    }
    
    return {
        success: true,
        message: 'مرحباً بك!\nتم تسجيل الدخول بنجاح',
        session,
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            grade: user.grade
        }
    };
}

// Logout user
function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
}

// Check if user is logged in
function isLoggedIn() {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return false;
    
    const sessionData = JSON.parse(session);
    
    // Check if session expired
    if (Date.now() > sessionData.expiresAt) {
        logout();
        return false;
    }
    
    return sessionData;
}

// Get current logged in user
function getCurrentUser() {
    return isLoggedIn();
}

// Update user profile
function updateUserProfile(userId, updates) {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        return {
            success: false,
            message: 'المستخدم غير موجود'
        };
    }
    
    // Update user data
    users[userIndex] = {
        ...users[userIndex],
        ...updates,
        id: users[userIndex].id, // Prevent ID change
        email: users[userIndex].email, // Prevent email change (security)
        password: updates.password || users[userIndex].password,
        updatedAt: new Date().toISOString()
    };
    
    saveUsers(users);
    
    return {
        success: true,
        message: 'تم تحديث البيانات بنجاح',
        user: {
            id: users[userIndex].id,
            firstName: users[userIndex].firstName,
            lastName: users[userIndex].lastName,
            fullName: users[userIndex].fullName,
            email: users[userIndex].email,
            role: users[userIndex].role,
            grade: users[userIndex].grade
        }
    };
}

// Change password
function changePassword(userId, currentPassword, newPassword) {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        return {
            success: false,
            message: 'المستخدم غير موجود'
        };
    }
    
    // Verify current password
    if (users[userIndex].password !== currentPassword) {
        return {
            success: false,
            message: 'كلمة المرور الحالية غير صحيحة'
        };
    }
    
    // Update password
    users[userIndex].password = newPassword;
    users[userIndex].passwordChangedAt = new Date().toISOString();
    
    saveUsers(users);
    
    return {
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح'
    };
}

// Delete user account (admin only)
function deleteUser(userId, adminId) {
    const currentUser = getCurrentUser();
    
    if (!currentUser || currentUser.role !== 'admin') {
        return {
            success: false,
            message: 'ليس لديك صلاحية حذف المستخدمين'
        };
    }
    
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        return {
            success: false,
            message: 'المستخدم غير موجود'
        };
    }
    
    users.splice(userIndex, 1);
    saveUsers(users);
    
    return {
        success: true,
        message: 'تم حذف المستخدم بنجاح'
    };
}

// Export users data as JSON string (for file download)
function exportUsersData() {
    const users = getAllUsers();
    const dataToExport = users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        grade: user.grade,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
    }));
    
    return JSON.stringify(dataToExport, null, 2);
}

// Import users data from JSON
function importUsersData(jsonData) {
    try {
        const importedUsers = JSON.parse(jsonData);
        
        if (!Array.isArray(importedUsers)) {
            return {
                success: false,
                message: 'بيانات غير صالحة'
            };
        }
        
        let importCount = 0;
        let duplicateCount = 0;
        const currentUsers = getAllUsers();
        
        importedUsers.forEach(importedUser => {
            // Check for duplicates
            const duplicate = currentUsers.find(
                u => u.email === importedUser.email || u.phone === importedUser.phone
            );
            
            if (!duplicate) {
                const newUser = {
                    id: 'imported_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    firstName: importedUser.firstName,
                    lastName: importedUser.lastName,
                    fullName: importedUser.fullName,
                    phone: importedUser.phone,
                    email: importedUser.email,
                    password: importedUser.password || 'Default1234', // Set default password if not provided
                    role: importedUser.role || 'student',
                    grade: importedUser.grade,
                    createdAt: importedUser.createdAt || new Date().toISOString()
                };
                currentUsers.push(newUser);
                importCount++;
            } else {
                duplicateCount++;
            }
        });
        
        saveUsers(currentUsers);
        
        return {
            success: true,
            message: `تم استيراد ${importCount} مستخدم بنجاح\n${duplicateCount} مستخدم تم تجاهلهم (مكررين)`
        };
    } catch (error) {
        return {
            success: false,
            message: 'خطأ في تحليل البيانات: ' + error.message
        };
    }
}

// Get user statistics
function getUserStats() {
    const users = getAllUsers();
    
    const stats = {
        total: users.length,
        students: users.filter(u => u.role === 'student').length,
        teachers: users.filter(u => u.role === 'teacher').length,
        parents: users.filter(u => u.role === 'parent').length,
        admins: users.filter(u => u.role === 'admin').length,
        byGrade: {},
        recentRegistrations: users
            .filter(u => new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            .length
    };
    
    // Count users by grade
    users.forEach(user => {
        if (user.grade && user.grade !== 'admin') {
            stats.byGrade[user.grade] = (stats.byGrade[user.grade] || 0) + 1;
        }
    });
    
    return stats;
}

// Check if email is valid
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Check if password meets strength requirements
function isStrongPassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber;
}

// Redirect if not logged in
function requireLogin(redirectUrl = 'login.html') {
    if (!isLoggedIn()) {
        window.location.href = redirectUrl + '?return=' + encodeURIComponent(window.location.href);
        return false;
    }
    return true;
}

// Display user info in UI
function displayUserInfo() {
    const user = getCurrentUser();
    if (user) {
        const userInfoElements = document.querySelectorAll('.user-info');
        userInfoElements.forEach(el => {
            el.innerHTML = `
                <span class="user-name">${user.fullName}</span>
                <span class="user-role">(${getRoleName(user.role)})</span>
            `;
        });
        
        // Show logout button
        const logoutBtns = document.querySelectorAll('.logout-btn');
        logoutBtns.forEach(btn => btn.style.display = 'inline-block');
        
        // Hide login/register buttons
        const authBtns = document.querySelectorAll('.auth-btn-hidden');
        authBtns.forEach(btn => btn.style.display = 'none');
    }
}

// Get Arabic role name
function getRoleName(role) {
    const roles = {
        'admin': 'مدير النظام',
        'teacher': 'مدرس',
        'student': 'طالب',
        'parent': 'ولي أمر'
    };
    return roles[role] || role;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    displayUserInfo();
    
    // Check for return URL after login
    const urlParams = new URLSearchParams(window.location.search);
    const returnTo = urlParams.get('return');
    
    if (returnTo && isLoggedIn()) {
        window.location.href = returnTo;
    }
});
